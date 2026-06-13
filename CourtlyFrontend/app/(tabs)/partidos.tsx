import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { useAuth } from '@/src/context/AuthContext';
import { matchesApi } from '@/src/api/matches';
import { invitationsApi } from '@/src/api/invitations';
import { Match, Invitation } from '@/src/types';
import { Avatar } from '@/src/components/Avatar';
import { MatchCard } from '@/src/components/MatchCard';

type Tab = 'parati' | 'amigos';

const TABS: { key: Tab; label: string }[] = [
  { key: 'parati', label: 'Para ti' },
  { key: 'amigos', label: 'Amigos' },
];

export default function PartidosScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('parati');
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [friendMatches, setFriendMatches] = useState<Match[]>([]);
  const [notifCount, setNotifCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [all, friends, inv] = await Promise.all([
      matchesApi.getAll().catch(() => [] as Match[]),
      matchesApi.getFriendMatches().catch(() => [] as Match[]),
      invitationsApi.getPending().catch(() => [] as Invitation[]),
    ]);
    setAllMatches(all);
    setFriendMatches(friends);
    setNotifCount(inv.length);
  }, []);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  }, [loadData]);

  const handleJoin = (match: Match) => {
    return matchesApi.join(match.id)
      .then(updated => {
        const patch = (prev: Match[]) => prev.map(m => m.id === match.id ? updated : m);
        setAllMatches(patch);
        setFriendMatches(patch);
      });
  };

  const currentMatches = activeTab === 'parati' ? allMatches : friendMatches;

  const emptyConfig = {
    parati: {
      icon: 'tennisball-outline' as const,
      title: 'Sin partidos disponibles',
      text: 'No hay partidos vigentes por ahora.',
    },
    amigos: {
      icon: 'people-outline' as const,
      title: 'Sin partidos de amigos',
      text: 'Cuando tus amigos creen partidos, aparecerán aquí.\nDos usuarios que se sigan mutuamente son amigos.',
    },
  }[activeTab];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/perfil')}>
          <Avatar name={user?.name ?? '?'} size={38} available />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partidos</Text>
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
          {currentMatches.length > 0 ? (
            <View style={styles.list}>
              {currentMatches.map(match => (
                <MatchCard key={match.id} match={match} onJoin={handleJoin} />
              ))}
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name={emptyConfig.icon} size={52} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>{emptyConfig.title}</Text>
              <Text style={styles.emptyText}>{emptyConfig.text}</Text>
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
  list: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingTop: 80, paddingHorizontal: 40 },
  emptyTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
