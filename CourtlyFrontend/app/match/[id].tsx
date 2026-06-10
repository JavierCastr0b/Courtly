import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, Platform, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { levelDisplay } from '@/src/theme/colors';
import { useTheme } from '@/src/theme/ThemeContext';
import type { Colors } from '@/src/theme/colors';
import { Match, User } from '@/src/types';
import { matchesApi, MatchSet } from '@/src/api/matches';
import { useAuth } from '@/src/context/AuthContext';
import { Avatar } from '@/src/components/Avatar';
import { Tag } from '@/src/components/Tag';
import { Button } from '@/src/components/Button';
import ScorecardCard from '@/src/components/ScorecardCard';
import { InvitePlayersSheet, MOCK_CANDIDATES } from '@/src/components/InvitePlayersSheet';
import { PlayerRatingModal } from '@/src/components/PlayerRatingModal';
import { hasRatedMatch } from '@/src/utils/ratingUtils';

const isDoubles = (m: Match) =>
  (m.matchType ?? '').toUpperCase().includes('DOBLES') ||
  (m.matchType ?? '').toUpperCase().includes('DOUBLE');

// ─── Sub-components (call useTheme directly) ──────────────────────────────────
function SetRow({
  index, set, onChange, onRemove,
}: {
  index: number;
  set: MatchSet;
  onChange: (s: MatchSet) => void;
  onRemove: () => void;
}) {
  const { colors } = useTheme();
  const adj = (side: 'a' | 'b', delta: number) =>
    onChange({ ...set, [side]: Math.max(0, set[side] + delta) });

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', width: 38 }}>Set {index + 1}</Text>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }} onPress={() => adj('a', -1)}>
          <Ionicons name="remove" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '800', minWidth: 26, textAlign: 'center' }}>{set.a}</Text>
        <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }} onPress={() => adj('a', 1)}>
          <Ionicons name="add" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={{ color: colors.textMuted, fontSize: 16, marginHorizontal: 2 }}>–</Text>
        <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }} onPress={() => adj('b', -1)}>
          <Ionicons name="remove" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '800', minWidth: 26, textAlign: 'center' }}>{set.b}</Text>
        <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }} onPress={() => adj('b', 1)}>
          <Ionicons name="add" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={onRemove} style={{ padding: 4 }}>
        <Ionicons name="close-circle-outline" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

function TeamColumn({
  label, players, guests, winners, accent, onPress,
}: {
  label: string;
  players: User[];
  guests: string[];
  winners: User[];
  accent: string;
  onPress?: (u: User) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, borderRadius: 12, borderWidth: 1, borderColor: accent + '50', padding: 10, gap: 8 }}>
      <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', color: accent }}>{label}</Text>
      {players.map(p => (
        <TouchableOpacity key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} onPress={() => onPress?.(p)} activeOpacity={0.75}>
          <Avatar name={p.name} size={28} />
          <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>{p.name.split(' ')[0]}</Text>
          {winners.some(w => w.id === p.id) && (
            <Ionicons name="trophy" size={12} color="#FFB800" />
          )}
        </TouchableOpacity>
      ))}
      {guests.map((g, i) => (
        <View key={`g${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="person-outline" size={14} color={colors.textMuted} />
          </View>
          <Text style={{ flex: 1, color: colors.textMuted, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>{g}</Text>
        </View>
      ))}
    </View>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 12, paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    backBtn: { padding: 4, width: 40 },
    headerTitle: { color: c.textPrimary, fontSize: 17, fontWeight: '700' },
    deleteBtn: { padding: 4, width: 40, alignItems: 'flex-end' },
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    content: { paddingBottom: 60 },
    organizerRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 20,
    },
    organizerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    organizerLabel: { color: c.textMuted, fontSize: 11, fontWeight: '500' },
    organizerName: { color: c.textPrimary, fontSize: 15, fontWeight: '700', marginTop: 2 },
    infoCard: {
      marginHorizontal: 20, backgroundColor: c.cardBg,
      borderRadius: 14, borderWidth: 1, borderColor: c.border,
      padding: 16, marginBottom: 14,
    },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
    infoIcon: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: c.primary + '18',
      alignItems: 'center', justifyContent: 'center',
    },
    infoLabel: { color: c.textMuted, fontSize: 11, fontWeight: '500' },
    infoValue: { color: c.textPrimary, fontSize: 15, fontWeight: '600', marginTop: 2 },
    infoSub: { color: c.textSecondary, fontSize: 12, marginTop: 2 },
    infoDivider: { height: 1, backgroundColor: c.border, marginVertical: 14 },
    descCard: {
      marginHorizontal: 20, backgroundColor: c.cardBg,
      borderRadius: 14, borderWidth: 1, borderColor: c.border,
      padding: 16, marginBottom: 14,
    },
    descText: { color: c.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 8 },
    sectionTitle: { color: c.textPrimary, fontSize: 15, fontWeight: '700' },
    resultCard: {
      marginHorizontal: 20, backgroundColor: '#FFB80010',
      borderRadius: 14, borderWidth: 1, borderColor: '#FFB80040',
      padding: 16, marginBottom: 14, gap: 8,
    },
    resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    resultTitle: { color: '#FFB800', fontSize: 14, fontWeight: '700' },
    resultScore: { color: c.textPrimary, fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
    winnersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    winnerChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: '#FFB80018', borderRadius: 20,
      paddingHorizontal: 10, paddingVertical: 4,
      borderWidth: 1, borderColor: '#FFB80040',
    },
    winnerChipName: { color: '#FFB800', fontSize: 13, fontWeight: '700' },
    spotsCard: {
      marginHorizontal: 20, backgroundColor: c.cardBg,
      borderRadius: 14, borderWidth: 1, borderColor: c.border,
      padding: 16, marginBottom: 14,
    },
    spotsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    spotsCount: { color: c.textSecondary, fontSize: 14, fontWeight: '700' },
    spotsCountFull: { color: c.accent },
    spotsBar: { flexDirection: 'row', gap: 6, marginBottom: 16 },
    spotDot: { height: 6, flex: 1, borderRadius: 3, backgroundColor: c.border },
    spotFilled: { backgroundColor: c.primary },
    teamsRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
    teamVsSep: { alignItems: 'center', paddingTop: 28 },
    teamVsText: { color: c.textMuted, fontSize: 12, fontWeight: '800' },
    participantsList: { gap: 2 },
    participantRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderRadius: 10 },
    participantName: { color: c.textPrimary, fontSize: 14, fontWeight: '600' },
    participantLevel: { color: c.textSecondary, fontSize: 12, marginTop: 1 },
    organizerBadge: {
      backgroundColor: c.primary + '22', borderRadius: 6,
      paddingHorizontal: 7, paddingVertical: 3,
    },
    organizerBadgeText: { color: c.primary, fontSize: 11, fontWeight: '700' },
    emptySlot: { opacity: 0.5 },
    emptyAvatar: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: c.secondary, borderWidth: 1,
      borderColor: c.border, borderStyle: 'dashed',
      alignItems: 'center', justifyContent: 'center',
    },
    emptySlotText: { color: c.textMuted, fontSize: 14 },
    pickTeamBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      marginHorizontal: 20, marginBottom: 10,
      backgroundColor: c.primary + '12', borderRadius: 10,
      borderWidth: 1, borderColor: c.primary + '40',
      paddingHorizontal: 14, paddingVertical: 10,
    },
    pickTeamText: { color: c.primary, fontSize: 14, fontWeight: '600' },
    actionBtn: { marginHorizontal: 20, marginTop: 6, marginBottom: 10 },
    chatCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      marginHorizontal: 20, marginBottom: 10,
      backgroundColor: c.cardBg, borderRadius: 14,
      borderWidth: 1, borderColor: c.border, padding: 14,
    },
    chatCardIcon: {
      width: 40, height: 40, borderRadius: 11,
      backgroundColor: c.primary + '18', alignItems: 'center', justifyContent: 'center',
    },
    chatCardTitle: { color: c.textPrimary, fontSize: 15, fontWeight: '700' },
    chatCardSub: { color: c.textSecondary, fontSize: 12, marginTop: 1 },
    inviteBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      marginHorizontal: 20, marginBottom: 10,
      backgroundColor: c.primary + '12', borderRadius: 12,
      borderWidth: 1, borderColor: c.primary + '40', paddingVertical: 12,
    },
    inviteBtnText: { color: c.primary, fontSize: 15, fontWeight: '700' },
    inviteCard: {
      marginHorizontal: 20, backgroundColor: c.cardBg, borderRadius: 14,
      borderWidth: 1, borderColor: c.border, padding: 14, marginBottom: 10,
    },
    inviteCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    inviteCountPill: { backgroundColor: c.primary + '18', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 2 },
    inviteCountText: { color: c.primary, fontSize: 12, fontWeight: '700' },
    inviteRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
    inviteName: { color: c.textPrimary, fontSize: 14, flex: 1 },
    inviteStatus: { color: c.textMuted, fontSize: 12 },
    finishedBanner: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      marginHorizontal: 20, marginTop: 6, marginBottom: 10,
      backgroundColor: c.cardBg, borderRadius: 12,
      borderWidth: 1, borderColor: c.border,
      paddingVertical: 14,
    },
    finishedText: { color: c.textMuted, fontSize: 14, fontWeight: '600' },
    rateBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      marginHorizontal: 20, marginBottom: 10, marginTop: 4,
      backgroundColor: '#FFB80012', borderRadius: 12,
      borderWidth: 1, borderColor: '#FFB80040', paddingVertical: 12,
    },
    rateBtnText: { color: '#FFB800', fontSize: 15, fontWeight: '700' },
    ratedBanner: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
      marginHorizontal: 20, marginBottom: 10, marginTop: 4,
      backgroundColor: c.success + '10', borderRadius: 12,
      borderWidth: 1, borderColor: c.success + '30', paddingVertical: 10,
    },
    ratedBannerText: { color: c.success, fontSize: 13, fontWeight: '600' },
    joinErrorBox: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      marginHorizontal: 20, marginTop: 6,
      backgroundColor: c.accent + '15', borderRadius: 8,
      paddingHorizontal: 10, paddingVertical: 7,
      borderWidth: 1, borderColor: c.accent + '40',
    },
    joinErrorText: { color: c.accent, fontSize: 12, flex: 1 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
    offscreenCapture: {
      position: 'absolute',
      transform: [{ translateX: -2000 }],
      top: 100,
    },
    scorecardCaptureWrapper: {
      backgroundColor: 'transparent',
      padding: 16,
    },
    scorecardPreview: {
      backgroundColor: '#111318',
      borderRadius: 20,
      padding: 20,
      width: 312,
      alignSelf: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.07)',
    },
    scorecardSheet: {
      backgroundColor: c.background,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
      gap: 16, alignItems: 'center',
    },
    sheet: {
      backgroundColor: c.background,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, gap: 14,
    },
    sheetScroll: {
      backgroundColor: c.background,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, gap: 12,
    },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: 4 },
    sheetTitle: { color: c.textPrimary, fontSize: 18, fontWeight: '800' },
    sheetSub: { color: c.textMuted, fontSize: 14, marginTop: -6 },
    sheetActions: { flexDirection: 'row', gap: 10 },
    teamBtns: { flexDirection: 'row', gap: 10 },
    teamBtn: {
      flex: 1, borderRadius: 14, borderWidth: 1.5, borderColor: c.border,
      padding: 14, alignItems: 'center', gap: 4,
    },
    teamBtnLabel: { fontSize: 15, fontWeight: '800' },
    teamBtnCount: { color: c.textMuted, fontSize: 12 },
    teamBtnNames: { color: c.textMuted, fontSize: 11, textAlign: 'center' },
    guestSection: { gap: 8 },
    guestLabel: { color: c.textSecondary, fontSize: 13, fontWeight: '600' },
    guestInput: {
      backgroundColor: c.cardBg, borderRadius: 10,
      borderWidth: 1, borderColor: c.border,
      color: c.textPrimary, fontSize: 14,
      paddingHorizontal: 14, paddingVertical: 11,
    },
    subSection: { color: c.textPrimary, fontSize: 14, fontWeight: '700', marginTop: 4 },
    setsHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, marginBottom: 4 },
    setsTeamHdr: { fontSize: 12, fontWeight: '700', width: 90, textAlign: 'center' },
    addSetBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
    addSetText: { color: c.primary, fontSize: 14, fontWeight: '600' },
  });
}

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: me } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinTeam, setJoinTeam] = useState<'A' | 'B' | null>(null);
  const [guestName, setGuestName] = useState('');

  const [showMyTeam, setShowMyTeam] = useState(false);

  const [showFinalize, setShowFinalize] = useState(false);
  const [winningTeam, setWinningTeam] = useState<'A' | 'B' | null>(null);
  const [sets, setSets] = useState<MatchSet[]>([{ a: 0, b: 0 }]);
  const [recording, setRecording] = useState(false);

  const [showScorecard, setShowScorecard] = useState(false);
  const [showInviteSheet, setShowInviteSheet] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rated, setRated] = useState(false);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [lastSets, setLastSets] = useState<MatchSet[]>([]);
  const [lastWinner, setLastWinner] = useState<'A' | 'B' | null>(null);
  const scorecardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    matchesApi.getById(id)
      .then(m => { setMatch(m); if (me?.id) setRated(hasRatedMatch(m.id, me.id)); })
      .catch(() => Alert.alert('Error', 'No se pudo cargar el partido.'))
      .finally(() => setLoading(false));
  }, [id, me?.id]);

  const isParticipant = match?.participants?.some(p => p.id === me?.id) ?? false;
  const isOrganizer = match?.organizer?.id === me?.id;
  const spotsLeft = match?.spotsLeft ?? 0;
  const isFull = spotsLeft === 0 && !isParticipant;
  const doubles = match ? isDoubles(match) : false;

  const myTeam = match
    ? (match.teamA ?? []).some(p => p.id === me?.id) ? 'A'
    : (match.teamB ?? []).some(p => p.id === me?.id) ? 'B'
    : null
    : null;

  const teamACount = (match?.teamA?.length ?? 0) + (match?.teamAGuests?.length ?? 0);
  const teamBCount = (match?.teamB?.length ?? 0) + (match?.teamBGuests?.length ?? 0);

  const handleJoin = () => {
    if (!match) return;
    if (doubles) { setJoinTeam(null); setGuestName(''); setShowJoinModal(true); return; }
    setJoinError(null);
    setJoining(true);
    matchesApi.join(match.id)
      .then(updated => setMatch(updated))
      .catch(e => setJoinError(e.message))
      .finally(() => setJoining(false));
  };

  const confirmJoin = () => {
    if (!match) return;
    if (doubles && !joinTeam) { Alert.alert('Elige un equipo', 'Selecciona el equipo al que te unirás.'); return; }
    setJoinError(null);
    setJoining(true);
    setShowJoinModal(false);
    matchesApi.join(match.id, joinTeam ?? undefined, guestName.trim() || undefined)
      .then(updated => setMatch(updated))
      .catch(e => setJoinError(e.message ?? 'Error al unirte'))
      .finally(() => setJoining(false));
  };

  const handleLeave = () => {
    if (!match) return;
    Alert.alert('Salir del partido', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir', style: 'destructive', onPress: () => {
          setLeaving(true);
          matchesApi.leave(match.id)
            .then(() => matchesApi.getById(match.id))
            .then(updated => setMatch(updated))
            .catch(e => Alert.alert('Error', e.message))
            .finally(() => setLeaving(false));
        },
      },
    ]);
  };

  const handleDelete = () => {
    if (!match) return;
    Alert.alert('Eliminar partido', '¿Seguro que quieres eliminar este partido?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: () => {
          matchesApi.delete(match.id)
            .then(() => router.back())
            .catch(e => Alert.alert('Error', e.message));
        },
      },
    ]);
  };

  const handleSetMyTeam = (t: 'A' | 'B') => {
    if (!match) return;
    setShowMyTeam(false);
    matchesApi.setMyTeam(match.id, t)
      .then(updated => setMatch(updated))
      .catch(e => Alert.alert('Error', e.message));
  };

  const handleRecordResult = () => {
    if (!match) return;
    if (doubles && !winningTeam) {
      Alert.alert('Selecciona el equipo ganador', 'Elige cuál equipo ganó el partido.');
      return;
    }
    const validSets = sets.filter(s => s.a > 0 || s.b > 0);
    setRecording(true);
    matchesApi.recordResult(match.id, winningTeam, validSets)
      .then(updated => {
        setMatch(updated);
        setShowFinalize(false);
        setLastSets(validSets);
        setLastWinner(winningTeam);
        setSets([{ a: 0, b: 0 }]);
        setWinningTeam(null);
        setShowScorecard(true);
      })
      .catch(e => Alert.alert('Error', e.message ?? 'No se pudo registrar el resultado.'))
      .finally(() => setRecording(false));
  };

  const handleShareScorecard = async () => {
    if (!scorecardRef.current) return;
    setSharing(true);
    try {
      await new Promise(r => setTimeout(r, 150));
      const uri = await captureRef(scorecardRef, { format: 'png', quality: 1, result: 'tmpfile' });
      await Sharing.shareAsync(uri, { mimeType: 'image/png' });
    } catch {
      Alert.alert('Error', 'No se pudo compartir el resultado.');
    } finally {
      setSharing(false);
    }
  };

  const addSet = () => setSets(prev => [...prev, { a: 0, b: 0 }]);
  const removeSet = (i: number) => setSets(prev => prev.filter((_, idx) => idx !== i));
  const updateSet = (i: number, s: MatchSet) => setSets(prev => prev.map((x, idx) => idx === i ? s : x));

  const scoreLabel = match?.score
    ? match.score.split(' ').map((s, i) => {
        const [a, b] = s.split('-');
        return `Set ${i + 1}: ${a}–${b}`;
      }).join('  ')
    : null;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partido</Text>
        {isOrganizer && !match?.resultRecorded ? (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={20} color={colors.accent} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : match ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          <View style={styles.organizerRow}>
            <TouchableOpacity onPress={() => router.push(`/profile/${match.organizer.id}`)} style={styles.organizerInfo}>
              <Avatar name={match.organizer.name} size={46} available={match.organizer.available} />
              <View>
                <Text style={styles.organizerLabel}>Organizado por</Text>
                <Text style={styles.organizerName}>{match.organizer.name}</Text>
              </View>
            </TouchableOpacity>
            <Tag label={levelDisplay[match.level] ?? match.level} variant="level" level={match.level} />
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}><Ionicons name="calendar-outline" size={18} color={colors.primary} /></View>
              <View>
                <Text style={styles.infoLabel}>Fecha</Text>
                <Text style={styles.infoValue}>{match.date}</Text>
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}><Ionicons name="time-outline" size={18} color={colors.primary} /></View>
              <View>
                <Text style={styles.infoLabel}>Hora</Text>
                <Text style={styles.infoValue}>{match.time}</Text>
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}><Ionicons name="location-outline" size={18} color={colors.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Lugar</Text>
                <Text style={styles.infoValue} numberOfLines={2}>
                  {match.court?.name ?? match.customLocation ?? '—'}
                </Text>
                {match.court?.address ? <Text style={styles.infoSub}>{match.court.address}</Text> : null}
              </View>
            </View>
          </View>

          {match.description ? (
            <View style={styles.descCard}>
              <Text style={styles.sectionTitle}>Descripción</Text>
              <Text style={styles.descText}>{match.description}</Text>
            </View>
          ) : null}

          {match.resultRecorded && (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Ionicons name="trophy" size={16} color="#FFB800" />
                <Text style={styles.resultTitle}>Resultado final</Text>
              </View>
              {scoreLabel ? (
                <Text style={styles.resultScore}>{scoreLabel}</Text>
              ) : null}
              <View style={styles.winnersRow}>
                {(match.winners ?? []).map(w => (
                  <View key={w.id} style={styles.winnerChip}>
                    <Ionicons name="trophy-outline" size={12} color="#FFB800" />
                    <Text style={styles.winnerChipName}>{w.name.split(' ')[0]}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.spotsCard}>
            <View style={styles.spotsHeader}>
              <Text style={styles.sectionTitle}>Jugadores</Text>
              <Text style={[styles.spotsCount, isFull && styles.spotsCountFull]}>
                {(match.totalSpots ?? 0) - spotsLeft}/{match.totalSpots ?? 0}
              </Text>
            </View>

            <View style={styles.spotsBar}>
              {Array.from({ length: match.totalSpots ?? 0 }).map((_, i) => (
                <View key={i} style={[styles.spotDot, i < (match.totalSpots ?? 0) - spotsLeft && styles.spotFilled]} />
              ))}
            </View>

            {doubles && ((match.teamA?.length ?? 0) > 0 || (match.teamB?.length ?? 0) > 0) ? (
              <View style={styles.teamsRow}>
                <TeamColumn
                  label="Equipo A"
                  players={match.teamA ?? []}
                  guests={match.teamAGuests ?? []}
                  winners={match.winners ?? []}
                  accent={colors.primary}
                  onPress={u => router.push(`/profile/${u.id}`)}
                />
                <View style={styles.teamVsSep}>
                  <Text style={styles.teamVsText}>VS</Text>
                </View>
                <TeamColumn
                  label="Equipo B"
                  players={match.teamB ?? []}
                  guests={match.teamBGuests ?? []}
                  winners={match.winners ?? []}
                  accent={colors.accent}
                  onPress={u => router.push(`/profile/${u.id}`)}
                />
              </View>
            ) : (
              <View style={styles.participantsList}>
                {match.participants?.map(p => (
                  <TouchableOpacity key={p.id} style={styles.participantRow} onPress={() => router.push(`/profile/${p.id}`)} activeOpacity={0.7}>
                    <Avatar name={p.name} size={36} available={p.available} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.participantName}>{p.name}</Text>
                      <Text style={styles.participantLevel}>{levelDisplay[p.level] ?? p.level}</Text>
                    </View>
                    {p.id === match.organizer.id && (
                      <View style={styles.organizerBadge}><Text style={styles.organizerBadgeText}>Org.</Text></View>
                    )}
                    {match.resultRecorded && (match.winners ?? []).some(w => w.id === p.id) && (
                      <Ionicons name="trophy" size={16} color="#FFB800" />
                    )}
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
                {Array.from({ length: spotsLeft }).map((_, i) => (
                  <View key={`e${i}`} style={[styles.participantRow, styles.emptySlot]}>
                    <View style={styles.emptyAvatar}><Ionicons name="person-add-outline" size={18} color={colors.textMuted} /></View>
                    <Text style={styles.emptySlotText}>Lugar disponible</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.chatCard}
            onPress={() => router.push(`/match/chat/${match.id}`)}
            activeOpacity={0.8}
          >
            <View style={styles.chatCardIcon}>
              <Ionicons name="chatbubbles-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.chatCardTitle}>Chat del partido</Text>
              <Text style={styles.chatCardSub}>
                {match.participants.length} jugador{match.participants.length !== 1 ? 'es' : ''} · Coordinación rápida
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Invitations summary */}
          {(isOrganizer || isParticipant) && invitedIds.size > 0 && (
            <View style={styles.inviteCard}>
              <View style={styles.inviteCardHeader}>
                <Text style={styles.sectionTitle}>Invitaciones enviadas</Text>
                <View style={styles.inviteCountPill}>
                  <Text style={styles.inviteCountText}>{invitedIds.size}</Text>
                </View>
              </View>
              {Array.from(invitedIds).map(pid => {
                const player = MOCK_CANDIDATES.find(c => c.id === pid);
                if (!player) return null;
                return (
                  <View key={pid} style={styles.inviteRow}>
                    <Avatar name={player.name} size={28} />
                    <Text style={styles.inviteName}>{player.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                      <Text style={styles.inviteStatus}>Pendiente</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Invite button */}
          {(isOrganizer || isParticipant) && !match.resultRecorded && (
            <TouchableOpacity style={styles.inviteBtn} onPress={() => setShowInviteSheet(true)} activeOpacity={0.8}>
              <Ionicons name="person-add-outline" size={18} color={colors.primary} />
              <Text style={styles.inviteBtnText}>Invitar jugadores</Text>
            </TouchableOpacity>
          )}

          {doubles && isParticipant && !myTeam && !match.resultRecorded && (
            <TouchableOpacity style={styles.pickTeamBtn} onPress={() => setShowMyTeam(true)} activeOpacity={0.8}>
              <Ionicons name="people-outline" size={16} color={colors.primary} />
              <Text style={styles.pickTeamText}>Elegir mi equipo</Text>
            </TouchableOpacity>
          )}

          {isOrganizer && !match.resultRecorded && (
            <Button
              label="Finalizar partido"
              variant="primary"
              fullWidth size="lg"
              onPress={() => { setSets([{ a: 0, b: 0 }]); setWinningTeam(null); setShowFinalize(true); }}
              style={styles.actionBtn}
            />
          )}

          {!isOrganizer && (
            match.resultRecorded ? (
              <View style={styles.finishedBanner}>
                <Ionicons name="checkmark-circle" size={16} color={colors.textMuted} />
                <Text style={styles.finishedText}>Partido terminado</Text>
              </View>
            ) : isParticipant ? (
              <Button label="Salir del partido" variant="outline" fullWidth size="lg" loading={leaving} onPress={handleLeave} style={styles.actionBtn} />
            ) : (
              <>
                <Button
                  label={isFull ? 'Partido completo' : 'Unirme al partido'}
                  variant={isFull ? 'secondary' : 'primary'}
                  fullWidth size="lg" disabled={isFull} loading={joining}
                  onPress={handleJoin} style={styles.actionBtn}
                />
                {!!joinError && (
                  <View style={styles.joinErrorBox}>
                    <Ionicons name="alert-circle-outline" size={15} color={colors.accent} />
                    <Text style={styles.joinErrorText}>{joinError}</Text>
                  </View>
                )}
              </>
            )
          )}

          {/* ── Rate players (post-match) ── */}
          {match.resultRecorded && (isParticipant || isOrganizer) && (
            rated ? (
              <View style={styles.ratedBanner}>
                <Ionicons name="checkmark-circle" size={15} color={colors.success} />
                <Text style={styles.ratedBannerText}>Ya calificaste este partido</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.rateBtn}
                onPress={() => setShowRatingModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="star-outline" size={17} color="#FFB800" />
                <Text style={styles.rateBtnText}>Calificar jugadores</Text>
              </TouchableOpacity>
            )
          )}

        </ScrollView>
      ) : (
        <View style={styles.loader}><Text style={{ color: colors.textMuted }}>No se encontró el partido.</Text></View>
      )}

      {/* ── Join team modal ── */}
      <Modal visible={showJoinModal} transparent animationType="slide" onRequestClose={() => setShowJoinModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Elegir equipo</Text>
            <Text style={styles.sheetSub}>Selecciona en qué equipo juegas</Text>

            <View style={styles.teamBtns}>
              <TouchableOpacity
                style={[styles.teamBtn, joinTeam === 'A' && { borderColor: colors.primary, backgroundColor: colors.primary + '18' }]}
                onPress={() => setJoinTeam('A')} activeOpacity={0.8}
              >
                <Text style={[styles.teamBtnLabel, { color: colors.primary }]}>Equipo A</Text>
                <Text style={styles.teamBtnCount}>{teamACount} jugadores</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.teamBtn, joinTeam === 'B' && { borderColor: colors.accent, backgroundColor: colors.accent + '18' }]}
                onPress={() => setJoinTeam('B')} activeOpacity={0.8}
              >
                <Text style={[styles.teamBtnLabel, { color: colors.accent }]}>Equipo B</Text>
                <Text style={styles.teamBtnCount}>{teamBCount} jugadores</Text>
              </TouchableOpacity>
            </View>

            {spotsLeft > 1 && (
              <View style={styles.guestSection}>
                <Text style={styles.guestLabel}>¿Traes un acompañante sin cuenta?</Text>
                <TextInput
                  style={styles.guestInput}
                  placeholder="Nombre del jugador invitado (opcional)"
                  placeholderTextColor={colors.textMuted}
                  value={guestName}
                  onChangeText={setGuestName}
                />
              </View>
            )}

            <View style={styles.sheetActions}>
              <Button label="Cancelar" variant="outline" size="md" onPress={() => setShowJoinModal(false)} style={{ flex: 1 }} />
              <Button label="Unirme" variant="primary" size="md" loading={joining} onPress={confirmJoin} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── My team picker ── */}
      <Modal visible={showMyTeam} transparent animationType="slide" onRequestClose={() => setShowMyTeam(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>¿En qué equipo juegas?</Text>
            <View style={styles.teamBtns}>
              <TouchableOpacity style={[styles.teamBtn, { borderColor: colors.primary + '60' }]} onPress={() => handleSetMyTeam('A')} activeOpacity={0.8}>
                <Text style={[styles.teamBtnLabel, { color: colors.primary }]}>Equipo A</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.teamBtn, { borderColor: colors.accent + '60' }]} onPress={() => handleSetMyTeam('B')} activeOpacity={0.8}>
                <Text style={[styles.teamBtnLabel, { color: colors.accent }]}>Equipo B</Text>
              </TouchableOpacity>
            </View>
            <Button label="Cancelar" variant="outline" size="md" onPress={() => setShowMyTeam(false)} />
          </View>
        </View>
      </Modal>

      {/* ── Offscreen scorecard for capture ── */}
      {showScorecard && (
        <View style={styles.offscreenCapture} pointerEvents="none">
          <View ref={scorecardRef} style={styles.scorecardCaptureWrapper} collapsable={false}>
            <ScorecardCard
              date={match?.date ?? ''}
              location={match?.court?.name ?? match?.customLocation ?? ''}
              teamANames={
                doubles
                  ? (match?.teamA ?? []).map(u => u.name.split(' ')[0])
                  : (match?.participants ?? []).slice(0, 1).map(u => u.name.split(' ')[0])
              }
              teamBNames={
                doubles
                  ? (match?.teamB ?? []).map(u => u.name.split(' ')[0])
                  : (match?.participants ?? []).slice(1, 2).map(u => u.name.split(' ')[0])
              }
              sets={lastSets.length > 0 ? lastSets : [{ a: 0, b: 0 }]}
              winnerTeam={lastWinner}
            />
          </View>
        </View>
      )}

      {/* ── Scorecard modal ── */}
      <Modal visible={showScorecard} transparent animationType="fade" onRequestClose={() => setShowScorecard(false)}>
        <View style={styles.overlay}>
          <View style={styles.scorecardSheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Resultado registrado</Text>
            <Text style={styles.sheetSub}>Comparte el scorecard con los jugadores</Text>
            <View style={styles.scorecardPreview}>
              <ScorecardCard
                date={match?.date ?? ''}
                location={match?.court?.name ?? match?.customLocation ?? ''}
                teamANames={
                  doubles
                    ? (match?.teamA ?? []).map(u => u.name.split(' ')[0])
                    : (match?.participants ?? []).slice(0, 1).map(u => u.name.split(' ')[0])
                }
                teamBNames={
                  doubles
                    ? (match?.teamB ?? []).map(u => u.name.split(' ')[0])
                    : (match?.participants ?? []).slice(1, 2).map(u => u.name.split(' ')[0])
                }
                sets={lastSets.length > 0 ? lastSets : [{ a: 0, b: 0 }]}
                winnerTeam={lastWinner}
              />
            </View>
            <View style={styles.sheetActions}>
              <Button label="Cerrar" variant="outline" size="md" onPress={() => setShowScorecard(false)} style={{ flex: 1 }} />
              <Button label={sharing ? 'Compartiendo...' : 'Compartir'} variant="primary" size="md" loading={sharing} onPress={handleShareScorecard} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Invite players sheet ── */}
      <InvitePlayersSheet
        visible={showInviteSheet}
        invitedIds={invitedIds}
        onInvite={id => setInvitedIds(prev => new Set([...prev, id]))}
        onClose={() => setShowInviteSheet(false)}
        matchLevel={match?.level}
        spotsLeft={match?.spotsLeft}
      />

      {/* ── Player rating modal ── */}
      {match && me && (
        <PlayerRatingModal
          visible={showRatingModal}
          matchId={match.id}
          players={(match.participants ?? []).filter(p => p.id !== me.id)}
          reviewerId={me.id}
          onClose={() => setShowRatingModal(false)}
          onDone={() => { setRated(true); setShowRatingModal(false); }}
        />
      )}

      {/* ── Finalize modal ── */}
      <Modal visible={showFinalize} transparent animationType="slide" onRequestClose={() => setShowFinalize(false)}>
        <View style={styles.overlay}>
          <ScrollView contentContainerStyle={styles.sheetScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Finalizar partido</Text>

            {doubles ? (
              <View>
                <Text style={styles.subSection}>¿Qué equipo ganó?</Text>
                <View style={styles.teamBtns}>
                  <TouchableOpacity
                    style={[styles.teamBtn, winningTeam === 'A' && { borderColor: colors.primary, backgroundColor: colors.primary + '18' }]}
                    onPress={() => setWinningTeam('A')} activeOpacity={0.8}
                  >
                    <Ionicons name="trophy-outline" size={18} color={colors.primary} />
                    <Text style={[styles.teamBtnLabel, { color: colors.primary }]}>Equipo A ganó</Text>
                    <Text style={styles.teamBtnNames} numberOfLines={2}>
                      {[...(match?.teamA ?? []).map(u => u.name.split(' ')[0]), ...(match?.teamAGuests ?? [])].join(', ') || '—'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.teamBtn, winningTeam === 'B' && { borderColor: colors.accent, backgroundColor: colors.accent + '18' }]}
                    onPress={() => setWinningTeam('B')} activeOpacity={0.8}
                  >
                    <Ionicons name="trophy-outline" size={18} color={colors.accent} />
                    <Text style={[styles.teamBtnLabel, { color: colors.accent }]}>Equipo B ganó</Text>
                    <Text style={styles.teamBtnNames} numberOfLines={2}>
                      {[...(match?.teamB ?? []).map(u => u.name.split(' ')[0]), ...(match?.teamBGuests ?? [])].join(', ') || '—'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            <Text style={styles.subSection}>Resultado por set</Text>
            <View style={styles.setsHeader}>
              <Text style={[styles.setsTeamHdr, { color: colors.primary }]}>
                {doubles ? 'Equipo A' : 'Jugador A'}
              </Text>
              <View style={{ flex: 1 }} />
              <Text style={[styles.setsTeamHdr, { color: colors.accent }]}>
                {doubles ? 'Equipo B' : 'Jugador B'}
              </Text>
            </View>
            {sets.map((s, i) => (
              <SetRow
                key={i} index={i} set={s}
                onChange={ns => updateSet(i, ns)}
                onRemove={() => removeSet(i)}
              />
            ))}
            <TouchableOpacity style={styles.addSetBtn} onPress={addSet} activeOpacity={0.75}>
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.addSetText}>Agregar set</Text>
            </TouchableOpacity>

            <View style={[styles.sheetActions, { marginTop: 8 }]}>
              <Button label="Cancelar" variant="outline" size="md" onPress={() => setShowFinalize(false)} style={{ flex: 1 }} />
              <Button label="Confirmar" variant="primary" size="md" loading={recording} onPress={handleRecordResult} style={{ flex: 1 }} />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
