import type { User, Match } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CompatibilityColor = 'high' | 'medium' | 'low';

export interface CompatibilityResult {
  score: number;
  label: string;
  color: CompatibilityColor;
  reasons: string[];
}

// ─── Internals ────────────────────────────────────────────────────────────────

const LEVEL_ORDER = ['INICIACION', 'PRINCIPIANTE', 'INTERMEDIO', 'AVANZADO', 'PROFESIONAL'] as const;

function levelDiff(a: string, b: string): number {
  const ai = LEVEL_ORDER.indexOf(a as any);
  const bi = LEVEL_ORDER.indexOf(b as any);
  if (ai === -1 || bi === -1) return 2;
  return Math.abs(ai - bi);
}

// Deterministic, order-independent hash for a pair of IDs → [0, max]
function pairHash(a: string, b: string, max: number): number {
  const str = [a, b].sort().join('|');
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h, 33) ^ str.charCodeAt(i);
  }
  return Math.abs(h) % (max + 1);
}

// Loose location match: share at least one word longer than 3 chars
function locationMatch(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  const words = (s: string) =>
    s.toLowerCase()
      .replace(/[^a-záéíóúüñ\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3);
  const wa = words(a);
  const wb = words(b);
  return wa.some(w => wb.includes(w));
}

function getLabel(score: number): string {
  if (score >= 90) return 'Muy compatible';
  if (score >= 75) return 'Compatible';
  if (score >= 60) return 'Parecido';
  return 'Diferente';
}

function getColor(score: number): CompatibilityColor {
  if (score >= 75) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
}

// ─── User ↔ User ─────────────────────────────────────────────────────────────

export function calculateUserCompatibility(me: User, target: User): CompatibilityResult {
  let score = 0;
  const reasons: string[] = [];

  // Level (0–30)
  const ld = levelDiff(me.level, target.level);
  if (ld === 0)      { score += 30; reasons.push('Mismo nivel'); }
  else if (ld === 1) { score += 20; reasons.push('Nivel similar'); }
  else if (ld === 2) { score += 8; }

  // Location (0–20)
  if (locationMatch(me.location, target.location)) {
    score += 20; reasons.push('Misma zona');
  } else if (!me.location || !target.location) {
    score += 10;
  }

  // Format (0–15)
  if (me.preferredFormat && target.preferredFormat) {
    if (me.preferredFormat === target.preferredFormat) {
      score += 15;
      reasons.push(me.preferredFormat === 'SINGLES' ? 'Prefieren singles' : 'Prefieren dobles');
    }
  } else {
    score += 7;
  }

  // Style (0–12)
  if (me.preferredStyle && target.preferredStyle) {
    if (me.preferredStyle === target.preferredStyle) {
      score += 12;
      reasons.push(me.preferredStyle === 'COMPETITIVO' ? 'Estilo competitivo' : 'Estilo chill');
    }
  } else {
    score += 5;
  }

  // Availability (0–8)
  if (target.available) { score += 8; reasons.push('Disponible ahora'); }
  else                  { score += 2; }

  // Rating bonus (0–5)
  if (target.rating != null && target.rating >= 4.0) {
    score += 5; reasons.push('Buena reputación');
  }

  // Deterministic variation per pair (0–10)
  score += pairHash(me.id, target.id, 10);

  return build(score, reasons);
}

// ─── User ↔ Match ─────────────────────────────────────────────────────────────

export function calculateMatchCompatibility(me: User, match: Match): CompatibilityResult {
  let score = 0;
  const reasons: string[] = [];

  // Level (0–35)
  const ld = levelDiff(me.level, match.level);
  if (ld === 0)      { score += 35; reasons.push('Tu nivel exacto'); }
  else if (ld === 1) { score += 22; reasons.push('Nivel compatible'); }
  else if (ld === 2) { score += 8; }

  // Format preference (0–15)
  const mt = (match.matchType ?? '').toUpperCase();
  const isDoubles = mt.includes('DOBL') || mt.includes('DOUBLE');
  const isSingles  = mt.includes('SINGL') || mt.includes('INDIV');
  if (me.preferredFormat && (isDoubles || isSingles)) {
    const prefDoubles = me.preferredFormat === 'DOBLES';
    if ((prefDoubles && isDoubles) || (!prefDoubles && isSingles)) {
      score += 15; reasons.push('Formato que prefieres');
    }
  } else {
    score += 6;
  }

  // Spots (0–12)
  if (match.spotsLeft > 0) {
    score += 12;
    reasons.push(match.spotsLeft === 1 ? 'Último cupo disponible' : 'Hay lugares disponibles');
  }

  // Location (0–15)
  const matchLoc = match.court?.address ?? match.court?.name ?? match.customLocation ?? null;
  if (locationMatch(me.location, matchLoc)) {
    score += 15; reasons.push('Cerca de ti');
  } else if (!me.location || !matchLoc) {
    score += 6;
  }

  // Deterministic variation (0–13)
  score += pairHash(me.id, match.id, 13);

  return build(score, reasons);
}

function build(raw: number, reasons: string[]): CompatibilityResult {
  const score = Math.min(99, Math.max(12, raw));
  return { score, label: getLabel(score), color: getColor(score), reasons: reasons.slice(0, 4) };
}
