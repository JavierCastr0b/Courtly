import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { Match } from '@/src/types';
import { matchesApi } from '@/src/api/matches';
import { Tag } from '@/src/components/Tag';
import { Button } from '@/src/components/Button';
import { useAuth } from '@/src/context/AuthContext';

export default function MisPartidosScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const targetId = userId ?? user?.id ?? '';

  useEffect(() => {
    if (!targetId) return;
    matchesApi.getByUser(targetId)
      .then(setMatches)
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  }, [targetId]);

  const handleLeave = (matchId: string) => {
    Alert.alert('Salir del partido', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir', style: 'destructive',
        onPress: () => {
          matchesApi.leave(matchId)
            .then(() => setMatches(prev => prev.filter(m => m.id !== matchId)))
            .catch(() => Alert.alert('Error', 'No se pudo salir del partido.'));
        },
      },
    ]);
  };

  const handleDelete = (matchId: string) => {
    Alert.alert('Cancelar partido', '¿Seguro que quieres cancelar este partido?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancelar partido', style: 'destructive',
        onPress: () => {
          matchesApi.delete(matchId)
            .then(() => setMatches(prev => prev.filter(m => m.id !== matchId)))
            .catch(() => Alert.alert('Error', 'No se pudo cancelar el partido.'));
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
        <Text style={styles.headerTitle}>Mis partidos</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="tennisball-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Sin partidos aún</Text>
              <Text style={styles.emptyText}>Crea tu primer partido desde la pestaña Registrar.</Text>
              <Button label="Crear partido" variant="primary" size="md" onPress={() => router.push('/(tabs)/registrar')} style={{ marginTop: 16 }} />
            </View>
          }
          renderItem={({ item: match }) => {
            const isOrganizer = match.organizer.id === user?.id;
            const location = match.court?.name ?? match.customLocation ?? '—';
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.cardLeft}>
                    <Text style={styles.cardDate}>{match.date} · {match.time?.slice(0, 5)}</Text>
                    <Text style={styles.cardLocation} numberOfLines={1}>{location}</Text>
                    <View style={styles.tagsRow}>
                      <Tag label={match.level} variant="level" />
                      {match.sportType ? (
                        <View style={styles.typeTag}>
                          <Text style={styles.typeTagText}>{match.sportType}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <View style={styles.cardRight}>
                    <View style={styles.spotsRow}>
                      <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.spotsText}>{match.spotsLeft} lugares</Text>
                    </View>
                    {isOrganizer && (
                      <View style={styles.organizerBadge}>
                        <Text style={styles.organizerText}>Organizador</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.cardActions}>
                  {isOrganizer ? (
                    <Button label="Cancelar partido" variant="outline" size="sm" onPress={() => handleDelete(match.id)} style={{ flex: 1 }} />
                  ) : (
                    <Button label="Salir del partido" variant="outline" size="sm" onPress={() => handleLeave(match.id)} style={{ flex: 1 }} />
                  )}
                </View>
              </View>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
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
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 18, paddingBottom: 40 },
  card: {
    backgroundColor: colors.cardBg, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  cardLeft: { flex: 1, gap: 4 },
  cardRight: { alignItems: 'flex-end', gap: 8 },
  cardDate: { color: colors.textPrimary, fontWeight: '700', fontSize: 14 },
  cardLocation: { color: colors.textSecondary, fontSize: 13 },
  tagsRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  typeTag: { backgroundColor: colors.secondary, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  typeTagText: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  spotsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  spotsText: { color: colors.textSecondary, fontSize: 12 },
  organizerBadge: { backgroundColor: colors.primary + '22', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  organizerText: { color: colors.primary, fontSize: 11, fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
});
