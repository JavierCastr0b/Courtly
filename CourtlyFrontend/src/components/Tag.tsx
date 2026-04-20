import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, levelColor, levelDisplay, LevelType } from '../theme/colors';

interface TagProps {
  label: string;
  variant?: 'level' | 'default' | 'success' | 'warning' | 'muted';
  level?: string;
  style?: ViewStyle;
}

export function Tag({ label, variant = 'default', level, style }: TagProps) {
  let bgColor = colors.secondary;
  let textColor = colors.textSecondary;

  if (variant === 'level') {
    const key = level ?? label;
    bgColor = (levelColor[key] ?? colors.primary) + '22';
    textColor = levelColor[key] ?? colors.primary;
  } else if (variant === 'success') {
    bgColor = colors.success + '22';
    textColor = colors.success;
  } else if (variant === 'warning') {
    bgColor = colors.warning + '22';
    textColor = colors.warning;
  } else if (variant === 'muted') {
    bgColor = colors.border;
    textColor = colors.textMuted;
  }

  const displayLabel = levelDisplay[label] ?? label;

  return (
    <View style={[styles.tag, { backgroundColor: bgColor }, style]}>
      <Text style={[styles.label, { color: textColor }]}>{displayLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
