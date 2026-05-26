import type { ConcursoParticipationDetail } from '@/types/participation';

function getNumericValue(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function getDisciplineBlocks(concurso: ConcursoParticipationDetail): unknown[] {
  const disciplines = concurso.disciplines;
  if (!disciplines) return [];
  if (typeof disciplines === 'object' && !Array.isArray(disciplines) && 'blocks' in disciplines) {
    const blocks = (disciplines as { blocks?: unknown[] }).blocks;
    return Array.isArray(blocks) ? blocks : [];
  }
  if (Array.isArray(disciplines)) return disciplines;
  return [];
}

/** Total de questões objetivas (soma das disciplinas habilitadas). */
export function getTotalObjectiveQuestions(concurso: ConcursoParticipationDetail): number {
  let total = 0;
  for (const block of getDisciplineBlocks(concurso)) {
    if (block && typeof block === 'object' && 'disciplines' in block) {
      const list = (block as { disciplines?: unknown[] }).disciplines ?? [];
      for (const d of list) {
        if (d && typeof d === 'object' && (d as { isEnabled?: boolean }).isEnabled) {
          const type = (d as { type?: string }).type ?? '';
          if (
            type === 'discursive' ||
            type === 'case_study_1' ||
            type === 'case_study_2' ||
            type === 'case_study_3' ||
            type === 'other_subjective'
          ) {
            continue;
          }
          total += getNumericValue((d as { questionCount?: unknown }).questionCount);
        }
      }
    }
  }
  if (total > 0) return total;

  const c = concurso as Record<string, unknown>;
  if (c.has_basic_knowledge) total += getNumericValue(c.basic_knowledge_questions);
  if (c.has_specific_knowledge_1) total += getNumericValue(c.specific_knowledge_1_questions);
  if (c.has_specific_knowledge_2) total += getNumericValue(c.specific_knowledge_2_questions);
  if (c.has_specific_knowledge_3) total += getNumericValue(c.specific_knowledge_3_questions);
  return total || 0;
}

export function getSectionTypeForQuestion(
  concurso: ConcursoParticipationDetail,
  questionNumber: number
): string {
  let currentIndex = 1;
  for (const block of getDisciplineBlocks(concurso)) {
    if (block && typeof block === 'object' && 'disciplines' in block) {
      const list = (block as { disciplines?: unknown[] }).disciplines ?? [];
      for (const d of list) {
        if (d && typeof d === 'object' && (d as { isEnabled?: boolean }).isEnabled) {
          const count = getNumericValue((d as { questionCount?: unknown }).questionCount);
          const type = (d as { type?: string }).type ?? 'basic';
          if (questionNumber >= currentIndex && questionNumber < currentIndex + count) {
            return type;
          }
          currentIndex += count;
        }
      }
    }
  }
  return 'basic';
}

export function getAnswerOptions(examType?: string | null): string[] {
  return examType === 'Certo ou Errado' ? ['C', 'E'] : ['A', 'B', 'C', 'D', 'E'];
}
