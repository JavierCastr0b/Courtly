import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { User } from '@/src/types';
import { usersApi } from '@/src/api/users';
import { Avatar } from '@/src/components/Avatar';
import { Button } from '@/src/components/Button';

type Mode = 'followers' | 'following' | 'friends';

const TITLES: Record<Mode, string> = {
  followers: 'Seguidores',
  following: 'Siguiendo',
  friends: 'Amigos',
};

export default function FollowersScreen() {
  const { id, mode } = useLocalSearchParams<{ id: string; mode: Mode }>();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = mode === 'followers'
      ? usersApi.getFollowersList(id)
      : mode === 'following'
        ? usersApi.getFollowingList(id)
        : usersApi.getFriends(id);

    Promise.all([fetchUsers, usersApi.getFollowing().catch(() => [] as string[])])
      .then(([list, following]) => {
        setUsers(list);
        setFollowedIds(new Set(following));
      })
      .finally(() => setLoading(false));
  }, [id, mode]);

  const handleFollow = (targetId: string) => {
    const isFollowed = followedIds.has(targetId);
    setFollowedIds(prev => { const s = new Set(prev); isFollowed ? s.delete(targetId) : s.add(targetId); return s; });
    (isFollowed ? usersApi.unfollow(targetId) : usersApi.follow(targetId)).catch(() => {
      setFollowedIds(prev => { const s = new Set(prev); isFollowed ? s.add(targetId) : s.delete(targetId); return s; });
    });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{TITLES[mode ?? 'followers']}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={u => u.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={44} color={colors.textMuted} />
              <Text style={styles.emptyText}>
                {mode === 'friends' ? 'Sin amigos aún' : mode === 'followers' ? 'Sin seguidores aún' : 'No sigue a nadie aún'}
              </Text>
            </View>
          }
          renderItem={({ item: u }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push(`/profile/${u.id}`)}
              activeOpacity={0.7}
            >
              <Avatar name={u.name} size={46} available={u.available} />
              <View style={styles.rowInfo}>
                <Text style={styles.name}>{u.name}</Text>
                <Text style={styles.username}>@{u.username}</Text>
              </View>
              <Button
                label={followedIds.has(u.id) ? 'Siguiendo' : 'Seguir'}
                variant={followedIds.has(u.id) ? 'secondary' : 'outline'}
                size="sm"
                onPress={() => handleFollow(u.id)}
              />
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
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
  list: { paddingVertical: 8, paddingHorizontal: 18 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  rowInfo: { flex: 1 },
  name: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  username: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  separator: { height: 1, backgroundColor: colors.border },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { color: colors.textMuted, fontSize: 14 },
});
