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

// ─── Types ───────────────────────────────────────────────────────────────────

type LocalMessage = {
  id: string;
  userId: string | null;
  userName: string;
  content: string;
  type: 'TEXT' | 'SYSTEM' | 'QUICK_ACTION';
  createdAt: string;
  pending?: boolean;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { id: 'arrived',  label: 'Ya llegué',           message: '¡Ya llegué! 🙋' },
  { id: 'late',     label: '10 min tarde',         message: 'Voy 10 minutos tarde, espérenme 🕐' },
  { id: 'balls',    label: '¿Quién lleva bolas?',  message: '¿Alguien lleva bolas? 🎾' },
  { id: 'reserve',  label: '¿Quién reserva?',      message: '¿Quién va a reservar la cancha? 📋' },
  { id: 'confirm',  label: 'Confirmo asistencia',  message: '¡Confirmado, ahí estaré! ✅' },
] as const;

const ATT_LABELS: Record<AttendanceStatus, string> = {
  CONFIRMED:   'Confirmo',
  PENDING:     'Pendiente',
  CANT_ATTEND: 'No puedo',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function attColors(c: Colors): Record<AttendanceStatus, string> {
  return { CONFIRMED: c.success, PENDING: c.warning, CANT_ATTEND: '#EF4444' };
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

// ─── Styles ──────────────────────────────────────────────────────────────────

function makeStyles(c: Colors) {
  return StyleSheet.create({
    root:    { flex: 1, backgroundColor: c.background },
    flex1:   { flex: 1 },
    loader:  { flex: 1, alignItems: 'center', justifyContent: 'center' },

    // Header
    header: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 12, paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    backBtn:        { padding: 4 },
    headerInfo:     { flex: 1 },
    headerTitle:    { color: c.textPrimary, fontSize: 15, fontWeight: '700' },
    headerSub:      { color: c.textMuted, fontSize: 12, marginTop: 1 },
    headerBadge:    {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: c.secondary, borderRadius: 12,
      paddingHorizontal: 9, paddingVertical: 4,
      borderWidth: 1, borderColor: c.border,
    },
    headerBadgeText: { color: c.textSecondary, fontSize: 12, fontWeight: '600' },

    // Participants strip
    participantItem:  { alignItems: 'center', marginRight: 16 },
    participantName:  { color: c.textMuted, fontSize: 10, marginTop: 3, maxWidth: 52, textAlign: 'center' },
    attDotOuter: {
      position: 'absolute', top: 0, right: 0,
      width: 11, height: 11, borderRadius: 6,
      borderWidth: 2, borderColor: c.background,
    },
    meRing: {
      borderWidth: 2, borderColor: c.primary, borderRadius: 28, padding: 1,
    },

    // Attendance bar
    attBar: {
      flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6,
      paddingHorizontal: 14, paddingVertical: 8,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    attLabel: { color: c.textMuted, fontSize: 11 },
    attBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 10, paddingVertical: 4,
      borderRadius: 14, borderWidth: 1, borderColor: c.border,
    },
    attDotSmall: { width: 6, height: 6, borderRadius: 3 },
    attBtnText: { fontSize: 11, fontWeight: '500', color: c.textSecondary },

    // Messages
    messagesArea: { flex: 1 },
    messagesContent: { paddingHorizontal: 14, paddingVertical: 10, gap: 2 },

    // My bubble
    myRow:    { alignItems: 'flex-end', marginBottom: 1 },
    myBubble: {
      backgroundColor: c.primary, borderRadius: 18, borderBottomRightRadius: 4,
      paddingHorizontal: 13, paddingVertical: 9, maxWidth: '74%',
    },
    myText:   { color: '#fff', fontSize: 14, lineHeight: 20 },
    myTime:   { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 3, textAlign: 'right' },

    // Other bubble
    otherRow:    { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginBottom: 1 },
    otherBubble: {
      backgroundColor: c.cardBg, borderRadius: 18, borderBottomLeftRadius: 4,
      paddingHorizontal: 13, paddingVertical: 9, maxWidth: '74%',
      borderWidth: 1, borderColor: c.border,
    },
    otherName:   { color: c.accent, fontSize: 11, fontWeight: '700', marginBottom: 2 },
    otherText:   { color: c.textPrimary, fontSize: 14, lineHeight: 20 },
    otherTime:   { color: c.textMuted, fontSize: 10, marginTop: 3 },

    // System message
    sysRow:  { alignItems: 'center', marginVertical: 5 },
    sysText: { color: c.textMuted, fontSize: 12, fontStyle: 'italic', textAlign: 'center' },

    // Quick actions
    quickBar:     { borderTopWidth: 1, borderTopColor: c.border, paddingVertical: 7 },
    quickContent: { paddingHorizontal: 14, gap: 7 },
    quickBtn: {
      paddingHorizontal: 12, paddingVertical: 7,
      borderRadius: 18, borderWidth: 1, borderColor: c.border,
      backgroundColor: c.secondary,
    },
    quickBtnText: { color: c.textSecondary, fontSize: 12, fontWeight: '500' },
    quickBtnLocation: { borderColor: c.accent + '50', backgroundColor: c.accent + '0D' },
    quickBtnLocationText: { color: c.accent },

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
    input:       { color: c.textPrimary, fontSize: 14, minHeight: 20 },
    sendBtn:     { width: 42, height: 42, borderRadius: 21, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },
    sendBtnOff:  { backgroundColor: c.secondary },

    // Join prompt
    joinPrompt: {
      margin: 14, padding: 12, borderRadius: 12,
      backgroundColor: c.secondary, borderWidth: 1, borderColor: c.border,
      alignItems: 'center',
    },
    joinPromptText: { color: c.textMuted, fontSize: 13, textAlign: 'center' },

    // Empty messages
    emptyMsg: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
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

  const [match, setMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [myAttendance, setMyAttendance] = useState<AttendanceStatus>('PENDING');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const aColors = useMemo(() => attColors(colors), [colors]);

  // ── Load data ─────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    if (!id) return;
    const [m, msgs, att] = await Promise.all([
      matchesApi.getById(id).catch(() => null),
      chatApi.getMessages(id).catch(() => []),
      chatApi.getAttendance(id).catch(() => []),
    ]);

    if (m) setMatch(m);

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

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  // ── Send message ──────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (content: string, type: LocalMessage['type'] = 'TEXT') => {
    if (!content.trim() || !user || !id) return;
    const localId = `local-${Date.now()}`;
    const msg: LocalMessage = {
      id: localId,
      userId: user.id,
      userName: user.name,
      content: content.trim(),
      type,
      createdAt: new Date().toISOString(),
      pending: true,
    };
    setMessages(prev => [msg, ...prev]);
    setInputText('');
    setSending(true);
    try {
      const sent = await chatApi.sendMessage(id, content.trim(), type);
      setMessages(prev =>
        prev.map(m => m.id === localId ? { ...msg, id: sent.id, pending: false, createdAt: sent.createdAt } : m)
      );
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
      id: `sys-att-${Date.now()}`,
      userId: null,
      userName: 'Sistema',
      content: `${user.name.split(' ')[0]} ${verb[status]}`,
      type: 'SYSTEM',
      createdAt: new Date().toISOString(),
    }, ...cur]);

    try {
      await chatApi.updateAttendance(id, status);
    } catch {
      setMyAttendance(prev);
      setAttendance(a => ({ ...a, [user.id]: prev }));
    }
  }, [id, user, myAttendance]);

  // ── Computed ──────────────────────────────────────────────────────────────

  const isParticipant = useMemo(
    () => match?.participants?.some(p => p.id === user?.id) ?? false,
    [match, user?.id]
  );

  const location = match?.court?.name ?? match?.customLocation ?? 'Partido';
  const dateLabel = match ? formatMatchDate(match.date) : '';
  const levelLabel = match ? (levelDisplay[match.level] ?? match.level) : '';
  const spotsInfo = match ? `${match.totalSpots - match.spotsLeft}/${match.totalSpots}` : '';

  // ── Render message ────────────────────────────────────────────────────────

  const renderMessage = useCallback(({ item }: { item: LocalMessage }) => {
    if (item.type === 'SYSTEM') {
      return (
        <View style={styles.sysRow}>
          <Text style={styles.sysText}>{item.content}</Text>
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
  }, [user?.id, styles]);

  // ── Loading ───────────────────────────────────────────────────────────────

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
              {dateLabel}{match?.time ? ` · ${match.time}` : ''}{levelLabel ? ` · ${levelLabel}` : ''}
            </Text>
          </View>
          <View style={styles.headerBadge}>
            <Ionicons name="people-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.headerBadgeText}>{spotsInfo}</Text>
          </View>
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

        {/* ── My attendance ── */}
        {isParticipant && (
          <View style={styles.attBar}>
            <Text style={styles.attLabel}>Mi asistencia:</Text>
            {(['CONFIRMED', 'PENDING', 'CANT_ATTEND'] as AttendanceStatus[]).map(s => {
              const active = myAttendance === s;
              return (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.attBtn,
                    active && { backgroundColor: aColors[s] + '18', borderColor: aColors[s] + '60' },
                  ]}
                  onPress={() => handleAttendance(s)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.attDotSmall, { backgroundColor: aColors[s] }]} />
                  <Text style={[styles.attBtnText, active && { color: aColors[s], fontWeight: '600' }]}>
                    {ATT_LABELS[s]}
                  </Text>
                </TouchableOpacity>
              );
            })}
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

        {/* ── Quick actions ── */}
        {isParticipant && (
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
                onPress={() => Alert.alert('Compartir ubicación', 'Esta función estará disponible próximamente.')}
                activeOpacity={0.7}
              >
                <Text style={[styles.quickBtnText, styles.quickBtnLocationText]}>
                  📍 Ubicación
                </Text>
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
    </SafeAreaView>
  );
}
