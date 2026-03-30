import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
}

export function Card({ children, style, noPadding = false }: CardProps) {
  return (
    <View style={[styles.card, !noPadding && styles.padding, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  padding: {
    padding: 14,
  },
});
