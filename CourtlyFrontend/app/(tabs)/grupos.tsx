import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { User, Invitation, Club } from '@/src/types';
import { usersApi } from '@/src/api/users';
import { invitationsApi } from '@/src/api/invitations';
import { clubsApi } from '@/src/api/clubs';
import { FriendCard } from '@/src/components/FriendCard';
import { Avatar } from '@/src/components/Avatar';
import { Button } from '@/src/components/Button';
import { InviteModal } from '@/src/components/InviteModal';

type TopTab = 'Amigos' | 'Clubes';
const TOP_TABS: TopTab[] = ['Amigos', 'Clubes'];

export default function GruposScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TopTab>('Amigos');
  const [inviteUser, setInviteUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [joinedClubs, setJoinedClubs] = useState<Set<string>>(new Set());
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      usersApi.search('').catch(() => [] as User[]),
      invitationsApi.getPending().catch(() => [] as Invitation[]),
      clubsApi.getAll().catch(() => [] as Club[]),
      usersApi.getFollowing().catch(() => [] as string[]),
    ]).then(([u, inv, cl, following]) => {
      setUsers(u);
      setInvitations(inv);
      setClubs(cl);
      setFollowedIds(new Set(following));
    }).finally(() => setLoading(false));
  }, []);

  const handleAcceptInvitation = (id: string) => {
    invitationsApi.accept(id)
      .then(() => setInvitations(prev => prev.filter(i => i.id !== id)))
      .catch(() => Alert.alert('Error', 'No se pudo aceptar la invitación.'));
  };

  const handleRejectInvitation = (id: string) => {
    invitationsApi.reject(id)
      .then(() => setInvitations(prev => prev.filter(i => i.id !== id)))
      .catch(() => Alert.alert('Error', 'No se pudo rechazar la invitación.'));
  };

  const toggleClub = (id: string) => {
    if (joinedClubs.has(id)) {
      clubsApi.leave(id)
        .then(() => setJoinedClubs(prev => { const s = new Set(prev); s.delete(id); return s; }))
        .catch(() => {});
    } else {
      clubsApi.join(id)
        .then(() => setJoinedClubs(prev => new Set([...prev, id])))
        .catch(() => {});
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingInvitations = invitations.filter(i => i.status === 'PENDING');

  if (loading) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Grupos</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="chatbubble-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.topTabsRow}>
        {TOP_TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.topTab, activeTab === tab && styles.topTabActive]}
          >
            <Text style={[styles.topTabText, activeTab === tab && styles.topTabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'Amigos' && (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {pendingInvitations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Invitaciones pendientes</Text>
              {pendingInvitations.map(inv => (
                <View key={inv.id} style={styles.invitationCard}>
                  <View style={styles.invitationTop}>
                    <Avatar name={inv.fromUser.name} size={40} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.invitationUser}>{inv.fromUser.name}</Text>
                      <View style={styles.invitationMeta}>
                        <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                        <Text style={styles.invitationMetaText}>{inv.court?.name ?? inv.customLocation ?? '—'}</Text>
                      </View>
                      <View style={styles.invitationMeta}>
                        <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                        <Text style={styles.invitationMetaText}>{inv.date} · {inv.time}</Text>
                      </View>
                      {inv.message ? <Text style={styles.invitationMessage}>"{inv.message}"</Text> : null}
                    </View>
                  </View>
                  <View style={styles.invitationActions}>
                    <Button label="Aceptar" variant="primary" size="sm" onPress={() => handleAcceptInvitation(inv.id)} style={{ flex: 1 }} />
                    <Button label="Rechazar" variant="outline" size="sm" onPress={() => handleRejectInvitation(inv.id)} style={{ flex: 1 }} />
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={16} color={colors.textMuted} style={{ marginLeft: 12 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar jugadores..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={{ marginRight: 12 }}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Jugadores</Text>
            {filteredUsers.map(u => (
              <FriendCard
                key={u.id}
                user={u}
                onInvite={u => setInviteUser(u)}
                onViewProfile={u => router.push(`/profile/${u.id}`)}
              />
            ))}
            {filteredUsers.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No se encontraron jugadores.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {activeTab === 'Clubes' && (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.eventsPromo}>
            <Text style={styles.eventsTitle}>Explora los eventos locales</Text>
            <Text style={styles.eventsSubtitle}>
              Encuentra entrenamientos, eventos y clubes cerca de ti y convierte tus planes en kilómetros.
            </Text>
            <Button label="Encuentra tu equipo" variant="primary" size="md" onPress={() => {}} style={{ marginTop: 14 }} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Clubes recomendados</Text>
            {clubs.map(club => {
              const joined = joinedClubs.has(club.id);
              return (
                <View key={club.id} style={styles.clubCard}>
                  <View style={styles.clubAvatar}>
                    <Ionicons name="shield-half" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.clubInfo}>
                    <Text style={styles.clubName}>{club.name}</Text>
                    <View style={styles.clubMeta}>
                      <Ionicons name="people-outline" size={12} color={colors.textSecondary} />
                      <Text style={styles.clubMetaText}>{club.memberCount} miembros</Text>
                      {club.location ? (
                        <>
                          <Text style={styles.clubDot}>·</Text>
                          <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                          <Text style={styles.clubMetaText}>{club.location}</Text>
                        </>
                      ) : null}
                    </View>
                    {club.description ? <Text style={styles.clubDesc} numberOfLines={2}>{club.description}</Text> : null}
                  </View>
                  <Button
                    label={joined ? 'Unido' : 'Unirse'}
                    variant={joined ? 'secondary' : 'outline'}
                    size="sm"
                    onPress={() => toggleClub(club.id)}
                  />
                </View>
              );
            })}
          </View>

          <View style={styles.createClubCard}>
            <Text style={styles.createClubTitle}>Crea tu propio club de pádel</Text>
            <Text style={styles.createClubSub}>
              Crea un centro de operaciones para tu comunidad en Courtly.
            </Text>
            <Button
              label="Primeros pasos"
              variant="cta"
              fullWidth
              onPress={() => Alert.alert('Crear club', 'Crea y gestiona tu club directamente desde la aplicación.')}
              style={{ marginTop: 14 }}
            />
          </View>
        </ScrollView>
      )}

      <InviteModal
        visible={inviteUser !== null}
        user={inviteUser}
        onClose={() => setInviteUser(null)}
        onSend={data => {
          if (!inviteUser) return;
          invitationsApi.create({
            toUserId: inviteUser.id,
            courtId: data.court || undefined,
            customLocation: data.customLocation || undefined,
            date: data.date,
            time: data.time,
            message: data.message || undefined,
          })
            .then(() => Alert.alert('¡Invitación enviada!', `Invitación enviada a ${inviteUser.name}.`))
            .catch(e => Alert.alert('Error', e.message));
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 4 },
  headerBtn: { padding: 6 },
  topTabsRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  topTab: { flex: 1, paddingVertical: 13, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  topTabActive: { borderBottomColor: colors.primary },
  topTabText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  topTabTextActive: { color: colors.primary },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  section: { paddingHorizontal: 18, marginTop: 20 },
  sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 14 },
  invitationCard: {
    backgroundColor: colors.cardBg, borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: colors.primary + '44', gap: 12,
  },
  invitationTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  invitationUser: { color: colors.textPrimary, fontWeight: '700', fontSize: 14, marginBottom: 4 },
  invitationMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  invitationMetaText: { color: colors.textSecondary, fontSize: 12 },
  invitationMessage: { color: colors.primary, fontSize: 12, fontStyle: 'italic', marginTop: 4 },
  invitationActions: { flexDirection: 'row', gap: 8 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.secondary, borderRadius: 10,
    marginHorizontal: 18, marginTop: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, paddingVertical: 11, paddingHorizontal: 10, color: colors.textPrimary, fontSize: 14 },
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { color: colors.textMuted, fontSize: 14 },
  clubCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: colors.cardBg, borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: colors.border, gap: 12,
  },
  clubAvatar: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: colors.primary + '18',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  clubInfo: { flex: 1 },
  clubName: { color: colors.textPrimary, fontWeight: '700', fontSize: 14, marginBottom: 4 },
  clubMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6, flexWrap: 'wrap' },
  clubMetaText: { color: colors.textSecondary, fontSize: 11 },
  clubDot: { color: colors.textMuted, fontSize: 11 },
  clubDesc: { color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
  createClubCard: {
    marginHorizontal: 18, marginTop: 20,
    backgroundColor: colors.cardBg, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: colors.border,
  },
  createClubTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  createClubSub: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  eventsPromo: {
    marginHorizontal: 18, marginTop: 20,
    backgroundColor: colors.primary + '15', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: colors.primary + '44',
  },
  eventsTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  eventsSubtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
});
