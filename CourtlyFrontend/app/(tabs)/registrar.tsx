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
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/src/theme/colors';
import { Court, Level } from '@/src/types';
import { courtsApi } from '@/src/api/courts';
import { matchesApi } from '@/src/api/matches';
import { postsApi } from '@/src/api/posts';
import { Button } from '@/src/components/Button';
import { Tag } from '@/src/components/Tag';

type Mode = 'match' | 'post';
type MatchType = 'SINGLES' | 'DOBLES';

const MATCH_TYPES: { value: MatchType; label: string; spots: number; icon: string }[] = [
  { value: 'SINGLES', label: 'Singles', spots: 1, icon: 'person-outline' },
  { value: 'DOBLES', label: 'Dobles', spots: 3, icon: 'people-outline' },
];

const ALL_LEVELS: Level[] = ['INICIACION', 'PRINCIPIANTE', 'INTERMEDIO', 'AVANZADO', 'PROFESIONAL'];

const LEVELS: { value: Level; label: string; sub: string }[] = [
  { value: 'INICIACION',   label: '5ta',  sub: '5ta categoría' },
  { value: 'PRINCIPIANTE', label: '4ta',  sub: '4ta categoría o superior' },
  { value: 'INTERMEDIO',   label: '3ra',  sub: '3ra categoría o superior' },
  { value: 'AVANZADO',     label: '2da',  sub: '2da categoría o superior' },
  { value: 'PROFESIONAL',  label: '1ra',  sub: 'Solo 1ra categoría' },
];
const TIME_SLOTS = ['6:00 AM', '7:00 AM', '8:00 AM', '5:00 PM', '6:00 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM'];
const DATE_OPTIONS = ['Hoy', 'Mañana', 'Sábado', 'Domingo', 'Lunes'];

function resolveDate(label: string): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  if (label === 'Hoy') return fmt(now);
  if (label === 'Mañana') { const d = new Date(now); d.setDate(d.getDate() + 1); return fmt(d); }
  const dayMap: Record<string, number> = { Lunes: 1, Martes: 2, Miércoles: 3, Jueves: 4, Viernes: 5, Sábado: 6, Domingo: 0 };
  const target = dayMap[label];
  if (target !== undefined) {
    const d = new Date(now);
    const diff = (target - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return fmt(d);
  }
  return fmt(now);
}

function resolveTime(label: string): string {
  const match = label.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!match) return '19:00';
  let h = parseInt(match[1], 10);
  const m = match[2];
  const period = match[3].toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m}`;
}

export default function RegistrarScreen() {
  const [mode, setMode] = useState<Mode>('match');
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);
  const [selectedLevels, setSelectedLevels] = useState<Set<Level>>(new Set(ALL_LEVELS));
  const [courtSearch, setCourtSearch] = useState('');
  const [showCourtPicker, setShowCourtPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState('Hoy');
  const [selectedTime, setSelectedTime] = useState('7:00 PM');
  const [matchType, setMatchType] = useState<MatchType>('DOBLES');
  const [players, setPlayers] = useState(3);
  const [description, setDescription] = useState('');
  const [postText, setPostText] = useState('');
  const [postPhoto, setPostPhoto] = useState<{ uri: string; base64: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCourts, setLoadingCourts] = useState(true);
  const [customLocation, setCustomLocation] = useState('');

  useEffect(() => {
    setLoadingCourts(true);
    courtsApi.getAll()
      .then(setCourts)
      .catch(() => setCourts([]))
      .finally(() => setLoadingCourts(false));
  }, []);

  const handlePickPhoto = async (source: 'camera' | 'gallery') => {
    const { status } = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso para continuar.');
      return;
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, base64: true, mediaTypes: 'images' });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPostPhoto({ uri: asset.uri, base64: asset.base64 ?? '' });
    }
  };

  const handlePublish = async () => {
    if (mode === 'match' && !selectedCourt) {
      Alert.alert('Selecciona una ubicación', 'Elige una cancha o usa "Otros" para indicar la ubicación.');
      return;
    }
    if (mode === 'match' && selectedCourt === '__otros__' && !customLocation.trim()) {
      Alert.alert('Indica la ubicación', 'Escribe la dirección o nombre del lugar.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'match') {
        const isOtros = selectedCourt === '__otros__';
        await matchesApi.create({
          courtId: isOtros ? undefined : selectedCourt!,
          customLocation: isOtros ? customLocation : undefined,
          date: resolveDate(selectedDate),
          time: resolveTime(selectedTime),
          levels: Array.from(selectedLevels),
          totalSpots: players + 1,
          matchType,
          description: description || undefined,
        });
        Alert.alert('¡Partido publicado!', 'Tu partido ya es visible para otros jugadores.', [
          { text: 'OK', onPress: () => { setSelectedCourt(null); setDescription(''); } },
        ]);
      } else {
        const postLocation = selectedCourt === '__otros__'
          ? (customLocation || undefined)
          : courts.find(c => c.id === selectedCourt)?.name;
        await postsApi.create({
          title: postText,
          location: postLocation,
          image: postPhoto ? `data:image/jpeg;base64,${postPhoto.base64}` : undefined,
        });
        Alert.alert('¡Publicación creada!', 'Tu publicación es visible en el feed.', [
          { text: 'OK', onPress: () => { setPostText(''); setSelectedCourt(null); setPostPhoto(null); } },
        ]);
      }
    } catch {
      Alert.alert('Error', 'No se pudo publicar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const court = courts.find((c) => c.id === selectedCourt);
  const locationLabel = selectedCourt === '__otros__' ? customLocation : court?.name;

  const filteredCourts = courts.filter(c => {
    const q = courtSearch.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q);
  });

  const isAllLevels = selectedLevels.size === ALL_LEVELS.length;

  const toggleLevel = (level: Level) => {
    setSelectedLevels(prev => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
        if (next.size === 0) return prev;
      } else {
        next.add(level);
      }
      return next;
    });
  };

  const levelSummary = isAllLevels
    ? 'Libre (Todas)'
    : ALL_LEVELS.filter(l => selectedLevels.has(l))
        .map(l => LEVELS.find(lvl => lvl.value === l)?.label ?? l)
        .join(', ');

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.modeSwitcher}>
          <TouchableOpacity
            onPress={() => { setMode('match'); setShowCourtPicker(false); setCourtSearch(''); }}
            style={[styles.modeBtn, mode === 'match' && styles.modeBtnActive]}
          >
            <Ionicons name="tennisball-outline" size={15} color={mode === 'match' ? colors.primary : colors.textSecondary} />
            <Text style={[styles.modeBtnText, mode === 'match' && styles.modeBtnTextActive]}>Partido</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setMode('post'); setShowCourtPicker(false); setCourtSearch(''); }}
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
              {loadingCourts ? (
                <View style={styles.courtLoader}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.courtLoaderText}>Cargando canchas...</Text>
                </View>
              ) : courts.length === 0 ? (
                <View style={styles.noCourtsBox}>
                  <Ionicons name="alert-circle-outline" size={18} color={colors.textMuted} />
                  <Text style={styles.noCourtsText}>No hay canchas registradas. Pide al administrador que agregue canchas para poder crear partidos.</Text>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.courtTrigger, showCourtPicker && styles.courtTriggerOpen]}
                    onPress={() => setShowCourtPicker(v => !v)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="tennisball-outline"
                      size={16}
                      color={selectedCourt ? colors.primary : colors.textSecondary}
                    />
                    <Text style={[styles.courtTriggerText, !!selectedCourt && styles.courtTriggerSelected]} numberOfLines={1}>
                      {selectedCourt === '__otros__'
                        ? 'Otros'
                        : selectedCourt
                          ? courts.find(c => c.id === selectedCourt)?.name
                          : 'Seleccionar cancha...'}
                    </Text>
                    <Ionicons
                      name={showCourtPicker ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>

                  {showCourtPicker && (
                    <View style={styles.courtDropdown}>
                      <View style={styles.courtSearchRow}>
                        <Ionicons name="search" size={14} color={colors.textMuted} />
                        <TextInput
                          style={styles.courtSearchInput}
                          placeholder="Buscar nombre o dirección..."
                          placeholderTextColor={colors.textMuted}
                          value={courtSearch}
                          onChangeText={setCourtSearch}
                        />
                      </View>
                      {filteredCourts.map(c => (
                        <TouchableOpacity
                          key={c.id}
                          style={[styles.courtDropdownItem, selectedCourt === c.id && styles.courtDropdownItemActive]}
                          onPress={() => { setSelectedCourt(c.id); setCustomLocation(''); setShowCourtPicker(false); setCourtSearch(''); }}
                          activeOpacity={0.75}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.courtName, selectedCourt === c.id && { color: colors.primary }]}>{c.name}</Text>
                            <Text style={styles.courtMeta}>{c.address}</Text>
                          </View>
                          {selectedCourt === c.id && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                        </TouchableOpacity>
                      ))}
                      {filteredCourts.length === 0 && (
                        <Text style={styles.courtDropdownEmpty}>Sin resultados</Text>
                      )}
                      <TouchableOpacity
                        style={[styles.courtDropdownItem, selectedCourt === '__otros__' && styles.courtDropdownItemActive]}
                        onPress={() => { setSelectedCourt('__otros__'); setShowCourtPicker(false); setCourtSearch(''); }}
                        activeOpacity={0.75}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.courtName, selectedCourt === '__otros__' && { color: colors.primary }]}>Otros</Text>
                          <Text style={styles.courtMeta}>Ingresar dirección manualmente</Text>
                        </View>
                        {selectedCourt === '__otros__' && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
              {selectedCourt === '__otros__' && (
                <TextInput
                  style={styles.textInput}
                  placeholder="Escribe la dirección o nombre del lugar..."
                  placeholderTextColor={colors.textMuted}
                  value={customLocation}
                  onChangeText={setCustomLocation}
                  autoFocus
                />
              )}

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

              <Text style={styles.sectionLabel}>Categorías</Text>
              <View style={styles.levelList}>
                <TouchableOpacity
                  onPress={() => setSelectedLevels(new Set(ALL_LEVELS))}
                  style={[styles.levelRow, isAllLevels && styles.levelRowActive]}
                  activeOpacity={0.75}
                >
                  <Tag label="LIBRE" variant="level" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.levelRowLabel, isAllLevels && { color: colors.textPrimary }]}>Libre (Todas)</Text>
                    <Text style={styles.levelRowSub}>Cualquier nivel puede unirse</Text>
                  </View>
                  {isAllLevels && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                </TouchableOpacity>
                {LEVELS.map((lvl) => {
                  const active = selectedLevels.has(lvl.value);
                  return (
                    <TouchableOpacity
                      key={lvl.value}
                      onPress={() => toggleLevel(lvl.value)}
                      style={[styles.levelRow, active && styles.levelRowActive]}
                      activeOpacity={0.75}
                    >
                      <Tag label={lvl.value} variant="level" />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.levelRowLabel, active && { color: colors.textPrimary }]}>{lvl.label}</Text>
                        <Text style={styles.levelRowSub}>{lvl.sub}</Text>
                      </View>
                      {active && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.sectionLabel}>Modalidad</Text>
              <View style={styles.matchTypeRow}>
                {MATCH_TYPES.map((mt) => (
                  <TouchableOpacity
                    key={mt.value}
                    style={[styles.matchTypeCard, matchType === mt.value && styles.matchTypeCardActive]}
                    onPress={() => { setMatchType(mt.value); setPlayers(mt.spots); }}
                    activeOpacity={0.75}
                  >
                    <Ionicons name={mt.icon as any} size={22} color={matchType === mt.value ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.matchTypeLabel, matchType === mt.value && styles.matchTypeLabelActive]}>{mt.label}</Text>
                    <Text style={styles.matchTypeSub}>{mt.spots + 1} jugadores</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionLabel}>Jugadores adicionales</Text>
              <View style={styles.stepperRow}>
                {matchType === 'SINGLES' ? (
                  <View style={styles.stepper}>
                    <View style={[styles.stepperBtn, { opacity: 0.3 }]}>
                      <Ionicons name="remove" size={20} color={colors.primary} />
                    </View>
                    <Text style={styles.stepperValue}>1</Text>
                    <View style={[styles.stepperBtn, { opacity: 0.3 }]}>
                      <Ionicons name="add" size={20} color={colors.primary} />
                    </View>
                  </View>
                ) : (
                  <View style={styles.stepper}>
                    <TouchableOpacity onPress={() => setPlayers((p) => Math.max(1, p - 1))} style={styles.stepperBtn}>
                      <Ionicons name="remove" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.stepperValue}>{players}</Text>
                    <TouchableOpacity onPress={() => setPlayers((p) => Math.min(3, p + 1))} style={styles.stepperBtn}>
                      <Ionicons name="add" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}
                <Text style={styles.stepperHint}>+ tú = <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{players + 1} total</Text></Text>
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

              {locationLabel && (
                <View style={styles.preview}>
                  <Text style={styles.previewTitle}>Resumen del partido</Text>
                  <View style={styles.previewRow}>
                    <Ionicons name="location-outline" size={15} color={colors.textSecondary} />
                    <Text style={styles.previewText}>{locationLabel}</Text>
                  </View>
                  <View style={styles.previewRow}>
                    <Ionicons name="time-outline" size={15} color={colors.textSecondary} />
                    <Text style={styles.previewText}>{selectedDate} · {selectedTime}</Text>
                  </View>
                  <View style={styles.previewRow}>
                    <Ionicons name="people-outline" size={15} color={colors.textSecondary} />
                    <Text style={styles.previewText}>{players + 1} jugadores · {matchType === 'SINGLES' ? 'Singles' : 'Dobles'} · {levelSummary}</Text>
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

              <Text style={styles.sectionLabel}>Foto (opcional)</Text>
              {postPhoto ? (
                <View style={styles.photoPreviewBox}>
                  <Image source={{ uri: postPhoto.uri }} style={styles.photoPreview} resizeMode="cover" />
                  <TouchableOpacity style={styles.photoRemove} onPress={() => setPostPhoto(null)}>
                    <Ionicons name="close-circle" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoRow}>
                  <TouchableOpacity style={styles.photoBtn} onPress={() => handlePickPhoto('camera')} activeOpacity={0.75}>
                    <Ionicons name="camera-outline" size={20} color={colors.primary} />
                    <Text style={styles.photoBtnText}>Cámara</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.photoBtn} onPress={() => handlePickPhoto('gallery')} activeOpacity={0.75}>
                    <Ionicons name="image-outline" size={20} color={colors.primary} />
                    <Text style={styles.photoBtnText}>Galería</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={styles.sectionLabel}>Ubicación (opcional)</Text>
              <TouchableOpacity
                style={[styles.courtTrigger, showCourtPicker && styles.courtTriggerOpen]}
                onPress={() => setShowCourtPicker(v => !v)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={selectedCourt ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.courtTriggerText, !!selectedCourt && styles.courtTriggerSelected]} numberOfLines={1}>
                  {selectedCourt === '__otros__'
                    ? 'Otros'
                    : selectedCourt
                      ? courts.find(c => c.id === selectedCourt)?.name
                      : 'Agregar ubicación...'}
                </Text>
                {selectedCourt ? (
                  <TouchableOpacity onPress={(e) => { e.stopPropagation(); setSelectedCourt(null); setCustomLocation(''); }} hitSlop={8}>
                    <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                ) : (
                  <Ionicons name={showCourtPicker ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textMuted} />
                )}
              </TouchableOpacity>

              {showCourtPicker && (
                <View style={styles.courtDropdown}>
                  <View style={styles.courtSearchRow}>
                    <Ionicons name="search" size={14} color={colors.textMuted} />
                    <TextInput
                      style={styles.courtSearchInput}
                      placeholder="Buscar nombre o dirección..."
                      placeholderTextColor={colors.textMuted}
                      value={courtSearch}
                      onChangeText={setCourtSearch}
                    />
                  </View>
                  {filteredCourts.map(c => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.courtDropdownItem, selectedCourt === c.id && styles.courtDropdownItemActive]}
                      onPress={() => { setSelectedCourt(c.id); setCustomLocation(''); setShowCourtPicker(false); setCourtSearch(''); }}
                      activeOpacity={0.75}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.courtName, selectedCourt === c.id && { color: colors.primary }]}>{c.name}</Text>
                        <Text style={styles.courtMeta}>{c.address}</Text>
                      </View>
                      {selectedCourt === c.id && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                    </TouchableOpacity>
                  ))}
                  {filteredCourts.length === 0 && (
                    <Text style={styles.courtDropdownEmpty}>Sin resultados</Text>
                  )}
                  <TouchableOpacity
                    style={[styles.courtDropdownItem, selectedCourt === '__otros__' && styles.courtDropdownItemActive]}
                    onPress={() => { setSelectedCourt('__otros__'); setShowCourtPicker(false); setCourtSearch(''); }}
                    activeOpacity={0.75}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.courtName, selectedCourt === '__otros__' && { color: colors.primary }]}>Otros</Text>
                      <Text style={styles.courtMeta}>Ingresar ubicación manualmente</Text>
                    </View>
                    {selectedCourt === '__otros__' && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                  </TouchableOpacity>
                </View>
              )}
              {selectedCourt === '__otros__' && (
                <TextInput
                  style={styles.textInput}
                  placeholder="Escribe la dirección o ubicación..."
                  placeholderTextColor={colors.textMuted}
                  value={customLocation}
                  onChangeText={setCustomLocation}
                />
              )}

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
  levelList: { gap: 6, marginBottom: 20 },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 10,
    padding: 13,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  levelRowActive: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  levelRowLabel: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  levelRowSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
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
  matchTypeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  matchTypeCard: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.secondary, borderRadius: 12,
    paddingVertical: 16, gap: 6,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  matchTypeCardActive: { borderColor: colors.primary, backgroundColor: colors.primary + '12' },
  matchTypeLabel: { color: colors.textSecondary, fontSize: 15, fontWeight: '700' },
  matchTypeLabelActive: { color: colors.primary },
  matchTypeSub: { color: colors.textMuted, fontSize: 12 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  stepperHint: { color: colors.textSecondary, fontSize: 14 },
  photoRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  photoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.secondary, borderRadius: 10, paddingVertical: 14,
    borderWidth: 1.5, borderColor: colors.primary + '50',
  },
  photoBtnText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  photoPreviewBox: { position: 'relative', marginBottom: 20, borderRadius: 12, overflow: 'hidden' },
  photoPreview: { width: '100%', height: 200, borderRadius: 12 },
  photoRemove: { position: 'absolute', top: 8, right: 8 },
  courtLoader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 4, marginBottom: 8 },
  courtLoaderText: { color: colors.textMuted, fontSize: 14 },
  noCourtsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.secondary,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noCourtsText: { color: colors.textMuted, fontSize: 13, flex: 1, lineHeight: 19 },
  courtTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 10,
    padding: 13,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 10,
  },
  courtTriggerOpen: { borderColor: colors.primary },
  courtTriggerText: { flex: 1, color: colors.textMuted, fontSize: 14 },
  courtTriggerSelected: { color: colors.textPrimary, fontWeight: '600' as const },
  courtDropdown: {
    backgroundColor: colors.secondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    overflow: 'hidden' as const,
  },
  courtSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  courtSearchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    paddingVertical: 0,
  },
  courtDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  courtDropdownItemActive: { backgroundColor: colors.primary + '12' },
  courtDropdownEmpty: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center' as const,
    paddingVertical: 14,
  },
});
