import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { Avatar } from './Avatar';

// ─── Types ────────────────────────────────────────────────────────────────────

type ActivityType =
  | 'match_created'
  | 'match_won'
  | 'new_follow'
  | 'achievement'
  | 'available'
  | 'new_equipment'
  | 'win_streak';

interface FriendActivity {
  id: string;
  type: ActivityType;
  user: { id: string; name: string };
  createdAt: Date;
  matchLocation?: string;
  matchDate?: string;
  matchTime?: string;
  matchLevel?: string;
  score?: string;
  opponents?: string;
  targetUser?: { id: string; name: string };
  achievementValue?: number;
  equipmentName?: string;
  streakCount?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diff < 1) return 'Ahora mismo';
  if (diff < 60) return `Hace ${diff} min`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `Hace ${h} h`;
  if (h < 48) return 'Ayer';
  return `Hace ${Math.floor(h / 24)} días`;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const _ts = Date.now();

const MOCK_ACTIVITIES: FriendActivity[] = [
  { id: 'a1',  type: 'available',      user: { id: 'u1', name: 'Javier Castro' },  createdAt: new Date(_ts - 5 * 60_000) },
  { id: 'a2',  type: 'match_created',  user: { id: 'u2', name: 'Hugo Martínez' },  createdAt: new Date(_ts - 18 * 60_000),   matchLocation: 'Golf Los Incas',   matchDate: 'Hoy',    matchTime: '8:00 PM',  matchLevel: '4ta categoría' },
  { id: 'a3',  type: 'win_streak',     user: { id: 'u3', name: 'Pedro Salinas' },  createdAt: new Date(_ts - 1 * 3_600_000),  streakCount: 5 },
  { id: 'a4',  type: 'match_won',      user: { id: 'u2', name: 'Hugo Martínez' },  createdAt: new Date(_ts - 2 * 3_600_000),  score: '6-4  6-3', opponents: 'Pedro / Luis' },
  { id: 'a5',  type: 'new_equipment',  user: { id: 'u4', name: 'Nicolás Vera' },   createdAt: new Date(_ts - 3 * 3_600_000),  equipmentName: 'Bullpadel Vertex 04' },
  { id: 'a6',  type: 'achievement',    user: { id: 'u5', name: 'Sergio García' },  createdAt: new Date(_ts - 4 * 3_600_000),  achievementValue: 25 },
  { id: 'a7',  type: 'new_follow',     user: { id: 'u4', name: 'Nicolás Vera' },   createdAt: new Date(_ts - 5 * 3_600_000),  targetUser: { id: 'u6', name: 'Matías Ruiz' } },
  { id: 'a8',  type: 'match_created',  user: { id: 'u1', name: 'Javier Castro' },  createdAt: new Date(_ts - 8 * 3_600_000),  matchLocation: 'Club Miraflores',  matchDate: 'Mañana', matchTime: '10:00 AM', matchLevel: '3ra categoría' },
  { id: 'a9',  type: 'match_won',      user: { id: 'u6', name: 'Matías Ruiz' },    createdAt: new Date(_ts - 27 * 3_600_000), score: '6-2  7-5', opponents: 'Hugo / Nicolás' },
  { id: 'a10', type: 'achievement',    user: { id: 'u3', name: 'Pedro Salinas' },  createdAt: new Date(_ts - 30 * 3_600_000), achievementValue: 10 },
  { id: 'a11', type: 'available',      user: { id: 'u7', name: 'Luis Morales' },   createdAt: new Date(_ts - 33 * 3_600_000) },
  { id: 'a12', type: 'new_equipment',  user: { id: 'u5', name: 'Sergio García' },  createdAt: new Date(_ts - 54 * 3_600_000), equipmentName: 'Head Zephyr Pro' },
];

// ─── Activity config ──────────────────────────────────────────────────────────

const ACTIVITY_CONFIG: Record<ActivityType, {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  colorKey: 'primary' | 'accent' | 'success';
  verb: (a: FriendActivity) => string;
  actionLabel: string;
}> = {
  match_created: {
    iconName: 'tennisball',
    colorKey: 'primary',
    verb: () => 'creó un partido',
    actionLabel: 'Ver partido',
  },
  match_won: {
    iconName: 'trophy',
    colorKey: 'accent',
    verb: () => 'ganó un partido',
    actionLabel: 'Ver perfil',
  },
  new_follow: {
    iconName: 'person-add',
    colorKey: 'primary',
    verb: a => `empezó a seguir a ${a.targetUser?.name.split(' ')[0] ?? ''}`,
    actionLabel: 'Ver perfil',
  },
  achievement: {
    iconName: 'star',
    colorKey: 'accent',
    verb: a => `alcanzó ${a.achievementValue ?? 0} partidos jugados`,
    actionLabel: 'Ver perfil',
  },
  available: {
    iconName: 'radio-button-on',
    colorKey: 'success',
    verb: () => 'está disponible hoy',
    actionLabel: 'Invitar',
  },
  new_equipment: {
    iconName: 'tennisball-outline',
    colorKey: 'primary',
    verb: () => 'añadió una nueva pala',
    actionLabel: 'Ver perfil',
  },
  win_streak: {
    iconName: 'flame',
    colorKey: 'accent',
    verb: a => `lleva ${a.streakCount ?? 0} victorias seguidas`,
    actionLabel: 'Ver perfil',
  },
};

// ─── FadeInCard wrapper ───────────────────────────────────────────────────────

function FadeInCard({ children, delay }: { children: React.ReactNode; delay: number }) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 300, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 300, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

// ─── Individual card ──────────────────────────────────────────────────────────

function ActivityCard({ activity, index }: { activity: FriendActivity; index: number }) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const cfg  = ACTIVITY_CONFIG[activity.type];
  const tint = cfg.colorKey === 'primary' ? colors.primary
    : cfg.colorKey === 'accent'           ? colors.accent
    : colors.success;

  return (
    <FadeInCard delay={index * 55}>
      <View style={{
        backgroundColor: colors.cardBg,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14,
        marginHorizontal: 18,
        marginBottom: 10,
        shadowColor: isDark ? '#000' : colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.22 : 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}>

        {/* Header: avatar + description + time */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
          <View style={{ position: 'relative', marginTop: 1 }}>
            <Avatar name={activity.user.name} size={40} />
            <View style={{
              position: 'absolute', bottom: -2, right: -2,
              width: 18, height: 18, borderRadius: 9,
              backgroundColor: tint, borderWidth: 2, borderColor: colors.cardBg,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name={cfg.iconName} size={8} color="#fff" />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19 }}>
              <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>
                {activity.user.name.split(' ')[0]}{' '}
              </Text>
              {cfg.verb(activity)}
            </Text>
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
            {timeAgo(activity.createdAt)}
          </Text>
        </View>

        {/* Detail blocks */}

        {activity.type === 'match_created' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.secondary, borderRadius: 10, padding: 10, marginBottom: 12 }}>
            <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: tint + '22', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="tennisball-outline" size={17} color={tint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>{activity.matchLocation}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{activity.matchDate} · {activity.matchTime}</Text>
              {activity.matchLevel && (
                <View style={{ alignSelf: 'flex-start', backgroundColor: tint + '18', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, marginTop: 3 }}>
                  <Text style={{ color: tint, fontSize: 10, fontWeight: '700' }}>{activity.matchLevel}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {activity.type === 'match_won' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFB80010', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#FFB80030', marginBottom: 12 }}>
            <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: '#FFB80022', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="trophy" size={17} color="#FFB800" />
            </View>
            <View>
              <Text style={{ color: '#FFB800', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 }}>{activity.score}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>vs {activity.opponents}</Text>
            </View>
          </View>
        )}

        {activity.type === 'win_streak' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: tint + '10', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: tint + '28', marginBottom: 12 }}>
            <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: tint + '22', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="flame" size={17} color={tint} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {Array.from({ length: Math.min(activity.streakCount ?? 0, 7) }).map((_, i) => (
                <View
                  key={i}
                  style={{ width: 5, height: 16, borderRadius: 3, backgroundColor: tint, opacity: 1 - i * 0.1 }}
                />
              ))}
              <Text style={{ color: tint, fontSize: 13, fontWeight: '800', marginLeft: 5 }}>
                {activity.streakCount} seguidas
              </Text>
            </View>
          </View>
        )}

        {activity.type === 'achievement' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: tint + '10', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: tint + '28', marginBottom: 12 }}>
            <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: tint + '22', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="trophy-outline" size={17} color={tint} />
            </View>
            <View>
              <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>{activity.achievementValue} partidos jugados</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>Nuevo hito alcanzado</Text>
            </View>
          </View>
        )}

        {activity.type === 'new_follow' && activity.targetUser && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.secondary, borderRadius: 10, padding: 10, marginBottom: 12 }}>
            <Avatar name={activity.targetUser.name} size={30} />
            <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600', flex: 1 }}>
              {activity.targetUser.name}
            </Text>
            <Ionicons name="checkmark-circle" size={18} color={tint} />
          </View>
        )}

        {activity.type === 'available' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: tint + '12', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: tint + '28', marginBottom: 12 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: tint }} />
            <Text style={{ color: tint, fontSize: 13, fontWeight: '600' }}>Disponible ahora para jugar</Text>
          </View>
        )}

        {activity.type === 'new_equipment' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.secondary, borderRadius: 10, padding: 10, marginBottom: 12 }}>
            <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: tint + '22', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="tennisball" size={17} color={tint} />
            </View>
            <View>
              <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>{activity.equipmentName}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>Nueva pala registrada</Text>
            </View>
          </View>
        )}

        {/* Action button */}
        <TouchableOpacity
          onPress={() => router.push(`/profile/${activity.user.id}`)}
          activeOpacity={0.75}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
            backgroundColor: tint + '14', borderRadius: 10, paddingVertical: 9,
            borderWidth: 1, borderColor: tint + '35',
          }}
        >
          <Text style={{ color: tint, fontSize: 13, fontWeight: '700' }}>{cfg.actionLabel}</Text>
          <Ionicons name="chevron-forward" size={13} color={tint} />
        </TouchableOpacity>
      </View>
    </FadeInCard>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function FriendActivityEmptyState({ onFindPlayers }: { onFindPlayers: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginHorizontal: 18, backgroundColor: colors.cardBg, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 24, alignItems: 'center', gap: 10 }}>
      <View style={{ width: 52, height: 52, borderRadius: 15, backgroundColor: colors.primary + '18', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="people-outline" size={26} color={colors.primary} />
      </View>
      <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700', textAlign: 'center' }}>
        Todavía no sigues a ningún jugador
      </Text>
      <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 19 }}>
        Sigue jugadores de tu nivel y descubre su actividad.
      </Text>
      <TouchableOpacity
        onPress={onFindPlayers}
        activeOpacity={0.8}
        style={{
          backgroundColor: colors.primary, borderRadius: 12,
          paddingVertical: 11, paddingHorizontal: 22,
          flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Encontrar jugadores</Text>
        <Ionicons name="arrow-forward" size={14} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function FriendActivityFeed({ hasFollowing, onFindPlayers }: {
  hasFollowing: boolean;
  onFindPlayers: () => void;
}) {
  if (!hasFollowing) {
    return <FriendActivityEmptyState onFindPlayers={onFindPlayers} />;
  }
  return (
    <>
      {MOCK_ACTIVITIES.map((activity, index) => (
        <ActivityCard key={activity.id} activity={activity} index={index} />
      ))}
    </>
  );
}
