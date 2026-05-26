import type { Ranking } from '@/services/rankingService';
import type { ConcursoDetail } from '@/types/ranking';
import { formatRankingScore } from '@/utils/rankingDisplay';

export type DisciplineColumn = {
  key: string;
  label: string;
  width: number;
  getScore: (ranking: Ranking) => number;
  isBelowMinimum: (ranking: Ranking) => boolean;
};

function isDisciplineBlock(item: unknown): item is { disciplines: unknown[] } {
  return !!item && typeof item === 'object' && 'disciplines' in item;
}

export function getCustomDisciplines(
  disciplines: ConcursoDetail['disciplines']
): { type: string; name: string }[] {
  if (!disciplines) return [];

  const enabled: { type: string; name: string }[] = [];

  if (typeof disciplines === 'object' && !Array.isArray(disciplines) && 'blocks' in disciplines) {
    const blocks = (disciplines as { blocks?: unknown[] }).blocks ?? [];
    for (const block of blocks) {
      if (block && typeof block === 'object' && 'disciplines' in block) {
        const list = (block as { disciplines: unknown[] }).disciplines ?? [];
        for (const d of list) {
          if (
            d &&
            typeof d === 'object' &&
            (d as { isEnabled?: boolean }).isEnabled === true &&
            typeof (d as { type?: string }).type === 'string' &&
            typeof (d as { name?: string }).name === 'string'
          ) {
            enabled.push({
              type: (d as { type: string }).type,
              name: (d as { name: string }).name,
            });
          }
        }
      }
    }
    return enabled;
  }

  if (Array.isArray(disciplines)) {
    if (disciplines.length > 0 && isDisciplineBlock(disciplines[0])) {
      for (const block of disciplines) {
        if (!isDisciplineBlock(block)) continue;
        for (const d of block.disciplines) {
          if (
            d &&
            typeof d === 'object' &&
            (d as { isEnabled?: boolean }).isEnabled === true &&
            typeof (d as { type?: string }).type === 'string' &&
            typeof (d as { name?: string }).name === 'string'
          ) {
            enabled.push({
              type: (d as { type: string }).type,
              name: (d as { name: string }).name,
            });
          }
        }
      }
    } else {
      for (const d of disciplines) {
        if (
          d &&
          typeof d === 'object' &&
          'isEnabled' in d &&
          (d as { isEnabled?: boolean }).isEnabled === true &&
          'type' in d &&
          'name' in d
        ) {
          enabled.push({
            type: (d as { type: string }).type,
            name: (d as { name: string }).name,
          });
        }
      }
    }
  }

  return enabled;
}

function hasOtherSubjective(concurso: ConcursoDetail): boolean {
  if (concurso.subjects?.other === true) return true;
  const disciplines = concurso.disciplines;
  if (!disciplines) return false;

  if (typeof disciplines === 'object' && !Array.isArray(disciplines) && 'blocks' in disciplines) {
    for (const block of (disciplines as { blocks?: unknown[] }).blocks ?? []) {
      if (block && typeof block === 'object' && 'disciplines' in block) {
        for (const d of (block as { disciplines: unknown[] }).disciplines ?? []) {
          if (
            d &&
            typeof d === 'object' &&
            (d as { isEnabled?: boolean }).isEnabled &&
            (d as { type?: string }).type === 'other_subjective'
          ) {
            return true;
          }
        }
      }
    }
  }

  if (Array.isArray(disciplines)) {
    for (const item of disciplines) {
      if (isDisciplineBlock(item)) {
        if (
          item.disciplines?.some(
            (d) =>
              d &&
              typeof d === 'object' &&
              (d as { isEnabled?: boolean }).isEnabled &&
              (d as { type?: string }).type === 'other_subjective'
          )
        ) {
          return true;
        }
      } else if (
        item &&
        typeof item === 'object' &&
        (item as { isEnabled?: boolean }).isEnabled &&
        (item as { type?: string }).type === 'other_subjective'
      ) {
        return true;
      }
    }
  }

  return false;
}

const COL_W = 52;

function buildTotalColumn(concurso: ConcursoDetail | null | undefined): DisciplineColumn {
  return {
    key: 'tot',
    label: 'tot',
    width: COL_W,
    getScore: (r) => r.score,
    isBelowMinimum: (r) => (concurso ? !!r.belowMinimum : false),
  };
}

export function buildDisciplineColumns(concurso: ConcursoDetail | null | undefined): DisciplineColumn[] {
  if (!concurso) {
    return [buildTotalColumn(null)];
  }

  const cols: DisciplineColumn[] = [];

  for (const d of getCustomDisciplines(concurso.disciplines)) {
    cols.push({
      key: d.type,
      label: d.name.toLowerCase(),
      width: Math.max(COL_W, Math.min(88, d.name.length * 7 + 16)),
      getScore: (r) => Number(r.weightedCustomDisciplineScores?.[d.type] ?? 0),
      isBelowMinimum: (r) => r.belowDisciplineMinimums?.includes(d.type) ?? false,
    });
  }

  if (concurso.subjects?.discr === true) {
    cols.push({
      key: 'discursive',
      label: 'dis',
      width: COL_W,
      getScore: (r) => Number(r.weightedDiscursiveScore ?? r.discursiveScore ?? 0),
      isBelowMinimum: (r) => r.belowDisciplineMinimums?.includes('discursive') ?? false,
    });
  }

  if (concurso.subjects?.case1 === true) {
    cols.push({
      key: 'case_study_1',
      label: 'ec1',
      width: COL_W,
      getScore: (r) => Number(r.weightedCaseStudy1Score ?? r.caseStudy1Score ?? 0),
      isBelowMinimum: (r) => r.belowDisciplineMinimums?.includes('case_study_1') ?? false,
    });
  }

  if (concurso.subjects?.case2 === true) {
    cols.push({
      key: 'case_study_2',
      label: 'ec2',
      width: COL_W,
      getScore: (r) => Number(r.weightedCaseStudy2Score ?? r.caseStudy2Score ?? 0),
      isBelowMinimum: (r) => r.belowDisciplineMinimums?.includes('case_study_2') ?? false,
    });
  }

  if (concurso.subjects?.case3 === true) {
    cols.push({
      key: 'case_study_3',
      label: 'ec3',
      width: COL_W,
      getScore: (r) => Number(r.weightedCaseStudy3Score ?? r.caseStudy3Score ?? 0),
      isBelowMinimum: (r) => r.belowDisciplineMinimums?.includes('case_study_3') ?? false,
    });
  }

  if (hasOtherSubjective(concurso)) {
    const label = (concurso.subjects?.name_other || 'Outro').toLowerCase();
    cols.push({
      key: 'other_subjective',
      label,
      width: Math.max(COL_W, Math.min(88, label.length * 7 + 16)),
      getScore: (r) => Number(r.weightedOtherSubjectiveScore ?? r.otherSubjectiveScore ?? 0),
      isBelowMinimum: (r) => r.belowDisciplineMinimums?.includes('other_subjective') ?? false,
    });
  }

  /** Mesma ordem do web: tot logo após participante, depois disciplinas. */
  return [buildTotalColumn(concurso), ...cols];
}

export function formatColumnScore(value: number): string {
  return formatRankingScore(value);
}

export const RANKING_FIXED_LEFT_WIDTH = 36 + 200;

export function scoresSectionWidth(columns: DisciplineColumn[]): number {
  return columns.reduce((sum, c) => sum + c.width, 0);
}
