import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, levelColor, levelDisplay } from '@/src/theme/colors';
import { Match } from '@/src/types';
import { matchesApi } from '@/src/api/matches';
import { useAuth } from '@/src/context/AuthContext';
import { Avatar } from '@/src/components/Avatar';
import { Tag } from '@/src/components/Tag';
import { Button } from '@/src/components/Button';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: me } = useAuth();

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);

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

  const handleJoin = () => {
    if (!match) return;
    setJoining(true);
    matchesApi.join(match.id)
      .then(updated => setMatch(updated))
      .catch(e => Alert.alert('Error', e.message))
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

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partido</Text>
        {isOrganizer ? (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={20} color={colors.ctaHighlight} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : match ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Organizador */}
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

          {/* Info principal */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.infoLabel}>Fecha</Text>
                <Text style={styles.infoValue}>{match.date}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.infoLabel}>Hora</Text>
                <Text style={styles.infoValue}>{match.time}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="location-outline" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Lugar</Text>
                <Text style={styles.infoValue} numberOfLines={2}>
                  {match.court?.name ?? match.customLocation ?? '—'}
                </Text>
                {match.court?.address ? (
                  <Text style={styles.infoSub}>{match.court.address}</Text>
                ) : null}
              </View>
            </View>
          </View>

          {/* Descripción */}
          {match.description ? (
            <View style={styles.descCard}>
              <Text style={styles.sectionTitle}>Descripción</Text>
              <Text style={styles.descText}>{match.description}</Text>
            </View>
          ) : null}

          {/* Cupos */}
          <View style={styles.spotsCard}>
            <View style={styles.spotsHeader}>
              <Text style={styles.sectionTitle}>Jugadores</Text>
              <Text style={[styles.spotsCount, isFull && { color: colors.ctaHighlight }]}>
                {(match.totalSpots ?? 0) - spotsLeft}/{match.totalSpots ?? 0}
              </Text>
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

            {/* Lista de participantes */}
            <View style={styles.participantsList}>
              {match.participants?.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.participantRow}
                  onPress={() => router.push(`/profile/${p.id}`)}
                  activeOpacity={0.7}
                >
                  <Avatar name={p.name} size={36} available={p.available} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.participantName}>{p.name}</Text>
                    <Text style={styles.participantLevel}>{levelDisplay[p.level] ?? p.level}</Text>
                  </View>
                  {p.id === match.organizer.id && (
                    <View style={styles.organizerBadge}>
                      <Text style={styles.organizerBadgeText}>Org.</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))}

              {/* Slots vacíos */}
              {Array.from({ length: spotsLeft }).map((_, i) => (
                <View key={`empty-${i}`} style={[styles.participantRow, styles.emptySlot]}>
                  <View style={styles.emptyAvatar}>
                    <Ionicons name="person-add-outline" size={18} color={colors.textMuted} />
                  </View>
                  <Text style={styles.emptySlotText}>Lugar disponible</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Acción */}
          {!isOrganizer && (
            isParticipant ? (
              <Button
                label="Salir del partido"
                variant="outline"
                fullWidth
                size="lg"
                loading={leaving}
                onPress={handleLeave}
                style={styles.actionBtn}
              />
            ) : (
              <Button
                label={isFull ? 'Partido completo' : 'Unirme al partido'}
                variant={isFull ? 'secondary' : 'primary'}
                fullWidth
                size="lg"
                disabled={isFull}
                loading={joining}
                onPress={handleJoin}
                style={styles.actionBtn}
              />
            )
          )}

        </ScrollView>
      ) : (
        <View style={styles.loader}>
          <Text style={{ color: colors.textMuted }}>No se encontró el partido.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  sectionTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  participantsList: { gap: 2 },
  participantRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderRadius: 10,
  },
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
  actionBtn: { marginHorizontal: 20, marginTop: 6, marginBottom: 10 },
});
