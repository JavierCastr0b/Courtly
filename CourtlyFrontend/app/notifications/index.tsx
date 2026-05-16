import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { Invitation } from '@/src/types';
import { invitationsApi } from '@/src/api/invitations';
import { notificationsApi, AppNotification } from '@/src/api/notifications';
import { Avatar } from '@/src/components/Avatar';
import { Button } from '@/src/components/Button';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      invitationsApi.getPending().catch(() => [] as Invitation[]),
      notificationsApi.getAll().catch(() => [] as AppNotification[]),
    ]).then(([inv, nts]) => {
      setInvitations(inv);
      setNotifs(nts);
    }).finally(() => setLoading(false));
  }, []);

  useFocusEffect(load);

  const handleMarkAllRead = () => {
    notificationsApi.markAllRead()
      .then(() => setNotifs(prev => prev.map(n => ({ ...n, read: true }))))
      .catch(() => {});
  };

  const handleNotifPress = (n: AppNotification) => {
    if (!n.read) {
      notificationsApi.markRead(n.id)
        .then(() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x)))
        .catch(() => {});
    }
    router.push(`/profile/${n.sender.id}`);
  };

  const notifMeta = (n: AppNotification): { icon: string; color: string; text: string } => {
    if (n.type === 'LIKE') return { icon: 'heart', color: '#FF4B4B', text: 'le dio like a tu publicación' };
    return { icon: 'person-add', color: colors.primary, text: 'te empezó a seguir' };
  };

  const handleAccept = (id: string) => {
    invitationsApi.accept(id)
      .then(() => setInvitations(prev => prev.filter(i => i.id !== id)))
      .catch(e => Alert.alert('Error', e.message));
  };

  const handleReject = (id: string) => {
    invitationsApi.reject(id)
      .then(() => setInvitations(prev => prev.filter(i => i.id !== id)))
      .catch(e => Alert.alert('Error', e.message));
  };

  const unread = notifs.filter(n => !n.read).length;
  const isEmpty = invitations.length === 0 && notifs.length === 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        {unread > 0 ? (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.readAllBtn}>
            <Text style={styles.readAllText}>Leer todo</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : isEmpty ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Sin notificaciones</Text>
          <Text style={styles.emptyText}>Aquí verás las invitaciones y actividad de tu red.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Follow notifications */}
          {notifs.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Actividad</Text>
              {notifs.map(n => (
                <TouchableOpacity
                  key={n.id}
                  style={[styles.notifCard, !n.read && styles.notifUnread]}
                  onPress={() => handleNotifPress(n)}
                  activeOpacity={0.75}
                >
                  {(() => {
                    const { icon, color, text } = notifMeta(n);
                    return (
                      <>
                        <View style={styles.notifAvatarWrap}>
                          <Avatar name={n.sender.name} size={42} />
                          <View style={[styles.notifIconBadge, { backgroundColor: color }]}>
                            <Ionicons name={icon as any} size={10} color="#fff" />
                          </View>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.notifText}>
                            <Text style={styles.notifBold}>{n.sender.name}</Text>
                            {' '}{text}
                          </Text>
                          <Text style={styles.notifTime}>{timeAgo(n.createdAt)}</Text>
                        </View>
                      </>
                    );
                  })()}
                  {!n.read && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Pending invitations */}
          {invitations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Invitaciones pendientes</Text>
              {invitations.map(inv => (
                <View key={inv.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Avatar name={inv.fromUser.name} size={42} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardName}>{inv.fromUser.name}</Text>
                      <View style={styles.metaRow}>
                        <Ionicons name="tennisball-outline" size={12} color={colors.textSecondary} />
                        <Text style={styles.metaText}>{inv.court?.name ?? inv.customLocation ?? '—'}</Text>
                      </View>
                      <View style={styles.metaRow}>
                        <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                        <Text style={styles.metaText}>{inv.date} · {inv.time}</Text>
                      </View>
                      {inv.message ? <Text style={styles.message}>"{inv.message}"</Text> : null}
                    </View>
                  </View>
                  <View style={styles.actions}>
                    <Button label="Aceptar" variant="primary" size="sm" onPress={() => handleAccept(inv.id)} style={{ flex: 1 }} />
                    <Button label="Rechazar" variant="outline" size="sm" onPress={() => handleReject(inv.id)} style={{ flex: 1 }} />
                  </View>
                </View>
              ))}
            </View>
          )}

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { padding: 4, width: 40 },
  headerTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
  readAllBtn: { paddingHorizontal: 4, paddingVertical: 6, width: 60, alignItems: 'flex-end' },
  readAllText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 60 },
  emptyTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  content: { paddingBottom: 40 },
  section: { paddingHorizontal: 18, marginTop: 20, gap: 8 },
  sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 4 },

  // Follow notification row
  notifCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.cardBg, borderRadius: 14,
    padding: 12, borderWidth: 1, borderColor: colors.border,
  },
  notifUnread: { borderColor: colors.primary + '40', backgroundColor: colors.primary + '08' },
  notifAvatarWrap: { position: 'relative' },
  notifIconBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.background,
  },
  notifText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  notifBold: { color: colors.textPrimary, fontWeight: '700' },
  notifTime: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },

  // Invitation card
  card: {
    backgroundColor: colors.cardBg, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.border, gap: 12,
  },
  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  cardName: { color: colors.textPrimary, fontWeight: '700', fontSize: 14, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  metaText: { color: colors.textSecondary, fontSize: 12 },
  message: { color: colors.primary, fontSize: 12, fontStyle: 'italic', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8 },
});
