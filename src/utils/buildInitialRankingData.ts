import type { ConcursoParticipationDetail } from '@/types/participation';

export function buildInitialRankingData(
  concurso: ConcursoParticipationDetail,
  reservationType: string,
  selectedBookletId: string | null
) {
  const objectScores: Record<string, number> = {};
  const disciplines = concurso.disciplines;
  const blocks =
    disciplines &&
    typeof disciplines === 'object' &&
    !Array.isArray(disciplines) &&
    'blocks' in disciplines
      ? (disciplines as { blocks?: unknown[] }).blocks
      : Array.isArray(disciplines)
        ? disciplines
        : [];

  for (const block of blocks ?? []) {
    if (block && typeof block === 'object' && 'disciplines' in block) {
      for (const d of (block as { disciplines?: unknown[] }).disciplines ?? []) {
        if (
          d &&
          typeof d === 'object' &&
          (d as { isEnabled?: boolean }).isEnabled &&
          typeof (d as { type?: string }).type === 'string' &&
          (d as { type: string }).type.startsWith('custom_')
        ) {
          objectScores[(d as { type: string }).type] = 0;
        }
      }
    }
  }

  return {
    user_data: {
      score: 0,
      answers: {},
      subject_scores_tot: 0,
      object_scores: objectScores,
      subjective_scores: 0,
      subjectives: {
        discursive: 0,
        case_study_1: 0,
        case_study_2: 0,
        case_study_3: 0,
        other_subjective: 0,
      },
      all_questions_answered: false,
      reservation_type: reservationType,
    },
    concurso_id: concurso.id,
    control_metadata: {
      created_at: new Date().toISOString(),
      edit_history: [],
      last_updated: new Date().toISOString(),
      is_score_recalculated: false,
    },
    selected_booklet_id: selectedBookletId,
    edit_count: 0,
  };
}
