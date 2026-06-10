import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator,
  ScrollView, StatusBar, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/ThemeContext';
import type { Colors } from '@/src/theme/colors';
import { levelDisplay } from '@/src/theme/colors';
import { useAuth } from '@/src/context/AuthContext';
import { matchesApi } from '@/src/api/matches';
import { chatApi } from '@/src/api/chat';
import type { Match, AttendanceStatus } from '@/src/types';
import { Avatar } from '@/src/components/Avatar';
import { InvitePlayersSheet } from '@/src/components/InvitePlayersSheet';
import { PlayerRatingModal } from '@/src/components/PlayerRatingModal';
import { hasRatedMatch } from '@/src/utils/ratingUtils';

// ─── Types ───────────────────────────────────────────────────────────────────

type LocalMessage = {
  id: string;
  userId: string | null;
  userName: string;
  content: string;
  type: 'TEXT' | 'SYSTEM' | 'QUICK_ACTION' | 'LOCATION';
  createdAt: string;
  pending?: boolean;
};

type MatchStatus = 'BUSCANDO' | 'COMPLETO' | 'CONFIRMANDO' | 'EN_CURSO' | 'FINALIZADO';

// ─── Constants ───────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { id: 'arrived',  label: 'Ya llegué',          message: '¡Ya llegué! 🙋' },
  { id: 'late',     label: '10 min tarde',        message: 'Voy 10 minutos tarde, espérenme 🕐' },
  { id: 'balls',    label: '¿Quién lleva bolas?', message: '¿Alguien lleva bolas? 🎾' },
  { id: 'reserve',  label: '¿Quién reserva?',     message: '¿Quién va a reservar la cancha? 📋' },
  { id: 'confirm',  label: 'Confirmo asistencia', message: '¡Confirmado, ahí estaré! ✅' },
] as const;

const ATT_LABELS: Record<AttendanceStatus, string> = {
  CONFIRMED:   'Confirmo',
  PENDING:     'Pendiente',
  CANT_ATTEND: 'No puedo',
};

const STATUS_LABELS: Record<MatchStatus, string> = {
  BUSCANDO:    'Buscando',
  COMPLETO:    'Completo',
  CONFIRMANDO: 'Confirmando',
  EN_CURSO:    'En curso',
  FINALIZADO:  'Finalizado',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function attColors(c: Colors): Record<AttendanceStatus, string> {
  return { CONFIRMED: c.success, PENDING: c.warning, CANT_ATTEND: '#EF4444' };
}

function statusColors(c: Colors): Record<MatchStatus, string> {
  return {
    BUSCANDO:    c.primary,
    COMPLETO:    c.accent,
    CONFIRMANDO: c.warning,
    EN_CURSO:    c.success,
    FINALIZADO:  c.textMuted,
  };
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function formatMatchDate(dateStr: string): string {
  const today = new Date();
  const d = new Date(dateStr + 'T00:00:00');
  if (d.toDateString() === today.toDateString()) return 'Hoy';
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return 'Mañana';
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function computeMatchStatus(match: Match): MatchStatus {
  if (match.resultRecorded) return 'FINALIZADO';
  if ((match.spotsLeft ?? 1) <= 0) {
    try {
      const dt = new Date(`${match.date}T${match.time ?? '23:59'}`);
      if (!isNaN(dt.getTime()) && dt <= new Date()) return 'EN_CURSO';
    } catch { /* noop */ }
    return 'CONFIRMANDO';
  }
  return 'BUSCANDO';
}

// ─── Styles ──────────────────────────────────────────────────────────────────

function makeStyles(c: Colors) {
  return StyleSheet.create({
    root:   { flex: 1, backgroundColor: c.background },
    flex1:  { flex: 1 },
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    // Header
    header: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingHorizontal: 12, paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    backBtn:         { padding: 4 },
    headerInfo:      { flex: 1 },
    headerTitle:     { color: c.textPrimary, fontSize: 15, fontWeight: '700' },
    headerSub:       { color: c.textMuted, fontSize: 12, marginTop: 1 },
    headerBadge:     {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: c.secondary, borderRadius: 12,
      paddingHorizontal: 9, paddingVertical: 4,
      borderWidth: 1, borderColor: c.border,
    },
    headerBadgeText: { color: c.textSecondary, fontSize: 12, fontWeight: '600' },
    statusChip: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4,
      borderWidth: 1,
    },
    statusChipText: { fontSize: 11, fontWeight: '700' },

    // Participants
    participantItem: { alignItems: 'center', marginRight: 14 },
    participantName: { color: c.textMuted, fontSize: 10, marginTop: 3, maxWidth: 52, textAlign: 'center' },
    attDotOuter: {
      position: 'absolute', top: 0, right: 0,
      width: 11, height: 11, borderRadius: 6,
      borderWidth: 2, borderColor: c.background,
    },
    meRing: { borderWidth: 2, borderColor: c.primary, borderRadius: 28, padding: 1 },

    // Match info card
    matchInfoCard: {
      marginHorizontal: 12, marginTop: 8, marginBottom: 2,
      backgroundColor: c.cardBg, borderRadius: 14,
      borderWidth: 1, borderColor: c.border, overflow: 'hidden',
    },
    matchInfoToggleRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 14, paddingVertical: 10,
    },
    matchInfoToggleLabel: {
      color: c.textSecondary, fontSize: 11, fontWeight: '700',
      textTransform: 'uppercase', letterSpacing: 0.5,
    },
    matchInfoBody:  { paddingHorizontal: 14, paddingBottom: 6, gap: 6 },
    matchInfoRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
    matchInfoValue: { color: c.textSecondary, fontSize: 13, flex: 1 },
    matchInfoBtnRow: {
      flexDirection: 'row', gap: 8,
      paddingHorizontal: 14, paddingVertical: 10,
      borderTopWidth: 1, borderTopColor: c.border, marginTop: 4,
    },
    matchInfoBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      paddingVertical: 7, borderRadius: 9, borderWidth: 1,
    },
    matchInfoBtnText: { fontSize: 13, fontWeight: '600' },

    // Attendance – big card (when PENDING)
    attCard: {
      marginHorizontal: 12, marginVertical: 6,
      backgroundColor: c.cardBg, borderRadius: 14,
      borderWidth: 1, borderColor: c.border, padding: 12,
    },
    attCardHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    attCardTitle:   { color: c.textPrimary, fontSize: 13, fontWeight: '700' },
    attCardBtnRow:  { flexDirection: 'row', gap: 8 },
    attBigBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      paddingVertical: 10, borderRadius: 10, borderWidth: 1,
    },
    attBigBtnText: { fontSize: 13, fontWeight: '700' },

    // Attendance – compact status row (when CONFIRMED / CANT_ATTEND)
    attStatusRow: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingHorizontal: 14, paddingVertical: 9,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    attDotSmall:     { width: 7, height: 7, borderRadius: 3.5 },
    attStatusText:   { color: c.textSecondary, fontSize: 12, fontWeight: '600', flex: 1 },
    attChangeBtn:    { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, backgroundColor: c.primary + '15' },
    attChangeBtnText:{ color: c.primary, fontSize: 12, fontWeight: '600' },

    // Messages
    messagesArea:    { flex: 1 },
    messagesContent: { paddingHorizontal: 14, paddingVertical: 10, gap: 2 },

    myRow:    { alignItems: 'flex-end', marginBottom: 1 },
    myBubble: {
      backgroundColor: c.primary, borderRadius: 18, borderBottomRightRadius: 4,
      paddingHorizontal: 13, paddingVertical: 9, maxWidth: '74%',
    },
    myText: { color: '#fff', fontSize: 14, lineHeight: 20 },
    myTime: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 3, textAlign: 'right' },

    otherRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginBottom: 1 },
    otherBubble: {
      backgroundColor: c.cardBg, borderRadius: 18, borderBottomLeftRadius: 4,
      paddingHorizontal: 13, paddingVertical: 9, maxWidth: '74%',
      borderWidth: 1, borderColor: c.border,
    },
    otherName: { color: c.accent, fontSize: 11, fontWeight: '700', marginBottom: 2 },
    otherText: { color: c.textPrimary, fontSize: 14, lineHeight: 20 },
    otherTime: { color: c.textMuted, fontSize: 10, marginTop: 3 },

    // System message – pill
    sysRow:  { alignItems: 'center', marginVertical: 5 },
    sysPill: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: c.secondary, borderRadius: 20,
      borderWidth: 1, borderColor: c.border,
      paddingHorizontal: 12, paddingVertical: 4,
    },
    sysText: { color: c.textMuted, fontSize: 11 },

    // Location message
    locationRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginBottom: 1 },
    locationBubble: {
      backgroundColor: c.accent + '12', borderRadius: 16,
      borderWidth: 1, borderColor: c.accent + '40',
      paddingHorizontal: 13, paddingVertical: 10, maxWidth: '74%',
    },
    locationBubbleName: { color: c.accent, fontSize: 11, fontWeight: '700', marginBottom: 3 },
    locationBubbleText: { color: c.textPrimary, fontSize: 13, marginBottom: 8 },
    locationViewBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: c.accent + '20', borderRadius: 8,
      paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start',
    },
    locationViewBtnText: { color: c.accent, fontSize: 12, fontWeight: '700' },
    myLocationBubble: {
      backgroundColor: c.primary, borderRadius: 18, borderBottomRightRadius: 4,
      paddingHorizontal: 13, paddingVertical: 10, maxWidth: '74%',
    },

    // Quick actions
    quickBar:     { borderTopWidth: 1, borderTopColor: c.border, paddingVertical: 7 },
    quickContent: { paddingHorizontal: 14, gap: 7 },
    quickBtn: {
      paddingHorizontal: 12, paddingVertical: 7,
      borderRadius: 18, borderWidth: 1, borderColor: c.border,
      backgroundColor: c.secondary,
    },
    quickBtnText:         { color: c.textSecondary, fontSize: 12, fontWeight: '500' },
    quickBtnLocation:     { borderColor: c.accent + '50', backgroundColor: c.accent + '0D' },
    quickBtnLocationText: { color: c.accent },

    // Post-match card
    postMatchCard: {
      margin: 12, marginTop: 0,
      backgroundColor: c.primary + '0E', borderRadius: 16,
      borderWidth: 1, borderColor: c.primary + '30', padding: 14,
    },
    postMatchTitleRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    postMatchTitle:           { color: c.textPrimary, fontSize: 15, fontWeight: '800' },
    postMatchSub:             { color: c.textMuted, fontSize: 12, marginBottom: 12 },
    postMatchPrimaryBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
      paddingVertical: 11, borderRadius: 12, marginBottom: 8,
      backgroundColor: c.primary,
    },
    postMatchPrimaryBtnText:   { color: '#fff', fontSize: 14, fontWeight: '700' },
    postMatchSecondaryRow:     { flexDirection: 'row', gap: 8 },
    postMatchSecondaryBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      paddingVertical: 9, borderRadius: 12,
      backgroundColor: c.secondary, borderWidth: 1, borderColor: c.border,
    },
    postMatchSecondaryBtnText: { color: c.textSecondary, fontSize: 13, fontWeight: '600' },

    // Input
    inputRow: {
      flexDirection: 'row', alignItems: 'flex-end', gap: 8,
      paddingHorizontal: 12, paddingTop: 8,
      borderTopWidth: 1, borderTopColor: c.border,
    },
    inputBox: {
      flex: 1, backgroundColor: c.secondary,
      borderRadius: 20, borderWidth: 1, borderColor: c.border,
      paddingHorizontal: 14, paddingVertical: 9, maxHeight: 110,
    },
    input:      { color: c.textPrimary, fontSize: 14, minHeight: 20 },
    sendBtn:    { width: 42, height: 42, borderRadius: 21, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },
    sendBtnOff: { backgroundColor: c.secondary },

    joinPrompt: {
      margin: 14, padding: 12, borderRadius: 12,
      backgroundColor: c.secondary, borderWidth: 1, borderColor: c.border,
      alignItems: 'center',
    },
    joinPromptText: { color: c.textMuted, fontSize: 13, textAlign: 'center' },

    emptyMsg:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
    emptyMsgText: { color: c.textMuted, fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  });
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function MatchChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const flatRef = useRef<FlatList>(null);

  const [match, setMatch]               = useState<Match | null>(null);
  const [messages, setMessages]         = useState<LocalMessage[]>([]);
  const [attendance, setAttendance]     = useState<Record<string, AttendanceStatus>>({});
  const [myAttendance, setMyAttendance] = useState<AttendanceStatus>('PENDING');
  const [inputText, setInputText]       = useState('');
  const [loading, setLoading]           = useState(true);
  const [sending, setSending]           = useState(false);
  const [showInviteSheet, setShowInviteSheet] = useState(false);
  const [invitedIds, setInvitedIds]     = useState<Set<string>>(new Set());
  const [showMatchCard, setShowMatchCard] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rated, setRated]               = useState(false);

  const aColors = useMemo(() => attColors(colors), [colors]);
  const sColors = useMemo(() => statusColors(colors), [colors]);

  const matchStatus: MatchStatus = useMemo(
    () => (match ? computeMatchStatus(match) : 'BUSCANDO'),
    [match],
  );

  const isParticipant = useMemo(
    () => match?.participants?.some(p => p.id === user?.id) ?? false,
    [match, user?.id],
  );
  const isOrganizer = match?.organizer?.id === user?.id;

  const location   = match?.court?.name ?? match?.customLocation ?? 'Partido';
  const dateLabel  = match ? formatMatchDate(match.date) : '';
  const levelLabel = match ? (levelDisplay[match.level] ?? match.level) : '';
  const spotsInfo  = match ? `${match.totalSpots - match.spotsLeft}/${match.totalSpots}` : '';

  // ── Load ──────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    if (!id) return;
    const [m, msgs, att] = await Promise.all([
      matchesApi.getById(id).catch(() => null),
      chatApi.getMessages(id).catch(() => []),
      chatApi.getAttendance(id).catch(() => []),
    ]);
    if (m) { setMatch(m); if (user?.id) setRated(hasRatedMatch(m.id, user.id)); }
    if (msgs.length > 0) {
      const mapped: LocalMessage[] = [...msgs]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map(msg => ({
          id: msg.id,
          userId: msg.user?.id ?? null,
          userName: msg.user?.name ?? 'Sistema',
          content: msg.content,
          type: msg.type,
          createdAt: msg.createdAt,
        }));
      setMessages(mapped);
    }
    const attMap: Record<string, AttendanceStatus> = {};
    if (m) m.participants.forEach(p => { attMap[p.id] = 'PENDING'; });
    att.forEach((a: { userId: string; status: AttendanceStatus }) => { attMap[a.userId] = a.status; });
    setAttendance(attMap);
    if (user?.id && attMap[user.id]) setMyAttendance(attMap[user.id]);
  }, [id, user?.id]);

  useEffect(() => { loadData().finally(() => setLoading(false)); }, [loadData]);

  // ── Send ──────────────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (content: string, type: LocalMessage['type'] = 'TEXT') => {
    if (!content.trim() || !user || !id) return;
    const localId = `local-${Date.now()}`;
    const msg: LocalMessage = {
      id: localId, userId: user.id, userName: user.name,
      content: content.trim(), type,
      createdAt: new Date().toISOString(), pending: true,
    };
    setMessages(prev => [msg, ...prev]);
    setInputText('');
    setSending(true);
    try {
      const apiType = type === 'LOCATION' ? 'QUICK_ACTION' : type;
      const sent = await chatApi.sendMessage(id, content.trim(), apiType);
      setMessages(prev => prev.map(m => m.id === localId
        ? { ...msg, id: sent.id, pending: false, createdAt: sent.createdAt }
        : m));
    } catch {
      setMessages(prev => prev.map(m => m.id === localId ? { ...m, pending: false } : m));
    } finally {
      setSending(false);
    }
  }, [id, user]);

  // ── Attendance ────────────────────────────────────────────────────────────

  const handleAttendance = useCallback(async (status: AttendanceStatus) => {
    if (!user?.id || !id) return;
    const prev = myAttendance;
    setMyAttendance(status);
    setAttendance(a => ({ ...a, [user.id]: status }));
    const verb: Record<AttendanceStatus, string> = {
      CONFIRMED:   'confirmó su asistencia ✅',
      PENDING:     'está pendiente de confirmar',
      CANT_ATTEND: 'no podrá asistir ❌',
    };
    setMessages(cur => [{
      id: `sys-att-${Date.now()}`, userId: null, userName: 'Sistema',
      content: `${user.name.split(' ')[0]} ${verb[status]}`,
      type: 'SYSTEM', createdAt: new Date().toISOString(),
    }, ...cur]);
    try {
      await chatApi.updateAttendance(id, status);
    } catch {
      setMyAttendance(prev);
      setAttendance(a => ({ ...a, [user.id]: prev }));
    }
  }, [id, user, myAttendance]);

  // ── Location share ────────────────────────────────────────────────────────

  const handleShareLocation = useCallback(() => {
    if (!user) return;
    sendMessage(`${user.name.split(' ')[0]} compartió su ubicación`, 'LOCATION');
  }, [user, sendMessage]);

  // ── Render message ────────────────────────────────────────────────────────

  const renderMessage = useCallback(({ item }: { item: LocalMessage }) => {
    if (item.type === 'SYSTEM') {
      return (
        <View style={styles.sysRow}>
          <View style={styles.sysPill}>
            <Ionicons name="information-circle-outline" size={12} color={colors.textMuted} />
            <Text style={styles.sysText}>{item.content}</Text>
          </View>
        </View>
      );
    }

    if (item.type === 'LOCATION') {
      const isMe = item.userId === user?.id;
      if (isMe) {
        return (
          <View style={styles.myRow}>
            <View style={[styles.myLocationBubble, item.pending && { opacity: 0.65 }]}>
              <Text style={[styles.myText, { marginBottom: 8 }]}>📍 Compartí mi ubicación</Text>
              <TouchableOpacity
                style={[styles.locationViewBtn, { backgroundColor: 'rgba(255,255,255,0.22)' }]}
                onPress={() => Alert.alert('Ubicación', 'Función disponible próximamente.')}
              >
                <Ionicons name="map-outline" size={12} color="#fff" />
                <Text style={[styles.locationViewBtnText, { color: '#fff' }]}>Ver ubicación</Text>
              </TouchableOpacity>
              <Text style={[styles.myTime, { marginTop: 6 }]}>{formatTime(item.createdAt)}</Text>
            </View>
          </View>
        );
      }
      return (
        <View style={styles.locationRow}>
          <Avatar name={item.userName} size={28} />
          <View style={[styles.locationBubble, item.pending && { opacity: 0.65 }]}>
            <Text style={styles.locationBubbleName}>{item.userName.split(' ')[0]}</Text>
            <Text style={styles.locationBubbleText}>📍 {item.content}</Text>
            <TouchableOpacity
              style={styles.locationViewBtn}
              onPress={() => Alert.alert('Ubicación', 'Función disponible próximamente.')}
            >
              <Ionicons name="map-outline" size={12} color={colors.accent} />
              <Text style={styles.locationViewBtnText}>Ver ubicación</Text>
            </TouchableOpacity>
            <Text style={[styles.otherTime, { marginTop: 6 }]}>{formatTime(item.createdAt)}</Text>
          </View>
        </View>
      );
    }

    if (item.userId === user?.id) {
      return (
        <View style={styles.myRow}>
          <View style={[styles.myBubble, item.pending && { opacity: 0.65 }]}>
            <Text style={styles.myText}>{item.content}</Text>
            <Text style={styles.myTime}>{formatTime(item.createdAt)}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.otherRow}>
        <Avatar name={item.userName} size={28} />
        <View style={styles.otherBubble}>
          <Text style={styles.otherName}>{item.userName.split(' ')[0]}</Text>
          <Text style={styles.otherText}>{item.content}</Text>
          <Text style={styles.otherTime}>{formatTime(item.createdAt)}</Text>
        </View>
      </View>
    );
  }, [user?.id, styles, colors]);

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <View style={styles.loader}><ActivityIndicator color={colors.primary} size="large" /></View>
      </SafeAreaView>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>{location}</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {dateLabel}{match?.time ? ` · ${match.time}` : ''}{levelLabel ? ` · ${levelLabel}` : ''}{spotsInfo ? ` · ${spotsInfo}` : ''}
            </Text>
          </View>
          {match && (
            <View style={[styles.statusChip, {
              backgroundColor: sColors[matchStatus] + '18',
              borderColor:     sColors[matchStatus] + '40',
            }]}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: sColors[matchStatus] }} />
              <Text style={[styles.statusChipText, { color: sColors[matchStatus] }]}>
                {STATUS_LABELS[matchStatus]}
              </Text>
            </View>
          )}
          {(isParticipant || isOrganizer) && (
            <TouchableOpacity
              onPress={() => setShowInviteSheet(true)}
              style={{ padding: 5, backgroundColor: colors.primary + '15', borderRadius: 10, borderWidth: 1, borderColor: colors.primary + '40' }}
              activeOpacity={0.7}
            >
              <Ionicons name="person-add-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Participants strip ── */}
        {match && match.participants.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 10 }}
            style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
          >
            {match.participants.map(p => {
              const att = attendance[p.id] ?? 'PENDING';
              const isMe = p.id === user?.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={styles.participantItem}
                  onPress={() => !isMe && router.push(`/profile/${p.id}`)}
                  activeOpacity={isMe ? 1 : 0.75}
                >
                  <View style={isMe ? styles.meRing : undefined}>
                    <Avatar name={p.name} size={42} />
                  </View>
                  <View style={[styles.attDotOuter, { backgroundColor: aColors[att] }]} />
                  <Text style={styles.participantName} numberOfLines={1}>
                    {isMe ? 'Tú' : p.name.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* ── Match info card (collapsible) ── */}
        {match && (
          <View style={styles.matchInfoCard}>
            <TouchableOpacity
              style={styles.matchInfoToggleRow}
              onPress={() => setShowMatchCard(v => !v)}
              activeOpacity={0.7}
            >
              <Text style={styles.matchInfoToggleLabel}>Resumen del partido</Text>
              <Ionicons
                name={showMatchCard ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.textMuted}
              />
            </TouchableOpacity>
            {showMatchCard && (
              <>
                <View style={styles.matchInfoBody}>
                  <View style={styles.matchInfoRow}>
                    <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.matchInfoValue}>{location}</Text>
                  </View>
                  <View style={styles.matchInfoRow}>
                    <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.matchInfoValue}>
                      {dateLabel}{match.time ? ` · ${match.time}` : ''}
                    </Text>
                  </View>
                  <View style={styles.matchInfoRow}>
                    <Ionicons name="tennisball-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.matchInfoValue}>
                      {levelLabel}
                      {match.matchType ? ` · ${match.matchType === 'DOBLES' ? 'Dobles' : 'Singles'}` : ''}
                      {` · ${spotsInfo} jugadores`}
                    </Text>
                  </View>
                  <View style={styles.matchInfoRow}>
                    <View style={{ width: 7, height: 7, borderRadius: 3.5, marginLeft: 3.5, backgroundColor: sColors[matchStatus] }} />
                    <Text style={[styles.matchInfoValue, { color: sColors[matchStatus] }]}>
                      {STATUS_LABELS[matchStatus]}
                    </Text>
                  </View>
                </View>
                <View style={styles.matchInfoBtnRow}>
                  <TouchableOpacity
                    style={[styles.matchInfoBtn, { borderColor: colors.primary + '40', backgroundColor: colors.primary + '0D' }]}
                    onPress={() => router.push(`/match/${id}`)}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="eye-outline" size={14} color={colors.primary} />
                    <Text style={[styles.matchInfoBtnText, { color: colors.primary }]}>Ver detalle</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.matchInfoBtn, { borderColor: colors.accent + '40', backgroundColor: colors.accent + '0D' }]}
                    onPress={() => Alert.alert('Abrir mapa', 'Función disponible próximamente.')}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="map-outline" size={14} color={colors.accent} />
                    <Text style={[styles.matchInfoBtnText, { color: colors.accent }]}>Abrir mapa</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}

        {/* ── Attendance – pending: big confirm card ── */}
        {isParticipant && myAttendance === 'PENDING' && matchStatus !== 'FINALIZADO' && (
          <View style={styles.attCard}>
            <View style={styles.attCardHeader}>
              <Text style={styles.attCardTitle}>Confirma tu asistencia</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={[styles.attDotSmall, { backgroundColor: aColors.PENDING }]} />
                <Text style={{ color: aColors.PENDING, fontSize: 11, fontWeight: '600' }}>Pendiente</Text>
              </View>
            </View>
            <View style={styles.attCardBtnRow}>
              <TouchableOpacity
                style={[styles.attBigBtn, { borderColor: colors.success + '55', backgroundColor: colors.success + '12' }]}
                onPress={() => handleAttendance('CONFIRMED')}
                activeOpacity={0.75}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
                <Text style={[styles.attBigBtnText, { color: colors.success }]}>Confirmar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.attBigBtn, { borderColor: '#EF444430', backgroundColor: '#EF444410' }]}
                onPress={() => handleAttendance('CANT_ATTEND')}
                activeOpacity={0.75}
              >
                <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
                <Text style={[styles.attBigBtnText, { color: '#EF4444' }]}>No puedo ir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Attendance – confirmed/cant: compact row ── */}
        {isParticipant && myAttendance !== 'PENDING' && matchStatus !== 'FINALIZADO' && (
          <View style={styles.attStatusRow}>
            <View style={[styles.attDotSmall, { backgroundColor: aColors[myAttendance] }]} />
            <Text style={[styles.attStatusText, { color: aColors[myAttendance] }]}>
              {myAttendance === 'CONFIRMED' ? 'Confirmado' : 'No puedo asistir'}
            </Text>
            <TouchableOpacity
              style={styles.attChangeBtn}
              onPress={() => handleAttendance('PENDING')}
            >
              <Text style={styles.attChangeBtnText}>Cambiar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Messages ── */}
        {messages.length === 0 ? (
          <View style={styles.emptyMsg}>
            <Ionicons name="chatbubbles-outline" size={44} color={colors.textMuted} />
            <Text style={styles.emptyMsgText}>Sé el primero en escribir algo</Text>
          </View>
        ) : (
          <FlatList
            ref={flatRef}
            style={styles.messagesArea}
            contentContainerStyle={styles.messagesContent}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            inverted
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}

        {/* ── Post-match card (FINALIZADO) ── */}
        {matchStatus === 'FINALIZADO' && isParticipant && (
          <View style={styles.postMatchCard}>
            <View style={styles.postMatchTitleRow}>
              <Ionicons name="trophy-outline" size={20} color={colors.primary} />
              <Text style={styles.postMatchTitle}>¿Cómo fue el partido?</Text>
            </View>
            <Text style={styles.postMatchSub}>El partido ha finalizado. ¿Qué quieres hacer?</Text>
            <TouchableOpacity
              style={styles.postMatchPrimaryBtn}
              onPress={() => router.push(`/match/${id}`)}
              activeOpacity={0.8}
            >
              <Ionicons name="trophy-outline" size={16} color="#fff" />
              <Text style={styles.postMatchPrimaryBtnText}>Registrar resultado</Text>
            </TouchableOpacity>
            <View style={styles.postMatchSecondaryRow}>
              <TouchableOpacity
                style={[
                  styles.postMatchSecondaryBtn,
                  rated && { borderColor: colors.success + '40', backgroundColor: colors.success + '10' },
                ]}
                onPress={() => !rated && setShowRatingModal(true)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={rated ? 'checkmark-circle-outline' : 'star-outline'}
                  size={14}
                  color={rated ? colors.success : colors.textSecondary}
                />
                <Text style={[styles.postMatchSecondaryBtnText, rated && { color: colors.success }]}>
                  {rated ? 'Calificado ✓' : 'Calificar'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.postMatchSecondaryBtn}
                onPress={() => Alert.alert('Pedir revancha', 'Esta función estará disponible próximamente.')}
                activeOpacity={0.75}
              >
                <Ionicons name="refresh-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.postMatchSecondaryBtnText}>Revancha</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Quick actions (hidden when FINALIZADO) ── */}
        {isParticipant && matchStatus !== 'FINALIZADO' && (
          <View style={styles.quickBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickContent}
              keyboardShouldPersistTaps="always"
            >
              {QUICK_ACTIONS.map(qa => (
                <TouchableOpacity
                  key={qa.id}
                  style={styles.quickBtn}
                  onPress={() => sendMessage(qa.message, 'QUICK_ACTION')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickBtnText}>{qa.label}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.quickBtn, styles.quickBtnLocation]}
                onPress={handleShareLocation}
                activeOpacity={0.7}
              >
                <Text style={[styles.quickBtnText, styles.quickBtnLocationText]}>📍 Ubicación</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* ── Input ── */}
        {isParticipant ? (
          <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                placeholder="Escribe un mensaje..."
                placeholderTextColor={colors.textMuted}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
              />
            </View>
            <TouchableOpacity
              style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnOff]}
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim() || sending}
              activeOpacity={0.8}
            >
              <Ionicons
                name="send"
                size={17}
                color={inputText.trim() && !sending ? '#fff' : colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        ) : match && (
          <View style={[styles.joinPrompt, { marginBottom: Math.max(insets.bottom, 14) }]}>
            <Text style={styles.joinPromptText}>
              Únete al partido para participar en el chat
            </Text>
          </View>
        )}

      </KeyboardAvoidingView>

      <InvitePlayersSheet
        visible={showInviteSheet}
        invitedIds={invitedIds}
        onInvite={playerId => setInvitedIds(prev => new Set([...prev, playerId]))}
        onClose={() => setShowInviteSheet(false)}
        matchLevel={match?.level}
        spotsLeft={match?.spotsLeft}
      />

      {match && user && (
        <PlayerRatingModal
          visible={showRatingModal}
          matchId={match.id}
          players={(match.participants ?? []).filter(p => p.id !== user.id)}
          reviewerId={user.id}
          onClose={() => setShowRatingModal(false)}
          onDone={() => { setRated(true); setShowRatingModal(false); }}
        />
      )}
    </SafeAreaView>
  );
}
