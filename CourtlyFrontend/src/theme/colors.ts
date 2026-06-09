export interface Colors {
  background: string;
  primary: string;
  accent: string;
  ctaHighlight: string;
  secondary: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  cardBg: string;
  tabBar: string;
  tabBarBorder: string;
  overlay: string;
  shimmer: string;
  urgentBg: string;
}

export const darkColors: Colors = {
  background: '#050B18',
  primary: '#040ECB',
  accent: '#14B8A6',
  ctaHighlight: '#14B8A6',
  secondary: '#1E293B',
  surface: '#111827',
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#263244',
  success: '#22C55E',
  warning: '#F59E0B',
  cardBg: '#111827',
  tabBar: '#050B18',
  tabBarBorder: '#263244',
  overlay: 'rgba(0,0,0,0.7)',
  shimmer: '#1E293B',
  urgentBg: '#0D1F1A',
};

export const lightColors: Colors = {
  background: '#F6FDFB',
  primary: '#040ECB',
  accent: '#14B8A6',
  ctaHighlight: '#14B8A6',
  secondary: '#F1F5F9',
  surface: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  border: '#E2E8F0',
  success: '#22C55E',
  warning: '#F59E0B',
  cardBg: '#FFFFFF',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
  overlay: 'rgba(0,0,0,0.4)',
  shimmer: '#E2E8F0',
  urgentBg: '#F0FDFB',
};

export const colors: Colors = darkColors;

export type LevelType = 'Iniciación' | 'Intermedio' | 'Avanzado' | 'Profesional';

export const levelColor: Record<string, string> = {
  INICIACION:   '#34D399',
  PRINCIPIANTE: '#22C55E',
  INTERMEDIO:   '#818CF8',
  AVANZADO:     '#14B8A6',
  PROFESIONAL:  '#C084FC',
};

export const levelDisplay: Record<string, string> = {
  INICIACION:  '5ta',
  PRINCIPIANTE: '4ta',
  INTERMEDIO: '3ra',
  AVANZADO: '2da',
  PROFESIONAL: '1ra',
};
