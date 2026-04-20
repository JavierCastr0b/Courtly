import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Match } from '../types';
import { colors, levelColor } from '../theme/colors';
import { Avatar } from './Avatar';
import { Tag } from './Tag';
import { Button } from './Button';

interface MatchCardProps {
  match: Match;
  onJoin?: (match: Match) => void;
  compact?: boolean;
}

export function MatchCard({ match, onJoin, compact = false }: MatchCardProps) {
  const spotsRatio = match.spotsLeft / match.totalSpots;
  const urgency = match.spotsLeft === 1;

  if (compact) {
    return (
      <TouchableOpacity activeOpacity={0.8} style={styles.compactCard}>
        <View style={styles.compactHeader}>
          <Text style={styles.compactCourt} numberOfLines={1}>{match.court.name}</Text>
          <Tag label={match.level} variant="level" level={match.level} />
        </View>
        <View style={styles.compactMeta}>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.metaText}>{match.date} · {match.time}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="people-outline" size={13} color={urgency ? colors.ctaHighlight : colors.textSecondary} />
            <Text style={[styles.metaText, urgency && styles.urgentText]}>
              {match.spotsLeft} {match.spotsLeft === 1 ? 'lugar' : 'lugares'}
            </Text>
          </View>
        </View>
        <Button
          label="Unirme"
          variant="primary"
          size="sm"
          fullWidth
          onPress={() => onJoin?.(match)}
          style={{ marginTop: 10 }}
        />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar name={match.organizer.name} size={40} />
        <View style={styles.headerInfo}>
          <Text style={styles.organizerName}>{match.organizer.name}</Text>
          <Text style={styles.courtName} numberOfLines={1}>{match.court.name}</Text>
        </View>
        <Tag label={match.level} variant="level" level={match.level} />
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={15} color={colors.textSecondary} />
          <Text style={styles.detailText}>{match.date} · {match.time}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="location-outline" size={15} color={colors.textSecondary} />
          <Text style={styles.detailText} numberOfLines={1}>{match.court.address}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons
            name="people-outline"
            size={15}
            color={urgency ? colors.ctaHighlight : colors.textSecondary}
          />
          <Text style={[styles.detailText, urgency && styles.urgentText]}>
            {match.spotsLeft} de {match.totalSpots} lugares disponibles
          </Text>
        </View>
      </View>

      <View style={styles.spotsBar}>
        {Array.from({ length: match.totalSpots }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.spotDot,
              i < match.totalSpots - match.spotsLeft && styles.spotFilled,
            ]}
          />
        ))}
      </View>

      <Button
        label="Unirme al partido"
        variant="primary"
        fullWidth
        onPress={() => onJoin?.(match)}
        style={{ marginTop: 14 }}
      />
    </View>
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
});
