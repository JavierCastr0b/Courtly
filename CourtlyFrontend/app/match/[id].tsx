import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, Platform, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { colors, levelColor, levelDisplay } from '@/src/theme/colors';
import { Match, User } from '@/src/types';
import { matchesApi, MatchSet } from '@/src/api/matches';
import { useAuth } from '@/src/context/AuthContext';
import { Avatar } from '@/src/components/Avatar';
import { Tag } from '@/src/components/Tag';
import { Button } from '@/src/components/Button';
import ScorecardCard from '@/src/components/ScorecardCard';

const isDoubles = (m: Match) =>
  (m.matchType ?? '').toUpperCase().includes('DOBLES') ||
  (m.matchType ?? '').toUpperCase().includes('DOUBLE');

// ─── Set score row with +/- buttons ───────────────────────────────────────
function SetRow({
  index, set, onChange, onRemove,
}: {
  index: number;
  set: MatchSet;
  onChange: (s: MatchSet) => void;
  onRemove: () => void;
}) {
  const adj = (side: 'a' | 'b', delta: number) =>
    onChange({ ...set, [side]: Math.max(0, set[side] + delta) });

  return (
    <View style={st.setRow}>
      <Text style={st.setLabel}>Set {index + 1}</Text>
      <View style={st.setScore}>
        <TouchableOpacity style={st.adj} onPress={() => adj('a', -1)}>
          <Ionicons name="remove" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={st.setNum}>{set.a}</Text>
        <TouchableOpacity style={st.adj} onPress={() => adj('a', 1)}>
          <Ionicons name="add" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={st.setVs}>–</Text>
        <TouchableOpacity style={st.adj} onPress={() => adj('b', -1)}>
          <Ionicons name="remove" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={st.setNum}>{set.b}</Text>
        <TouchableOpacity style={st.adj} onPress={() => adj('b', 1)}>
          <Ionicons name="add" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={onRemove} style={st.removeSet}>
        <Ionicons name="close-circle-outline" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Team column ──────────────────────────────────────────────────────────
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
  return (
    <View style={[st.teamCol, { borderColor: accent + '50' }]}>
      <Text style={[st.teamLabel, { color: accent }]}>{label}</Text>
      {players.map(p => (
        <TouchableOpacity key={p.id} style={st.teamPlayer} onPress={() => onPress?.(p)} activeOpacity={0.75}>
          <Avatar name={p.name} size={28} />
          <Text style={st.teamPlayerName} numberOfLines={1}>{p.name.split(' ')[0]}</Text>
          {winners.some(w => w.id === p.id) && (
            <Ionicons name="trophy" size={12} color="#FFB800" />
          )}
        </TouchableOpacity>
      ))}
      {guests.map((g, i) => (
        <View key={`g${i}`} style={st.teamPlayer}>
          <View style={st.guestAvatar}>
            <Ionicons name="person-outline" size={14} color={colors.textMuted} />
          </View>
          <Text style={[st.teamPlayerName, { color: colors.textMuted }]} numberOfLines={1}>{g}</Text>
        </View>
      ))}
    </View>
  );
}

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: me } = useAuth();

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Join team modal
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinTeam, setJoinTeam] = useState<'A' | 'B' | null>(null);
  const [guestName, setGuestName] = useState('');

  // My team picker (organizer or participant without team)
  const [showMyTeam, setShowMyTeam] = useState(false);

  // Finalize modal
  const [showFinalize, setShowFinalize] = useState(false);
  const [winningTeam, setWinningTeam] = useState<'A' | 'B' | null>(null);
  const [sets, setSets] = useState<MatchSet[]>([{ a: 0, b: 0 }]);
  const [recording, setRecording] = useState(false);

  // Scorecard
  const [showScorecard, setShowScorecard] = useState(false);
  const [lastSets, setLastSets] = useState<MatchSet[]>([]);
  const [lastWinner, setLastWinner] = useState<'A' | 'B' | null>(null);
  const scorecardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    matchesApi.getById(id)
      .then(setMatch)
      .catch(() => Alert.alert('Error', 'No se pudo cargar el partido.'))
      .finally(() => setLoading(false));
  }, [id]);

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
      // Small delay so the offscreen view fully lays out before capture
      await new Promise(r => setTimeout(r, 150));
      const uri = await captureRef(scorecardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
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
    <SafeAreaView style={st.root} edges={['top']}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => router.back()} style={st.backBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={st.headerTitle}>Partido</Text>
        {isOrganizer && !match?.resultRecorded ? (
          <TouchableOpacity onPress={handleDelete} style={st.deleteBtn}>
            <Ionicons name="trash-outline" size={20} color={colors.ctaHighlight} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {loading ? (
        <View style={st.loader}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : match ? (
        <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>

          {/* Organizador */}
          <View style={st.organizerRow}>
            <TouchableOpacity onPress={() => router.push(`/profile/${match.organizer.id}`)} style={st.organizerInfo}>
              <Avatar name={match.organizer.name} size={46} available={match.organizer.available} />
              <View>
                <Text style={st.organizerLabel}>Organizado por</Text>
                <Text style={st.organizerName}>{match.organizer.name}</Text>
              </View>
            </TouchableOpacity>
            <Tag label={levelDisplay[match.level] ?? match.level} variant="level" level={match.level} />
          </View>

          {/* Info principal */}
          <View style={st.infoCard}>
            <View style={st.infoRow}>
              <View style={st.infoIcon}><Ionicons name="calendar-outline" size={18} color={colors.primary} /></View>
              <View>
                <Text style={st.infoLabel}>Fecha</Text>
                <Text style={st.infoValue}>{match.date}</Text>
              </View>
            </View>
            <View style={st.infoDivider} />
            <View style={st.infoRow}>
              <View style={st.infoIcon}><Ionicons name="time-outline" size={18} color={colors.primary} /></View>
              <View>
                <Text style={st.infoLabel}>Hora</Text>
                <Text style={st.infoValue}>{match.time}</Text>
              </View>
            </View>
            <View style={st.infoDivider} />
            <View style={st.infoRow}>
              <View style={st.infoIcon}><Ionicons name="location-outline" size={18} color={colors.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={st.infoLabel}>Lugar</Text>
                <Text style={st.infoValue} numberOfLines={2}>
                  {match.court?.name ?? match.customLocation ?? '—'}
                </Text>
                {match.court?.address ? <Text style={st.infoSub}>{match.court.address}</Text> : null}
              </View>
            </View>
          </View>

          {match.description ? (
            <View style={st.descCard}>
              <Text style={st.sectionTitle}>Descripción</Text>
              <Text style={st.descText}>{match.description}</Text>
            </View>
          ) : null}

          {/* Result card */}
          {match.resultRecorded && (
            <View style={st.resultCard}>
              <View style={st.resultHeader}>
                <Ionicons name="trophy" size={16} color="#FFB800" />
                <Text style={st.resultTitle}>Resultado final</Text>
              </View>
              {scoreLabel ? (
                <Text style={st.resultScore}>{scoreLabel}</Text>
              ) : null}
              <View style={st.winnersRow}>
                {(match.winners ?? []).map(w => (
                  <View key={w.id} style={st.winnerChip}>
                    <Ionicons name="trophy-outline" size={12} color="#FFB800" />
                    <Text style={st.winnerChipName}>{w.name.split(' ')[0]}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Jugadores — teams or plain list */}
          <View style={st.spotsCard}>
            <View style={st.spotsHeader}>
              <Text style={st.sectionTitle}>Jugadores</Text>
              <Text style={[st.spotsCount, isFull && { color: colors.ctaHighlight }]}>
                {(match.totalSpots ?? 0) - spotsLeft}/{match.totalSpots ?? 0}
              </Text>
            </View>

            <View style={st.spotsBar}>
              {Array.from({ length: match.totalSpots ?? 0 }).map((_, i) => (
                <View key={i} style={[st.spotDot, i < (match.totalSpots ?? 0) - spotsLeft && st.spotFilled]} />
              ))}
            </View>

            {doubles && ((match.teamA?.length ?? 0) > 0 || (match.teamB?.length ?? 0) > 0) ? (
              <View style={st.teamsRow}>
                <TeamColumn
                  label="Equipo A"
                  players={match.teamA ?? []}
                  guests={match.teamAGuests ?? []}
                  winners={match.winners ?? []}
                  accent={colors.primary}
                  onPress={u => router.push(`/profile/${u.id}`)}
                />
                <View style={st.teamVsSep}>
                  <Text style={st.teamVsText}>VS</Text>
                </View>
                <TeamColumn
                  label="Equipo B"
                  players={match.teamB ?? []}
                  guests={match.teamBGuests ?? []}
                  winners={match.winners ?? []}
                  accent={colors.ctaHighlight}
                  onPress={u => router.push(`/profile/${u.id}`)}
                />
              </View>
            ) : (
              <View style={st.participantsList}>
                {match.participants?.map(p => (
                  <TouchableOpacity key={p.id} style={st.participantRow} onPress={() => router.push(`/profile/${p.id}`)} activeOpacity={0.7}>
                    <Avatar name={p.name} size={36} available={p.available} />
                    <View style={{ flex: 1 }}>
                      <Text style={st.participantName}>{p.name}</Text>
                      <Text style={st.participantLevel}>{levelDisplay[p.level] ?? p.level}</Text>
                    </View>
                    {p.id === match.organizer.id && (
                      <View style={st.organizerBadge}><Text style={st.organizerBadgeText}>Org.</Text></View>
                    )}
                    {match.resultRecorded && (match.winners ?? []).some(w => w.id === p.id) && (
                      <Ionicons name="trophy" size={16} color="#FFB800" />
                    )}
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
                {Array.from({ length: spotsLeft }).map((_, i) => (
                  <View key={`e${i}`} style={[st.participantRow, st.emptySlot]}>
                    <View style={st.emptyAvatar}><Ionicons name="person-add-outline" size={18} color={colors.textMuted} /></View>
                    <Text style={st.emptySlotText}>Lugar disponible</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Pick my team (participant without a team in doubles) */}
          {doubles && isParticipant && !myTeam && !match.resultRecorded && (
            <TouchableOpacity style={st.pickTeamBtn} onPress={() => setShowMyTeam(true)} activeOpacity={0.8}>
              <Ionicons name="people-outline" size={16} color={colors.primary} />
              <Text style={st.pickTeamText}>Elegir mi equipo</Text>
            </TouchableOpacity>
          )}

          {/* Finalizar partido */}
          {isOrganizer && !match.resultRecorded && (
            <Button
              label="Finalizar partido"
              variant="primary"
              fullWidth size="lg"
              onPress={() => { setSets([{ a: 0, b: 0 }]); setWinningTeam(null); setShowFinalize(true); }}
              style={st.actionBtn}
            />
          )}

          {/* Join / Leave (non-organizer) */}
          {!isOrganizer && (
            match.resultRecorded ? (
              <View style={st.finishedBanner}>
                <Ionicons name="checkmark-circle" size={16} color={colors.textMuted} />
                <Text style={st.finishedText}>Partido terminado</Text>
              </View>
            ) : isParticipant ? (
              <Button label="Salir del partido" variant="outline" fullWidth size="lg" loading={leaving} onPress={handleLeave} style={st.actionBtn} />
            ) : (
              <>
                <Button
                  label={isFull ? 'Partido completo' : 'Unirme al partido'}
                  variant={isFull ? 'secondary' : 'primary'}
                  fullWidth size="lg" disabled={isFull} loading={joining}
                  onPress={handleJoin} style={st.actionBtn}
                />
                {!!joinError && (
                  <View style={st.joinErrorBox}>
                    <Ionicons name="alert-circle-outline" size={15} color={colors.ctaHighlight} />
                    <Text style={st.joinErrorText}>{joinError}</Text>
                  </View>
                )}
              </>
            )
          )}

        </ScrollView>
      ) : (
        <View style={st.loader}><Text style={{ color: colors.textMuted }}>No se encontró el partido.</Text></View>
      )}

      {/* ── Join team modal ── */}
      <Modal visible={showJoinModal} transparent animationType="slide" onRequestClose={() => setShowJoinModal(false)}>
        <View style={st.overlay}>
          <View style={st.sheet}>
            <View style={st.handle} />
            <Text style={st.sheetTitle}>Elegir equipo</Text>
            <Text style={st.sheetSub}>Selecciona en qué equipo juegas</Text>

            <View style={st.teamBtns}>
              <TouchableOpacity
                style={[st.teamBtn, joinTeam === 'A' && { borderColor: colors.primary, backgroundColor: colors.primary + '18' }]}
                onPress={() => setJoinTeam('A')} activeOpacity={0.8}
              >
                <Text style={[st.teamBtnLabel, { color: colors.primary }]}>Equipo A</Text>
                <Text style={st.teamBtnCount}>{teamACount} jugadores</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.teamBtn, joinTeam === 'B' && { borderColor: colors.ctaHighlight, backgroundColor: colors.ctaHighlight + '18' }]}
                onPress={() => setJoinTeam('B')} activeOpacity={0.8}
              >
                <Text style={[st.teamBtnLabel, { color: colors.ctaHighlight }]}>Equipo B</Text>
                <Text style={st.teamBtnCount}>{teamBCount} jugadores</Text>
              </TouchableOpacity>
            </View>

            {spotsLeft > 1 && (
              <View style={st.guestSection}>
                <Text style={st.guestLabel}>¿Traes un acompañante sin cuenta?</Text>
                <TextInput
                  style={st.guestInput}
                  placeholder="Nombre del jugador invitado (opcional)"
                  placeholderTextColor={colors.textMuted}
                  value={guestName}
                  onChangeText={setGuestName}
                />
              </View>
            )}

            <View style={st.sheetActions}>
              <Button label="Cancelar" variant="outline" size="md" onPress={() => setShowJoinModal(false)} style={{ flex: 1 }} />
              <Button label="Unirme" variant="primary" size="md" loading={joining} onPress={confirmJoin} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── My team picker ── */}
      <Modal visible={showMyTeam} transparent animationType="slide" onRequestClose={() => setShowMyTeam(false)}>
        <View style={st.overlay}>
          <View style={st.sheet}>
            <View style={st.handle} />
            <Text style={st.sheetTitle}>¿En qué equipo juegas?</Text>
            <View style={st.teamBtns}>
              <TouchableOpacity style={[st.teamBtn, { borderColor: colors.primary + '60' }]} onPress={() => handleSetMyTeam('A')} activeOpacity={0.8}>
                <Text style={[st.teamBtnLabel, { color: colors.primary }]}>Equipo A</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[st.teamBtn, { borderColor: colors.ctaHighlight + '60' }]} onPress={() => handleSetMyTeam('B')} activeOpacity={0.8}>
                <Text style={[st.teamBtnLabel, { color: colors.ctaHighlight }]}>Equipo B</Text>
              </TouchableOpacity>
            </View>
            <Button label="Cancelar" variant="outline" size="md" onPress={() => setShowMyTeam(false)} />
          </View>
        </View>
      </Modal>

      {/* ── Offscreen scorecard for capture (outside Modal — iOS captureRef requires this) ── */}
      {showScorecard && (
        <View style={st.offscreenCapture} pointerEvents="none">
          <View ref={scorecardRef} style={st.scorecardCaptureWrapper} collapsable={false}>
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

      {/* ── Scorecard modal (visual only, no ref) ── */}
      <Modal visible={showScorecard} transparent animationType="fade" onRequestClose={() => setShowScorecard(false)}>
        <View style={st.overlay}>
          <View style={st.scorecardSheet}>
            <View style={st.handle} />
            <Text style={st.sheetTitle}>Resultado registrado</Text>
            <Text style={st.sheetSub}>Comparte el scorecard con los jugadores</Text>
            <View style={st.scorecardPreview}>
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
            <View style={st.sheetActions}>
              <Button label="Cerrar" variant="outline" size="md" onPress={() => setShowScorecard(false)} style={{ flex: 1 }} />
              <Button label={sharing ? 'Compartiendo...' : 'Compartir'} variant="primary" size="md" loading={sharing} onPress={handleShareScorecard} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Finalize modal ── */}
      <Modal visible={showFinalize} transparent animationType="slide" onRequestClose={() => setShowFinalize(false)}>
        <View style={st.overlay}>
          <ScrollView contentContainerStyle={st.sheetScroll} showsVerticalScrollIndicator={false}>
            <View style={st.handle} />
            <Text style={st.sheetTitle}>Finalizar partido</Text>

            {/* Team winner */}
            {doubles ? (
              <View>
                <Text style={st.subSection}>¿Qué equipo ganó?</Text>
                <View style={st.teamBtns}>
                  <TouchableOpacity
                    style={[st.teamBtn, winningTeam === 'A' && { borderColor: colors.primary, backgroundColor: colors.primary + '18' }]}
                    onPress={() => setWinningTeam('A')} activeOpacity={0.8}
                  >
                    <Ionicons name="trophy-outline" size={18} color={colors.primary} />
                    <Text style={[st.teamBtnLabel, { color: colors.primary }]}>Equipo A ganó</Text>
                    <Text style={st.teamBtnNames} numberOfLines={2}>
                      {[...(match?.teamA ?? []).map(u => u.name.split(' ')[0]), ...(match?.teamAGuests ?? [])].join(', ') || '—'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[st.teamBtn, winningTeam === 'B' && { borderColor: colors.ctaHighlight, backgroundColor: colors.ctaHighlight + '18' }]}
                    onPress={() => setWinningTeam('B')} activeOpacity={0.8}
                  >
                    <Ionicons name="trophy-outline" size={18} color={colors.ctaHighlight} />
                    <Text style={[st.teamBtnLabel, { color: colors.ctaHighlight }]}>Equipo B ganó</Text>
                    <Text style={st.teamBtnNames} numberOfLines={2}>
                      {[...(match?.teamB ?? []).map(u => u.name.split(' ')[0]), ...(match?.teamBGuests ?? [])].join(', ') || '—'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {/* Sets */}
            <Text style={st.subSection}>Resultado por set</Text>
            <View style={st.setsHeader}>
              <Text style={[st.setsTeamHdr, { color: colors.primary }]}>
                {doubles ? 'Equipo A' : 'Jugador A'}
              </Text>
              <View style={{ flex: 1 }} />
              <Text style={[st.setsTeamHdr, { color: colors.ctaHighlight }]}>
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
            <TouchableOpacity style={st.addSetBtn} onPress={addSet} activeOpacity={0.75}>
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={st.addSetText}>Agregar set</Text>
            </TouchableOpacity>

            <View style={[st.sheetActions, { marginTop: 8 }]}>
              <Button label="Cancelar" variant="outline" size="md" onPress={() => setShowFinalize(false)} style={{ flex: 1 }} />
              <Button label="Confirmar" variant="primary" size="md" loading={recording} onPress={handleRecordResult} style={{ flex: 1 }} />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { padding: 4, width: 40 },
  headerTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
  deleteBtn: { padding: 4, width: 40, alignItems: 'flex-end' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: 60 },

  organizerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 20,
  },
  organizerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  organizerLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '500' },
  organizerName: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginTop: 2 },

  infoCard: {
    marginHorizontal: 20, backgroundColor: colors.cardBg,
    borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    padding: 16, marginBottom: 14,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  infoIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.primary + '18',
    alignItems: 'center', justifyContent: 'center',
  },
  infoLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '500' },
  infoValue: { color: colors.textPrimary, fontSize: 15, fontWeight: '600', marginTop: 2 },
  infoSub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  infoDivider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },

  descCard: {
    marginHorizontal: 20, backgroundColor: colors.cardBg,
    borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    padding: 16, marginBottom: 14,
  },
  descText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 8 },
  sectionTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },

  resultCard: {
    marginHorizontal: 20, backgroundColor: '#FFB80010',
    borderRadius: 14, borderWidth: 1, borderColor: '#FFB80040',
    padding: 16, marginBottom: 14, gap: 8,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultTitle: { color: '#FFB800', fontSize: 14, fontWeight: '700' },
  resultScore: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
  winnersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  winnerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FFB80018', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: '#FFB80040',
  },
  winnerChipName: { color: '#FFB800', fontSize: 13, fontWeight: '700' },

  spotsCard: {
    marginHorizontal: 20, backgroundColor: colors.cardBg,
    borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    padding: 16, marginBottom: 14,
  },
  spotsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  spotsCount: { color: colors.textSecondary, fontSize: 14, fontWeight: '700' },
  spotsBar: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  spotDot: { height: 6, flex: 1, borderRadius: 3, backgroundColor: colors.border },
  spotFilled: { backgroundColor: colors.primary },

  // Teams layout
  teamsRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  teamVsSep: { alignItems: 'center', paddingTop: 28 },
  teamVsText: { color: colors.textMuted, fontSize: 12, fontWeight: '800' },
  teamCol: {
    flex: 1, borderRadius: 12, borderWidth: 1,
    padding: 10, gap: 8,
  },
  teamLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  teamPlayer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  teamPlayerName: { flex: 1, color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
  guestAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.secondary, borderWidth: 1,
    borderColor: colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },

  // Plain list
  participantsList: { gap: 2 },
  participantRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderRadius: 10 },
  participantName: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  participantLevel: { color: colors.textSecondary, fontSize: 12, marginTop: 1 },
  organizerBadge: {
    backgroundColor: colors.primary + '22', borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  organizerBadgeText: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  emptySlot: { opacity: 0.5 },
  emptyAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.secondary, borderWidth: 1,
    borderColor: colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  emptySlotText: { color: colors.textMuted, fontSize: 14 },

  pickTeamBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginBottom: 10,
    backgroundColor: colors.primary + '12', borderRadius: 10,
    borderWidth: 1, borderColor: colors.primary + '40',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  pickTeamText: { color: colors.primary, fontSize: 14, fontWeight: '600' },

  actionBtn: { marginHorizontal: 20, marginTop: 6, marginBottom: 10 },
  finishedBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 20, marginTop: 6, marginBottom: 10,
    backgroundColor: colors.cardBg, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
    paddingVertical: 14,
  },
  finishedText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  joinErrorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 20, marginTop: 6,
    backgroundColor: colors.ctaHighlight + '15', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 7,
    borderWidth: 1, borderColor: colors.ctaHighlight + '40',
  },
  joinErrorText: { color: colors.ctaHighlight, fontSize: 12, flex: 1 },

  // Modals
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
    backgroundColor: colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    gap: 16, alignItems: 'center',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, gap: 14,
  },
  sheetScroll: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, gap: 12,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 4 },
  sheetTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  sheetSub: { color: colors.textMuted, fontSize: 14, marginTop: -6 },
  sheetActions: { flexDirection: 'row', gap: 10 },

  teamBtns: { flexDirection: 'row', gap: 10 },
  teamBtn: {
    flex: 1, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border,
    padding: 14, alignItems: 'center', gap: 4,
  },
  teamBtnLabel: { fontSize: 15, fontWeight: '800' },
  teamBtnCount: { color: colors.textMuted, fontSize: 12 },
  teamBtnNames: { color: colors.textMuted, fontSize: 11, textAlign: 'center' },

  guestSection: { gap: 8 },
  guestLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  guestInput: {
    backgroundColor: colors.cardBg, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border,
    color: colors.textPrimary, fontSize: 14,
    paddingHorizontal: 14, paddingVertical: 11,
  },

  subSection: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', marginTop: 4 },
  setsHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, marginBottom: 4 },
  setsTeamHdr: { fontSize: 12, fontWeight: '700', width: 90, textAlign: 'center' },

  // Set row
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  setLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600', width: 38 },
  setScore: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  adj: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  setNum: { color: colors.textPrimary, fontSize: 20, fontWeight: '800', minWidth: 26, textAlign: 'center' },
  setVs: { color: colors.textMuted, fontSize: 16, marginHorizontal: 2 },
  removeSet: { padding: 4 },

  addSetBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  addSetText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});
