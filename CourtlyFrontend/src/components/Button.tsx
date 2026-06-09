import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'cta';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const SIZE_PADDING: Record<string, { paddingVertical: number; paddingHorizontal: number }> = {
  sm: { paddingVertical: 6, paddingHorizontal: 14 },
  md: { paddingVertical: 10, paddingHorizontal: 20 },
  lg: { paddingVertical: 14, paddingHorizontal: 28 },
};

const SIZE_FONT: Record<string, number> = { sm: 13, md: 15, lg: 16 };

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const { colors } = useTheme();

  const bg: Record<string, string> = {
    primary: colors.primary,
    secondary: colors.secondary,
    outline: 'transparent',
    ghost: 'transparent',
    cta: colors.accent,
  };

  const textColor: Record<string, string> = {
    primary: '#fff',
    secondary: colors.textPrimary,
    outline: colors.primary,
    ghost: colors.primary,
    cta: '#fff',
  };

  const containerStyle: ViewStyle = {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: bg[variant],
    ...SIZE_PADDING[size],
    ...(fullWidth ? { alignSelf: 'stretch' as const } : {}),
    ...(variant === 'outline' ? { borderWidth: 1.5, borderColor: colors.primary } : {}),
    ...((disabled || loading) ? { opacity: 0.45 } : {}),
    ...(style as object ?? {}),
  };

  const labelStyle: TextStyle = {
    fontWeight: '600',
    color: textColor[variant],
    fontSize: SIZE_FONT[size],
    ...(textStyle as object ?? {}),
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={containerStyle}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : '#fff'}
        />
      ) : (
        <Text style={labelStyle}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
