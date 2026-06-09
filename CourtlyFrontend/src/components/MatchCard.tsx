import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Match } from '../types';
import { useTheme } from '../theme/ThemeContext';
import type { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './Avatar';
import { Tag } from './Tag';
import { Button } from './Button';

interface MatchCardProps {
  match: Match;
  onJoin?: (match: Match) => void;
  compact?: boolean;
}

function getTimeRemaining(date: string, time: string): string | null {
  try {
    const t = time.length > 5 ? time.substring(0, 5) : time;
    const matchDt = new Date(`${date}T${t}:00`);
    const diffMs = matchDt.getTime() - Date.now();
    if (diffMs < 0) return null;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  } catch {
    return null;
  }
}

function formatMatchType(t: string | null): string | null {
  if (!t) return null;
  const map: Record<string, string> = {
    SINGLES: 'Singles', DOBLES: 'Dobles', DOUBLES: 'Dobles',
    INDIVIDUAL: 'Singles', PAREJAS: 'Dobles',
  };
  return map[t.toUpperCase()] ?? null;
}

function formatMatchStyle(t: string | null): string | null {
  if (!t) return null;
  const map: Record<string, string> = {
    COMPETITIVO: 'Competitivo', CHILL: 'Chill', AMISTOSO: 'Amistoso',
  };
  return map[t.toUpperCase()] ?? null;
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    card: { backgroundColor: c.cardBg, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: c.border, marginBottom: 12 },
    cardUrgent: { borderColor: c.accent + '55', backgroundColor: c.urgentBg },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
    headerInfo: { flex: 1 },
    organizerName: { color: c.textPrimary, fontWeight: '700', fontSize: 14 },
    courtName: { color: c.textSecondary, fontSize: 12, marginTop: 2 },
    badgesRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
    typeBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20,
      backgroundColor: c.primary + '18', borderWidth: 1, borderColor: c.primary + '40',
    },
    typeBadgeAccent: { backgroundColor: c.accent + '18', borderColor: c.accent + '40' },
    typeBadgeGreen: { backgroundColor: c.success + '18', borderColor: c.success + '40' },
    typeBadgeText: { color: c.primary, fontSize: 11, fontWeight: '600' },
    details: { gap: 8, marginBottom: 14 },
    detailItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    detailText: { color: c.textSecondary, fontSize: 13, flex: 1 },
    urgentText: { color: c.accent, fontWeight: '700' },
    timeRemainPill: { backgroundColor: c.primary + '20', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
    timeRemainText: { color: c.primary, fontSize: 11, fontWeight: '600' },
    participantsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    emptySlot: {
      width: 26, height: 26, borderRadius: 13,
      backgroundColor: c.secondary, borderWidth: 1.5, borderColor: c.border,
      alignItems: 'center', justifyContent: 'center', marginLeft: -8,
    },
    emptySlotText: { color: c.textMuted, fontSize: 9, fontWeight: '700' },
    participantLabel: { color: c.textMuted, fontSize: 11, marginLeft: 10, fontWeight: '500' },
    spotsBar: { flexDirection: 'row', gap: 5, marginBottom: 2 },
    spotDot: { height: 5, flex: 1, borderRadius: 3, backgroundColor: c.border },
    spotFilled: { backgroundColor: c.primary },
    spotFilledUrgent: { backgroundColor: c.accent },
    joinError: { color: c.accent, fontSize: 11, marginTop: 6, textAlign: 'center' },
    compactCard: { backgroundColor: c.cardBg, borderRadius: 16, padding: 14, width: 192, borderWidth: 1, borderColor: c.border, marginRight: 12 },
    compactCardUrgent: { borderColor: c.accent + '65', backgroundColor: c.urgentBg },
    urgencyBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: c.accent + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 10,
    },
    urgencyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent },
    urgencyBannerText: { color: c.accent, fontSize: 11, fontWeight: '700' },
    compactHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 6 },
    compactCourt: { color: c.textPrimary, fontWeight: '700', fontSize: 13, flex: 1 },
    compactMeta: { gap: 5, marginBottom: 10 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    metaText: { color: c.textSecondary, fontSize: 12 },
    timeLeftPill: { backgroundColor: c.primary + '22', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 },
    timeLeftText: { color: c.primary, fontSize: 10, fontWeight: '600' },
    miniAvatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    miniAvatar: {
      width: 22, height: 22, borderRadius: 11,
      backgroundColor: c.primary + '50', alignItems: 'center', justifyContent: 'center',
      borderWidth: 1.5, borderColor: c.cardBg,
    },
    miniAvatarOverlap: { marginLeft: -7 },
    miniAvatarEmpty: { backgroundColor: c.border },
    miniAvatarText: { color: '#fff', fontSize: 9, fontWeight: '700' },
    compactSpotsBar: { flexDirection: 'row', gap: 4, marginBottom: 2 },
    compactSpotSlice: { height: 4, flex: 1, borderRadius: 2, backgroundColor: c.border },
    compactSpotFilled: { backgroundColor: c.primary },
    compactSpotUrgentFilled: { backgroundColor: c.accent },
  });
}

export function MatchCard({ match, onJoin, compact = false }: MatchCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const { user: me } = useAuth();
  const [joinError, setJoinError] = React.useState<string | null>(null);
  const [joining, setJoining] = React.useState(false);

  if (!match) return null;

  const spotsLeft = match.spotsLeft ?? 0;
  const isFull = spotsLeft === 0;
  const urgency = spotsLeft === 1;
  const isOrganizer = match.organizer?.id === me?.id;
  const isParticipant = match.participants?.some(p => p.id === me?.id) ?? false;
  const canJoin = !isOrganizer && !isParticipant && !isFull;
  const timeLeft = getTimeRemaining(match.date, match.time);
  const matchFormat = formatMatchType(match.matchType);
  const matchStyle = formatMatchStyle(match.sportType);
  const filledSpots = (match.totalSpots ?? 0) - spotsLeft;

  const handleJoin = async () => {
    if (!canJoin || !onJoin) return;
    setJoinError(null);
    setJoining(true);
    try {
      await onJoin(match);
    } catch (e: any) {
      setJoinError(e.message);
      setTimeout(() => setJoinError(null), 4000);
    } finally {
      setJoining(false);
    }
  };

  if (compact) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.compactCard, urgency && styles.compactCardUrgent]}
        onPress={() => router.push(`/match/${match.id}`)}
      >
        {urgency && (
          <View style={styles.urgencyBanner}>
            <View style={styles.urgencyDot} />
            <Text style={styles.urgencyBannerText}>¡Último cupo!</Text>
          </View>
        )}
        <View style={styles.compactHeader}>
          <Text style={styles.compactCourt} numberOfLines={1}>
            {match.court?.name ?? match.customLocation ?? '—'}
          </Text>
          <Tag label={match.level} variant="level" level={match.level} />
        </View>
        <View style={styles.compactMeta}>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.metaText}>{match.time}</Text>
            {timeLeft && (
              <View style={styles.timeLeftPill}>
                <Text style={styles.timeLeftText}>en {timeLeft}</Text>
              </View>
            )}
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="people-outline" size={12} color={urgency ? colors.accent : colors.textSecondary} />
            <Text style={[styles.metaText, urgency && styles.urgentText]}>
              {urgency ? 'Falta 1 jugador' : `${spotsLeft} lugar${spotsLeft !== 1 ? 'es' : ''}`}
            </Text>
          </View>
          {matchFormat && (
            <View style={styles.metaRow}>
              <Ionicons name="tennisball-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.metaText}>{matchFormat}</Text>
              {matchStyle && <Text style={styles.metaText}>· {matchStyle}</Text>}
            </View>
          )}
        </View>
        {(match.participants?.length ?? 0) > 0 && (
          <View style={styles.miniAvatarRow}>
            {match.participants!.slice(0, 3).map((p, i) => (
              <View key={p.id} style={[styles.miniAvatar, i > 0 && styles.miniAvatarOverlap]}>
                <Text style={styles.miniAvatarText}>{p.name.charAt(0).toUpperCase()}</Text>
              </View>
            ))}
            {Array.from({ length: Math.min(spotsLeft, 2) }).map((_, i) => (
              <View key={`e-${i}`} style={[styles.miniAvatar, styles.miniAvatarEmpty, styles.miniAvatarOverlap]} />
            ))}
          </View>
        )}
        <View style={styles.compactSpotsBar}>
          {Array.from({ length: match.totalSpots ?? 4 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.compactSpotSlice,
                i < filledSpots && styles.compactSpotFilled,
                i < filledSpots && urgency && styles.compactSpotUrgentFilled,
              ]}
            />
          ))}
        </View>
        <Button
          label={match.resultRecorded ? 'Terminado' : isFull ? 'Completo' : !canJoin ? 'Inscrito ✓' : 'Unirme →'}
          variant={canJoin && !match.resultRecorded ? 'primary' : 'secondary'}
          size="sm" fullWidth
          disabled={!canJoin || match.resultRecorded}
          loading={joining} onPress={handleJoin}
          style={{ marginTop: 10 }}
        />
        {!!joinError && <Text style={styles.joinError}>{joinError}</Text>}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[styles.card, urgency && styles.cardUrgent]}
      onPress={() => router.push(`/match/${match.id}`)}
    >
      <View style={styles.header}>
        <Avatar name={match.organizer.name} size={40} />
        <View style={styles.headerInfo}>
          <Text style={styles.organizerName}>{match.organizer.name}</Text>
          <Text style={styles.courtName} numberOfLines={1}>
            {match.court?.name ?? match.customLocation ?? '—'}
          </Text>
        </View>
        <Tag label={match.level} variant="level" level={match.level} />
      </View>

      {(matchFormat || matchStyle) && (
        <View style={styles.badgesRow}>
          {matchFormat && (
            <View style={styles.typeBadge}>
              <Ionicons name="tennisball-outline" size={11} color={colors.primary} />
              <Text style={styles.typeBadgeText}>{matchFormat}</Text>
            </View>
          )}
          {matchStyle && (
            <View style={[
              styles.typeBadge,
              matchStyle === 'Competitivo' ? styles.typeBadgeAccent : styles.typeBadgeGreen,
            ]}>
              <Text style={[
                styles.typeBadgeText,
                { color: matchStyle === 'Competitivo' ? colors.accent : colors.success },
              ]}>
                {matchStyle}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={15} color={colors.textSecondary} />
          <Text style={styles.detailText}>{match.date} · {match.time}</Text>
          {timeLeft && (
            <View style={styles.timeRemainPill}>
              <Text style={styles.timeRemainText}>en {timeLeft}</Text>
            </View>
          )}
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="location-outline" size={15} color={colors.textSecondary} />
          <Text style={styles.detailText} numberOfLines={1}>
            {match.court?.address ?? match.customLocation ?? '—'}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="people-outline" size={15} color={urgency ? colors.accent : colors.textSecondary} />
          <Text style={[styles.detailText, urgency && styles.urgentText]}>
            {urgency ? '¡Falta solo 1 jugador!' : `${spotsLeft} de ${match.totalSpots ?? 0} lugares disponibles`}
          </Text>
        </View>
      </View>

      {(match.participants?.length ?? 0) > 0 && (
        <View style={styles.participantsRow}>
          {match.participants!.slice(0, 4).map((p, i) => (
            <Avatar key={p.id} name={p.name} size={26} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: 10 - i }} />
          ))}
          {spotsLeft > 0 && (
            <View style={styles.emptySlot}>
              <Text style={styles.emptySlotText}>+{spotsLeft}</Text>
            </View>
          )}
          <Text style={styles.participantLabel}>{filledSpots} de {match.totalSpots ?? 0} inscritos</Text>
        </View>
      )}

      <View style={styles.spotsBar}>
        {Array.from({ length: match.totalSpots ?? 0 }).map((_, i) => (
          <View key={i} style={[styles.spotDot, i < filledSpots && (urgency ? styles.spotFilledUrgent : styles.spotFilled)]} />
        ))}
      </View>

      <Button
        label={match.resultRecorded ? 'Partido terminado' : isFull ? 'Partido completo' : !canJoin ? 'Ya estás inscrito ✓' : 'Unirme al partido →'}
        variant={canJoin && !match.resultRecorded ? 'primary' : 'secondary'}
        fullWidth disabled={!canJoin || match.resultRecorded}
        loading={joining} onPress={handleJoin}
        style={{ marginTop: 14 }}
      />
      {!!joinError && <Text style={styles.joinError}>{joinError}</Text>}
    </TouchableOpacity>
  );
}
