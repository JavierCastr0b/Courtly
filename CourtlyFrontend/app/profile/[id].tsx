import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { levelColor, levelDisplay } from '@/src/theme/colors';
import { useTheme } from '@/src/theme/ThemeContext';
import type { Colors } from '@/src/theme/colors';
import { User, Equipment, Match } from '@/src/types';
import { usersApi } from '@/src/api/users';
import { useAuth } from '@/src/context/AuthContext';
import { Avatar } from '@/src/components/Avatar';
import { Button } from '@/src/components/Button';
import { getRatingSummary, BADGE_CONFIG } from '@/src/utils/ratingUtils';
import { MatchHistorySection } from '@/src/components/MatchHistorySection';

function fmtDate(s: string) {
  return new Date(s + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
}

function StatBox({ value, label, accent }: { value: string | number; label: string; accent?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 5 }}>
      <Text style={{ color: accent ?? colors.textPrimary, fontSize: 22, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' }}>{label}</Text>
    </View>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    navBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 8, paddingVertical: 6,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    backBtn: { padding: 6, width: 40 },
    scrollContent: { paddingBottom: 48 },
    hero: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 16,
      paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12,
    },
    avatarGlow: {
      borderWidth: 2.5, borderRadius: 52, padding: 2,
      shadowOpacity: 0.55, shadowRadius: 14, shadowOffset: { width: 0, height: 0 },
      elevation: 10,
    },
    heroRight: { flex: 1, paddingTop: 4 },
    heroName: { color: c.textPrimary, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
    heroBadges: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 7 },
    lvlBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
    lvlBadgeText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },
    availBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    availDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: c.success },
    availText: { color: c.success, fontSize: 12, fontWeight: '600' },
    heroMeta: { color: c.textSecondary, fontSize: 13, marginTop: 7 },
    bio: { color: c.textSecondary, fontSize: 14, lineHeight: 21, paddingHorizontal: 20, marginBottom: 14 },
    actionRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 20 },
    statsCard: {
      flexDirection: 'row', backgroundColor: c.cardBg,
      marginHorizontal: 20, borderRadius: 16, padding: 20,
      alignItems: 'center', borderWidth: 1, borderColor: c.border,
      marginBottom: 12,
    },
    statDiv: { width: 1, height: 36, backgroundColor: c.border },
    followCard: {
      flexDirection: 'row', marginHorizontal: 20, marginBottom: 16,
      backgroundColor: c.cardBg, borderRadius: 12, borderWidth: 1, borderColor: c.border,
    },
    followItem: { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 4 },
    followVal: { color: c.textPrimary, fontSize: 18, fontWeight: '700' },
    followLbl: { color: c.textMuted, fontSize: 11 },
    followDiv: { width: 1, backgroundColor: c.border, marginVertical: 10 },
    miniRow: { flexDirection: 'row', gap: 12, marginHorizontal: 20, marginBottom: 20 },
    miniCard: {
      flex: 1, backgroundColor: c.cardBg, borderRadius: 14,
      borderWidth: 1, borderColor: c.border, padding: 16,
    },
    miniTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    miniLbl: { color: c.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
    miniVal: { color: c.textPrimary, fontSize: 26, fontWeight: '800' },
    miniSub: { color: c.textMuted, fontSize: 12, marginTop: 2 },
    section: { marginHorizontal: 20, marginBottom: 20 },
    secTitle: { color: c.textPrimary, fontSize: 15, fontWeight: '700' },
    card: { backgroundColor: c.cardBg, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16 },
    matchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
    matchBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
    resBadge: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    resW: { backgroundColor: c.success + '22' },
    resL: { backgroundColor: '#FF4B4B22' },
    resN: { backgroundColor: c.border + '66' },
    resTxt: { fontSize: 13, fontWeight: '800' },
    matchOpp: { color: c.textPrimary, fontSize: 14, fontWeight: '600' },
    matchMeta: { color: c.textMuted, fontSize: 12, marginTop: 2 },
    equipRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
    equipBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
    equipIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    equipName: { color: c.textPrimary, fontSize: 14, fontWeight: '600' },
    equipBrand: { color: c.textMuted, fontSize: 12, marginTop: 2 },
    equipTag: { color: c.textMuted, fontSize: 11 },
    prefRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
    prefPill: {
      backgroundColor: c.cardBg, borderRadius: 20,
      borderWidth: 1, borderColor: c.border,
      paddingHorizontal: 14, paddingVertical: 7,
    },
    prefPillText: { color: c.textSecondary, fontSize: 13, fontWeight: '500' },
    prefPillHand: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      borderColor: c.primary + '40', backgroundColor: c.primary + '10',
    },
    // Rating summary section
    ratingCard: {
      marginHorizontal: 20, marginBottom: 12,
      backgroundColor: c.cardBg, borderRadius: 16,
      borderWidth: 1, borderColor: c.border, padding: 16,
    },
    ratingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    ratingTitle: { color: c.textPrimary, fontSize: 14, fontWeight: '700' },
    ratingOverall: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    ratingScore: { color: '#FFB800', fontSize: 22, fontWeight: '800' },
    ratingCount: { color: c.textMuted, fontSize: 12, marginTop: 2 },
    ratingBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 7 },
    ratingBarLabel: { color: c.textSecondary, fontSize: 12, width: 76 },
    ratingBar: { flex: 1, height: 5, borderRadius: 3, backgroundColor: c.border, overflow: 'hidden' },
    ratingBarFill: { height: 5, borderRadius: 3 },
    ratingBarVal: { color: c.textSecondary, fontSize: 12, fontWeight: '600', width: 28, textAlign: 'right' },
    badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    badge: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 10, paddingVertical: 4,
      borderRadius: 20, borderWidth: 1,
    },
    badgeText: { fontSize: 12, fontWeight: '600' },
    wpaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    wpaText: { color: c.textMuted, fontSize: 12 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalSheet: {
      backgroundColor: c.background,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, gap: 14,
    },
    modalHandle: {
      width: 40, height: 4, borderRadius: 2,
      backgroundColor: c.border, alignSelf: 'center', marginBottom: 4,
    },
    modalTitle: { color: c.textPrimary, fontSize: 18, fontWeight: '800' },
    modalSub: { color: c.textMuted, fontSize: 14, marginTop: -6 },
    starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, paddingVertical: 8 },
    modalActions: { flexDirection: 'row', gap: 10 },
  });
}

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: me } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [profile, setProfile] = useState<User | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [followed, setFollowed] = useState(false);
  const [stats, setStats] = useState({ followersCount: 0, followingCount: 0 });
  const [loading, setLoading] = useState(true);
  const [myStars, setMyStars] = useState(0);
  const [showRecommend, setShowRecommend] = useState(false);
  const [pendingStars, setPendingStars] = useState(0);
  const [recommending, setRecommending] = useState(false);

  useEffect(() => {
    Promise.all([
      usersApi.getById(id),
      usersApi.getStats(id).catch(() => ({ followersCount: 0, followingCount: 0 })),
      usersApi.getFollowing().catch(() => [] as string[]),
      usersApi.getEquipment(id).catch(() => [] as Equipment[]),
      usersApi.getMatches(id).catch(() => [] as Match[]),
      usersApi.getMyRecommendation(id).catch(() => ({ stars: 0 })),
    ]).then(([u, st, following, eq, mx, rec]) => {
      setProfile(u);
      setStats(st);
      setFollowed(following.includes(id));
      setEquipment(eq);
      setMatches(mx);
      setMyStars(rec.stars);
    }).catch(() => Alert.alert('Error', 'No se pudo cargar el perfil.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleFollow = () => {
    const next = !followed;
    setFollowed(next);
    setStats(prev => ({ ...prev, followersCount: prev.followersCount + (next ? 1 : -1) }));
    (next ? usersApi.follow(id) : usersApi.unfollow(id)).catch(() => {
      setFollowed(!next);
      setStats(prev => ({ ...prev, followersCount: prev.followersCount + (next ? -1 : 1) }));
    });
  };

  const handleRecommend = () => {
    if (!pendingStars) return;
    setRecommending(true);
    usersApi.recommend(id, pendingStars)
      .then(res => {
        setMyStars(pendingStars);
        setProfile(prev => prev ? { ...prev, rating: res.rating } : prev);
        setShowRecommend(false);
      })
      .catch(e => Alert.alert('Error', e.message ?? 'No se pudo enviar la valoración.'))
      .finally(() => setRecommending(false));
  };

  const isOwn = me?.id === id;

  if (loading) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Text style={{ color: colors.textMuted }}>Perfil no encontrado.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const winRate = profile.matchesPlayed > 0
    ? Math.round((profile.wins / profile.matchesPlayed) * 100) : 0;
  const lvlCol = levelColor[profile.level];
  const lvlDsp = levelDisplay[profile.level];
  const pala = equipment.find(e => e.type === 'PALA');

  const prefs = [
    profile.preferredSide === 'REVES' ? 'Revés' : profile.preferredSide === 'DRIVE' ? 'Drive' : null,
    profile.preferredFormat === 'SINGLES' ? 'Singles' : profile.preferredFormat === 'DOBLES' ? 'Dobles' : null,
    profile.preferredStyle === 'COMPETITIVO' ? 'Competitivo' : profile.preferredStyle === 'CHILL' ? 'Chill' : null,
  ].filter(Boolean) as string[];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn}>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.hero}>
          <View style={[styles.avatarGlow, { borderColor: lvlCol + 'AA', shadowColor: lvlCol }]}>
            <Avatar name={profile.name} size={88} available={false} />
          </View>
          <View style={styles.heroRight}>
            <Text style={styles.heroName}>{profile.name}</Text>
            <View style={styles.heroBadges}>
              <View style={[styles.lvlBadge, { backgroundColor: lvlCol + '20', borderColor: lvlCol + '70' }]}>
                <Text style={[styles.lvlBadgeText, { color: lvlCol }]}>{lvlDsp}</Text>
              </View>
              {profile.available && (
                <View style={styles.availBadge}>
                  <View style={styles.availDot} />
                  <Text style={styles.availText}>Disponible</Text>
                </View>
              )}
            </View>
            <Text style={styles.heroMeta} numberOfLines={1}>
              {'@' + profile.username + (profile.location ? '  ·  ' + profile.location : '')}
            </Text>
          </View>
        </View>

        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

        {!isOwn && (
          <View style={styles.actionRow}>
            <Button
              label={followed ? 'Siguiendo' : 'Seguir'}
              variant={followed ? 'secondary' : 'primary'}
              size="md"
              onPress={handleFollow}
              style={{ flex: 1 }}
            />
            <Button
              label={myStars > 0 ? `★ ${myStars}` : '★ Valorar'}
              variant={myStars > 0 ? 'secondary' : 'outline'}
              size="md"
              onPress={() => { setPendingStars(myStars || 0); setShowRecommend(true); }}
              style={{ flex: 1 }}
            />
          </View>
        )}

        <View style={styles.statsCard}>
          <StatBox value={profile.matchesPlayed} label="PARTIDOS" />
          <View style={styles.statDiv} />
          <StatBox value={profile.wins} label="VICTORIAS" accent={colors.success} />
          <View style={styles.statDiv} />
          <StatBox value={winRate + '%'} label="WIN RATE" />
          <View style={styles.statDiv} />
          <StatBox value={profile.rating != null ? `★ ${profile.rating.toFixed(1)}` : '—'} label="RATING" accent={colors.primary} />
        </View>

        {/* ── Rating summary ── */}
        {(() => {
          const rs = getRatingSummary(profile.id, profile.rating);
          if (rs.totalRatings === 0) return null;
          return (
            <View style={styles.ratingCard}>
              <View style={styles.ratingHeader}>
                <Text style={styles.ratingTitle}>Reputación</Text>
                <View style={styles.ratingOverall}>
                  <Ionicons name="star" size={18} color="#FFB800" />
                  <Text style={styles.ratingScore}>{rs.overallRating.toFixed(1)}</Text>
                  <Text style={styles.ratingCount}>({rs.totalRatings} val.)</Text>
                </View>
              </View>

              {[
                { label: 'Puntualidad', value: rs.punctualityAvg },
                { label: 'Nivel real',  value: rs.skillAvg },
                { label: 'Vibra',       value: rs.vibeAvg },
              ].map(({ label, value }) => (
                <View key={label} style={styles.ratingBarRow}>
                  <Text style={styles.ratingBarLabel}>{label}</Text>
                  <View style={styles.ratingBar}>
                    <View style={[styles.ratingBarFill, {
                      width: `${(value / 5) * 100}%` as any,
                      backgroundColor: value >= 4.5 ? colors.success : value >= 3.5 ? colors.primary : colors.warning,
                    }]} />
                  </View>
                  <Text style={styles.ratingBarVal}>{value.toFixed(1)}</Text>
                </View>
              ))}

              {rs.wouldPlayAgainPct > 0 && (
                <View style={styles.wpaRow}>
                  <Ionicons name="thumbs-up-outline" size={13} color={colors.success} />
                  <Text style={styles.wpaText}>
                    <Text style={{ color: colors.success, fontWeight: '700' }}>{rs.wouldPlayAgainPct}%</Text>
                    {' '}volvería a jugar con este jugador
                  </Text>
                </View>
              )}

              {rs.badges.length > 0 && (
                <View style={styles.badgeRow}>
                  {rs.badges.map(key => {
                    const cfg = BADGE_CONFIG[key];
                    return (
                      <View key={key} style={[styles.badge, { borderColor: colors.primary + '40', backgroundColor: colors.primary + '0D' }]}>
                        <Ionicons name={cfg.icon as any} size={12} color={colors.primary} />
                        <Text style={[styles.badgeText, { color: colors.primary }]}>{cfg.label}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })()}

        <View style={styles.followCard}>
          <TouchableOpacity
            style={styles.followItem}
            onPress={() => router.push({ pathname: '/followers/[id]', params: { id, mode: 'following' } })}
          >
            <Text style={styles.followVal}>{stats.followingCount}</Text>
            <Text style={styles.followLbl}>Siguiendo</Text>
          </TouchableOpacity>
          <View style={styles.followDiv} />
          <TouchableOpacity
            style={styles.followItem}
            onPress={() => router.push({ pathname: '/followers/[id]', params: { id, mode: 'followers' } })}
          >
            <Text style={styles.followVal}>{stats.followersCount}</Text>
            <Text style={styles.followLbl}>Seguidores</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.miniRow}>
          <View style={styles.miniCard}>
            <View style={styles.miniTop}>
              <Ionicons name="tennisball-outline" size={13} color={colors.primary} />
              <Text style={styles.miniLbl}>PALA</Text>
            </View>
            {pala ? (
              <>
                <Text style={styles.miniVal} numberOfLines={1}>{pala.name ?? pala.brand ?? '—'}</Text>
                {pala.brand && pala.name ? <Text style={styles.miniSub} numberOfLines={1}>{pala.brand}</Text> : null}
              </>
            ) : (
              <Text style={[styles.miniSub, { marginTop: 4 }]}>Sin registrar</Text>
            )}
          </View>
        </View>

        <MatchHistorySection allMatches={matches} userId={profile.id} isOwn={isOwn} />

        {equipment.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.secTitle}>Equipamiento</Text>
            <View style={[styles.card, { marginTop: 10 }]}>
              {equipment.map((eq, idx) => (
                <View key={eq.id} style={[styles.equipRow, idx < equipment.length - 1 && styles.equipBorder]}>
                  <View style={[styles.equipIcon, { backgroundColor: (eq.type === 'PALA' ? colors.primary : colors.accent) + '18' }]}>
                    <Ionicons
                      name={eq.type === 'PALA' ? 'tennisball-outline' : 'footsteps-outline'}
                      size={16}
                      color={eq.type === 'PALA' ? colors.primary : colors.accent}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.equipName}>{eq.name ?? eq.brand ?? (eq.type === 'PALA' ? 'Pala' : 'Zapatilla')}</Text>
                    {eq.brand && eq.name ? <Text style={styles.equipBrand}>{eq.brand}</Text> : null}
                  </View>
                  <Text style={styles.equipTag}>{eq.type === 'PALA' ? 'Pala' : 'Zapatilla'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {(prefs.length > 0 || profile.dominantHand) && (
          <View style={styles.section}>
            <Text style={styles.secTitle}>Preferencias</Text>
            <View style={styles.prefRow}>
              {prefs.map(p => (
                <View key={p} style={styles.prefPill}>
                  <Text style={styles.prefPillText}>{p}</Text>
                </View>
              ))}
              {profile.dominantHand && (
                <View style={[styles.prefPill, styles.prefPillHand]}>
                  <Ionicons name="hand-right-outline" size={12} color={colors.primary} />
                  <Text style={[styles.prefPillText, { color: colors.primary }]}>
                    {profile.dominantHand === 'DERECHA' ? 'Derecha' : 'Izquierda'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

      </ScrollView>

      <Modal visible={showRecommend} transparent animationType="slide" onRequestClose={() => setShowRecommend(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Valorar a {profile?.name.split(' ')[0]}</Text>
            <Text style={styles.modalSub}>¿Cómo fue tu experiencia jugando con esta persona?</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => setPendingStars(star)} activeOpacity={0.7}>
                  <Ionicons
                    name={star <= pendingStars ? 'star' : 'star-outline'}
                    size={40}
                    color={star <= pendingStars ? '#FFB800' : colors.border}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <Button label="Cancelar" variant="outline" size="md" onPress={() => setShowRecommend(false)} style={{ flex: 1 }} />
              <Button
                label="Enviar"
                variant="primary"
                size="md"
                loading={recommending}
                disabled={pendingStars === 0}
                onPress={handleRecommend}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
