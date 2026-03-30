import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import {
  mockUsers,
  mockInvitations,
  mockChallenges,
  mockClubs,
  currentUser,
  User,
} from '@/src/data/mockData';
import { FriendCard } from '@/src/components/FriendCard';
import { Avatar } from '@/src/components/Avatar';
import { Button } from '@/src/components/Button';
import { InviteModal } from '@/src/components/InviteModal';
import { Tag } from '@/src/components/Tag';

type TopTab = 'Amigos' | 'Retos' | 'Clubes';
const TOP_TABS: TopTab[] = ['Amigos', 'Retos', 'Clubes'];

export default function GruposScreen() {
  const [activeTab, setActiveTab] = useState<TopTab>('Amigos');
  const [inviteUser, setInviteUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [invitations, setInvitations] = useState(mockInvitations);
  const [joinedClubs, setJoinedClubs] = useState<Set<string>>(
    new Set(mockClubs.filter((c) => c.joined).map((c) => c.id))
  );

  const handleAcceptInvitation = (id: string) => {
    setInvitations((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: 'accepted' as const } : inv))
    );
  };

  const handleRejectInvitation = (id: string) => {
    setInvitations((prev) => prev.filter((inv) => inv.id !== id));
  };

  const toggleClub = (id: string) => {
    setJoinedClubs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filteredFriends = mockUsers.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingInvitations = invitations.filter((i) => i.status === 'pending');
  const recentlyPlayed = mockUsers.filter((u) => u.recentlyPlayedWith);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* ─── Header ─────────────────────────────────── */}
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

      {/* ─── Top Tabs ───────────────────────────────── */}
      <View style={styles.topTabsRow}>
        {TOP_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.topTab, activeTab === tab && styles.topTabActive]}
          >
            <Text style={[styles.topTabText, activeTab === tab && styles.topTabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── TAB: Amigos ────────────────────────────── */}
      {activeTab === 'Amigos' && (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Pending invitations */}
          {pendingInvitations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Invitaciones pendientes</Text>
              {pendingInvitations.map((inv) => (
                <View key={inv.id} style={styles.invitationCard}>
                  <View style={styles.invitationTop}>
                    <Avatar name={inv.fromUser.name} initials={inv.fromUser.initials} size={40} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.invitationUser}>{inv.fromUser.name}</Text>
                      <View style={styles.invitationMeta}>
                        <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                        <Text style={styles.invitationMetaText}>{inv.court.name}</Text>
                      </View>
                      <View style={styles.invitationMeta}>
                        <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                        <Text style={styles.invitationMetaText}>{inv.date} · {inv.time}</Text>
                      </View>
                      {inv.message && (
                        <Text style={styles.invitationMessage}>"{inv.message}"</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.invitationActions}>
                    <Button
                      label="Aceptar"
                      variant="primary"
                      size="sm"
                      onPress={() => handleAcceptInvitation(inv.id)}
                      style={{ flex: 1 }}
                    />
                    <Button
                      label="Rechazar"
                      variant="outline"
                      size="sm"
                      onPress={() => handleRejectInvitation(inv.id)}
                      style={{ flex: 1 }}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Search */}
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

          {/* Recently played with */}
          {recentlyPlayed.length > 0 && searchQuery.length === 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionSubtitle}>Jugaste recientemente con...</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
                {recentlyPlayed.map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    style={styles.recentCard}
                    onPress={() => setInviteUser(user)}
                  >
                    <Avatar name={user.name} initials={user.initials} size={48} available={user.available} />
                    <Text style={styles.recentName} numberOfLines={1}>{user.name.split(' ')[0]}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Friends list */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tus amigos</Text>
            {filteredFriends.map((user) => (
              <FriendCard
                key={user.id}
                user={user}
                onInvite={(u) => setInviteUser(u)}
                onViewProfile={(u) => Alert.alert(u.name, `Nivel: ${u.level}\nPartidos: ${u.matchesPlayed}`)}
              />
            ))}
            {filteredFriends.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No se encontraron amigos.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* ─── TAB: Retos ─────────────────────────────── */}
      {activeTab === 'Retos' && (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Retos activos</Text>
            {mockChallenges.map((challenge) => (
              <View key={challenge.id} style={styles.challengeCard}>
                <View style={styles.challengeHeader}>
                  <View style={styles.challengeVS}>
                    <Avatar name={challenge.challenger.name} initials={challenge.challenger.initials} size={38} />
                    <View style={styles.vsBox}>
                      <Text style={styles.vsText}>VS</Text>
                    </View>
                    <Avatar name={challenge.challenged.name} initials={challenge.challenged.initials} size={38} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.challengeDesc}>{challenge.description}</Text>
                    <View style={styles.challengeMeta}>
                      <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
                      <Text style={styles.challengeMetaText}>Hasta {challenge.deadline}</Text>
                    </View>
                  </View>
                </View>

                {challenge.challenger_score !== undefined && (
                  <View style={styles.scoreRow}>
                    <View style={styles.scoreItem}>
                      <Text style={styles.scoreName}>{challenge.challenger.name.split(' ')[0]}</Text>
                      <Text style={styles.scoreValue}>{challenge.challenger_score}</Text>
                    </View>
                    <Text style={styles.scoreSep}>:</Text>
                    <View style={styles.scoreItem}>
                      <Text style={styles.scoreName}>{challenge.challenged.name.split(' ')[0]}</Text>
                      <Text style={styles.scoreValue}>{challenge.challenged_score}</Text>
                    </View>
                  </View>
                )}

                {challenge.status === 'pending' && (
                  <Button
                    label="Aceptar reto"
                    variant="cta"
                    size="sm"
                    fullWidth
                    onPress={() => Alert.alert('¡Reto aceptado!', `Has aceptado el reto: ${challenge.description}`)}
                    style={{ marginTop: 12 }}
                  />
                )}
                {challenge.status === 'active' && (
                  <View style={styles.activeChallengeBadge}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeBadgeText}>En curso</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Create challenge CTA */}
          <View style={[styles.section, { alignItems: 'center', paddingVertical: 16 }]}>
            <Button
              label="Crear nuevo reto"
              variant="outline"
              size="lg"
              onPress={() => Alert.alert('Crear reto', 'Elige un amigo para crear un reto.')}
            />
          </View>
        </ScrollView>
      )}

      {/* ─── TAB: Clubes ────────────────────────────── */}
      {activeTab === 'Clubes' && (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Explore events */}
          <View style={styles.eventsPromo}>
            <Text style={styles.eventsTitle}>Explora los eventos locales</Text>
            <Text style={styles.eventsSubtitle}>
              Encuentra entrenamientos, eventos y clubes cerca de ti y convierte tus planes en kilómetros.
            </Text>
            <Button
              label="Encuentra tu equipo"
              variant="primary"
              size="md"
              onPress={() => {}}
              style={{ marginTop: 14 }}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Clubes recomendados</Text>
            {mockClubs.map((club) => {
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
                      <Text style={styles.clubMetaText}>{club.members} miembros</Text>
                      <Text style={styles.clubDot}>·</Text>
                      <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                      <Text style={styles.clubMetaText}>{club.location}</Text>
                    </View>
                    <Text style={styles.clubDesc} numberOfLines={2}>{club.description}</Text>
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

          {/* Create club CTA */}
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

      {/* ─── Invite Modal ────────────────────────────── */}
      <InviteModal
        visible={inviteUser !== null}
        user={inviteUser}
        onClose={() => setInviteUser(null)}
        onSend={(data) => {
          Alert.alert('¡Invitación enviada!', `Invitación enviada a ${inviteUser?.name}.`);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  headerBtn: {
    padding: 6,
  },
  topTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topTab: {
    flex: 1,
    paddingVertical: 13,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  topTabActive: {
    borderBottomColor: colors.primary,
  },
  topTabText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  topTabTextActive: {
    color: colors.primary,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: 32,
  },
  section: {
    paddingHorizontal: 18,
    marginTop: 20,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  // Invitation card
  invitationCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.primary + '44',
    gap: 12,
  },
  invitationTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  invitationUser: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
  },
  invitationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  invitationMetaText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  invitationMessage: {
    color: colors.primary,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  invitationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  // Search
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
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 10,
    color: colors.textPrimary,
    fontSize: 14,
  },
  // Recently played
  recentCard: {
    alignItems: 'center',
    gap: 6,
    width: 64,
  },
  recentName: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  // Challenge card
  challengeCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  challengeHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  challengeVS: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vsBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.ctaHighlight + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    color: colors.ctaHighlight,
    fontSize: 9,
    fontWeight: '900',
  },
  challengeDesc: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
  },
  challengeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  challengeMetaText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
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
  scoreItem: {
    alignItems: 'center',
    gap: 4,
  },
  scoreName: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  scoreValue: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
  },
  scoreSep: {
    color: colors.textMuted,
    fontSize: 22,
    fontWeight: '700',
  },
  activeChallengeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  activeBadgeText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '600',
  },
  // Club card
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
  clubInfo: {
    flex: 1,
  },
  clubName: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
  },
  clubMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  clubMetaText: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  clubDot: {
    color: colors.textMuted,
    fontSize: 11,
  },
  clubDesc: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  // Create club
  createClubCard: {
    marginHorizontal: 18,
    marginTop: 20,
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  createClubTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  createClubSub: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  // Events promo
  eventsPromo: {
    marginHorizontal: 18,
    marginTop: 20,
    backgroundColor: colors.primary + '15',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.primary + '44',
  },
  eventsTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  eventsSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
