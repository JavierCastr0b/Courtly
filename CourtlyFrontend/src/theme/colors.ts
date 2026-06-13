export const colors = {
  background: '#0B0F14',
  primary: '#1E90FF',
  accent: '#FFFFFF',
  secondary: '#1C2028',
  surface: '#161B22',
  ctaHighlight: '#FF6B00',
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E93',
  textMuted: '#4A5568',
  border: '#2C3038',
  success: '#34C759',
  warning: '#FFD60A',
  cardBg: '#1C2028',
  tabBar: '#0D1117',
  tabBarBorder: '#1C2028',
  beginner: '#34C759',
  intermediate: '#1E90FF',
  advanced: '#FF6B00',
  overlay: 'rgba(0,0,0,0.7)',
  shimmer: '#262D3A',
};

export type LevelType = 'Iniciación' | 'Intermedio' | 'Avanzado' | 'Profesional';

export const levelColor: Record<string, string> = {
  LIBRE:        '#52D68A',
  INICIACION:   '#52D68A',
  PRINCIPIANTE: colors.beginner,
  INTERMEDIO:   colors.intermediate,
  AVANZADO:     colors.advanced,
  PROFESIONAL:  '#9B59B6',
};

export const levelDisplay: Record<string, string> = {
  LIBRE:        'Libre',
  INICIACION:   '5ta',
  PRINCIPIANTE: '4ta',
  INTERMEDIO:   '3ra',
  AVANZADO:     '2da',
  PROFESIONAL:  '1ra',
};
