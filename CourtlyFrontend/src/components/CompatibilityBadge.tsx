import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { CompatibilityResult } from '../utils/compatibility';

interface Props {
  result: CompatibilityResult;
  /** sm = score pill only  |  md = pill + label + reason chips */
  size?: 'sm' | 'md';
  maxReasons?: number;
  style?: ViewStyle;
}

export function CompatibilityBadge({ result, size = 'sm', maxReasons = 2, style }: Props) {
  const { colors } = useTheme();

  const tint =
    result.color === 'high'   ? colors.accent :
    result.color === 'medium' ? colors.primary :
    colors.textMuted;

  if (size === 'sm') {
    return (
      <View style={[{
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: tint + '18',
        borderRadius: 10, borderWidth: 1, borderColor: tint + '45',
        paddingHorizontal: 7, paddingVertical: 3,
      }, style]}>
        <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: tint }} />
        <Text style={{ color: tint, fontSize: 11, fontWeight: '700' }}>{result.score}%</Text>
      </View>
    );
  }

  // md — pill + label + reason chips
  const visible = result.reasons.slice(0, maxReasons);
  return (
    <View style={style}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: tint + '15',
        borderRadius: 12, borderWidth: 1, borderColor: tint + '40',
        paddingHorizontal: 12, paddingVertical: 8,
        marginBottom: visible.length > 0 ? 8 : 0,
        alignSelf: 'flex-start',
      }}>
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: tint }} />
        <Text style={{ color: tint, fontSize: 15, fontWeight: '800' }}>{result.score}%</Text>
        <Text style={{ color: tint + 'CC', fontSize: 13, fontWeight: '500' }}>{result.label}</Text>
      </View>
      {visible.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {visible.map(r => (
            <View key={r} style={{
              backgroundColor: colors.secondary,
              borderRadius: 10, borderWidth: 1, borderColor: colors.border,
              paddingHorizontal: 9, paddingVertical: 4,
            }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{r}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
