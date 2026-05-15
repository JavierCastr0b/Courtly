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
  overlay: 'rgba(0,0,0,0.7)',
  shimmer: '#262D3A',
};

export type LevelType = 'PRIMERA' | 'SEGUNDA' | 'TERCERA' | 'CUARTA' | 'QUINTA' | 'SEXTA';

export const levelColor: Record<string, string> = {
  PRIMERA: '#34C759',
  SEGUNDA: '#00BFA5',
  TERCERA: '#1E90FF',
  CUARTA: '#8E44AD',
  QUINTA: '#FF6B00',
  SEXTA: '#E74C3C',
};

export const levelDisplay: Record<string, string> = {
  PRIMERA: '1ra',
  SEGUNDA: '2da',
  TERCERA: '3ra',
  CUARTA: '4ta',
  QUINTA: '5ta',
  SEXTA: '6ta',
};
