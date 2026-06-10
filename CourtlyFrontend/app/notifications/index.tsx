import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/ThemeContext';
import type { Colors } from '@/src/theme/colors';
import { Invitation } from '@/src/types';
import { invitationsApi } from '@/src/api/invitations';
import { notificationsApi, AppNotification } from '@/src/api/notifications';
import { Avatar } from '@/src/components/Avatar';
import { Button } from '@/src/components/Button';

// ─── Mock party invitations ───────────────────────────────────────────────────

type PartyInviteResponse = 'pending' | 'accepted' | 'rejected';

interface MockPartyInvite {
  id: string;
  fromName: string;
  fromId: string;
  matchLocation: string;
  matchDate: string;
  matchTime: string;
  matchLevel: string;
  timeAgo: string;
}

const MOCK_PARTY_INVITES: MockPartyInvite[] = [
  { id: 'pi1', fromName: 'Javier Castro', fromId: 'u1', matchLocation: 'Golf Los Incas',  matchDate: 'Hoy',    matchTime: '8:00 PM',  matchLevel: '4ta categoría', timeAgo: 'Hace 5 min' },
  { id: 'pi2', fromName: 'Carlos Ramos',  fromId: 'u6', matchLocation: 'Padel Indoor Lima', matchDate: 'Mañana', matchTime: '10:00 AM', matchLevel: '3ra categoría', timeAgo: 'Hace 2 h' },
];

function PartyInviteCard({ invite, response, onAccept, onReject }: {
  invite: MockPartyInvite;
  response: PartyInviteResponse;
  onAccept: () => void;
  onReject: () => void;
}) {
  const { colors } = useTheme();
  const scaleA = useRef(new Animated.Value(1)).current;
  const scaleR = useRef(new Animated.Value(1)).current;

  const press = (scale: Animated.Value, cb: () => void) => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.93, duration: 70, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 110, useNativeDriver: true }),
    ]).start(cb);
  };

  return (
    <View style={{ backgroundColor: colors.cardBg, borderRadius: 14, borderWidth: 1, borderColor: colors.primary + '35', padding: 14, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: colors.primary }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <View style={{ position: 'relative' }}>
          <Avatar name={invite.fromName} size={40} />
          <View style={{ position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.cardBg, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="tennisball" size={7} color="#fff" />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
            <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{invite.fromName} </Text>
            te invitó a un partido
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>{invite.timeAgo}</Text>
        </View>
      </View>
      {/* Match detail */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.secondary, borderRadius: 10, padding: 10, marginBottom: 12 }}>
        <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.primary + '18', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="tennisball-outline" size={16} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>{invite.matchLocation}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{invite.matchDate} · {invite.matchTime}</Text>
          <View style={{ alignSelf: 'flex-start', backgroundColor: colors.primary + '18', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 1, marginTop: 3 }}>
            <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700' }}>{invite.matchLevel}</Text>
          </View>
        </View>
      </View>
      {/* Actions or response */}
      {response === 'pending' ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Animated.View style={{ flex: 1, transform: [{ scale: scaleA }] }}>
            <TouchableOpacity
              style={{ backgroundColor: colors.success, borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
              activeOpacity={0.85}
              onPress={() => press(scaleA, onAccept)}
            >
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Aceptar</Text>
            </TouchableOpacity>
          </Animated.View>
          <Animated.View style={{ flex: 1, transform: [{ scale: scaleR }] }}>
            <TouchableOpacity
              style={{ backgroundColor: colors.secondary, borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}
              activeOpacity={0.85}
              onPress={() => press(scaleR, onReject)}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '600' }}>Rechazar</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      ) : (
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
          backgroundColor: response === 'accepted' ? colors.success + '18' : '#EF444418',
          borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7,
          borderWidth: 1, borderColor: response === 'accepted' ? colors.success + '40' : '#EF444440',
        }}>
          <Ionicons name={response === 'accepted' ? 'checkmark-circle' : 'close-circle'} size={15} color={response === 'accepted' ? colors.success : '#EF4444'} />
          <Text style={{ color: response === 'accepted' ? colors.success : '#EF4444', fontSize: 13, fontWeight: '700' }}>
            {response === 'accepted' ? 'Aceptaste la invitación' : 'Rechazaste la invitación'}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 12, paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    backBtn: { padding: 4, width: 40 },
    headerTitle: { color: c.textPrimary, fontSize: 17, fontWeight: '700' },
    readAllBtn: { paddingHorizontal: 4, paddingVertical: 6, width: 60, alignItems: 'flex-end' },
    readAllText: { color: c.primary, fontSize: 13, fontWeight: '600' },
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 60 },
    emptyTitle: { color: c.textPrimary, fontSize: 17, fontWeight: '700' },
    emptyText: { color: c.textMuted, fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
    content: { paddingBottom: 40 },
    section: { paddingHorizontal: 18, marginTop: 20, gap: 8 },
    sectionTitle: { color: c.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 4 },
    notifCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: c.cardBg, borderRadius: 14, padding: 12,
      borderWidth: 1, borderColor: c.border,
    },
    notifUnread: { borderColor: c.primary + '40', backgroundColor: c.primary + '08' },
    notifAvatarWrap: { position: 'relative' },
    notifIconBadge: {
      position: 'absolute', bottom: -2, right: -2,
      width: 18, height: 18, borderRadius: 9,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1.5, borderColor: c.background,
    },
    notifText: { color: c.textSecondary, fontSize: 14, lineHeight: 20 },
    notifBold: { color: c.textPrimary, fontWeight: '700' },
    notifTime: { color: c.textMuted, fontSize: 12, marginTop: 3 },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.primary },
    card: { backgroundColor: c.cardBg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: c.border, gap: 12 },
    cardTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    cardName: { color: c.textPrimary, fontWeight: '700', fontSize: 14, marginBottom: 4 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
    metaText: { color: c.textSecondary, fontSize: 12 },
    message: { color: c.primary, fontSize: 12, fontStyle: 'italic', marginTop: 4 },
    actions: { flexDirection: 'row', gap: 8 },
  });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [partyResponses, setPartyResponses] = useState<Record<string, PartyInviteResponse>>(
    Object.fromEntries(MOCK_PARTY_INVITES.map(i => [i.id, 'pending']))
  );

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      invitationsApi.getPending().catch(() => [] as Invitation[]),
      notificationsApi.getAll().catch(() => [] as AppNotification[]),
    ]).then(([inv, nts]) => { setInvitations(inv); setNotifs(nts); }).finally(() => setLoading(false));
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
        <View style={styles.loader}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : isEmpty ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Sin notificaciones</Text>
          <Text style={styles.emptyText}>Aquí verás las invitaciones y actividad de tu red.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Mock party invitations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Invitaciones a partidos</Text>
            {MOCK_PARTY_INVITES.map(invite => (
              <PartyInviteCard
                key={invite.id}
                invite={invite}
                response={partyResponses[invite.id]}
                onAccept={() => setPartyResponses(p => ({ ...p, [invite.id]: 'accepted' }))}
                onReject={() => setPartyResponses(p => ({ ...p, [invite.id]: 'rejected' }))}
              />
            ))}
          </View>
          {notifs.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Actividad</Text>
              {notifs.map(n => (
                <TouchableOpacity key={n.id} style={[styles.notifCard, !n.read && styles.notifUnread]} onPress={() => handleNotifPress(n)} activeOpacity={0.75}>
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
