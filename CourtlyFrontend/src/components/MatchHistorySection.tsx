import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import type { Colors } from '../theme/colors';
import { levelDisplay } from '../theme/colors';
import type { Match } from '../types';
import { hasRatedMatch } from '../utils/ratingUtils';
import {
  getMatchResult, getOpponentLabel, computeHistorySummary,
  filterMatches, fmtRelativeDate,
  type HistoryFilter, type HistorySummary,
} from '../utils/matchHistoryUtils';

// ─── Constants ────────────────────────────────────────────────────────────────

const FILTERS: { key: HistoryFilter; label: string }[] = [
  { key: 'ALL',     label: 'Todos' },
  { key: 'WIN',     label: 'Victorias' },
  { key: 'LOSS',    label: 'Derrotas' },
  { key: 'LAST_30', label: 'Últ. 30 días' },
  { key: 'DOBLES',  label: 'Dobles' },
  { key: 'SINGLES', label: 'Singles' },
];

const SHOWN_INITIAL = 5;

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(c: Colors) {
  return StyleSheet.create({
    section: { marginHorizontal: 20, marginBottom: 20 },
    secHeader: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', marginBottom: 12,
    },
    secTitle: { color: c.textPrimary, fontSize: 15, fontWeight: '700' },
    secCount: { color: c.textMuted, fontSize: 13 },

    // Summary
    summaryCard: {
      backgroundColor: c.cardBg, borderRadius: 16,
      borderWidth: 1, borderColor: c.border,
      padding: 16, marginBottom: 12,
    },
    summaryRow: { flexDirection: 'row', marginBottom: 14 },
    summaryCell: { flex: 1, alignItems: 'center', gap: 4 },
    summaryDiv: { width: 1, backgroundColor: c.border, marginVertical: 2 },
    summaryVal: { color: c.textPrimary, fontSize: 20, fontWeight: '800' },
    summaryLbl: {
      color: c.textMuted, fontSize: 10, fontWeight: '700',
      textTransform: 'uppercase', letterSpacing: 0.7,
    },
    streakRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    streakLabel: { color: c.textMuted, fontSize: 12, fontWeight: '600' },
    streakDots: { flexDirection: 'row', gap: 5 },
    streakDot: {
      width: 26, height: 26, borderRadius: 7,
      alignItems: 'center', justifyContent: 'center',
    },
    streakDotTxt: { fontSize: 11, fontWeight: '800' },

    // Filters
    filterScroll: { marginBottom: 10 },
    filterRow: { flexDirection: 'row', gap: 7 },
    chip: {
      paddingHorizontal: 14, paddingVertical: 7,
      borderRadius: 20, borderWidth: 1,
      backgroundColor: c.cardBg, borderColor: c.border,
    },
    chipActive: { backgroundColor: c.primary + '18', borderColor: c.primary },
    chipTxt: { fontSize: 12, fontWeight: '600', color: c.textMuted },
    chipTxtActive: { color: c.primary },

    // Match card
    matchCard: {
      backgroundColor: c.cardBg, borderRadius: 14,
      borderWidth: 1, borderColor: c.border,
      padding: 14, marginBottom: 8,
      flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    resBadge: {
      width: 42, height: 42, borderRadius: 11,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    resTxt: { fontSize: 14, fontWeight: '800' },
    body: { flex: 1, gap: 2 },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    resultLabel: { fontSize: 13, fontWeight: '800' },
    scoreText: { fontSize: 14, fontWeight: '700', color: c.textPrimary },
    metaLine: { color: c.textMuted, fontSize: 12 },
    oppLine: { color: c.textSecondary, fontSize: 12 },
    bottomRow: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', marginTop: 1,
    },
    dateText: { color: c.textMuted, fontSize: 11 },
    ratedChip: {
      flexDirection: 'row', alignItems: 'center', gap: 3,
      paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6,
      backgroundColor: '#FFB80012', borderWidth: 1, borderColor: '#FFB80040',
    },
    ratedChipTxt: { fontSize: 10, fontWeight: '600', color: '#FFB800' },

    // Ver más / Ver menos
    moreBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      paddingVertical: 12, borderRadius: 12,
      borderWidth: 1, borderColor: c.border, backgroundColor: c.cardBg, marginTop: 4,
    },
    moreBtnTxt: { color: c.textSecondary, fontSize: 13, fontWeight: '600' },

    // Empty
    emptyCard: {
      backgroundColor: c.cardBg, borderRadius: 14,
      borderWidth: 1, borderColor: c.border,
      alignItems: 'center', paddingVertical: 36, paddingHorizontal: 20, gap: 10,
    },
    emptyTitle: { color: c.textPrimary, fontSize: 16, fontWeight: '700', textAlign: 'center' },
    emptySub: { color: c.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 19 },
    emptyBtn: {
      marginTop: 4, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10,
      backgroundColor: c.primary + '15', borderWidth: 1, borderColor: c.primary + '40',
    },
    emptyBtnTxt: { color: c.primary, fontSize: 13, fontWeight: '700' },

    // Loading skeleton
    skeletonSummary: { height: 90, borderRadius: 16, backgroundColor: c.border + '55', marginBottom: 12 },
    skeletonCard:    { height: 76, borderRadius: 14, backgroundColor: c.border + '55', marginBottom: 8 },
  });
}

// ─── SummaryBlock ─────────────────────────────────────────────────────────────

function SummaryBlock({ summary, styles, colors }: {
  summary: HistorySummary;
  styles: ReturnType<typeof makeStyles>;
  colors: Colors;
}) {
  if (summary.total === 0) return null;
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryVal}>{summary.total}</Text>
          <Text style={styles.summaryLbl}>Jugados</Text>
        </View>
        <View style={styles.summaryDiv} />
        <View style={styles.summaryCell}>
          <Text style={[styles.summaryVal, { color: colors.success }]}>{summary.wins}</Text>
          <Text style={styles.summaryLbl}>Victorias</Text>
        </View>
        <View style={styles.summaryDiv} />
        <View style={styles.summaryCell}>
          <Text style={[styles.summaryVal, { color: '#EF4444' }]}>{summary.losses}</Text>
          <Text style={styles.summaryLbl}>Derrotas</Text>
        </View>
        <View style={styles.summaryDiv} />
        <View style={styles.summaryCell}>
          <Text style={[styles.summaryVal, { color: colors.primary }]}>{summary.winRate}%</Text>
          <Text style={styles.summaryLbl}>Win Rate</Text>
        </View>
      </View>

      {summary.streak.length > 0 && (
        <View style={styles.streakRow}>
          <Text style={styles.streakLabel}>Racha</Text>
          <View style={styles.streakDots}>
            {summary.streak.map((r, i) => {
              const bg = r === 'W' ? colors.success + '28'
                       : r === 'L' ? '#EF444428'
                       : colors.border + '80';
              const tc = r === 'W' ? colors.success
                       : r === 'L' ? '#EF4444'
                       : colors.textMuted;
              return (
                <View key={i} style={[styles.streakDot, { backgroundColor: bg }]}>
                  <Text style={[styles.streakDotTxt, { color: tc }]}>{r ?? '—'}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── MatchCard ────────────────────────────────────────────────────────────────

function MatchCard({ match, userId, isOwn, styles, colors, onPress }: {
  match: Match; userId: string; isOwn: boolean;
  styles: ReturnType<typeof makeStyles>; colors: Colors;
  onPress: () => void;
}) {
  const result  = getMatchResult(match, userId);
  const isWin   = result === 'W';
  const isLoss  = result === 'L';

  const badgeBg  = isWin ? colors.success + '22' : isLoss ? '#EF444422' : colors.border + '80';
  const badgeTxt = isWin ? colors.success         : isLoss ? '#EF4444'   : colors.textMuted;
  const labelCol = isWin ? colors.success         : isLoss ? '#EF4444'   : colors.textMuted;
  const labelStr = isWin ? 'Victoria'             : isLoss ? 'Derrota'   : '—';

  const courtName  = match.court?.name ?? match.customLocation ?? 'Cancha';
  const levelLbl   = levelDisplay[match.level] ?? String(match.level);
  const scoreStr   = match.score ? match.score.trim().replace(/ /g, ' / ') : null;
  const oppLabel   = getOpponentLabel(match, userId);
  const rated      = isOwn && hasRatedMatch(match.id, userId);

  return (
    <TouchableOpacity style={styles.matchCard} activeOpacity={0.75} onPress={onPress}>
      <View style={[styles.resBadge, { backgroundColor: badgeBg }]}>
        <Text style={[styles.resTxt, { color: badgeTxt }]}>{result ?? '—'}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={[styles.resultLabel, { color: labelCol }]}>{labelStr}</Text>
          {scoreStr ? <Text style={styles.scoreText}>{scoreStr}</Text> : null}
        </View>
        <Text style={styles.metaLine} numberOfLines={1}>{courtName} · {levelLbl}</Text>
        <Text style={styles.oppLine} numberOfLines={1}>{oppLabel}</Text>
        <View style={styles.bottomRow}>
          <Text style={styles.dateText}>{fmtRelativeDate(match.date)}</Text>
          {rated && (
            <View style={styles.ratedChip}>
              <Ionicons name="star" size={9} color="#FFB800" />
              <Text style={styles.ratedChipTxt}>Calificado</Text>
            </View>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export interface MatchHistorySectionProps {
  allMatches: Match[];
  userId: string;
  isOwn?: boolean;
  loading?: boolean;
}

export function MatchHistorySection({
  allMatches, userId, isOwn = false, loading = false,
}: MatchHistorySectionProps) {
  const { colors } = useTheme();
  const router     = useRouter();
  const styles     = useMemo(() => makeStyles(colors), [colors]);

  const [activeFilter, setActiveFilter] = useState<HistoryFilter>('ALL');
  const [showAll,      setShowAll]      = useState(false);

  const summary  = useMemo(() => computeHistorySummary(allMatches, userId), [allMatches, userId]);
  const filtered = useMemo(
    () => filterMatches(allMatches, userId, activeFilter),
    [allMatches, userId, activeFilter],
  );
  const shown     = showAll ? filtered : filtered.slice(0, SHOWN_INITIAL);
  const remaining = filtered.length - SHOWN_INITIAL;

  const handleFilter = (f: HistoryFilter) => {
    setActiveFilter(f);
    setShowAll(false);
  };

  return (
    <View style={styles.section}>
      <View style={styles.secHeader}>
        <Text style={styles.secTitle}>Historial de partidos</Text>
        {summary.total > 0 && <Text style={styles.secCount}>{summary.total} partidos</Text>}
      </View>

      {/* Loading skeleton */}
      {loading && (
        <>
          <View style={styles.skeletonSummary} />
          {[1, 2, 3].map(i => <View key={i} style={styles.skeletonCard} />)}
        </>
      )}

      {!loading && (
        <>
          {/* Summary stats */}
          <SummaryBlock summary={summary} styles={styles} colors={colors} />

          {/* Filters (only if there's something to filter) */}
          {summary.total > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterRow}
            >
              {FILTERS.map(f => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.chip, activeFilter === f.key && styles.chipActive]}
                  onPress={() => handleFilter(f.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipTxt, activeFilter === f.key && styles.chipTxtActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Empty: no completed matches at all */}
          {summary.total === 0 && (
            <View style={styles.emptyCard}>
              <Ionicons name="trophy-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>
                {isOwn ? 'Aún no tienes partidos registrados' : 'Sin partidos completados'}
              </Text>
              <Text style={styles.emptySub}>
                {isOwn
                  ? 'Juega tu primer partido y empieza a construir tu historial.'
                  : 'Este jugador aún no tiene partidos completados.'}
              </Text>
              {isOwn && (
                <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(tabs)')}>
                  <Text style={styles.emptyBtnTxt}>Buscar partido</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* No results for active filter */}
          {summary.total > 0 && filtered.length === 0 && (
            <View style={[styles.emptyCard, { paddingVertical: 24 }]}>
              <Ionicons name="search-outline" size={28} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                No hay partidos con este filtro.
              </Text>
            </View>
          )}

          {/* Cards */}
          {shown.map(m => (
            <MatchCard
              key={m.id}
              match={m}
              userId={userId}
              isOwn={isOwn}
              styles={styles}
              colors={colors}
              onPress={() => router.push(`/match/${m.id}`)}
            />
          ))}

          {/* Expand */}
          {!showAll && remaining > 0 && (
            <TouchableOpacity style={styles.moreBtn} onPress={() => setShowAll(true)} activeOpacity={0.75}>
              <Text style={styles.moreBtnTxt}>
                Ver {remaining} partido{remaining !== 1 ? 's' : ''} más
              </Text>
              <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          )}

          {/* Collapse */}
          {showAll && filtered.length > SHOWN_INITIAL && (
            <TouchableOpacity style={styles.moreBtn} onPress={() => setShowAll(false)} activeOpacity={0.75}>
              <Text style={styles.moreBtnTxt}>Ver menos</Text>
              <Ionicons name="chevron-up" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}
