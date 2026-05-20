import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, levelColor, levelDisplay } from '@/src/theme/colors';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { usersApi } from '@/src/api/users';
import { Avatar } from '@/src/components/Avatar';
import { Button } from '@/src/components/Button';
import { Equipment, Match } from '@/src/types';
import { notificationsApi } from '@/src/api/notifications';

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


function ToggleRow<T extends string>({
  label, options, value, onChange,
}: {
  label: string;
  options: { v: T; l: string }[];
  value: T | null;
  onChange: (v: T | null) => void;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={s.mLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {options.map(o => (
          <TouchableOpacity
            key={o.v}
            style={[s.togBtn, { flex: 1 }, value === o.v && s.togBtnOn]}
            onPress={() => onChange(value === o.v ? null : o.v)}
          >
            <Text style={[s.togBtnText, value === o.v && s.togBtnTextOn]}>{o.l}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

type Hand = 'DERECHA' | 'IZQUIERDA';
type Side = 'REVES' | 'DRIVE';
type Fmt = 'SINGLES' | 'DOBLES';
type Style = 'COMPETITIVO' | 'CHILL';

export default function PerfilScreen() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();

  const [stats, setStats] = useState({ followersCount: 0, followingCount: 0 });
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  const [editOpen, setEditOpen] = useState(false);
  const [eBio, setEBio] = useState('');
  const [eLoc, setELoc] = useState('');
  const [eAvail, setEAvail] = useState(false);
  const [eHand, setEHand] = useState<Hand | null>(null);
  const [eSide, setESide] = useState<Side | null>(null);
  const [eFmt, setEFmt] = useState<Fmt | null>(null);
  const [eStyle, setEStyle] = useState<Style | null>(null);
  const [saving, setSaving] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [eqType, setEqType] = useState<'PALA' | 'ZAPATILLA'>('PALA');
  const [eqName, setEqName] = useState('');
  const [eqBrand, setEqBrand] = useState('');
  const [addSaving, setAddSaving] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(useCallback(() => {
    if (!user) return;
    Promise.all([
      usersApi.getStats(user.id),
      usersApi.getEquipment(user.id).catch(() => [] as Equipment[]),
      usersApi.getMatches(user.id).catch(() => [] as Match[]),
      notificationsApi.getUnreadCount().catch(() => ({ count: 0 })),
    ]).then(([st, eq, mx, notif]) => {
      setStats(st);
      setEquipment(eq);
      setMatches(mx.slice(0, 6));
      setUnreadCount(notif.count);
    }).catch(() => {});
  }, [user?.id]));

  if (!user) return null;

  const winRate = user.matchesPlayed > 0 ? Math.round((user.wins / user.matchesPlayed) * 100) : 0;
  const lvlCol = levelColor[user.level];
  const lvlDsp = levelDisplay[user.level];
  const pala = equipment.find(e => e.type === 'PALA');

  const prefs = [
    user.preferredSide === 'REVES' ? 'Revés' : user.preferredSide === 'DRIVE' ? 'Drive' : null,
    user.preferredFormat === 'SINGLES' ? 'Singles' : user.preferredFormat === 'DOBLES' ? 'Dobles' : null,
    user.preferredStyle === 'COMPETITIVO' ? 'Competitivo' : user.preferredStyle === 'CHILL' ? 'Chill' : null,
  ].filter(Boolean) as string[];

  const openEdit = () => {
    setEBio(user.bio ?? '');
    setELoc(user.location ?? '');
    setEAvail(user.available);
    setEHand(user.dominantHand ?? null);
    setESide(user.preferredSide ?? null);
    setEFmt(user.preferredFormat ?? null);
    setEStyle(user.preferredStyle ?? null);
    setEditOpen(true);
  };

  const saveEdit = () => {
    setSaving(true);
    usersApi.update(user.id, {
      bio: eBio || undefined,
      location: eLoc || undefined,
      available: eAvail,
      dominantHand: eHand ?? undefined,
      preferredSide: eSide ?? undefined,
      preferredFormat: eFmt ?? undefined,
      preferredStyle: eStyle ?? undefined,
    })
      .then(() => refreshUser())
      .then(() => setEditOpen(false))
      .catch(e => Alert.alert('Error', e.message))
      .finally(() => setSaving(false));
  };

  const addEquip = () => {
    if (!eqName.trim() && !eqBrand.trim()) return;
    setAddSaving(true);
    usersApi.addEquipment({ type: eqType, name: eqName || undefined, brand: eqBrand || undefined })
      .then(ne => {
        setEquipment(prev => [...prev, ne]);
        setEqName(''); setEqBrand('');
        setAddOpen(false);
      })
      .catch(e => Alert.alert('Error', e.message))
      .finally(() => setAddSaving(false));
  };

  const delEquip = (id: string) => {
    usersApi.deleteEquipment(id)
      .then(() => setEquipment(prev => prev.filter(e => e.id !== id)))
      .catch(e => Alert.alert('Error', e.message));
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Tú</Text>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <TouchableOpacity style={s.headerBtn} onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications-outline" size={21} color={colors.textSecondary} />
            {unreadCount > 0 && <View style={s.notifDot} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={s.headerBtn}
            onPress={() => Alert.alert('Configuración', undefined, [
              { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
              { text: 'Cancelar', style: 'cancel' },
            ])}
          >
            <Ionicons name="settings-outline" size={21} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Hero ── */}
        <View style={s.hero}>
          <View style={[s.avatarGlow, { borderColor: lvlCol + 'AA', shadowColor: lvlCol }]}>
            <Avatar name={user.name} size={88} available={false} />
          </View>
          <View style={s.heroRight}>
            <Text style={s.heroName}>{user.name}</Text>
            <View style={s.heroBadges}>
              <View style={[s.lvlBadge, { backgroundColor: lvlCol + '20', borderColor: lvlCol + '70' }]}>
                <Text style={[s.lvlBadgeText, { color: lvlCol }]}>{lvlDsp}</Text>
              </View>
              {user.available && (
                <View style={s.availBadge}>
                  <View style={s.availDot} />
                  <Text style={s.availText}>Disponible</Text>
                </View>
              )}
            </View>
            <Text style={s.heroMeta} numberOfLines={1}>
              {'@' + user.username + (user.location ? '  ·  ' + user.location : '')}
            </Text>
          </View>
        </View>

        {user.bio ? <Text style={s.bio}>{user.bio}</Text> : null}

        <TouchableOpacity style={s.editChip} onPress={openEdit} activeOpacity={0.75}>
          <Ionicons name="pencil-outline" size={13} color={colors.primary} />
          <Text style={s.editChipText}>Editar perfil</Text>
        </TouchableOpacity>

        {/* ── Stats ── */}
        <View style={s.statsCard}>
          <StatBox value={user.matchesPlayed} label="PARTIDOS" />
          <View style={s.statDiv} />
          <StatBox value={user.wins} label="VICTORIAS" accent={colors.success} />
          <View style={s.statDiv} />
          <StatBox value={winRate + '%'} label="WIN RATE" />
          <View style={s.statDiv} />
          <StatBox value={user.rating != null ? `★ ${user.rating.toFixed(1)}` : '—'} label="RATING" accent={colors.primary} />
        </View>

        {/* ── Seguidores ── */}
        <View style={s.followCard}>
          <TouchableOpacity
            style={s.followItem}
            onPress={() => router.push({ pathname: '/followers/[id]', params: { id: user.id, mode: 'following' } })}
          >
            <Text style={s.followVal}>{stats.followingCount}</Text>
            <Text style={s.followLbl}>Siguiendo</Text>
          </TouchableOpacity>
          <View style={s.followDiv} />
          <TouchableOpacity
            style={s.followItem}
            onPress={() => router.push({ pathname: '/followers/[id]', params: { id: user.id, mode: 'followers' } })}
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
                const won = m.resultRecorded && (m.winners ?? []).some(w => w.id === user.id);
                const lost = m.resultRecorded && !(m.winners ?? []).some(w => w.id === user.id);
                const inTeamA = (m.teamA ?? []).some(p => p.id === user.id);
                const inTeamB = (m.teamB ?? []).some(p => p.id === user.id);
                const hasTeams = (m.teamA ?? []).length > 0 || (m.teamB ?? []).length > 0;
                let oppLabel: string;
                if (hasTeams) {
                  const myTeam = inTeamA ? (m.teamA ?? []) : inTeamB ? (m.teamB ?? []) : [];
                  const theirTeam = inTeamA ? (m.teamB ?? []) : (m.teamA ?? []);
                  const myNames = myTeam.map(p => p.name.split(' ')[0]).join(' / ') || 'Yo';
                  const theirNames = theirTeam.map(p => p.name.split(' ')[0]).join(' / ') || '—';
                  oppLabel = `${myNames} vs. ${theirNames}`;
                } else {
                  const opps = (m.participants ?? []).filter(p => p.id !== user.id);
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
        <View style={s.section}>
          <View style={s.secHead}>
            <Text style={s.secTitle}>Equipamiento</Text>
            <TouchableOpacity style={s.addBtn} onPress={() => setAddOpen(true)}>
              <Ionicons name="add" size={15} color={colors.primary} />
              <Text style={s.addBtnText}>Agregar</Text>
            </TouchableOpacity>
          </View>
          {equipment.length > 0 ? (
            <View style={s.card}>
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
                  <TouchableOpacity onPress={() => delEquip(eq.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <TouchableOpacity
              style={[s.card, s.equipEmpty]}
              onPress={() => setAddOpen(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="bag-handle-outline" size={20} color={colors.textMuted} />
              <Text style={s.equipEmptyText}>Agregar tu equipamiento</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Preferencias ── */}
        {(prefs.length > 0 || user.dominantHand) && (
          <View style={s.section}>
            <Text style={s.secTitle}>Preferencias</Text>
            <View style={s.prefRow}>
              {prefs.map(p => (
                <View key={p} style={s.prefPill}>
                  <Text style={s.prefPillText}>{p}</Text>
                </View>
              ))}
              {user.dominantHand && (
                <View style={[s.prefPill, s.prefPillHand]}>
                  <Ionicons name="hand-right-outline" size={12} color={colors.primary} />
                  <Text style={[s.prefPillText, { color: colors.primary }]}>
                    {user.dominantHand === 'DERECHA' ? 'Derecha' : 'Izquierda'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

      </ScrollView>

      {/* ── Modal: editar perfil ── */}
      <Modal visible={editOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={s.mHandle} />
          <View style={s.mHeader}>
            <Text style={s.mTitle}>Editar perfil</Text>
            <TouchableOpacity onPress={() => setEditOpen(false)}>
              <Text style={{ color: colors.textSecondary, fontSize: 15 }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1, padding: 20 }}>
            <Text style={s.mLabel}>Bio</Text>
            <TextInput
              style={[s.mInput, { minHeight: 80 }]}
              placeholder="Cuéntanos sobre ti..."
              placeholderTextColor={colors.textMuted}
              value={eBio}
              onChangeText={setEBio}
              multiline
            />
            <Text style={s.mLabel}>Ubicación</Text>
            <TextInput
              style={s.mInput}
              placeholder="Lima, Perú"
              placeholderTextColor={colors.textMuted}
              value={eLoc}
              onChangeText={setELoc}
            />
            <ToggleRow<Hand>
              label="Mano dominante"
              value={eHand}
              onChange={setEHand}
              options={[{ v: 'DERECHA', l: 'Derecha' }, { v: 'IZQUIERDA', l: 'Izquierda' }]}
            />
            <ToggleRow<Side>
              label="Lado preferido"
              value={eSide}
              onChange={setESide}
              options={[{ v: 'REVES', l: 'Revés' }, { v: 'DRIVE', l: 'Drive' }]}
            />
            <ToggleRow<Fmt>
              label="Formato"
              value={eFmt}
              onChange={setEFmt}
              options={[{ v: 'SINGLES', l: 'Singles' }, { v: 'DOBLES', l: 'Dobles' }]}
            />
            <ToggleRow<Style>
              label="Estilo de juego"
              value={eStyle}
              onChange={setEStyle}
              options={[{ v: 'COMPETITIVO', l: 'Competitivo' }, { v: 'CHILL', l: 'Chill' }]}
            />
            <TouchableOpacity
              onPress={() => setEAvail(v => !v)}
              style={[s.availToggle, eAvail && s.availToggleOn]}
            >
              <Text style={{ color: eAvail ? colors.success : colors.textSecondary, fontWeight: '600' }}>
                {eAvail ? '● Disponible hoy' : '○ No disponible'}
              </Text>
            </TouchableOpacity>
            <Button
              label="Guardar cambios"
              variant="primary"
              fullWidth
              size="lg"
              loading={saving}
              onPress={saveEdit}
              style={{ marginTop: 8 }}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Modal: agregar equipamiento ── */}
      <Modal visible={addOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAddOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={s.mHandle} />
          <View style={s.mHeader}>
            <Text style={s.mTitle}>Agregar equipamiento</Text>
            <TouchableOpacity onPress={() => setAddOpen(false)}>
              <Text style={{ color: colors.textSecondary, fontSize: 15 }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
          <View style={{ padding: 20, gap: 14 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {(['PALA', 'ZAPATILLA'] as const).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[s.togBtn, { flex: 1 }, eqType === t && s.togBtnOn]}
                  onPress={() => setEqType(t)}
                >
                  <Text style={[s.togBtnText, eqType === t && s.togBtnTextOn]}>
                    {t === 'PALA' ? 'Pala' : 'Zapatilla'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={s.mInput}
              placeholder="Nombre / modelo"
              placeholderTextColor={colors.textMuted}
              value={eqName}
              onChangeText={setEqName}
            />
            <TextInput
              style={s.mInput}
              placeholder="Marca"
              placeholderTextColor={colors.textMuted}
              value={eqBrand}
              onChangeText={setEqBrand}
            />
            <Button label="Agregar" variant="primary" fullWidth size="lg" loading={addSaving} onPress={addEquip} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
  headerBtn: { padding: 6 },
  notifDot: {
    position: 'absolute', top: 4, right: 4,
    width: 9, height: 9, borderRadius: 5,
    backgroundColor: colors.ctaHighlight,
    borderWidth: 1.5, borderColor: colors.background,
  },

  scroll: { flex: 1 },
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

  bio: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, paddingHorizontal: 20, marginBottom: 10 },

  editChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', marginLeft: 20, marginBottom: 20,
    backgroundColor: colors.primary + '14', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: colors.primary + '30',
  },
  editChipText: { color: colors.primary, fontSize: 13, fontWeight: '600' },

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
  secHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
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
  equipEmpty: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 24 },
  equipEmptyText: { color: colors.textMuted, fontSize: 14 },

  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  addBtnText: { color: colors.primary, fontSize: 14, fontWeight: '600' },

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

  // Modal
  mHandle: { width: 36, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  mHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  mTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  mLabel: {
    color: colors.textSecondary, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8,
  },
  mInput: {
    backgroundColor: colors.secondary, borderRadius: 10, padding: 14,
    color: colors.textPrimary, fontSize: 14, marginBottom: 16,
    borderWidth: 1, borderColor: colors.border, textAlignVertical: 'top',
  },
  togBtn: {
    backgroundColor: colors.secondary, borderRadius: 10,
    borderWidth: 1.5, borderColor: colors.border,
    paddingVertical: 12, alignItems: 'center',
  },
  togBtnOn: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  togBtnText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  togBtnTextOn: { color: colors.primary },
  availToggle: {
    borderRadius: 10, padding: 14, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.secondary, alignItems: 'center', marginBottom: 20,
  },
  availToggleOn: { borderColor: colors.success, backgroundColor: colors.success + '15' },
});
