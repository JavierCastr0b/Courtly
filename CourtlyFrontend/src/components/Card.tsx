import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
}

export function Card({ children, style, noPadding = false }: CardProps) {
  const { colors } = useTheme();
  return (
    <View style={[
      {
        backgroundColor: colors.cardBg,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
      },
      !noPadding && { padding: 14 },
      style,
    ]}>
      {children}
    </View>
  );
}
