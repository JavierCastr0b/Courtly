import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { User, Post } from '@/src/types';
import { usersApi } from '@/src/api/users';
import { postsApi } from '@/src/api/posts';
import { useAuth } from '@/src/context/AuthContext';
import { Avatar } from '@/src/components/Avatar';
import { Tag } from '@/src/components/Tag';
import { Button } from '@/src/components/Button';
import { PostCard } from '@/src/components/PostCard';

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: me } = useAuth();

  const [profile, setProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followed, setFollowed] = useState(false);
  const [stats, setStats] = useState({ followersCount: 0, followingCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      usersApi.getById(id),
      postsApi.getByUser(id).catch(() => [] as Post[]),
      usersApi.getFollowing().catch(() => [] as string[]),
      usersApi.getStats(id).catch(() => ({ followersCount: 0, followingCount: 0 })),
    ]).then(([u, userPosts, following, s]) => {
      setProfile(u);
      setPosts(userPosts);
      setFollowed(following.includes(id));
      setStats(s);
    }).catch(() => Alert.alert('Error', 'No se pudo cargar el perfil.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleFollow = () => {
    const next = !followed;
    setFollowed(next);
    (next ? usersApi.follow(id) : usersApi.unfollow(id)).catch(() => setFollowed(!next));
  };

  const isOwnProfile = me?.id === id;
  const winRate = profile && profile.matchesPlayed > 0
    ? Math.round((profile.wins / profile.matchesPlayed) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : profile ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={styles.hero}>
            <Avatar name={profile.name} size={80} available={profile.available} />
            <View style={styles.heroInfo}>
              <Text style={styles.name}>{profile.name}</Text>
              <Text style={styles.username}>@{profile.username}</Text>
              {profile.location ? (
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                  <Text style={styles.metaText}>{profile.location}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.followingCount}</Text>
              <Text style={styles.statLabel}>Siguiendo</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.followersCount}</Text>
              <Text style={styles.statLabel}>Seguidores</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profile.matchesPlayed}</Text>
              <Text style={styles.statLabel}>Partidos</Text>
            </View>
          </View>

          {/* Action */}
          {!isOwnProfile && (
            <View style={styles.actionRow}>
              <Button
                label={followed ? 'Siguiendo' : 'Seguir'}
                variant={followed ? 'secondary' : 'primary'}
                size="md"
                onPress={handleFollow}
                style={{ flex: 1 }}
              />
              <Button
                label="Invitar"
                variant="outline"
                size="md"
                onPress={() => router.push('/(tabs)/grupos')}
                style={{ flex: 1 }}
              />
            </View>
          )}

          {/* Posts */}
          {posts.length > 0 && (
            <View style={styles.postsSection}>
              <Text style={styles.sectionTitle}>Publicaciones</Text>
              {posts.map(p => <PostCard key={p.id} post={p} />)}
            </View>
          )}

          {posts.length === 0 && (
            <View style={styles.emptyPosts}>
              <Ionicons name="document-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>Sin publicaciones aún</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.loader}>
          <Text style={{ color: colors.textMuted }}>No se encontró el perfil.</Text>
        </View>
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
  content: { paddingBottom: 40 },
  hero: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 20, paddingVertical: 20,
  },
  heroInfo: { flex: 1 },
  name: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  username: { color: colors.textSecondary, fontSize: 14, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  metaText: { color: colors.textMuted, fontSize: 12 },
  bio: {
    color: colors.textSecondary, fontSize: 14, lineHeight: 20,
    paddingHorizontal: 20, marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row', backgroundColor: colors.cardBg,
    marginHorizontal: 20, borderRadius: 14, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: 16,
  },
  statCard: { flex: 1, alignItems: 'center', gap: 6 },
  statDivider: { width: 1, height: 30, backgroundColor: colors.border },
  statValue: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  statLabel: { color: colors.textSecondary, fontSize: 11 },
  actionRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 20 },
  postsSection: { paddingHorizontal: 20, marginTop: 8 },
  sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 14 },
  emptyPosts: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { color: colors.textMuted, fontSize: 14 },
});
