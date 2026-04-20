import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { Court, Match } from '@/src/types';
import { courtsApi } from '@/src/api/courts';
import { Button } from '@/src/components/Button';
import { Tag } from '@/src/components/Tag';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_H = SCREEN_HEIGHT * 0.44;

const FILTERS = ['Nivel', 'Hora', 'Distancia'];
const LEVEL_OPTS = ['Todos', 'PRINCIPIANTE', 'INTERMEDIO', 'AVANZADO'];
const LEVEL_LABELS: Record<string, string> = {
  PRINCIPIANTE: 'Principiante',
  INTERMEDIO: 'Intermedio',
  AVANZADO: 'Avanzado',
};

const INITIAL_REGION = {
  latitude: -12.105,
  longitude: -77.025,
  latitudeDelta: 0.09,
  longitudeDelta: 0.07,
};

export default function MapasScreen() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [courtMatches, setCourtMatches] = useState<Record<string, Match[]>>({});
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState('Todos');
  const sheetY = useRef(new Animated.Value(BOTTOM_SHEET_H)).current;
  const isSheetOpen = useRef(false);

  useEffect(() => {
    courtsApi.getAll().then(setCourts).catch(() => {});
  }, []);

  const loadMatches = (court: Court) => {
    if (!courtMatches[court.id]) {
      courtsApi.getMatches(court.id)
        .then(m => setCourtMatches(prev => ({ ...prev, [court.id]: m })))
        .catch(() => {});
    }
  };

  const openSheet = (court: Court) => {
    setSelectedCourt(court);
    loadMatches(court);
    Animated.spring(sheetY, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
    isSheetOpen.current = true;
  };

  const closeSheet = () => {
    Animated.timing(sheetY, { toValue: BOTTOM_SHEET_H, duration: 260, useNativeDriver: true }).start(() => {
      setSelectedCourt(null);
      isSheetOpen.current = false;
    });
  };

  const filteredMatches = (courtId: string): Match[] => {
    let ms = courtMatches[courtId] ?? [];
    if (levelFilter !== 'Todos') ms = ms.filter((m) => m.level === levelFilter);
    return ms;
  };

  return (
    <View style={styles.root}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_DEFAULT}
        initialRegion={INITIAL_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        userInterfaceStyle="dark"
      >
        {courts.map((court) => (
          <Marker
            key={court.id}
            coordinate={{ latitude: court.latitude, longitude: court.longitude }}
            onPress={() => openSheet(court)}
          >
            <View style={[
              styles.markerContainer,
              selectedCourt?.id === court.id && styles.markerSelected,
            ]}>
              <Ionicons name="tennisball" size={14} color="#fff" />
              <Text style={styles.markerCount}>{court.totalCourts}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      <SafeAreaView edges={['top']} style={styles.topOverlay} pointerEvents="box-none">
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <Text style={styles.searchText}>Buscar ubicaciones</Text>
          <TouchableOpacity style={styles.savedBtn}>
            <Ionicons name="bookmark-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.savedText}>Guardado</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <TouchableOpacity style={[styles.filterChip, styles.filterChipPrimary]}>
            <Ionicons name="tennisball-outline" size={13} color={colors.primary} />
            <Text style={styles.filterChipPrimaryText}>Canchas</Text>
            <Ionicons name="chevron-down" size={13} color={colors.primary} />
          </TouchableOpacity>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(activeFilter === f ? null : f)}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>{f}</Text>
              <Ionicons name="chevron-down" size={12} color={activeFilter === f ? colors.primary : colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {activeFilter === 'Nivel' && (
          <View style={styles.dropdown}>
            {LEVEL_OPTS.map((l) => (
              <TouchableOpacity
                key={l}
                onPress={() => { setLevelFilter(l); setActiveFilter(null); }}
                style={[styles.dropdownItem, levelFilter === l && styles.dropdownItemActive]}
              >
                <Text style={[styles.dropdownText, levelFilter === l && styles.dropdownTextActive]}>
                  {l === 'Todos' ? 'Todos' : LEVEL_LABELS[l]}
                </Text>
                {levelFilter === l && <Ionicons name="checkmark" size={14} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </SafeAreaView>

      <View style={styles.mapControls}>
        <TouchableOpacity style={styles.mapControlBtn}>
          <Text style={styles.mapControlText}>3D</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.mapControlBtn}>
          <Ionicons name="locate" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.floatingCTA}>
        <TouchableOpacity style={styles.ctaButton}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.ctaButtonText}>Crear partido</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: sheetY }] }]}>
        <View style={styles.sheetHandle} />

        {selectedCourt && (
          <>
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetCourtName}>{selectedCourt.name}</Text>
                <View style={styles.sheetMeta}>
                  <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
                  <Text style={styles.sheetMetaText}>{selectedCourt.address}</Text>
                  <Text style={styles.sheetDot}>·</Text>
                  <Ionicons name="tennisball-outline" size={13} color={colors.textSecondary} />
                  <Text style={styles.sheetMetaText}>{selectedCourt.totalCourts} canchas</Text>
                </View>
              </View>
              <TouchableOpacity onPress={closeSheet} style={styles.sheetCloseBtn}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.sheetTagRow}>
              <View style={styles.sheetTag}>
                <Text style={styles.sheetTagText}>{selectedCourt.surface}</Text>
              </View>
            </View>

            <Text style={styles.sheetSectionLabel}>Partidos disponibles</Text>
            <ScrollView style={styles.sheetMatchList} showsVerticalScrollIndicator={false}>
              {filteredMatches(selectedCourt.id).length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No hay partidos con este filtro.</Text>
                </View>
              ) : (
                filteredMatches(selectedCourt.id).map((match) => (
                  <View key={match.id} style={styles.sheetMatchCard}>
                    <View style={styles.sheetMatchLeft}>
                      <Text style={styles.sheetMatchTime}>{match.date} · {match.time}</Text>
                      <Tag label={match.level} variant="level" style={{ marginTop: 4 }} />
                    </View>
                    <View style={styles.sheetMatchRight}>
                      <View style={styles.spotsRow}>
                        <Ionicons
                          name="people-outline"
                          size={13}
                          color={match.spotsLeft === 1 ? colors.ctaHighlight : colors.textSecondary}
                        />
                        <Text style={[styles.spotsText, match.spotsLeft === 1 && { color: colors.ctaHighlight }]}>
                          {match.spotsLeft} {match.spotsLeft === 1 ? 'lugar' : 'lugares'}
                        </Text>
                      </View>
                      <Button label="Unirme" variant="primary" size="sm" onPress={() => {}} style={{ marginTop: 8 }} />
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginHorizontal: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  searchText: { flex: 1, color: colors.textMuted, fontSize: 14 },
  savedBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderLeftWidth: 1, borderLeftColor: colors.border, paddingLeft: 10 },
  savedText: { color: colors.textSecondary, fontSize: 13 },
  filterRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipPrimary: { borderColor: colors.primary, backgroundColor: colors.primary + '18' },
  filterChipPrimaryText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  filterChipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  filterChipText: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' },
  filterChipTextActive: { color: colors.primary, fontWeight: '600' },
  dropdown: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemActive: { backgroundColor: colors.primary + '12' },
  dropdownText: { color: colors.textSecondary, fontSize: 14 },
  dropdownTextActive: { color: colors.primary, fontWeight: '600' },
  mapControls: { position: 'absolute', right: 14, bottom: BOTTOM_SHEET_H * 0.15 + 80, gap: 8, zIndex: 5 },
  mapControlBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapControlText: { color: colors.textPrimary, fontSize: 12, fontWeight: '700' },
  floatingCTA: { position: 'absolute', alignSelf: 'center', bottom: 100, zIndex: 10 },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.ctaHighlight,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 12,
    shadowColor: colors.ctaHighlight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  ctaButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  markerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  markerSelected: { backgroundColor: colors.ctaHighlight, transform: [{ scale: 1.1 }] },
  markerCount: { color: '#fff', fontSize: 12, fontWeight: '700' },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BOTTOM_SHEET_H,
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 20,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 8,
  },
  sheetCourtName: { color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
  sheetMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  sheetMetaText: { color: colors.textSecondary, fontSize: 12 },
  sheetDot: { color: colors.textMuted },
  sheetCloseBtn: { padding: 4, marginLeft: 8 },
  sheetTagRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 18, marginBottom: 14 },
  sheetTag: { backgroundColor: colors.secondary, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  sheetTagText: { color: colors.textSecondary, fontSize: 12, fontWeight: '500' },
  sheetSectionLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 18,
    marginBottom: 8,
  },
  sheetMatchList: { flex: 1, paddingHorizontal: 18 },
  sheetMatchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetMatchLeft: { flex: 1 },
  sheetMatchRight: { alignItems: 'flex-end' },
  sheetMatchTime: { color: colors.textPrimary, fontWeight: '600', fontSize: 14 },
  spotsRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  spotsText: { color: colors.textSecondary, fontSize: 12, fontWeight: '500' },
  emptyState: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { color: colors.textMuted, fontSize: 14 },
});
