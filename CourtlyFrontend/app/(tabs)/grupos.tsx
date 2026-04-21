import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { User, Invitation, Challenge, Club } from '@/src/types';
import { usersApi } from '@/src/api/users';
import { invitationsApi } from '@/src/api/invitations';
import { challengesApi } from '@/src/api/challenges';
import { clubsApi } from '@/src/api/clubs';
import { FriendCard } from '@/src/components/FriendCard';
import { Avatar } from '@/src/components/Avatar';
import { Button } from '@/src/components/Button';
import { InviteModal } from '@/src/components/InviteModal';

type TopTab = 'Amigos' | 'Retos' | 'Clubes';
const TOP_TABS: TopTab[] = ['Amigos', 'Retos', 'Clubes'];

export default function GruposScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TopTab>('Amigos');
  const [inviteUser, setInviteUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [joinedClubs, setJoinedClubs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [challengeTarget, setChallengeTarget] = useState<User | null>(null);
  const [challengeDesc, setChallengeDesc] = useState('');
  const [challengeDeadline, setChallengeDeadline] = useState('');
  const [challengeModalVisible, setChallengeModalVisible] = useState(false);

  useEffect(() => {
    Promise.all([
      usersApi.search('').catch(() => [] as User[]),
      invitationsApi.getPending().catch(() => [] as Invitation[]),
      challengesApi.getMine().catch(() => [] as Challenge[]),
      clubsApi.getAll().catch(() => [] as Club[]),
    ]).then(([u, inv, ch, cl]) => {
      setUsers(u);
      setInvitations(inv);
      setChallenges(ch);
      setClubs(cl);
    }).finally(() => setLoading(false));
  }, []);

  const [followedIds, setFollowedIds] = React.useState<Set<string>>(new Set());
  useEffect(() => {
    usersApi.getFollowing().then(ids => setFollowedIds(new Set(ids))).catch(() => {});
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

  const handleCreateChallenge = () => {
    if (!challengeTarget) return;
    if (!challengeDesc.trim()) { Alert.alert('Describe el reto'); return; }
    if (!challengeDeadline.trim()) { Alert.alert('Ingresa una fecha límite'); return; }
    challengesApi.create({
      challengedUserId: challengeTarget.id,
      description: challengeDesc,
      deadline: challengeDeadline,
    })
      .then(c => {
        setChallenges(prev => [...prev, c]);
        setChallengeModalVisible(false);
        setChallengeDesc('');
        setChallengeDeadline('');
        setChallengeTarget(null);
        Alert.alert('¡Reto enviado!', `Reto enviado a ${challengeTarget.name}.`);
      })
      .catch(e => Alert.alert('Error', e.message));
  };

  const handleAcceptChallenge = (id: string) => {
    challengesApi.accept(id)
      .then(updated => setChallenges(prev => prev.map(c => c.id === id ? updated : c)))
      .catch(() => Alert.alert('Error', 'No se pudo aceptar el reto.'));
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
        {TOP_TABS.map((tab) => (
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
              {pendingInvitations.map((inv) => (
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
                      {inv.message ? (
                        <Text style={styles.invitationMessage}>"{inv.message}"</Text>
                      ) : null}
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
              placeholder="Buscar amigos..."
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
            {filteredUsers.map((u) => (
              <FriendCard
                key={u.id}
                user={u}
                onInvite={(u) => setInviteUser(u)}
                onViewProfile={(u) => router.push(`/profile/${u.id}`)}
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

      {activeTab === 'Retos' && (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Retos activos</Text>
            {challenges.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No tienes retos aún.</Text>
              </View>
            ) : (
              challenges.map((challenge) => (
                <View key={challenge.id} style={styles.challengeCard}>
                  <View style={styles.challengeHeader}>
                    <View style={styles.challengeVS}>
                      <Avatar name={challenge.challenger.name} size={38} />
                      <View style={styles.vsBox}>
                        <Text style={styles.vsText}>VS</Text>
                      </View>
                      <Avatar name={challenge.challenged.name} size={38} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.challengeDesc}>{challenge.description}</Text>
                      <View style={styles.challengeMeta}>
                        <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
                        <Text style={styles.challengeMetaText}>Hasta {challenge.deadline}</Text>
                      </View>
                    </View>
                  </View>

                  {challenge.challengerScore !== undefined && (
                    <View style={styles.scoreRow}>
                      <View style={styles.scoreItem}>
                        <Text style={styles.scoreName}>{challenge.challenger.name.split(' ')[0]}</Text>
                        <Text style={styles.scoreValue}>{challenge.challengerScore}</Text>
                      </View>
                      <Text style={styles.scoreSep}>:</Text>
                      <View style={styles.scoreItem}>
                        <Text style={styles.scoreName}>{challenge.challenged.name.split(' ')[0]}</Text>
                        <Text style={styles.scoreValue}>{challenge.challengedScore}</Text>
                      </View>
                    </View>
                  )}

                  {challenge.status === 'PENDING' && (
                    <Button
                      label="Aceptar reto"
                      variant="cta"
                      size="sm"
                      fullWidth
                      onPress={() => handleAcceptChallenge(challenge.id)}
                      style={{ marginTop: 12 }}
                    />
                  )}
                  {challenge.status === 'ACTIVE' && (
                    <View style={styles.activeChallengeBadge}>
                      <View style={styles.activeDot} />
                      <Text style={styles.activeBadgeText}>En curso</Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>

          <View style={[styles.section, { alignItems: 'center', paddingVertical: 16 }]}>
            <Button
              label="Crear nuevo reto"
              variant="outline"
              size="lg"
              onPress={() => setChallengeModalVisible(true)}
            />
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
            {clubs.map((club) => {
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
                    {club.description ? (
                      <Text style={styles.clubDesc} numberOfLines={2}>{club.description}</Text>
                    ) : null}
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

      {/* Challenge create modal */}
      <Modal visible={challengeModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setChallengeModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Crear reto</Text>
            <TouchableOpacity onPress={() => setChallengeModalVisible(false)}>
              <Text style={{ color: colors.textSecondary, fontSize: 15 }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1, padding: 20 }}>
            <Text style={styles.modalLabel}>Retar a</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {users.map(u => (
                  <TouchableOpacity
                    key={u.id}
                    onPress={() => setChallengeTarget(u)}
                    style={[styles.userChip, challengeTarget?.id === u.id && styles.userChipActive]}
                  >
                    <Text style={[styles.userChipText, challengeTarget?.id === u.id && { color: colors.primary }]}>
                      {u.name.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <Text style={styles.modalLabel}>Descripción del reto</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej. Primer set gana"
              placeholderTextColor={colors.textMuted}
              value={challengeDesc}
              onChangeText={setChallengeDesc}
              multiline
            />
            <Text style={styles.modalLabel}>Fecha límite (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="2026-05-01"
              placeholderTextColor={colors.textMuted}
              value={challengeDeadline}
              onChangeText={setChallengeDeadline}
            />
            <Button label="Enviar reto" variant="cta" fullWidth size="lg" onPress={handleCreateChallenge} style={{ marginTop: 8 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <InviteModal
        visible={inviteUser !== null}
        user={inviteUser}
        onClose={() => setInviteUser(null)}
        onSend={(data) => {
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.primary + '44',
    gap: 12,
  },
  invitationTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  invitationUser: { color: colors.textPrimary, fontWeight: '700', fontSize: 14, marginBottom: 4 },
  invitationMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  invitationMetaText: { color: colors.textSecondary, fontSize: 12 },
  invitationMessage: { color: colors.primary, fontSize: 12, fontStyle: 'italic', marginTop: 4 },
  invitationActions: { flexDirection: 'row', gap: 8 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 10,
    marginHorizontal: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, paddingVertical: 11, paddingHorizontal: 10, color: colors.textPrimary, fontSize: 14 },
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { color: colors.textMuted, fontSize: 14 },
  challengeCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  challengeHeader: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 8 },
  challengeVS: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  vsBox: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.ctaHighlight + '22', alignItems: 'center', justifyContent: 'center' },
  vsText: { color: colors.ctaHighlight, fontSize: 9, fontWeight: '900' },
  challengeDesc: { color: colors.textPrimary, fontWeight: '600', fontSize: 14, marginBottom: 4 },
  challengeMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  challengeMetaText: { color: colors.textSecondary, fontSize: 12 },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: colors.secondary,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  scoreItem: { alignItems: 'center', gap: 4 },
  scoreName: { color: colors.textSecondary, fontSize: 12 },
  scoreValue: { color: colors.textPrimary, fontSize: 28, fontWeight: '900' },
  scoreSep: { color: colors.textMuted, fontSize: 22, fontWeight: '700' },
  activeChallengeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  activeBadgeText: { color: colors.success, fontSize: 13, fontWeight: '600' },
  clubCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  clubAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  clubInfo: { flex: 1 },
  clubName: { color: colors.textPrimary, fontWeight: '700', fontSize: 14, marginBottom: 4 },
  clubMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6, flexWrap: 'wrap' },
  clubMetaText: { color: colors.textSecondary, fontSize: 11 },
  clubDot: { color: colors.textMuted, fontSize: 11 },
  clubDesc: { color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
  createClubCard: {
    marginHorizontal: 18,
    marginTop: 20,
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  createClubTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  createClubSub: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  eventsPromo: {
    marginHorizontal: 18,
    marginTop: 20,
    backgroundColor: colors.primary + '15',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.primary + '44',
  },
  eventsTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  eventsSubtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  modalHandle: { width: 36, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  modalLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  modalInput: { backgroundColor: colors.secondary, borderRadius: 10, padding: 14, color: colors.textPrimary, fontSize: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  userChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.secondary, borderWidth: 1.5, borderColor: 'transparent' },
  userChipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '18' },
  userChipText: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' },
});
