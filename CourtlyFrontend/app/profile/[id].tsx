import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, levelColor, levelDisplay } from '@/src/theme/colors';
import { User, Equipment, Match } from '@/src/types';
import { usersApi } from '@/src/api/users';
import { useAuth } from '@/src/context/AuthContext';
import { Avatar } from '@/src/components/Avatar';
import { Button } from '@/src/components/Button';

function fmtDate(s: string) {
  return new Date(s + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
}

function StatBox({ value, label, accent }: { value: string | number; label: string; accent?: string }) {
  return (
    <View style={s.statBox}>
      <Text style={[s.statVal, accent ? { color: accent } : null]}>{value}</Text>
      <Text style={s.statLbl}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: me } = useAuth();

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
      setMatches(mx.slice(0, 6));
      setMyStars(rec.stars);
    }).catch(() => Alert.alert('Error', 'No se pudo cargar el perfil.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleFollow = () => {
    const next = !followed;
    setFollowed(next);
    setStats(prev => ({
      ...prev,
      followersCount: prev.followersCount + (next ? 1 : -1),
    }));
    (next ? usersApi.follow(id) : usersApi.unfollow(id)).catch(() => {
      setFollowed(!next);
      setStats(prev => ({
        ...prev,
        followersCount: prev.followersCount + (next ? -1 : 1),
      }));
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
      <SafeAreaView style={s.root} edges={['top']}>
        <View style={s.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={s.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <View style={s.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={s.centered}>
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
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={s.backBtn}>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Hero ── */}
        <View style={s.hero}>
          <View style={[s.avatarGlow, { borderColor: lvlCol + 'AA', shadowColor: lvlCol }]}>
            <Avatar name={profile.name} size={88} available={false} />
          </View>
          <View style={s.heroRight}>
            <Text style={s.heroName}>{profile.name}</Text>
            <View style={s.heroBadges}>
              <View style={[s.lvlBadge, { backgroundColor: lvlCol + '20', borderColor: lvlCol + '70' }]}>
                <Text style={[s.lvlBadgeText, { color: lvlCol }]}>{lvlDsp}</Text>
              </View>
              {profile.available && (
                <View style={s.availBadge}>
                  <View style={s.availDot} />
                  <Text style={s.availText}>Disponible</Text>
                </View>
              )}
            </View>
            <Text style={s.heroMeta} numberOfLines={1}>
              {'@' + profile.username + (profile.location ? '  ·  ' + profile.location : '')}
            </Text>
          </View>
        </View>

        {profile.bio ? <Text style={s.bio}>{profile.bio}</Text> : null}

        {/* ── Acción: Seguir / Recomendar ── */}
        {!isOwn && (
          <View style={s.actionRow}>
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

        {/* ── Stats ── */}
        <View style={s.statsCard}>
          <StatBox value={profile.matchesPlayed} label="PARTIDOS" />
          <View style={s.statDiv} />
          <StatBox value={profile.wins} label="VICTORIAS" accent={colors.success} />
          <View style={s.statDiv} />
          <StatBox value={winRate + '%'} label="WIN RATE" />
          <View style={s.statDiv} />
          <StatBox value={profile.rating != null ? `★ ${profile.rating.toFixed(1)}` : '—'} label="RATING" accent={colors.primary} />
        </View>

        {/* ── Seguidores ── */}
        <View style={s.followCard}>
          <TouchableOpacity
            style={s.followItem}
            onPress={() => router.push({ pathname: '/followers/[id]', params: { id, mode: 'following' } })}
          >
            <Text style={s.followVal}>{stats.followingCount}</Text>
            <Text style={s.followLbl}>Siguiendo</Text>
          </TouchableOpacity>
          <View style={s.followDiv} />
          <TouchableOpacity
            style={s.followItem}
            onPress={() => router.push({ pathname: '/followers/[id]', params: { id, mode: 'followers' } })}
          >
            <Text style={s.followVal}>{stats.followersCount}</Text>
            <Text style={s.followLbl}>Seguidores</Text>
          </TouchableOpacity>
        </View>

        {/* ── Mini card: Pala ── */}
        <View style={s.miniRow}>
          <View style={s.miniCard}>
            <View style={s.miniTop}>
              <Ionicons name="tennisball-outline" size={13} color={colors.primary} />
              <Text style={s.miniLbl}>PALA</Text>
            </View>
            {pala ? (
              <>
                <Text style={s.miniVal} numberOfLines={1}>{pala.name ?? pala.brand ?? '—'}</Text>
                {pala.brand && pala.name ? <Text style={s.miniSub} numberOfLines={1}>{pala.brand}</Text> : null}
              </>
            ) : (
              <Text style={[s.miniSub, { marginTop: 4 }]}>Sin registrar</Text>
            )}
          </View>
        </View>

        {/* ── Partidos recientes ── */}
        {matches.length > 0 && (
          <View style={s.section}>
            <Text style={s.secTitle}>Partidos recientes</Text>
            <View style={[s.card, { marginTop: 10 }]}>
              {matches.map((m, idx) => {
                const won = m.resultRecorded && (m.winners ?? []).some(w => w.id === profile.id);
                const lost = m.resultRecorded && !(m.winners ?? []).some(w => w.id === profile.id);
                const inTeamA = (m.teamA ?? []).some(p => p.id === profile.id);
                const inTeamB = (m.teamB ?? []).some(p => p.id === profile.id);
                const hasTeams = (m.teamA ?? []).length > 0 || (m.teamB ?? []).length > 0;
                let oppLabel: string;
                if (hasTeams) {
                  const myTeam = inTeamA ? (m.teamA ?? []) : inTeamB ? (m.teamB ?? []) : [];
                  const theirTeam = inTeamA ? (m.teamB ?? []) : (m.teamA ?? []);
                  const myNames = myTeam.map(p => p.name.split(' ')[0]).join(' / ') || profile.name.split(' ')[0];
                  const theirNames = theirTeam.map(p => p.name.split(' ')[0]).join(' / ') || '—';
                  oppLabel = `${myNames} vs. ${theirNames}`;
                } else {
                  const opps = m.participants.filter(p => p.id !== profile.id);
                  oppLabel = opps.length > 0
                    ? 'vs. ' + opps.slice(0, 2).map(p => p.name.split(' ')[0]).join(' / ')
                    : 'Partido';
                }
                return (
                  <TouchableOpacity key={m.id} style={[s.matchRow, idx < matches.length - 1 && s.matchBorder]} onPress={() => router.push(`/match/${m.id}`)} activeOpacity={0.75}>
                    <View style={[s.resBadge, won ? s.resW : lost ? s.resL : s.resN]}>
                      <Text style={[s.resTxt, won ? { color: colors.success } : lost ? { color: '#FF4B4B' } : { color: colors.textMuted }]}>
                        {won ? 'W' : lost ? 'L' : '—'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.matchOpp} numberOfLines={1}>{oppLabel}</Text>
                      <Text style={s.matchMeta}>{levelDisplay[m.level]} · {fmtDate(m.date)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Equipamiento ── */}
        {equipment.length > 0 && (
          <View style={s.section}>
            <Text style={s.secTitle}>Equipamiento</Text>
            <View style={[s.card, { marginTop: 10 }]}>
              {equipment.map((eq, idx) => (
                <View key={eq.id} style={[s.equipRow, idx < equipment.length - 1 && s.equipBorder]}>
                  <View style={[s.equipIcon, { backgroundColor: (eq.type === 'PALA' ? colors.primary : colors.ctaHighlight) + '18' }]}>
                    <Ionicons
                      name={eq.type === 'PALA' ? 'tennisball-outline' : 'footsteps-outline'}
                      size={16}
                      color={eq.type === 'PALA' ? colors.primary : colors.ctaHighlight}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.equipName}>{eq.name ?? eq.brand ?? (eq.type === 'PALA' ? 'Pala' : 'Zapatilla')}</Text>
                    {eq.brand && eq.name ? <Text style={s.equipBrand}>{eq.brand}</Text> : null}
                  </View>
                  <Text style={s.equipTag}>{eq.type === 'PALA' ? 'Pala' : 'Zapatilla'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Preferencias ── */}
        {(prefs.length > 0 || profile.dominantHand) && (
          <View style={s.section}>
            <Text style={s.secTitle}>Preferencias</Text>
            <View style={s.prefRow}>
              {prefs.map(p => (
                <View key={p} style={s.prefPill}>
                  <Text style={s.prefPillText}>{p}</Text>
                </View>
              ))}
              {profile.dominantHand && (
                <View style={[s.prefPill, s.prefPillHand]}>
                  <Ionicons name="hand-right-outline" size={12} color={colors.primary} />
                  <Text style={[s.prefPillText, { color: colors.primary }]}>
                    {profile.dominantHand === 'DERECHA' ? 'Derecha' : 'Izquierda'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

      </ScrollView>

      {/* Recommend modal */}
      <Modal visible={showRecommend} transparent animationType="slide" onRequestClose={() => setShowRecommend(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Valorar a {profile?.name.split(' ')[0]}</Text>
            <Text style={s.modalSub}>¿Cómo fue tu experiencia jugando con esta persona?</Text>
            <View style={s.starsRow}>
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
            <View style={s.modalActions}>
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

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { padding: 6, width: 40 },

  scrollContent: { paddingBottom: 48 },

  // Hero
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
  heroName: { color: colors.textPrimary, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  heroBadges: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 7 },
  lvlBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  lvlBadgeText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },
  availBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  availDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  availText: { color: colors.success, fontSize: 12, fontWeight: '600' },
  heroMeta: { color: colors.textSecondary, fontSize: 13, marginTop: 7 },

  bio: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, paddingHorizontal: 20, marginBottom: 14 },

  actionRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 20 },

  // Stats
  statsCard: {
    flexDirection: 'row', backgroundColor: colors.cardBg,
    marginHorizontal: 20, borderRadius: 16, padding: 20,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
    marginBottom: 12,
  },
  statBox: { flex: 1, alignItems: 'center', gap: 5 },
  statVal: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  statLbl: { color: colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  statDiv: { width: 1, height: 36, backgroundColor: colors.border },

  // Seguidores
  followCard: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 16,
    backgroundColor: colors.cardBg, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
  },
  followItem: { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 4 },
  followVal: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  followLbl: { color: colors.textMuted, fontSize: 11 },
  followDiv: { width: 1, backgroundColor: colors.border, marginVertical: 10 },

  // Mini cards
  miniRow: { flexDirection: 'row', gap: 12, marginHorizontal: 20, marginBottom: 20 },
  miniCard: {
    flex: 1, backgroundColor: colors.cardBg, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border, padding: 16,
  },
  miniTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  miniLbl: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  miniVal: { color: colors.textPrimary, fontSize: 26, fontWeight: '800' },
  miniSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },

  // Sections
  section: { marginHorizontal: 20, marginBottom: 20 },
  secTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  card: { backgroundColor: colors.cardBg, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 16 },

  // Matches
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  matchBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  resBadge: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  resW: { backgroundColor: colors.success + '22' },
  resL: { backgroundColor: '#FF4B4B22' },
  resN: { backgroundColor: colors.border + '66' },
  resTxt: { fontSize: 13, fontWeight: '800' },
  matchOpp: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  matchMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },

  // Equipment
  equipRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  equipBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  equipIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  equipName: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  equipBrand: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  equipTag: { color: colors.textMuted, fontSize: 11 },

  // Preferences
  prefRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  prefPill: {
    backgroundColor: colors.cardBg, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  prefPillText: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' },
  prefPillHand: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderColor: colors.primary + '40', backgroundColor: colors.primary + '10',
  },

  // Recommend modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, gap: 14,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border, alignSelf: 'center', marginBottom: 4,
  },
  modalTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  modalSub: { color: colors.textMuted, fontSize: 14, marginTop: -6 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, paddingVertical: 8 },
  modalActions: { flexDirection: 'row', gap: 10 },
});
