import type { Ranking } from '@/services/rankingService';
import { getReservationAbbreviation, normalizeReservationType } from '@/utils/quotaNormalization';

export type QuotaTabKey = 'ac' | 'ppp' | 'pcd' | 'hip' | 'ind' | 'tran';

export const QUOTA_TABS: { key: QuotaTabKey; label: string; fullName: string }[] = [
  { key: 'ac', label: 'ac', fullName: 'Ampla Concorrência' },
  { key: 'ppp', label: 'ppp', fullName: 'PPP' },
  { key: 'pcd', label: 'pcd', fullName: 'PCD' },
  { key: 'hip', label: 'hip', fullName: 'Hipossuficientes' },
  { key: 'ind', label: 'ind', fullName: 'Indígenas' },
  { key: 'tran', label: 'tran', fullName: 'Pessoas Trans' },
];

const TAB_TO_FULL: Record<QuotaTabKey, string> = Object.fromEntries(
  QUOTA_TABS.map((t) => [t.key, t.fullName])
) as Record<QuotaTabKey, string>;

export function formatRankingScore(score: number): string {
  return Number(score || 0).toFixed(2);
}

/** Menor nota entre participantes classificados (corte da classificação; ignora eliminados). */
export function getLastClassifiedScore(
  rankings: Array<{ score: number; eliminated?: boolean }>
): number | null {
  const classified = rankings.filter((r) => !r.eliminated);
  if (classified.length === 0) return null;
  return Math.min(...classified.map((r) => Number(r.score) || 0));
}

export function isRankingEliminated(
  ranking: Ranking,
  examType?: string | null
): boolean {
  const score = ranking.score || 0;
  const belowMinimum = !!ranking.belowMinimum;
  const hasDisciplineMinimums =
    (ranking.belowDisciplineMinimums?.length ?? 0) > 0;
  const hasBlockMinimums = (ranking.belowBlockMinimums?.length ?? 0) > 0;
  const certoErrado = examType === 'Certo ou Errado' && score <= 0;
  const alternativas = examType === 'Alternativas' && score <= 0;
  return (
    belowMinimum ||
    hasDisciplineMinimums ||
    hasBlockMinimums ||
    certoErrado ||
    alternativas
  );
}

/** Recalcula posição na cota (igual web RankingTableContent). */
export function enrichRankingsForDisplay(
  rankings: Ranking[],
  examType?: string | null
): (Ranking & { quotaPosition: number; eliminated: boolean })[] {
  const withFlag = rankings.map((r) => ({
    ...r,
    eliminated: isRankingEliminated(r, examType),
  }));

  const classified = withFlag.filter((r) => !r.eliminated);
  const eliminated = withFlag.filter((r) => r.eliminated);

  const groupedByQuota: Record<string, typeof classified> = {};
  classified.forEach((r) => {
    const q = normalizeReservationType(r.reservationType);
    if (!groupedByQuota[q]) groupedByQuota[q] = [];
    groupedByQuota[q].push(r);
  });

  Object.keys(groupedByQuota).forEach((q) => {
    groupedByQuota[q].sort((a, b) => b.score - a.score);
  });

  const classifiedEnriched = classified.map((r) => {
    const q = normalizeReservationType(r.reservationType);
    const same = groupedByQuota[q] || [];
    const quotaPosition = same.findIndex((x) => x.id === r.id) + 1;
    return { ...r, quotaPosition: quotaPosition > 0 ? quotaPosition : 0 };
  });

  const eliminatedEnriched = eliminated.map((r) => ({
    ...r,
    quotaPosition: 0,
  }));

  return [...classifiedEnriched, ...eliminatedEnriched];
}

export function filterRankingsByTab(
  rankings: (Ranking & { quotaPosition: number; eliminated: boolean })[],
  tab: QuotaTabKey
): (Ranking & { quotaPosition: number; eliminated: boolean })[] {
  if (tab === 'ac') return rankings;
  const full = TAB_TO_FULL[tab];
  return rankings.filter(
    (r) => normalizeReservationType(r.reservationType) === full
  );
}

export function getQuotaTagForName(
  reservationType: string,
  isAmplaTab: boolean
): string {
  if (!isAmplaTab) return '';
  const normalized = normalizeReservationType(reservationType);
  if (normalized === 'Ampla Concorrência') return '';
  const abbr = getReservationAbbreviation(reservationType);
  return abbr ? `(${abbr})` : '';
}

export function getPositionLabel(
  ranking: Ranking & { quotaPosition: number; eliminated: boolean },
  tab: QuotaTabKey
): string {
  if (ranking.eliminated) return 'E';
  if (tab === 'ac') {
    return ranking.position > 0 ? `${ranking.position}º` : '—';
  }
  return ranking.quotaPosition > 0 ? `${ranking.quotaPosition}º` : '—';
}
