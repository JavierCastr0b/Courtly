import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { Court, Level } from '@/src/types';
import { courtsApi } from '@/src/api/courts';
import { matchesApi } from '@/src/api/matches';
import { postsApi } from '@/src/api/posts';
import { Button } from '@/src/components/Button';
import { Tag } from '@/src/components/Tag';

type Mode = 'match' | 'post';

const LEVELS: { value: Level; label: string }[] = [
  { value: 'PRINCIPIANTE', label: 'Principiante' },
  { value: 'INTERMEDIO', label: 'Intermedio' },
  { value: 'AVANZADO', label: 'Avanzado' },
];
const TIME_SLOTS = ['6:00 AM', '7:00 AM', '8:00 AM', '5:00 PM', '6:00 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM'];
const DATE_OPTIONS = ['Hoy', 'Mañana', 'Sábado', 'Domingo', 'Lunes'];

export default function RegistrarScreen() {
  const [mode, setMode] = useState<Mode>('match');
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<Level>('INTERMEDIO');
  const [selectedDate, setSelectedDate] = useState('Hoy');
  const [selectedTime, setSelectedTime] = useState('7:00 PM');
  const [players, setPlayers] = useState(2);
  const [description, setDescription] = useState('');
  const [postText, setPostText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    courtsApi.getAll().then(setCourts).catch(() => {});
  }, []);

  const handlePublish = async () => {
    if (mode === 'match' && !selectedCourt) {
      Alert.alert('Selecciona una cancha', 'Elige dónde quieres jugar tu partido.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'match') {
        await matchesApi.create({
          courtId: selectedCourt!,
          date: selectedDate,
          time: selectedTime,
          level: selectedLevel,
          totalSpots: players,
          description: description || undefined,
        });
        Alert.alert('¡Partido publicado!', 'Tu partido ya es visible para otros jugadores.', [
          { text: 'OK', onPress: () => { setSelectedCourt(null); setDescription(''); } },
        ]);
      } else {
        await postsApi.create({
          title: postText,
          level: selectedLevel,
          location: selectedCourt ? courts.find(c => c.id === selectedCourt)?.name : undefined,
        });
        Alert.alert('¡Publicación creada!', 'Tu publicación es visible en el feed.', [
          { text: 'OK', onPress: () => { setPostText(''); setSelectedCourt(null); } },
        ]);
      }
    } catch {
      Alert.alert('Error', 'No se pudo publicar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const court = courts.find((c) => c.id === selectedCourt);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.modeSwitcher}>
          <TouchableOpacity
            onPress={() => setMode('match')}
            style={[styles.modeBtn, mode === 'match' && styles.modeBtnActive]}
          >
            <Ionicons name="tennisball-outline" size={15} color={mode === 'match' ? colors.primary : colors.textSecondary} />
            <Text style={[styles.modeBtnText, mode === 'match' && styles.modeBtnTextActive]}>Partido</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMode('post')}
            style={[styles.modeBtn, mode === 'post' && styles.modeBtnActive]}
          >
            <Ionicons name="create-outline" size={15} color={mode === 'post' ? colors.primary : colors.textSecondary} />
            <Text style={[styles.modeBtnText, mode === 'post' && styles.modeBtnTextActive]}>Publicación</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {mode === 'match' ? (
            <>
              <Text style={styles.sectionLabel}>Seleccionar cancha</Text>
              {courts.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setSelectedCourt(c.id)}
                  style={[styles.courtItem, selectedCourt === c.id && styles.courtItemSelected]}
                  activeOpacity={0.75}
                >
                  <View style={styles.courtIcon}>
                    <Ionicons name="tennisball-outline" size={18} color={selectedCourt === c.id ? colors.primary : colors.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.courtName, selectedCourt === c.id && { color: colors.primary }]}>{c.name}</Text>
                    <Text style={styles.courtMeta}>{c.address}</Text>
                  </View>
                  {selectedCourt === c.id && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}

              <Text style={styles.sectionLabel}>Fecha</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                <View style={styles.pillRow}>
                  {DATE_OPTIONS.map((d) => (
                    <TouchableOpacity key={d} onPress={() => setSelectedDate(d)} style={[styles.pill, selectedDate === d && styles.pillActive]}>
                      <Text style={[styles.pillText, selectedDate === d && styles.pillTextActive]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.sectionLabel}>Hora</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                <View style={styles.pillRow}>
                  {TIME_SLOTS.map((t) => (
                    <TouchableOpacity key={t} onPress={() => setSelectedTime(t)} style={[styles.pill, selectedTime === t && styles.pillActive]}>
                      <Text style={[styles.pillText, selectedTime === t && styles.pillTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.sectionLabel}>Nivel</Text>
              <View style={styles.levelRow}>
                {LEVELS.map((lvl) => (
                  <TouchableOpacity
                    key={lvl.value}
                    onPress={() => setSelectedLevel(lvl.value)}
                    style={[styles.levelCard, selectedLevel === lvl.value && styles.levelCardActive]}
                    activeOpacity={0.75}
                  >
                    <Tag label={lvl.value} variant="level" />
                    {selectedLevel === lvl.value && (
                      <Ionicons name="checkmark" size={14} color={colors.primary} style={{ marginTop: 6 }} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionLabel}>Jugadores necesarios</Text>
              <View style={styles.stepper}>
                <TouchableOpacity onPress={() => setPlayers((p) => Math.max(1, p - 1))} style={styles.stepperBtn}>
                  <Ionicons name="remove" size={20} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{players}</Text>
                <TouchableOpacity onPress={() => setPlayers((p) => Math.min(4, p + 1))} style={styles.stepperBtn}>
                  <Ionicons name="add" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionLabel}>Descripción (opcional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Agrega detalles sobre el partido..."
                placeholderTextColor={colors.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />

              {court && (
                <View style={styles.preview}>
                  <Text style={styles.previewTitle}>Resumen del partido</Text>
                  <View style={styles.previewRow}>
                    <Ionicons name="location-outline" size={15} color={colors.textSecondary} />
                    <Text style={styles.previewText}>{court.name}</Text>
                  </View>
                  <View style={styles.previewRow}>
                    <Ionicons name="time-outline" size={15} color={colors.textSecondary} />
                    <Text style={styles.previewText}>{selectedDate} · {selectedTime}</Text>
                  </View>
                  <View style={styles.previewRow}>
                    <Ionicons name="people-outline" size={15} color={colors.textSecondary} />
                    <Text style={styles.previewText}>{players} jugadores · {LEVELS.find(l => l.value === selectedLevel)?.label}</Text>
                  </View>
                </View>
              )}

              <Button label="Publicar partido" variant="cta" fullWidth size="lg" loading={loading} onPress={handlePublish} style={styles.publishBtn} />
            </>
          ) : (
            <>
              <Text style={styles.sectionLabel}>¿Qué quieres compartir?</Text>
              <TextInput
                style={[styles.textInput, { minHeight: 120 }]}
                placeholder="Busco partido, comparte logros, eventos..."
                placeholderTextColor={colors.textMuted}
                value={postText}
                onChangeText={setPostText}
                multiline
                autoFocus
              />

              <Text style={styles.sectionLabel}>Etiqueta de nivel</Text>
              <View style={styles.levelRow}>
                {LEVELS.map((lvl) => (
                  <TouchableOpacity
                    key={lvl.value}
                    onPress={() => setSelectedLevel(lvl.value)}
                    style={[styles.levelCard, selectedLevel === lvl.value && styles.levelCardActive]}
                  >
                    <Tag label={lvl.value} variant="level" />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionLabel}>Ubicación (opcional)</Text>
              {courts.slice(0, 3).map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setSelectedCourt(c.id)}
                  style={[styles.courtItem, selectedCourt === c.id && styles.courtItemSelected]}
                >
                  <Ionicons name="location-outline" size={16} color={selectedCourt === c.id ? colors.primary : colors.textSecondary} />
                  <Text style={[styles.courtName, { flex: 1 }, selectedCourt === c.id && { color: colors.primary }]}>{c.name}</Text>
                  {selectedCourt === c.id && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
                </TouchableOpacity>
              ))}

              <Button label="Publicar" variant="primary" fullWidth size="lg" loading={loading} onPress={handlePublish} style={styles.publishBtn} />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  modeSwitcher: { flexDirection: 'row', backgroundColor: colors.secondary, borderRadius: 10, padding: 3, gap: 3 },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 8 },
  modeBtnActive: { backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.border },
  modeBtnText: { color: colors.textSecondary, fontSize: 14, fontWeight: '500' },
  modeBtnTextActive: { color: colors.primary, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 40 },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
    marginTop: 4,
  },
  courtItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 10,
    padding: 13,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 10,
  },
  courtItemSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '12' },
  courtIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  courtName: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  courtMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  pillScroll: { marginBottom: 18 },
  pillRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.secondary, borderWidth: 1.5, borderColor: 'transparent' },
  pillActive: { borderColor: colors.primary, backgroundColor: colors.primary + '18' },
  pillText: { color: colors.textSecondary, fontSize: 14, fontWeight: '500' },
  pillTextActive: { color: colors.primary, fontWeight: '600' },
  levelRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  levelCard: { flex: 1, backgroundColor: colors.secondary, borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  levelCardActive: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 10,
    padding: 4,
    alignSelf: 'flex-start',
    marginBottom: 20,
    gap: 8,
  },
  stepperBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: colors.cardBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  stepperValue: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', minWidth: 36, textAlign: 'center' },
  textInput: {
    backgroundColor: colors.secondary,
    borderRadius: 10,
    padding: 14,
    color: colors.textPrimary,
    fontSize: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    textAlignVertical: 'top',
  },
  preview: {
    backgroundColor: colors.primary + '12',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.primary + '44',
    gap: 8,
    marginBottom: 20,
  },
  previewTitle: { color: colors.primary, fontWeight: '700', fontSize: 14, marginBottom: 4 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewText: { color: colors.textSecondary, fontSize: 13 },
  publishBtn: { marginTop: 4 },
});
