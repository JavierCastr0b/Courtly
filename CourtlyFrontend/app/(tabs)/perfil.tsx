import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { currentUser, mockPosts } from '@/src/data/mockData';
import { Avatar } from '@/src/components/Avatar';
import { Tag } from '@/src/components/Tag';
import { Button } from '@/src/components/Button';
import { PostCard } from '@/src/components/PostCard';

// Simple activity heatmap data for March 2026
const WEEKS = 5;
const DAYS = 7;
const ACTIVITY = [
  [0, 0, 1, 0, 2, 0, 0],
  [0, 3, 0, 2, 0, 3, 0],
  [1, 0, 2, 0, 0, 2, 1],
  [0, 2, 0, 3, 2, 0, 0],
  [3, 0, 1, 0, 0, 0, 0],
];
const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function ActivityCell({ intensity }: { intensity: number }) {
  const bgMap = ['#1C2028', '#0D3361', '#1565C0', '#1E90FF'];
  return (
    <View style={[styles.activityCell, { backgroundColor: bgMap[intensity] }]} />
  );
}

const PROFILE_TABS = ['Progreso', 'Actividad'] as const;
type ProfileTab = typeof PROFILE_TABS[number];

export default function PerfilScreen() {
  const [activeTab, setActiveTab] = useState<ProfileTab>('Progreso');
  const userPosts = mockPosts.filter((p) => p.user.id === '1').slice(0, 2);

  const winRate = Math.round((currentUser.wins / currentUser.matchesPlayed) * 100);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* ─── Header ─────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tú</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => Alert.alert('Configuración')}>
          <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Profile section ────────────────────────── */}
        <View style={styles.profileSection}>
          <Avatar name={currentUser.name} initials={currentUser.initials} size={72} available />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{currentUser.name}</Text>
            <Text style={styles.profileUsername}>@{currentUser.username}</Text>
            <View style={styles.profileMeta}>
              <Ionicons name="location-outline" size={13} color={colors.textMuted} />
              <Text style={styles.profileMetaText}>{currentUser.location}</Text>
            </View>
          </View>
          <Button
            label="Editar perfil"
            variant="outline"
            size="sm"
            onPress={() => Alert.alert('Editar perfil')}
          />
        </View>

        {currentUser.bio && (
          <Text style={styles.bio}>{currentUser.bio}</Text>
        )}

        {/* ─── Stats ──────────────────────────────────── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{currentUser.matchesPlayed}</Text>
            <Text style={styles.statLabel}>Partidos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{currentUser.wins}</Text>
            <Text style={styles.statLabel}>Victorias</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.success }]}>{winRate}%</Text>
            <Text style={styles.statLabel}>Win rate</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Tag label={currentUser.level} variant="level" level={currentUser.level} />
            <Text style={styles.statLabel}>Nivel</Text>
          </View>
        </View>

        {/* ─── Tabs ───────────────────────────────────── */}
        <View style={styles.tabs}>
          {PROFILE_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'Progreso' && (
          <>
            {/* ─── This week ──────────────────────────── */}
            <View style={styles.weekBlock}>
              <View style={styles.weekHeader}>
                <Text style={styles.weekTitle}>Esta semana</Text>
              </View>
              <View style={styles.weekStats}>
                <View style={styles.weekStat}>
                  <Text style={styles.weekStatValue}>0 km</Text>
                  <Text style={styles.weekStatLabel}>Distancia</Text>
                </View>
                <View style={styles.weekStat}>
                  <Text style={styles.weekStatValue}>0 min</Text>
                  <Text style={styles.weekStatLabel}>Tiempo</Text>
                </View>
                <View style={styles.weekStat}>
                  <Text style={styles.weekStatValue}>0 pts</Text>
                  <Text style={styles.weekStatLabel}>Puntos</Text>
                </View>
              </View>
            </View>

            {/* ─── Streak ─────────────────────────────── */}
            <View style={styles.streakBlock}>
              <View style={styles.streakInfo}>
                <Ionicons name="flame" size={28} color={colors.ctaHighlight} />
                <View>
                  <Text style={styles.streakTitle}>Racha actual</Text>
                  <Text style={styles.streakValue}>0 semanas</Text>
                </View>
              </View>
              <View style={styles.streakInfo}>
                <Ionicons name="trophy" size={28} color={colors.warning} />
                <View>
                  <Text style={styles.streakTitle}>Mejor racha</Text>
                  <Text style={styles.streakValue}>3 semanas</Text>
                </View>
              </View>
            </View>

            {/* ─── Calendar heatmap ───────────────────── */}
            <View style={styles.calendarBlock}>
              <View style={styles.calendarHeader}>
                <Text style={styles.calendarMonth}>marzo 2026</Text>
              </View>
              <View style={styles.dayLabels}>
                {DAY_LABELS.map((d) => (
                  <Text key={d} style={styles.dayLabel}>{d}</Text>
                ))}
              </View>
              {ACTIVITY.map((week, wi) => (
                <View key={wi} style={styles.calendarWeek}>
                  {week.map((day, di) => (
                    <ActivityCell key={di} intensity={day} />
                  ))}
                </View>
              ))}
              <View style={styles.calendarLegend}>
                <Text style={styles.calendarLegendText}>Menos</Text>
                {[0, 1, 2, 3].map((i) => (
                  <ActivityCell key={i} intensity={i} />
                ))}
                <Text style={styles.calendarLegendText}>Más</Text>
              </View>
            </View>

            {/* ─── Premium upsell ─────────────────────── */}
            <View style={styles.premiumCard}>
              <Ionicons name="lock-closed" size={20} color={colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.premiumTitle}>Desata todo tu potencial.</Text>
                <Text style={styles.premiumSub}>
                  Haz un seguimiento de tu progreso y alcanza tus objetivos con las funciones incluidas en la suscripción.
                </Text>
              </View>
            </View>
          </>
        )}

        {activeTab === 'Actividad' && (
          <View style={{ marginTop: 16 }}>
            {mockPosts.slice(0, 3).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </View>
        )}
      </ScrollView>
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
  headerBtn: {
    padding: 4,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: 40,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 14,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  profileUsername: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  profileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  profileMetaText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  bio: {
    color: colors.textSecondary,
    fontSize: 14,
    paddingHorizontal: 18,
    marginBottom: 16,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.cardBg,
    marginHorizontal: 18,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginHorizontal: 18,
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.primary,
  },
  weekBlock: {
    marginHorizontal: 18,
    marginTop: 16,
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  weekHeader: {
    marginBottom: 12,
  },
  weekTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  weekStats: {
    flexDirection: 'row',
    gap: 20,
  },
  weekStat: {},
  weekStatValue: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  weekStatLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  streakBlock: {
    marginHorizontal: 18,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  streakInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakTitle: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  streakValue: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  calendarBlock: {
    marginHorizontal: 18,
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  calendarHeader: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calendarMonth: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  dayLabels: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 6,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  calendarWeek: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  activityCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 4,
  },
  calendarLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    justifyContent: 'flex-end',
  },
  calendarLegendText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  premiumCard: {
    marginHorizontal: 18,
    backgroundColor: colors.secondary,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  premiumTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 4,
  },
  premiumSub: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});
