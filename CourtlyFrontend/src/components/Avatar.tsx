import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const PALETTE = [
  '#1E90FF',
  '#14B8A6',
  '#22C55E',
  '#FF3B30',
  '#AF52DE',
  '#F59E0B',
  '#5AC8FA',
];

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function computeInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

interface AvatarProps {
  name: string;
  initials?: string;
  size?: number;
  available?: boolean;
  style?: ViewStyle;
}

export function Avatar({ name, initials, size = 44, available = false, style }: AvatarProps) {
  const { colors } = useTheme();
  initials = initials ?? computeInitials(name);
  const bg = getColor(name);
  const fontSize = size * 0.38;

  return (
    <View style={[styles.wrapper, style]}>
      <View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
        ]}
      >
        <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
      </View>
      {available && (
        <View style={[
          styles.badge,
          {
            width: size * 0.27,
            height: size * 0.27,
            borderRadius: size * 0.135,
            bottom: 0,
            right: 0,
            backgroundColor: colors.success,
            borderColor: colors.background,
          },
        ]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badge: {
    position: 'absolute',
    borderWidth: 2,
  },
});
