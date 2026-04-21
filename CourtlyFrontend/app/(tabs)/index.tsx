import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { useAuth } from '@/src/context/AuthContext';
import { matchesApi } from '@/src/api/matches';
import { postsApi } from '@/src/api/posts';
import { usersApi } from '@/src/api/users';
import { invitationsApi } from '@/src/api/invitations';
import { challengesApi } from '@/src/api/challenges';
import { Match, Post, User, Challenge, Invitation } from '@/src/types';
import { Avatar } from '@/src/components/Avatar';
import { MatchCard } from '@/src/components/MatchCard';
import { PostCard } from '@/src/components/PostCard';
import { Button } from '@/src/components/Button';
import { InviteModal } from '@/src/components/InviteModal';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [inviteTarget, setInviteTarget] = useState<User | null>(null);
  const [notifCount, setNotifCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      matchesApi.getAll().catch(() => [] as Match[]),
      postsApi.getFeed().catch(() => ({ content: [] as Post[], totalPages: 0, totalElements: 0, number: 0 })),
      usersApi.search('').catch(() => [] as User[]),
      invitationsApi.getPending().catch(() => [] as Invitation[]),
      challengesApi.getMine().catch(() => [] as Challenge[]),
      usersApi.getFollowing().catch(() => [] as string[]),
    ]).then(([m, p, u, inv, ch, following]) => {
      setMatches(m.slice(0, 5));
      setPosts(p.content.slice(0, 10));
      setSuggestions(u.filter(s => s.id !== user?.id).slice(0, 5));
      setNotifCount(inv.length + ch.filter(c => c.status === 'PENDING').length);
      setFollowedIds(new Set(following));
    }).finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

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

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {matches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.sectionIcon}>
                    <Ionicons name="flash" size={14} color={colors.ctaHighlight} />
                  </View>
                  <Text style={styles.sectionTitle}>Partidos sugeridos</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/(tabs)/mapas')}>
                  <Text style={styles.seeAll}>Ver todo</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                {matches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    compact
                    onJoin={(m) => matchesApi.join(m.id)
                      .then(updated => setMatches(prev => prev.map(x => x.id === m.id ? updated : x)))
                      .catch(() => {})
                    }
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {suggestions.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>A quién seguir</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/grupos')}>
                  <Text style={styles.seeAll}>Ver todo</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                {suggestions.map((u) => (
                  <TouchableOpacity key={u.id} style={styles.followCard} onPress={() => router.push(`/profile/${u.id}`)} activeOpacity={0.8}>
                    <Avatar name={u.name} size={52} available={u.available} />
                    <Text style={styles.followName} numberOfLines={1}>{u.name.split(' ')[0]}</Text>
                    <Text style={styles.followLevel}>{u.level}</Text>
                    <Button
                      label={followedIds.has(u.id) ? 'Siguiendo' : 'Seguir'}
                      variant={followedIds.has(u.id) ? 'secondary' : 'outline'}
                      size="sm"
                      onPress={() => {
                        const isFollowed = followedIds.has(u.id);
                        setFollowedIds(prev => { const s = new Set(prev); isFollowed ? s.delete(u.id) : s.add(u.id); return s; });
                        (isFollowed ? usersApi.unfollow(u.id) : usersApi.follow(u.id)).catch(() => {
                          setFollowedIds(prev => { const s = new Set(prev); isFollowed ? s.add(u.id) : s.delete(u.id); return s; });
                        });
                      }}
                      style={{ marginTop: 8 }}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {posts.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Tu feed</Text>
              </View>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onJoin={(p) => setInviteTarget(p.user)} />
              ))}
            </View>
          )}

          {!loading && matches.length === 0 && posts.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="tennisball-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Todo listo</Text>
              <Text style={styles.emptyText}>Crea un partido o una publicación para empezar.</Text>
            </View>
          )}
        </ScrollView>
      )}

      <InviteModal
        visible={inviteTarget !== null}
        user={inviteTarget}
        onClose={() => setInviteTarget(null)}
        onSend={(data) => {
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { flex: 1, textAlign: 'center', color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
  notifBtn: { position: 'relative', padding: 4 },
  notifBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: colors.ctaHighlight, borderRadius: 8,
    width: 16, height: 16, alignItems: 'center', justifyContent: 'center',
  },
  notifBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  section: { marginTop: 22 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, marginBottom: 14,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sectionIcon: {
    width: 22, height: 22, borderRadius: 6,
    backgroundColor: colors.ctaHighlight + '22',
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  seeAll: { color: colors.ctaHighlight, fontSize: 13, fontWeight: '600' },
  horizontalScroll: { paddingHorizontal: 18, paddingBottom: 4 },
  followCard: {
    backgroundColor: colors.cardBg, borderRadius: 14, padding: 14,
    alignItems: 'center', width: 120, marginRight: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  followName: { color: colors.textPrimary, fontWeight: '600', fontSize: 13, marginTop: 8 },
  followLevel: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 80 },
  emptyTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
});
