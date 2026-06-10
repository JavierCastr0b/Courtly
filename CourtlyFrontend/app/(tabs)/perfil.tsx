import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { levelColor, levelDisplay } from '@/src/theme/colors';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/theme/ThemeContext';
import type { Colors } from '@/src/theme/colors';
import { usersApi } from '@/src/api/users';
import { Avatar } from '@/src/components/Avatar';
import { Button } from '@/src/components/Button';
import { Equipment, Match } from '@/src/types';
import { notificationsApi } from '@/src/api/notifications';
import { MatchHistorySection } from '@/src/components/MatchHistorySection';

function fmtDate(s: string) {
  return new Date(s + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
}

// Sub-components call useTheme directly
function StatBox({ value, label, accent }: { value: string | number; label: string; accent?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 5 }}>
      <Text style={{ color: accent ?? colors.textPrimary, fontSize: 22, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' }}>{label}</Text>
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
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {options.map(o => (
          <TouchableOpacity
            key={o.v}
            style={[
              { flex: 1, backgroundColor: colors.secondary, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, paddingVertical: 12, alignItems: 'center' },
              value === o.v && { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
            ]}
            onPress={() => onChange(value === o.v ? null : o.v)}
          >
            <Text style={{ color: value === o.v ? colors.primary : colors.textSecondary, fontSize: 14, fontWeight: '600' }}>{o.l}</Text>
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

function makeStyles(c: Colors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 18, paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    headerTitle: { color: c.textPrimary, fontSize: 17, fontWeight: '700' },
    headerBtn: { padding: 6 },
    notifDot: {
      position: 'absolute', top: 4, right: 4,
      width: 9, height: 9, borderRadius: 5,
      backgroundColor: c.accent,
      borderWidth: 1.5, borderColor: c.background,
    },
    scroll: { flex: 1 },
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
    bio: { color: c.textSecondary, fontSize: 14, lineHeight: 21, paddingHorizontal: 20, marginBottom: 10 },
    editChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      alignSelf: 'flex-start', marginLeft: 20, marginBottom: 20,
      backgroundColor: c.primary + '14', borderRadius: 8,
      paddingHorizontal: 12, paddingVertical: 6,
      borderWidth: 1, borderColor: c.primary + '30',
    },
    editChipText: { color: c.primary, fontSize: 13, fontWeight: '600' },
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
    secHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
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
    equipEmpty: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 24 },
    equipEmptyText: { color: c.textMuted, fontSize: 14 },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    addBtnText: { color: c.primary, fontSize: 14, fontWeight: '600' },
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
    mHandle: { width: 36, height: 4, backgroundColor: c.border, borderRadius: 2, alignSelf: 'center', marginTop: 12 },
    mHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: c.border,
    },
    mTitle: { color: c.textPrimary, fontSize: 18, fontWeight: '700' },
    mLabel: {
      color: c.textSecondary, fontSize: 11, fontWeight: '700',
      textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8,
    },
    mInput: {
      backgroundColor: c.secondary, borderRadius: 10, padding: 14,
      color: c.textPrimary, fontSize: 14, marginBottom: 16,
      borderWidth: 1, borderColor: c.border, textAlignVertical: 'top',
    },
    availToggle: {
      borderRadius: 10, padding: 14, borderWidth: 1.5, borderColor: c.border,
      backgroundColor: c.secondary, alignItems: 'center', marginBottom: 20,
    },
    availToggleOn: { borderColor: c.success, backgroundColor: c.success + '15' },
    modalBg: { flex: 1, backgroundColor: c.background },
  });
}

export default function PerfilScreen() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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
      setMatches(mx);
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
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tú</Text>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications-outline" size={21} color={colors.textSecondary} />
            {unreadCount > 0 && <View style={styles.notifDot} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={toggleTheme}>
            <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={21} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => Alert.alert('Configuración', undefined, [
              { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
              { text: 'Cancelar', style: 'cancel' },
            ])}
          >
            <Ionicons name="settings-outline" size={21} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.hero}>
          <View style={[styles.avatarGlow, { borderColor: lvlCol + 'AA', shadowColor: lvlCol }]}>
            <Avatar name={user.name} size={88} available={false} />
          </View>
          <View style={styles.heroRight}>
            <Text style={styles.heroName}>{user.name}</Text>
            <View style={styles.heroBadges}>
              <View style={[styles.lvlBadge, { backgroundColor: lvlCol + '20', borderColor: lvlCol + '70' }]}>
                <Text style={[styles.lvlBadgeText, { color: lvlCol }]}>{lvlDsp}</Text>
              </View>
              {user.available && (
                <View style={styles.availBadge}>
                  <View style={styles.availDot} />
                  <Text style={styles.availText}>Disponible</Text>
                </View>
              )}
            </View>
            <Text style={styles.heroMeta} numberOfLines={1}>
              {'@' + user.username + (user.location ? '  ·  ' + user.location : '')}
            </Text>
          </View>
        </View>

        {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}

        <TouchableOpacity style={styles.editChip} onPress={openEdit} activeOpacity={0.75}>
          <Ionicons name="pencil-outline" size={13} color={colors.primary} />
          <Text style={styles.editChipText}>Editar perfil</Text>
        </TouchableOpacity>

        <View style={styles.statsCard}>
          <StatBox value={user.matchesPlayed} label="PARTIDOS" />
          <View style={styles.statDiv} />
          <StatBox value={user.wins} label="VICTORIAS" accent={colors.success} />
          <View style={styles.statDiv} />
          <StatBox value={winRate + '%'} label="WIN RATE" />
          <View style={styles.statDiv} />
          <StatBox value={user.rating != null ? `★ ${user.rating.toFixed(1)}` : '—'} label="RATING" accent={colors.primary} />
        </View>

        <View style={styles.followCard}>
          <TouchableOpacity
            style={styles.followItem}
            onPress={() => router.push({ pathname: '/followers/[id]', params: { id: user.id, mode: 'following' } })}
          >
            <Text style={styles.followVal}>{stats.followingCount}</Text>
            <Text style={styles.followLbl}>Siguiendo</Text>
          </TouchableOpacity>
          <View style={styles.followDiv} />
          <TouchableOpacity
            style={styles.followItem}
            onPress={() => router.push({ pathname: '/followers/[id]', params: { id: user.id, mode: 'followers' } })}
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

        <MatchHistorySection allMatches={matches} userId={user.id} isOwn={true} />

        <View style={styles.section}>
          <View style={styles.secHead}>
            <Text style={styles.secTitle}>Equipamiento</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setAddOpen(true)}>
              <Ionicons name="add" size={15} color={colors.primary} />
              <Text style={styles.addBtnText}>Agregar</Text>
            </TouchableOpacity>
          </View>
          {equipment.length > 0 ? (
            <View style={styles.card}>
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
                  <TouchableOpacity onPress={() => delEquip(eq.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.card, styles.equipEmpty]}
              onPress={() => setAddOpen(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="bag-handle-outline" size={20} color={colors.textMuted} />
              <Text style={styles.equipEmptyText}>Agregar tu equipamiento</Text>
            </TouchableOpacity>
          )}
        </View>

        {(prefs.length > 0 || user.dominantHand) && (
          <View style={styles.section}>
            <Text style={styles.secTitle}>Preferencias</Text>
            <View style={styles.prefRow}>
              {prefs.map(p => (
                <View key={p} style={styles.prefPill}>
                  <Text style={styles.prefPillText}>{p}</Text>
                </View>
              ))}
              {user.dominantHand && (
                <View style={[styles.prefPill, styles.prefPillHand]}>
                  <Ionicons name="hand-right-outline" size={12} color={colors.primary} />
                  <Text style={[styles.prefPillText, { color: colors.primary }]}>
                    {user.dominantHand === 'DERECHA' ? 'Derecha' : 'Izquierda'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

      </ScrollView>

      <Modal visible={editOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[{ flex: 1 }, styles.modalBg]}>
          <View style={styles.mHandle} />
          <View style={styles.mHeader}>
            <Text style={styles.mTitle}>Editar perfil</Text>
            <TouchableOpacity onPress={() => setEditOpen(false)}>
              <Text style={{ color: colors.textSecondary, fontSize: 15 }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1, padding: 20 }}>
            <Text style={styles.mLabel}>Bio</Text>
            <TextInput
              style={[styles.mInput, { minHeight: 80 }]}
              placeholder="Cuéntanos sobre ti..."
              placeholderTextColor={colors.textMuted}
              value={eBio}
              onChangeText={setEBio}
              multiline
            />
            <Text style={styles.mLabel}>Ubicación</Text>
            <TextInput
              style={styles.mInput}
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
              style={[styles.availToggle, eAvail && styles.availToggleOn]}
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

      <Modal visible={addOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAddOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[{ flex: 1 }, styles.modalBg]}>
          <View style={styles.mHandle} />
          <View style={styles.mHeader}>
            <Text style={styles.mTitle}>Agregar equipamiento</Text>
            <TouchableOpacity onPress={() => setAddOpen(false)}>
              <Text style={{ color: colors.textSecondary, fontSize: 15 }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
          <View style={{ padding: 20, gap: 14 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {(['PALA', 'ZAPATILLA'] as const).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[
                    { flex: 1, backgroundColor: colors.secondary, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, paddingVertical: 12, alignItems: 'center' as const },
                    eqType === t && { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
                  ]}
                  onPress={() => setEqType(t)}
                >
                  <Text style={{ color: eqType === t ? colors.primary : colors.textSecondary, fontSize: 14, fontWeight: '600' }}>
                    {t === 'PALA' ? 'Pala' : 'Zapatilla'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.mInput}
              placeholder="Nombre / modelo"
              placeholderTextColor={colors.textMuted}
              value={eqName}
              onChangeText={setEqName}
            />
            <TextInput
              style={styles.mInput}
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
