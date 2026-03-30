import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '../theme/colors';

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
  const containerStyle: ViewStyle[] = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style as ViewStyle,
  ].filter(Boolean) as ViewStyle[];

  const labelStyle: TextStyle[] = [
    styles.label,
    styles[`label_${variant}`],
    styles[`labelSize_${size}`],
    textStyle as TextStyle,
  ].filter(Boolean) as TextStyle[];

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

const styles = StyleSheet.create({
  base: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  cta: {
    backgroundColor: colors.ctaHighlight,
  },
  size_sm: {
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  size_md: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  size_lg: {
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontWeight: '600',
  },
  label_primary: {
    color: '#fff',
  },
  label_secondary: {
    color: colors.textPrimary,
  },
  label_outline: {
    color: colors.primary,
  },
  label_ghost: {
    color: colors.primary,
  },
  label_cta: {
    color: '#fff',
  },
  labelSize_sm: {
    fontSize: 13,
  },
  labelSize_md: {
    fontSize: 15,
  },
  labelSize_lg: {
    fontSize: 16,
  },
});
