import type { Match } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MatchResult = 'W' | 'L' | null;

export type HistoryFilter = 'ALL' | 'WIN' | 'LOSS' | 'LAST_30' | 'DOBLES' | 'SINGLES';

export interface HistorySummary {
  total: number;
  wins: number;
  losses: number;
  winRate: number;
  streak: MatchResult[]; // last 5, most recent first
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getMatchResult(match: Match, userId: string): MatchResult {
  if (!match.resultRecorded) return null;
  const winners = match.winners ?? [];
  if (winners.length === 0) return null;
  return winners.some(w => w.id === userId) ? 'W' : 'L';
}

function isDoublesMatch(match: Match): boolean {
  if (match.matchType) {
    const mt = match.matchType.toUpperCase();
    if (mt === 'DOBLES' || mt === 'DOUBLES') return true;
    if (mt === 'SINGLES') return false;
  }
  const tA = (match.teamA ?? []).length;
  const tB = (match.teamB ?? []).length;
  if (tA >= 2 || tB >= 2) return true;
  return (match.participants ?? []).length >= 4;
}

export function getOpponentLabel(match: Match, userId: string): string {
  const tA = match.teamA ?? [];
  const tB = match.teamB ?? [];
  const inA = tA.some(p => p.id === userId);
  const inB = tB.some(p => p.id === userId);
  const hasTeams = tA.length > 0 || tB.length > 0;

  if (hasTeams) {
    const myTeam   = inA ? tA : inB ? tB : [];
    const theirTeam = inA ? tB : tA;
    const partners  = myTeam.filter(p => p.id !== userId);
    const theirNames = theirTeam.map(p => p.name.split(' ')[0]).join(' / ') || '—';
    if (partners.length > 0) {
      return `Con ${partners.map(p => p.name.split(' ')[0]).join(' / ')} vs ${theirNames}`;
    }
    return `vs ${theirNames}`;
  }

  const opps = (match.participants ?? []).filter(p => p.id !== userId);
  if (opps.length === 0) return 'Partido';
  return 'vs ' + opps.slice(0, 2).map(p => p.name.split(' ')[0]).join(' / ');
}

export function computeHistorySummary(matches: Match[], userId: string): HistorySummary {
  const completed = matches.filter(m => m.resultRecorded);
  const wins   = completed.filter(m => getMatchResult(m, userId) === 'W').length;
  const losses = completed.filter(m => getMatchResult(m, userId) === 'L').length;
  const winRate = completed.length > 0 ? Math.round((wins / completed.length) * 100) : 0;
  const sorted = [...completed].sort((a, b) => b.date.localeCompare(a.date));
  const streak = sorted.slice(0, 5).map(m => getMatchResult(m, userId));
  return { total: completed.length, wins, losses, winRate, streak };
}

export function fmtRelativeDate(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  const diff = Math.round((today.getTime() - d.getTime()) / 86_400_000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  if (diff <= 6)  return `Hace ${diff} días`;
  if (diff <= 13) return 'Hace 1 semana';
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export function filterMatches(matches: Match[], userId: string, filter: HistoryFilter): Match[] {
  let base = matches.filter(m => m.resultRecorded);

  if (filter === 'WIN')  base = base.filter(m => getMatchResult(m, userId) === 'W');
  if (filter === 'LOSS') base = base.filter(m => getMatchResult(m, userId) === 'L');
  if (filter === 'LAST_30') {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    base = base.filter(m => {
      try { return new Date(m.date + 'T00:00:00') >= cutoff; } catch { return false; }
    });
  }
  if (filter === 'DOBLES')  base = base.filter(m => isDoublesMatch(m));
  if (filter === 'SINGLES') base = base.filter(m => !isDoublesMatch(m));

  return base.sort((a, b) => b.date.localeCompare(a.date));
}
