import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, levelDisplay } from '@/src/theme/colors';
import { useAuth } from '@/src/context/AuthContext';
import { postsApi } from '@/src/api/posts';
import { usersApi } from '@/src/api/users';
import { invitationsApi } from '@/src/api/invitations';
import { Post, User, Invitation } from '@/src/types';
import { Avatar } from '@/src/components/Avatar';
import { PostCard } from '@/src/components/PostCard';
import { Button } from '@/src/components/Button';
import { InviteModal } from '@/src/components/InviteModal';

type Tab = 'parati' | 'amigos' | 'siguiendo';

const TABS: { key: Tab; label: string }[] = [
  { key: 'parati', label: 'Para ti' },
  { key: 'amigos', label: 'Amigos' },
  { key: 'siguiendo', label: 'Siguiendo' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('parati');
  const [posts, setPosts] = useState<Post[]>([]);
  const [followingPosts, setFollowingPosts] = useState<Post[]>([]);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [inviteTarget, setInviteTarget] = useState<User | null>(null);
  const [notifCount, setNotifCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    const [p, fp, friends, u, inv, following, liked] = await Promise.all([
      postsApi.getFeed().catch(() => ({ content: [] as Post[], totalPages: 0, totalElements: 0, number: 0 })),
      postsApi.getFollowingFeed().catch(() => ({ content: [] as Post[], totalPages: 0, totalElements: 0, number: 0 })),
      usersApi.getFriends(user.id).catch(() => [] as User[]),
      usersApi.search('').catch(() => [] as User[]),
      invitationsApi.getPending().catch(() => [] as Invitation[]),
      usersApi.getFollowing().catch(() => [] as string[]),
      postsApi.getLikedIds().catch(() => [] as string[]),
    ]);
    setPosts(p.content);
    setFollowingPosts(fp.content);
    setFriendIds(new Set(friends.map(f => f.id)));
    setLikedIds(new Set(liked));
    setSuggestions(u.filter(s => s.id !== user?.id && !following.includes(s.id)).slice(0, 5));
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

  const friendPosts = followingPosts.filter(p => friendIds.has(p.user.id));

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

      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {/* PARA TI */}
          {activeTab === 'parati' && (
            <>
              {suggestions.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>A quién seguir</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                    {suggestions.map(u => (
                      <TouchableOpacity key={u.id} style={styles.followCard} onPress={() => router.push(`/profile/${u.id}`)} activeOpacity={0.8}>
                        <Avatar name={u.name} size={52} available={u.available} />
                        <Text style={styles.followName} numberOfLines={1}>{u.name.split(' ')[0]}</Text>
                        <Text style={styles.followLevel}>{levelDisplay[u.level] ?? u.level}</Text>
                        <Button
                          label={followedIds.has(u.id) ? 'Siguiendo' : 'Seguir'}
                          variant={followedIds.has(u.id) ? 'secondary' : 'outline'}
                          size="sm"
                          onPress={() => handleFollow(u.id)}
                          style={{ marginTop: 8 }}
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {posts.length > 0 ? (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Publicaciones</Text>
                  </View>
                  {posts.map(post => (
                    <PostCard key={post.id} post={post} initialLiked={likedIds.has(post.id)} />
                  ))}
                </View>
              ) : (
                <View style={styles.empty}>
                  <Ionicons name="newspaper-outline" size={48} color={colors.textMuted} />
                  <Text style={styles.emptyTitle}>Sin publicaciones</Text>
                  <Text style={styles.emptyText}>Sé el primero en publicar algo.</Text>
                </View>
              )}
            </>
          )}

          {/* AMIGOS */}
          {activeTab === 'amigos' && (
            <>
              {friendPosts.length > 0 ? (
                <View style={styles.section}>
                  {friendPosts.map(post => (
                    <PostCard key={post.id} post={post} initialLiked={likedIds.has(post.id)} />
                  ))}
                </View>
              ) : (
                <View style={styles.empty}>
                  <Ionicons name="people-outline" size={48} color={colors.textMuted} />
                  <Text style={styles.emptyTitle}>Sin publicaciones de amigos</Text>
                  <Text style={styles.emptyText}>Los usuarios que te sigan de vuelta aparecerán aquí.</Text>
                </View>
              )}
            </>
          )}

          {/* SIGUIENDO */}
          {activeTab === 'siguiendo' && (
            <>
              {followingPosts.length > 0 ? (
                <View style={styles.section}>
                  {followingPosts.map(post => (
                    <PostCard key={post.id} post={post} initialLiked={likedIds.has(post.id)} />
                  ))}
                </View>
              ) : (
                <View style={styles.empty}>
                  <Ionicons name="person-add-outline" size={48} color={colors.textMuted} />
                  <Text style={styles.emptyTitle}>Sin actividad</Text>
                  <Text style={styles.emptyText}>Sigue a jugadores para ver sus publicaciones aquí.</Text>
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
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 18, paddingVertical: 10, gap: 8,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  tab: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 20, backgroundColor: colors.secondary,
    borderWidth: 1, borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  tabLabelActive: { color: '#fff' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  horizontalScroll: { paddingBottom: 4 },
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
