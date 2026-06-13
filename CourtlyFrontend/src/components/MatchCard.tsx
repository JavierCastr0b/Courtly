import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Match } from '../types';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './Avatar';
import { Tag } from './Tag';
import { Button } from './Button';

interface MatchCardProps {
  match: Match;
  onJoin?: (match: Match) => void;
  compact?: boolean;
}

export function MatchCard({ match, onJoin, compact = false }: MatchCardProps) {
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
  const matchLevels = match.levels?.length > 0 ? match.levels : [match.level];
  const isLibre = matchLevels.length >= 5;

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
      <TouchableOpacity activeOpacity={0.8} style={styles.compactCard} onPress={() => router.push(`/match/${match.id}`)}>
        <View style={styles.compactHeader}>
          <Text style={styles.compactCourt} numberOfLines={1}>{match.court?.name ?? match.customLocation ?? '—'}</Text>
          {isLibre
            ? <Tag label="LIBRE" variant="level" />
            : <Tag label={matchLevels[0]} variant="level" level={matchLevels[0]} />}
        </View>
        <View style={styles.compactMeta}>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.metaText}>{match.date} · {match.time}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="people-outline" size={13} color={urgency ? colors.ctaHighlight : colors.textSecondary} />
            <Text style={[styles.metaText, urgency && styles.urgentText]}>
              {spotsLeft} {spotsLeft === 1 ? 'lugar' : 'lugares'}
            </Text>
          </View>
        </View>
        <Button
          label={match.resultRecorded ? 'Terminado' : isFull ? 'Completo' : !canJoin ? 'Inscrito' : 'Unirme'}
          variant={canJoin && !match.resultRecorded ? 'primary' : 'secondary'}
          size="sm"
          fullWidth
          disabled={!canJoin || match.resultRecorded}
          loading={joining}
          onPress={handleJoin}
          style={{ marginTop: 10 }}
        />
        {!!joinError && (
          <Text style={styles.joinError} numberOfLines={2}>{joinError}</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={() => router.push(`/match/${match.id}`)}>
      <View style={styles.header}>
        <Avatar name={match.organizer.name} size={40} />
        <View style={styles.headerInfo}>
          <Text style={styles.organizerName}>{match.organizer.name}</Text>
          <Text style={styles.courtName} numberOfLines={1}>{match.court?.name ?? match.customLocation ?? '—'}</Text>
        </View>
        {isLibre ? (
          <Tag label="LIBRE" variant="level" />
        ) : (
          <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 130 }}>
            {matchLevels.map(l => <Tag key={l} label={l} variant="level" level={l} />)}
          </View>
        )}
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={15} color={colors.textSecondary} />
          <Text style={styles.detailText}>{match.date} · {match.time}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="location-outline" size={15} color={colors.textSecondary} />
          <Text style={styles.detailText} numberOfLines={1}>{match.court?.address ?? match.customLocation ?? '—'}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons
            name="people-outline"
            size={15}
            color={urgency ? colors.ctaHighlight : colors.textSecondary}
          />
          <Text style={[styles.detailText, urgency && styles.urgentText]}>
            {spotsLeft} de {match.totalSpots ?? 0} lugares disponibles
          </Text>
        </View>
      </View>

      <View style={styles.spotsBar}>
        {Array.from({ length: match.totalSpots ?? 0 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.spotDot,
              i < (match.totalSpots ?? 0) - spotsLeft && styles.spotFilled,
            ]}
          />
        ))}
      </View>

      <Button
        label={match.resultRecorded ? 'Partido terminado' : isFull ? 'Partido completo' : !canJoin ? 'Ya estás inscrito' : 'Unirme al partido'}
        variant={canJoin && !match.resultRecorded ? 'primary' : 'secondary'}
        fullWidth
        disabled={!canJoin || match.resultRecorded}
        loading={joining}
        onPress={handleJoin}
        style={{ marginTop: 14 }}
      />
      {!!joinError && (
        <Text style={styles.joinError} numberOfLines={2}>{joinError}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  headerInfo: {
    flex: 1,
  },
  organizerName: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  courtName: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  details: {
    gap: 7,
    marginBottom: 14,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  detailText: {
    color: colors.textSecondary,
    fontSize: 13,
    flex: 1,
  },
  urgentText: {
    color: colors.ctaHighlight,
    fontWeight: '600',
  },
  spotsBar: {
    flexDirection: 'row',
    gap: 6,
  },
  spotDot: {
    height: 6,
    flex: 1,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  spotFilled: {
    backgroundColor: colors.primary,
  },
  // Compact styles
  compactCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    padding: 14,
    width: 180,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 12,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 6,
  },
  compactCourt: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 13,
    flex: 1,
  },
  compactMeta: {
    gap: 5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  joinError: {
    color: colors.ctaHighlight,
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },
});
