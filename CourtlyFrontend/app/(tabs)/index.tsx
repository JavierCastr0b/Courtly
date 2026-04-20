import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { useAuth } from '@/src/context/AuthContext';
import { matchesApi } from '@/src/api/matches';
import { postsApi } from '@/src/api/posts';
import { usersApi } from '@/src/api/users';
import { Match, Post, User } from '@/src/types';
import { Avatar } from '@/src/components/Avatar';
import { MatchCard } from '@/src/components/MatchCard';
import { PostCard } from '@/src/components/PostCard';
import { Button } from '@/src/components/Button';

const PROGRESS_ITEMS = [
  { id: '1', label: 'Carga tu primera actividad', sublabel: 'Puedes registrarla directamente en la aplicación.', done: false },
  { id: '2', label: 'Sigue a tres personas (0/3)', sublabel: 'Busca a tus amigos y a cracks del deporte y síguelos.', done: false },
  { id: '3', label: 'Únete a un club', sublabel: 'Encuentra tu comunidad padelera en Lima.', done: false },
  { id: '4', label: 'Conéctate a Apple Health', sublabel: 'Sincroniza tus datos de salud y actividad.', done: true },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications] = useState(3);

  useEffect(() => {
    Promise.all([
      matchesApi.getAll().catch(() => [] as Match[]),
      postsApi.getFeed().catch(() => ({ content: [] as Post[], totalPages: 0, totalElements: 0, number: 0 })),
      usersApi.search('').catch(() => [] as User[]),
    ]).then(([m, p, u]) => {
      setMatches(m.slice(0, 5));
      setPosts(p.content.slice(0, 10));
      setSuggestions(u.filter(s => s.id !== user?.id).slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  const completedCount = PROGRESS_ITEMS.filter((i) => i.done).length;
  const progressPct = (completedCount / PROGRESS_ITEMS.length) * 100;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Avatar name={user?.name ?? '?'} size={38} available />
        <Text style={styles.headerTitle}>Inicio</Text>
        <TouchableOpacity style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
          {notifications > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{notifications}</Text>
            </View>
          )}
        </TouchableOpacity>
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
        >
          {matches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.sectionIcon}>
                    <Ionicons name="flash" size={14} color={colors.ctaHighlight} />
                  </View>
                  <Text style={styles.sectionTitle}>Partidos sugeridos</Text>
                </View>
                <TouchableOpacity>
                  <Text style={styles.seeAll}>Ver todo</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                {matches.map((match) => (
                  <MatchCard key={match.id} match={match} compact onJoin={() => {}} />
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.progressBlock}>
            <Text style={styles.progressTitle}>¡Sigue así!</Text>
            <View style={styles.progressBarRow}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
              </View>
              <Text style={styles.progressCount}>
                {completedCount}/{PROGRESS_ITEMS.length}
              </Text>
            </View>
            <View style={styles.progressItems}>
              {PROGRESS_ITEMS.map((item) => (
                <View key={item.id} style={styles.progressItem}>
                  <View style={[styles.progressCircle, item.done && styles.progressCircleDone]}>
                    {item.done && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <View style={styles.progressItemText}>
                    <Text style={[styles.progressLabel, item.done && styles.progressLabelDone]}>
                      {item.label}
                    </Text>
                    {!item.done && (
                      <Text style={styles.progressSublabel}>{item.sublabel}</Text>
                    )}
                  </View>
                  {!item.done && (
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  )}
                </View>
              ))}
            </View>
          </View>

          {suggestions.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>A quién seguir</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAll}>Ver todo</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                {suggestions.map((u) => (
                  <View key={u.id} style={styles.followCard}>
                    <Avatar name={u.name} size={52} available={u.available} />
                    <Text style={styles.followName} numberOfLines={1}>{u.name.split(' ')[0]}</Text>
                    <Text style={styles.followLevel}>{u.level}</Text>
                    <Button
                      label="Seguir"
                      variant="outline"
                      size="sm"
                      onPress={() => usersApi.follow(u.id).catch(() => {})}
                      style={{ marginTop: 8 }}
                    />
                  </View>
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
                <PostCard key={post.id} post={post} onJoin={() => {}} />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  notifBtn: { position: 'relative', padding: 4 },
  notifBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.ctaHighlight,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  section: { marginTop: 22 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sectionIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: colors.ctaHighlight + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  seeAll: { color: colors.ctaHighlight, fontSize: 13, fontWeight: '600' },
  horizontalScroll: { paddingHorizontal: 18, paddingBottom: 4 },
  progressBlock: {
    marginTop: 22,
    marginHorizontal: 18,
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 12 },
  progressBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  progressBarBg: { flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: colors.success, borderRadius: 3 },
  progressCount: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  progressItems: { gap: 14 },
  progressItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  progressCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  progressCircleDone: { backgroundColor: colors.success, borderColor: colors.success },
  progressItemText: { flex: 1 },
  progressLabel: { color: colors.textPrimary, fontSize: 14, fontWeight: '500' },
  progressLabelDone: { color: colors.textMuted, textDecorationLine: 'line-through' },
  progressSublabel: { color: colors.textSecondary, fontSize: 12, marginTop: 2, lineHeight: 17 },
  followCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    width: 120,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  followName: { color: colors.textPrimary, fontWeight: '600', fontSize: 13, marginTop: 8 },
  followLevel: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
});
