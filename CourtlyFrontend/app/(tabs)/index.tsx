import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/ThemeContext';
import type { Colors } from '@/src/theme/colors';
import { levelDisplay } from '@/src/theme/colors';
import { useAuth } from '@/src/context/AuthContext';
import { matchesApi } from '@/src/api/matches';
import { postsApi } from '@/src/api/posts';
import { usersApi } from '@/src/api/users';
import { invitationsApi } from '@/src/api/invitations';
import { Match, Post, User, Invitation } from '@/src/types';
import { Avatar } from '@/src/components/Avatar';
import { MatchCard } from '@/src/components/MatchCard';
import { PostCard } from '@/src/components/PostCard';
import { Button } from '@/src/components/Button';
import { InviteModal } from '@/src/components/InviteModal';
import { FriendActivityFeed } from '@/src/components/FriendActivityFeed';

type Tab = 'recomendado' | 'amigos' | 'siguiendo' | 'partidos';

const TABS: { key: Tab; label: string }[] = [
  { key: 'recomendado', label: 'Recomendado' },
  { key: 'amigos',      label: 'Amigos' },
  { key: 'siguiendo',   label: 'Siguiendo' },
  { key: 'partidos',    label: 'Partidos' },
];

const LEVEL_NAMES: Record<string, string> = {
  INICIACION: 'Iniciación', PRINCIPIANTE: 'Principiante', INTERMEDIO: 'Intermedio',
  AVANZADO: 'Avanzado', PROFESIONAL: 'Profesional',
};


// ─── Sub-components ───────────────────────────────────────────────────────────

function HeroCard({ user, matchCount }: { user: User | null; matchCount: number }) {
  const router = useRouter();
  const { colors } = useTheme();
  const levelLabel = user ? (levelDisplay[user.level] ?? user.level) : '—';
  const levelName = user ? (LEVEL_NAMES[user.level] ?? user.level) : '—';

  return (
    <TouchableOpacity activeOpacity={0.88} style={{
      marginHorizontal: 18, borderRadius: 20, padding: 22,
      backgroundColor: '#0C1D35',
      borderWidth: 1, borderColor: colors.primary + '50', overflow: 'hidden',
      shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.22, shadowRadius: 18, elevation: 10,
    }} onPress={() => router.push('/(tabs)/mapas')}>
      <View style={{ position: 'absolute', right: -50, top: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: colors.primary + '14' }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.success + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: colors.success + '40' }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success }} />
          <Text style={{ color: colors.success, fontSize: 12, fontWeight: '600' }}>En vivo</Text>
        </View>
        <View style={{ backgroundColor: colors.primary + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: colors.primary + '40' }}>
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>{levelLabel} · {levelName}</Text>
        </View>
      </View>
      <Text style={{ color: '#FFFFFF', fontSize: 23, fontWeight: '800', lineHeight: 30, marginBottom: 8, letterSpacing: -0.3 }}>
        {matchCount > 0
          ? `${matchCount} partido${matchCount !== 1 ? 's' : ''} esperan tu nivel`
          : 'Encuentra tu próximo partido'}
      </Text>
      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 20 }}>
        {user?.location ? `Cerca de ${user.location}` : 'Padel compatible con tu nivel'}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 13, paddingVertical: 13, paddingHorizontal: 20 }}>
        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Ver partidos disponibles</Text>
        <Ionicons name="arrow-forward" size={15} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

function LiveActivityBar({ activePlayers, todayMatches, seekingPlayers }: {
  activePlayers: number; todayMatches: number; seekingPlayers: number;
}) {
  const { colors } = useTheme();
  if (activePlayers === 0 && todayMatches === 0 && seekingPlayers === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, gap: 8 }} style={{ marginTop: 16 }}>
      {activePlayers > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.success + '15', borderWidth: 1, borderColor: colors.success + '30', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success }} />
          <Text style={{ color: colors.success, fontSize: 12, fontWeight: '600' }}>{activePlayers} activos ahora</Text>
        </View>
      )}
      {todayMatches > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.primary + '15', borderWidth: 1, borderColor: colors.primary + '30', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
          <Ionicons name="flash" size={11} color={colors.primary} />
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>{todayMatches} partidos</Text>
        </View>
      )}
      {seekingPlayers > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.accent + '15', borderWidth: 1, borderColor: colors.accent + '30', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
          <Ionicons name="people-outline" size={11} color={colors.accent} />
          <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '600' }}>{seekingPlayers} buscando rival</Text>
        </View>
      )}
    </ScrollView>
  );
}

function SectionHeader({
  title, iconName, iconColor, onSeeAll,
}: {
  title: string;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  iconColor?: string;
  onSeeAll?: () => void;
}) {
  const { colors } = useTheme();
  const ic = iconColor ?? colors.primary;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: ic + '22', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={iconName} size={14} color={ic} />
        </View>
        <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '700' }}>{title}</Text>
      </View>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
          <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '600' }}>Ver todo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function CompatiblePlayerCard({
  player, me, followed, onFollow, onInvite,
}: {
  player: User; me: User | null; followed: boolean; onFollow: () => void; onInvite: () => void;
}) {
  const router = useRouter();
  const { colors } = useTheme();
  const levelLabel = levelDisplay[player.level] ?? player.level;
  const levelName = LEVEL_NAMES[player.level] ?? player.level;
  const sameLevel = me?.level === player.level;

  return (
    <TouchableOpacity
      style={{ backgroundColor: colors.cardBg, borderRadius: 16, padding: 14, width: 145, marginRight: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}
      onPress={() => router.push(`/profile/${player.id}`)}
      activeOpacity={0.85}
    >
      <View style={{ position: 'relative', marginBottom: 8, marginTop: 4 }}>
        <Avatar name={player.name} size={52} />
        {player.available && (
          <View style={{ position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: 6, backgroundColor: colors.success, borderWidth: 2, borderColor: colors.cardBg }} />
        )}
      </View>
      <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 14, marginBottom: 2 }} numberOfLines={1}>{player.name.split(' ')[0]}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: sameLevel ? 5 : 10, textAlign: 'center' }}>{levelLabel} · {levelName}</Text>
      {sameLevel && (
        <View style={{ backgroundColor: colors.success + '20', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8 }}>
          <Text style={{ color: colors.success, fontSize: 10, fontWeight: '700' }}>Mismo nivel</Text>
        </View>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, width: '100%' }}>
        <Button label={followed ? 'Siguiendo' : 'Seguir'} variant={followed ? 'secondary' : 'outline'} size="sm" onPress={onFollow} style={{ flex: 1 }} />
        <TouchableOpacity style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: colors.accent + '18', borderWidth: 1, borderColor: colors.accent + '45', alignItems: 'center', justifyContent: 'center' }} onPress={onInvite} activeOpacity={0.8}>
          <Ionicons name="person-add-outline" size={15} color={colors.accent} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border },
    headerTitle: { flex: 1, textAlign: 'center', color: c.textPrimary, fontSize: 17, fontWeight: '700' },
    notifBtn: { position: 'relative', padding: 4 },
    notifBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: c.accent, borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
    notifBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
    tabBar: { flexDirection: 'row', paddingHorizontal: 18, paddingVertical: 10, gap: 8, borderBottomWidth: 1, borderBottomColor: c.border },
    tab: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: c.secondary, borderWidth: 1, borderColor: c.border },
    tabActive: { backgroundColor: c.primary, borderColor: c.primary },
    tabLabel: { color: c.textSecondary, fontSize: 13, fontWeight: '600' },
    tabLabelActive: { color: '#fff' },
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 36 },
    section: { marginTop: 26 },
    hScroll: { paddingHorizontal: 18, paddingBottom: 4 },
    feedList: { paddingHorizontal: 18, marginTop: 0 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 80 },
    emptyTitle: { color: c.textPrimary, fontSize: 17, fontWeight: '700' },
    emptyText: { color: c.textMuted, fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  });
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [activeTab, setActiveTab] = useState<Tab>('recomendado');
  const [matches, setMatches] = useState<Match[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followingPosts, setFollowingPosts] = useState<Post[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [inviteTarget, setInviteTarget] = useState<User | null>(null);
  const [notifCount, setNotifCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [m, p, fp, u, inv, following, liked] = await Promise.all([
      matchesApi.getAll().catch(() => [] as Match[]),
      postsApi.getFeed().catch(() => ({ content: [] as Post[], totalPages: 0, totalElements: 0, number: 0 })),
      postsApi.getFollowingFeed().catch(() => ({ content: [] as Post[], totalPages: 0, totalElements: 0, number: 0 })),
      usersApi.search('').catch(() => [] as User[]),
      invitationsApi.getPending().catch(() => [] as Invitation[]),
      usersApi.getFollowing().catch(() => [] as string[]),
      postsApi.getLikedIds().catch(() => [] as string[]),
    ]);
    setMatches(m);
    setPosts(p.content.slice(0, 10));
    setLikedIds(new Set(liked));
    setFollowingPosts(fp.content);
    setSuggestions(u.filter(s => s.id !== user?.id).slice(0, 5));
    setNotifCount(inv.length);
    setFollowedIds(new Set(following));
  }, [user?.id]);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  }, [loadData]);

  const handleFollow = (targetId: string) => {
    const isFollowed = followedIds.has(targetId);
    setFollowedIds(prev => { const s = new Set(prev); isFollowed ? s.delete(targetId) : s.add(targetId); return s; });
    (isFollowed ? usersApi.unfollow(targetId) : usersApi.follow(targetId)).catch(() => {
      setFollowedIds(prev => { const s = new Set(prev); isFollowed ? s.add(targetId) : s.delete(targetId); return s; });
    });
  };

  const urgentMatches = matches.filter(m => m.spotsLeft > 0 && m.spotsLeft <= 2);
  const activePlayers = suggestions.filter(s => s.available).length + (user?.available ? 1 : 0);
  const seekingPlayers = posts.filter(p => p.playersNeeded > 0).length;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/perfil')}>
          <Avatar name={user?.name ?? '?'} size={38} available />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inicio</Text>
        <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/notifications')}>
          <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
          {notifCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{notifCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {activeTab === 'recomendado' && (
            <>
              <View style={{ marginTop: 20 }}>
                <HeroCard user={user} matchCount={matches.length} />
              </View>
              <LiveActivityBar activePlayers={activePlayers} todayMatches={matches.length} seekingPlayers={seekingPlayers} />

              {urgentMatches.length > 0 && (
                <View style={styles.section}>
                  <SectionHeader title="Últimos cupos" iconName="flame" iconColor={colors.accent} onSeeAll={() => router.push('/(tabs)/mapas')} />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
                    {urgentMatches.map(match => (
                      <MatchCard key={match.id} match={match} compact onJoin={m => matchesApi.join(m.id).then(updated => setMatches(prev => prev.map(x => x.id === m.id ? updated : x)))} />
                    ))}
                  </ScrollView>
                </View>
              )}

              {matches.length > 0 && (
                <View style={styles.section}>
                  <SectionHeader title="Partidos sugeridos" iconName="flash" iconColor={colors.primary} onSeeAll={() => router.push('/(tabs)/mapas')} />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
                    {matches.slice(0, 5).map(match => (
                      <MatchCard key={match.id} match={match} compact onJoin={m => matchesApi.join(m.id).then(updated => setMatches(prev => prev.map(x => x.id === m.id ? updated : x)))} />
                    ))}
                  </ScrollView>
                </View>
              )}

              {suggestions.length > 0 && (
                <View style={styles.section}>
                  <SectionHeader title="Jugadores compatibles" iconName="people" iconColor={colors.success} />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
                    {suggestions.map(u => (
                      <CompatiblePlayerCard key={u.id} player={u} me={user} followed={followedIds.has(u.id)} onFollow={() => handleFollow(u.id)} onInvite={() => setInviteTarget(u)} />
                    ))}
                  </ScrollView>
                </View>
              )}

              {posts.length > 0 && (
                <View style={styles.section}>
                  <SectionHeader title="Actividad reciente" iconName="pulse-outline" iconColor={colors.primary} />
                  <View style={styles.feedList}>
                    {posts.map(post => <PostCard key={post.id} post={post} initialLiked={likedIds.has(post.id)} />)}
                  </View>
                </View>
              )}

              {matches.length === 0 && posts.length === 0 && (
                <View style={styles.empty}>
                  <Ionicons name="tennisball-outline" size={48} color={colors.textMuted} />
                  <Text style={styles.emptyTitle}>Todo listo</Text>
                  <Text style={styles.emptyText}>Crea un partido o una publicación para empezar.</Text>
                </View>
              )}
            </>
          )}

          {activeTab === 'amigos' && (
            <View style={{ paddingTop: 16 }}>
              <FriendActivityFeed
                hasFollowing={followedIds.size > 0}
                onFindPlayers={() => router.push('/(tabs)/mapas')}
              />
            </View>
          )}

          {activeTab === 'siguiendo' && (
            <>
              {followingPosts.length > 0 ? (
                <View style={[styles.section, styles.feedList]}>
                  {followingPosts.map(post => <PostCard key={post.id} post={post} initialLiked={likedIds.has(post.id)} />)}
                </View>
              ) : (
                <View style={styles.empty}>
                  <Ionicons name="people-outline" size={48} color={colors.textMuted} />
                  <Text style={styles.emptyTitle}>Sin actividad</Text>
                  <Text style={styles.emptyText}>Sigue a jugadores para ver sus publicaciones aquí.</Text>
                </View>
              )}
            </>
          )}

          {activeTab === 'partidos' && (
            <>
              {matches.length > 0 ? (
                <View style={[styles.section, { paddingHorizontal: 18 }]}>
                  {matches.map(match => (
                    <MatchCard key={match.id} match={match} onJoin={m => matchesApi.join(m.id).then(updated => setMatches(prev => prev.map(x => x.id === m.id ? updated : x))).catch(() => {})} />
                  ))}
                </View>
              ) : (
                <View style={styles.empty}>
                  <Ionicons name="tennisball-outline" size={48} color={colors.textMuted} />
                  <Text style={styles.emptyTitle}>Sin partidos</Text>
                  <Text style={styles.emptyText}>No hay partidos disponibles por ahora.</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      <InviteModal
        visible={inviteTarget !== null}
        user={inviteTarget}
        onClose={() => setInviteTarget(null)}
        onSend={data => {
          if (!inviteTarget) return;
          invitationsApi.create({
            toUserId: inviteTarget.id,
            courtId: data.court || undefined,
            customLocation: data.customLocation || undefined,
            date: data.date,
            time: data.time,
            message: data.message || undefined,
          }).catch(() => {});
        }}
      />
    </SafeAreaView>
  );
}
