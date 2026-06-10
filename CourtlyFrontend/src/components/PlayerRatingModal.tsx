import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, Modal, ScrollView, TouchableOpacity,
  TextInput, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import type { Colors } from '../theme/colors';
import { levelDisplay } from '../theme/colors';
import type { User } from '../types';
import { Avatar } from './Avatar';
import { Button } from './Button';
import {
  submitRatings, hasRatedMatch,
  type PlayerRating,
} from '../utils/ratingUtils';

// ─── Types ───────────────────────────────────────────────────────────────────

type RatingEntry = {
  punctuality: number;    // 0 = not set
  skillAccuracy: number;
  vibe: number;
  wouldPlayAgain: boolean | null;
  comment: string;
};

const EMPTY: RatingEntry = {
  punctuality: 0, skillAccuracy: 0, vibe: 0,
  wouldPlayAgain: null, comment: '',
};

export interface PlayerRatingModalProps {
  visible: boolean;
  matchId: string;
  players: User[];
  reviewerId: string;
  onClose: () => void;
  onDone: () => void;
}

// ─── RatingStars ─────────────────────────────────────────────────────────────

function RatingStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 5 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <TouchableOpacity
          key={s}
          onPress={() => onChange(s)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 3, right: 3 }}
        >
          <Ionicons
            name={s <= value ? 'star' : 'star-outline'}
            size={28}
            color={s <= value ? '#FFB800' : colors.border}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

function makeStyles(c: Colors) {
  return StyleSheet.create({
    overlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
    sheet:    { backgroundColor: c.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '94%' },
    handle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
    header:   { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: c.border },
    headerRow:{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    title:    { color: c.textPrimary, fontSize: 19, fontWeight: '800', flex: 1, marginRight: 8 },
    sub:      { color: c.textMuted, fontSize: 13, marginTop: 3, lineHeight: 18 },
    closeBtn: { padding: 6, backgroundColor: c.secondary, borderRadius: 10, marginTop: 2 },

    scrollContent: { paddingBottom: 20 },

    playerCard: {
      marginHorizontal: 16, marginTop: 14,
      backgroundColor: c.cardBg, borderRadius: 16,
      borderWidth: 1, borderColor: c.border, padding: 16,
    },
    playerHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    playerName:   { color: c.textPrimary, fontSize: 15, fontWeight: '700' },
    playerLevel:  { color: c.textMuted, fontSize: 12, marginTop: 2 },

    criteriaRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    criteriaLabel:{ color: c.textSecondary, fontSize: 13, fontWeight: '600' },

    wpaLabel: { color: c.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
    wpaRow:   { flexDirection: 'row', gap: 8, marginBottom: 12 },
    wpaChip:  {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      paddingVertical: 9, borderRadius: 10, borderWidth: 1.5,
      backgroundColor: c.secondary, borderColor: c.border,
    },
    wpaChipText: { fontSize: 13, fontWeight: '600', color: c.textSecondary },

    commentInput: {
      backgroundColor: c.secondary, borderRadius: 10,
      borderWidth: 1, borderColor: c.border,
      paddingHorizontal: 12, paddingVertical: 9,
      color: c.textPrimary, fontSize: 13,
      minHeight: 52, textAlignVertical: 'top',
    },

    footer:   { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.border },
    footerHint: { color: c.textMuted, fontSize: 12, textAlign: 'center', marginBottom: 8 },

    // Already rated / success
    centerBox: { alignItems: 'center', paddingHorizontal: 32, paddingVertical: 44, gap: 12 },
    iconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    centerTitle: { color: c.textPrimary, fontSize: 20, fontWeight: '800', textAlign: 'center' },
    centerSub:   { color: c.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PlayerRatingModal({
  visible, matchId, players, reviewerId, onClose, onDone,
}: PlayerRatingModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const alreadyRated = hasRatedMatch(matchId, reviewerId);
  const [submitted, setSubmitted]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ratings, setRatings]       = useState<Record<string, RatingEntry>>({});

  useEffect(() => {
    if (visible) {
      setSubmitted(false);
      setRatings(Object.fromEntries(players.map(p => [p.id, { ...EMPTY }])));
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (playerId: string, field: keyof RatingEntry, value: unknown) =>
    setRatings(prev => ({ ...prev, [playerId]: { ...prev[playerId], [field]: value } }));

  const allFilled = useMemo(
    () => players.length > 0 && players.every(p => {
      const r = ratings[p.id];
      return r && r.punctuality > 0 && r.skillAccuracy > 0 && r.vibe > 0 && r.wouldPlayAgain !== null;
    }),
    [ratings, players],
  );

  const handleSubmit = () => {
    if (!allFilled || submitting) return;
    setSubmitting(true);
    const now = new Date().toISOString();
    const toSubmit: PlayerRating[] = players.map(p => ({
      matchId,
      reviewerId,
      reviewedUserId: p.id,
      punctuality:   ratings[p.id].punctuality,
      skillAccuracy: ratings[p.id].skillAccuracy,
      vibe:          ratings[p.id].vibe,
      wouldPlayAgain: ratings[p.id].wouldPlayAgain!,
      comment:       ratings[p.id].comment || undefined,
      createdAt:     now,
    }));
    submitRatings(toSubmit);
    setSubmitting(false);
    setSubmitted(true);
  };

  const handleClose = () => { submitted ? onDone() : onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />

          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>Califica a los jugadores</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.7}>
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.sub}>Tu opinión ayuda a mejorar los partidos futuros.</Text>
          </View>

          {/* ── Already rated ── */}
          {alreadyRated && (
            <View style={styles.centerBox}>
              <View style={[styles.iconCircle, { backgroundColor: colors.success + '18' }]}>
                <Ionicons name="checkmark-circle" size={44} color={colors.success} />
              </View>
              <Text style={styles.centerTitle}>Ya calificaste este partido</Text>
              <Text style={styles.centerSub}>Tus valoraciones ya fueron enviadas. ¡Gracias!</Text>
              <Button label="Cerrar" variant="primary" size="md" onPress={handleClose} style={{ marginTop: 4, minWidth: 140 }} />
            </View>
          )}

          {/* ── Success ── */}
          {!alreadyRated && submitted && (
            <View style={styles.centerBox}>
              <View style={[styles.iconCircle, { backgroundColor: colors.success + '18' }]}>
                <Ionicons name="checkmark-circle" size={44} color={colors.success} />
              </View>
              <Text style={styles.centerTitle}>¡Gracias!</Text>
              <Text style={styles.centerSub}>
                Tu valoración ayuda a mejorar Courtly y los próximos partidos de estos jugadores.
              </Text>
              <Button label="Cerrar" variant="primary" size="md" onPress={handleClose} style={{ marginTop: 4, minWidth: 140 }} />
            </View>
          )}

          {/* ── Rating form ── */}
          {!alreadyRated && !submitted && (
            <>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
              >
                {players.length === 0 && (
                  <View style={[styles.centerBox, { paddingVertical: 30 }]}>
                    <Ionicons name="people-outline" size={40} color={colors.textMuted} />
                    <Text style={[styles.centerSub, { marginTop: 8 }]}>
                      No hay jugadores para calificar en este partido.
                    </Text>
                  </View>
                )}

                {players.map(player => {
                  const r = ratings[player.id] ?? { ...EMPTY };
                  const complete = r.punctuality > 0 && r.skillAccuracy > 0 && r.vibe > 0 && r.wouldPlayAgain !== null;
                  return (
                    <View key={player.id} style={styles.playerCard}>
                      {/* Player info */}
                      <View style={styles.playerHeader}>
                        <Avatar name={player.name} size={44} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.playerName}>{player.name}</Text>
                          <Text style={styles.playerLevel}>
                            {levelDisplay[player.level] ?? player.level}
                          </Text>
                        </View>
                        {complete && (
                          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                        )}
                      </View>

                      {/* Puntualidad */}
                      <View style={styles.criteriaRow}>
                        <Text style={styles.criteriaLabel}>Puntualidad</Text>
                        <RatingStars value={r.punctuality} onChange={v => update(player.id, 'punctuality', v)} />
                      </View>

                      {/* Nivel real */}
                      <View style={styles.criteriaRow}>
                        <Text style={styles.criteriaLabel}>Nivel real</Text>
                        <RatingStars value={r.skillAccuracy} onChange={v => update(player.id, 'skillAccuracy', v)} />
                      </View>

                      {/* Vibra */}
                      <View style={styles.criteriaRow}>
                        <Text style={styles.criteriaLabel}>Vibra / Actitud</Text>
                        <RatingStars value={r.vibe} onChange={v => update(player.id, 'vibe', v)} />
                      </View>

                      {/* ¿Volvería a jugar? */}
                      <Text style={styles.wpaLabel}>¿Jugarías de nuevo?</Text>
                      <View style={styles.wpaRow}>
                        <TouchableOpacity
                          style={[
                            styles.wpaChip,
                            r.wouldPlayAgain === true && { borderColor: colors.success + '60', backgroundColor: colors.success + '12' },
                          ]}
                          onPress={() => update(player.id, 'wouldPlayAgain', true)}
                          activeOpacity={0.75}
                        >
                          <Ionicons name="thumbs-up-outline" size={16}
                            color={r.wouldPlayAgain === true ? colors.success : colors.textSecondary} />
                          <Text style={[styles.wpaChipText, r.wouldPlayAgain === true && { color: colors.success }]}>Sí</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.wpaChip,
                            r.wouldPlayAgain === false && { borderColor: '#EF444440', backgroundColor: '#EF444410' },
                          ]}
                          onPress={() => update(player.id, 'wouldPlayAgain', false)}
                          activeOpacity={0.75}
                        >
                          <Ionicons name="thumbs-down-outline" size={16}
                            color={r.wouldPlayAgain === false ? '#EF4444' : colors.textSecondary} />
                          <Text style={[styles.wpaChipText, r.wouldPlayAgain === false && { color: '#EF4444' }]}>No</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Optional comment */}
                      <TextInput
                        style={styles.commentInput}
                        placeholder="Algo breve sobre la experiencia… (opcional)"
                        placeholderTextColor={colors.textMuted}
                        value={r.comment}
                        onChangeText={v => update(player.id, 'comment', v)}
                        multiline
                        maxLength={200}
                      />
                    </View>
                  );
                })}
              </ScrollView>

              {/* Footer */}
              <View style={styles.footer}>
                {!allFilled && players.length > 0 && (
                  <Text style={styles.footerHint}>Completa todos los criterios para enviar</Text>
                )}
                <Button
                  label="Enviar valoraciones"
                  variant="cta"
                  fullWidth
                  size="lg"
                  loading={submitting}
                  disabled={!allFilled}
                  onPress={handleSubmit}
                />
              </View>
            </>
          )}

        </View>
      </View>
    </Modal>
  );
}
