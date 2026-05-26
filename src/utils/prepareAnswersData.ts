import type { ConcursoParticipationDetail } from '@/types/participation';
import { getSectionTypeForQuestion } from '@/utils/examStructure';

export function prepareAnswersData(
  answers: Record<number, string>,
  concurso: ConcursoParticipationDetail,
  selectedBookletId: string
): {
  answers: Record<string, Record<string, Record<string, string>>>;
} {
  const organized: Record<string, Record<string, Record<string, string>>> = {
    [selectedBookletId]: {},
  };

  Object.entries(answers).forEach(([questionNum, answer]) => {
    const trimmed = answer?.trim();
    if (!trimmed) return;
    const q = parseInt(questionNum, 10);
    if (Number.isNaN(q)) return;
    const sectionType = getSectionTypeForQuestion(concurso, q);
    if (!organized[selectedBookletId][sectionType]) {
      organized[selectedBookletId][sectionType] = {};
    }
    organized[selectedBookletId][sectionType][String(q)] = trimmed.toUpperCase();
  });

  return { answers: organized };
}
