import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { Avatar } from './Avatar';

// ─── Types ────────────────────────────────────────────────────────────────────

type Availability = 'DISPONIBLE_HOY' | 'DISPONIBLE_SEMANA' | 'NO_DISPONIBLE';

export interface InviteCandidate {
  id: string;
  name: string;
  level: string;
  availability: Availability;
  compatScore: number;
  isFriend: boolean;
}

export interface InvitePlayersSheetProps {
  visible: boolean;
  invitedIds: Set<string>;
  onInvite: (playerId: string) => void;
  onClose: () => void;
  matchLevel?: string;
  spotsLeft?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LEVEL_DISPLAY: Record<string, string> = {
  INICIACION: 'Iniciación', PRINCIPIANTE: 'Principiante',
  INTERMEDIO: 'Intermedio', AVANZADO: 'Avanzado', PROFESIONAL: 'Profesional',
};

export const MOCK_CANDIDATES: InviteCandidate[] = [
  { id: 'ip1',  name: 'Hugo Martínez',  level: 'AVANZADO',     availability: 'DISPONIBLE_HOY',    compatScore: 98, isFriend: true },
  { id: 'ip2',  name: 'Pedro Salinas',  level: 'INTERMEDIO',   availability: 'DISPONIBLE_HOY',    compatScore: 94, isFriend: true },
  { id: 'ip3',  name: 'Nicolás Vera',   level: 'AVANZADO',     availability: 'DISPONIBLE_SEMANA', compatScore: 91, isFriend: true },
  { id: 'ip4',  name: 'Matías Ruiz',    level: 'INTERMEDIO',   availability: 'DISPONIBLE_SEMANA', compatScore: 87, isFriend: true },
  { id: 'ip5',  name: 'Luis Morales',   level: 'PRINCIPIANTE', availability: 'NO_DISPONIBLE',     compatScore: 72, isFriend: true },
  { id: 'ip6',  name: 'Carlos Ramos',   level: 'AVANZADO',     availability: 'DISPONIBLE_HOY',    compatScore: 88, isFriend: true },
  { id: 'ip7',  name: 'Diego Flores',   level: 'INTERMEDIO',   availability: 'DISPONIBLE_HOY',    compatScore: 96, isFriend: false },
  { id: 'ip8',  name: 'Andrés Torres',  level: 'AVANZADO',     availability: 'DISPONIBLE_SEMANA', compatScore: 93, isFriend: false },
  { id: 'ip9',  name: 'Roberto Lima',   level: 'INTERMEDIO',   availability: 'DISPONIBLE_HOY',    compatScore: 90, isFriend: false },
  { id: 'ip10', name: 'Fernanda Cruz',  level: 'AVANZADO',     availability: 'DISPONIBLE_SEMANA', compatScore: 85, isFriend: false },
  { id: 'ip11', name: 'Valentina Díaz', level: 'INTERMEDIO',   availability: 'DISPONIBLE_HOY',    compatScore: 82, isFriend: false },
  { id: 'ip12', name: 'Camila Reyes',   level: 'PRINCIPIANTE', availability: 'DISPONIBLE_SEMANA', compatScore: 75, isFriend: false },
  { id: 'ip13', name: 'Santiago Muñoz', level: 'INTERMEDIO',   availability: 'NO_DISPONIBLE',     compatScore: 68, isFriend: false },
  { id: 'ip14', name: 'Pablo Herrera',  level: 'PRINCIPIANTE', availability: 'DISPONIBLE_HOY',    compatScore: 62, isFriend: false },
  { id: 'ip15', name: 'Ignacio Ponce',  level: 'AVANZADO',     availability: 'NO_DISPONIBLE',     compatScore: 55, isFriend: false },
];

// ─── CandidateRow ─────────────────────────────────────────────────────────────

function CandidateRow({ candidate, isInvited, onInvite, showCompat }: {
  candidate: InviteCandidate;
  isInvited: boolean;
  onInvite: () => void;
  showCompat: boolean;
}) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (isInvited) return;
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.92, duration: 80,  useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1,    duration: 130, useNativeDriver: true }),
    ]).start();
    onInvite();
  };

  const availColor = {
    DISPONIBLE_HOY:    colors.success,
    DISPONIBLE_SEMANA: colors.primary,
    NO_DISPONIBLE:     colors.textMuted,
  }[candidate.availability];

  const availLabel = {
    DISPONIBLE_HOY:    'Disponible hoy',
    DISPONIBLE_SEMANA: 'Esta semana',
    NO_DISPONIBLE:     'No disponible',
  }[candidate.availability];

  const compatColor = candidate.compatScore >= 85 ? colors.success
    : candidate.compatScore >= 70 ? colors.primary
    : colors.textMuted;

  const compatLabel = candidate.compatScore >= 85 ? 'Muy compatible'
    : candidate.compatScore >= 70 ? 'Compatible'
    : 'Menos compatible';

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.border,
    }}>
      <Avatar name={candidate.name} size={40} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 14 }}>{candidate.name}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{LEVEL_DISPLAY[candidate.level] ?? candidate.level}</Text>
        {showCompat ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: compatColor }} />
            <Text style={{ color: compatColor, fontSize: 11, fontWeight: '700' }}>
              {candidate.compatScore}% · {compatLabel}
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: availColor }} />
            <Text style={{ color: availColor, fontSize: 11, fontWeight: '500' }}>{availLabel}</Text>
          </View>
        )}
      </View>
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          onPress={handlePress}
          disabled={isInvited}
          activeOpacity={0.75}
          style={{
            paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
            backgroundColor: isInvited ? colors.success + '18' : colors.primary,
            borderWidth: isInvited ? 1 : 0,
            borderColor: isInvited ? colors.success + '50' : 'transparent',
          }}
        >
          <Text style={{ color: isInvited ? colors.success : '#fff', fontSize: 13, fontWeight: '700' }}>
            {isInvited ? 'Invitado ✓' : 'Invitar'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ─── Main sheet ───────────────────────────────────────────────────────────────

export function InvitePlayersSheet({
  visible, invitedIds, onInvite, onClose,
}: InvitePlayersSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const [bannerMsg, setBannerMsg] = useState('');

  const friends    = MOCK_CANDIDATES.filter(c => c.isFriend);
  const compatible = MOCK_CANDIDATES.filter(c => !c.isFriend).sort((a, b) => b.compatScore - a.compatScore);

  const showBanner = (msg: string) => {
    setBannerMsg(msg);
    Animated.sequence([
      Animated.timing(bannerOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(bannerOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const handleInviteAll = () => {
    const targets = compatible.filter(c => !invitedIds.has(c.id)).slice(0, 5);
    if (targets.length === 0) {
      showBanner('Todos los jugadores compatibles ya fueron invitados');
      return;
    }
    targets.forEach(c => onInvite(c.id));
    const n = targets.length;
    showBanner(`${n} jugador${n > 1 ? 'es' : ''} compatible${n > 1 ? 's' : ''} invitado${n > 1 ? 's' : ''}`);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' }}>
        <View style={{
          backgroundColor: colors.background,
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          maxHeight: '92%',
          paddingBottom: Math.max(insets.bottom, 16),
        }}>

          {/* Handle */}
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginTop: 10, marginBottom: 2 }} />

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 19, fontWeight: '800' }}>Invitar jugadores</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 3, lineHeight: 18 }}>
                Llena tu partido más rápido invitando jugadores compatibles.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={{ padding: 6, backgroundColor: colors.secondary, borderRadius: 10, marginTop: 2 }}>
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Success banner */}
          <Animated.View style={{ opacity: bannerOpacity, marginHorizontal: 20, marginBottom: 4 }}>
            <View style={{
              backgroundColor: colors.success + '18', borderRadius: 10,
              borderWidth: 1, borderColor: colors.success + '40',
              paddingHorizontal: 12, paddingVertical: 9,
              flexDirection: 'row', alignItems: 'center', gap: 8,
            }}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={{ color: colors.success, fontSize: 13, fontWeight: '600' }}>{bannerMsg}</Text>
            </View>
          </Animated.View>

          {/* Invitar compatibles CTA */}
          <TouchableOpacity
            onPress={handleInviteAll}
            activeOpacity={0.8}
            style={{
              marginHorizontal: 20, marginVertical: 10,
              flexDirection: 'row', alignItems: 'center', gap: 10,
              backgroundColor: colors.accent + '15', borderRadius: 12,
              borderWidth: 1, borderColor: colors.accent + '40',
              padding: 12,
            }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.accent + '22', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="flash" size={18} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>Invitar compatibles</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>Selecciona automáticamente los mejores jugadores</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.accent} />
          </TouchableOpacity>

          {/* Scrollable list */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}>

            {/* Friends */}
            <View style={{ marginBottom: 22 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700' }}>Amigos</Text>
                <View style={{ backgroundColor: colors.primary + '18', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>{friends.length}</Text>
                </View>
              </View>
              {friends.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 24, gap: 8 }}>
                  <Ionicons name="people-outline" size={34} color={colors.textMuted} />
                  <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center' }}>No tienes amigos todavía</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center' }}>Sigue jugadores para encontrarlos aquí</Text>
                </View>
              ) : (
                friends.map(c => (
                  <CandidateRow
                    key={c.id}
                    candidate={c}
                    isInvited={invitedIds.has(c.id)}
                    onInvite={() => onInvite(c.id)}
                    showCompat={false}
                  />
                ))
              )}
            </View>

            {/* Compatible players */}
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700' }}>Jugadores compatibles</Text>
                <View style={{ backgroundColor: colors.success + '18', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ color: colors.success, fontSize: 12, fontWeight: '700' }}>{compatible.length}</Text>
                </View>
              </View>
              {compatible.map(c => (
                <CandidateRow
                  key={c.id}
                  candidate={c}
                  isInvited={invitedIds.has(c.id)}
                  onInvite={() => onInvite(c.id)}
                  showCompat
                />
              ))}
            </View>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
