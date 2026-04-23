import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { Invitation } from '@/src/types';
import { invitationsApi } from '@/src/api/invitations';
import { Avatar } from '@/src/components/Avatar';
import { Button } from '@/src/components/Button';

export default function NotificationsScreen() {
  const router = useRouter();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invitationsApi.getPending()
      .then(setInvitations)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : invitations.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Sin notificaciones</Text>
          <Text style={styles.emptyText}>Aquí verás las invitaciones pendientes.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 60 },
  emptyTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  content: { paddingBottom: 40 },
  section: { paddingHorizontal: 18, marginTop: 20 },
  sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  card: {
    backgroundColor: colors.cardBg, borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: colors.border, gap: 12,
  },
  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  cardName: { color: colors.textPrimary, fontWeight: '700', fontSize: 14, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  metaText: { color: colors.textSecondary, fontSize: 12 },
  message: { color: colors.primary, fontSize: 12, fontStyle: 'italic', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8 },
});
