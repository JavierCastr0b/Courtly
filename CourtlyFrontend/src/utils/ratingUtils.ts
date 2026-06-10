// ─── Types ───────────────────────────────────────────────────────────────────

export type RatingBadge = 'PUNTUAL' | 'BUEN_NIVEL' | 'CONFIABLE' | 'BUENA_VIBRA' | 'RECOMENDADO';

export const BADGE_CONFIG: Record<RatingBadge, { label: string; icon: string }> = {
  PUNTUAL:     { label: 'Puntual',          icon: 'time-outline' },
  BUEN_NIVEL:  { label: 'Buen nivel',        icon: 'tennisball-outline' },
  CONFIABLE:   { label: 'Partner confiable', icon: 'shield-checkmark-outline' },
  BUENA_VIBRA: { label: 'Buena vibra',       icon: 'happy-outline' },
  RECOMENDADO: { label: 'Recomendado',       icon: 'star-outline' },
};

export interface PlayerRating {
  matchId: string;
  reviewerId: string;
  reviewedUserId: string;
  punctuality: number;    // 1–5
  skillAccuracy: number;  // 1–5
  vibe: number;           // 1–5
  wouldPlayAgain: boolean;
  comment?: string;
  createdAt: string;
}

export interface RatingSummary {
  totalRatings: number;
  overallRating: number;
  punctualityAvg: number;
  skillAvg: number;
  vibeAvg: number;
  wouldPlayAgainPct: number;
  badges: RatingBadge[];
}

// ─── In-memory mock store ─────────────────────────────────────────────────────
// Prepared for backend: replace submitRatings/getRatingSummary with API calls.

const _ratings: PlayerRating[] = [];
const _ratedKeys = new Set<string>(); // `${matchId}:${reviewerId}`

export function hasRatedMatch(matchId: string, reviewerId: string): boolean {
  return _ratedKeys.has(`${matchId}:${reviewerId}`);
}

export function submitRatings(ratings: PlayerRating[]): void {
  if (!ratings.length) return;
  _ratedKeys.add(`${ratings[0].matchId}:${ratings[0].reviewerId}`);
  _ratings.push(...ratings);
}

export function getRatingSummary(userId: string, fallbackRating?: number | null): RatingSummary {
  const mine = _ratings.filter(r => r.reviewedUserId === userId);

  if (mine.length === 0) {
    if (fallbackRating != null && fallbackRating > 0) {
      return _seedFromRating(userId, fallbackRating);
    }
    return { totalRatings: 0, overallRating: 0, punctualityAvg: 0, skillAvg: 0, vibeAvg: 0, wouldPlayAgainPct: 0, badges: [] };
  }

  const n    = mine.length;
  const punc = mine.reduce((s, r) => s + r.punctuality,   0) / n;
  const skill= mine.reduce((s, r) => s + r.skillAccuracy, 0) / n;
  const vibe = mine.reduce((s, r) => s + r.vibe,          0) / n;
  const yes  = mine.filter(r => r.wouldPlayAgain).length;

  const summary: RatingSummary = {
    totalRatings:      n,
    overallRating:     _r((punc + skill + vibe) / 3),
    punctualityAvg:    _r(punc),
    skillAvg:          _r(skill),
    vibeAvg:           _r(vibe),
    wouldPlayAgainPct: Math.round((yes / n) * 100),
    badges: [],
  };
  summary.badges = _computeBadges(summary);
  return summary;
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function _r(v: number) { return Math.round(v * 10) / 10; }

function _seedFromRating(userId: string, base: number): RatingSummary {
  const seed = userId.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const d = (off: number) => _r(Math.min(5, Math.max(1, base + ((seed + off) % 7 - 3) * 0.1)));
  const punc  = d(1);
  const skill = d(3);
  const vibe  = d(7);
  const n     = Math.max(3, (seed % 22) + 4);
  const wpa   = Math.min(100, Math.max(60, Math.round(base / 5 * 100)));
  const summary: RatingSummary = {
    totalRatings: n,
    overallRating: base,
    punctualityAvg: punc,
    skillAvg: skill,
    vibeAvg: vibe,
    wouldPlayAgainPct: wpa,
    badges: [],
  };
  summary.badges = _computeBadges(summary);
  return summary;
}

function _computeBadges(s: RatingSummary): RatingBadge[] {
  const b: RatingBadge[] = [];
  if (s.punctualityAvg >= 4.5)                         b.push('PUNTUAL');
  if (s.skillAvg       >= 4.3)                         b.push('BUEN_NIVEL');
  if (s.wouldPlayAgainPct >= 80)                       b.push('CONFIABLE');
  if (s.vibeAvg        >= 4.5)                         b.push('BUENA_VIBRA');
  if (s.overallRating  >= 4.5 && s.totalRatings >= 5)  b.push('RECOMENDADO');
  return b;
}
