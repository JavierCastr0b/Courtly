import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

const PALETTE = [
  '#1E90FF',
  '#FF6B00',
  '#34C759',
  '#FF3B30',
  '#AF52DE',
  '#FF9500',
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
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.background,
  },
});
