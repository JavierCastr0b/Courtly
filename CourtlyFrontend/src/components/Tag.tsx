import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, levelColor, LevelType } from '../theme/colors';

interface TagProps {
  label: string;
  variant?: 'level' | 'default' | 'success' | 'warning' | 'muted';
  level?: LevelType;
  style?: ViewStyle;
}

export function Tag({ label, variant = 'default', level, style }: TagProps) {
  let bgColor = colors.secondary;
  let textColor = colors.textSecondary;

  if (variant === 'level' && level) {
    bgColor = levelColor[level] + '22';
    textColor = levelColor[level];
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

  return (
    <View style={[styles.tag, { backgroundColor: bgColor }, style]}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
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
