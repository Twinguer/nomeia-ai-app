import { getSupabase } from '@/lib/supabase';
import type {
  ConcursoParticipationDetail,
  ExamBooklet,
  ExistingAnswersPayload,
  ParticipateResult,
  ParticipationLimitsResult,
  QuotaOption,
} from '@/types/participation';
import { buildInitialRankingData } from '@/utils/buildInitialRankingData';
import { prepareAnswersData } from '@/utils/prepareAnswersData';
import { normalizeReservationType } from '@/utils/quotaNormalization';

export type ParticipationStatus = {
  isParticipating: boolean;
  rankingKey: string | null;
  isCreator: boolean;
};

const PARTICIPATION_SELECT = `
  id,
  titulo,
  exam_type,
  disciplines,
  subjects,
  has_cota,
  exam_booklets,
  official_answers
`;

export async function getConcursoForParticipation(
  concursoId: string
): Promise<ConcursoParticipationDetail | null> {
  const { data, error } = await getSupabase()
    .from('concursos')
    .select(PARTICIPATION_SELECT)
    .eq('id', concursoId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const booklets = (data.exam_booklets as ExamBooklet[] | null) ?? [];
  const sorted = [...booklets].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
  );

  return {
    id: data.id,
    titulo: data.titulo,
    exam_type: data.exam_type,
    disciplines: data.disciplines,
    subjects: data.subjects as ConcursoParticipationDetail['subjects'],
    has_cota: data.has_cota as ConcursoParticipationDetail['has_cota'],
    exam_booklets: sorted,
    official_answers: data.official_answers as Record<string, unknown> | null,
  };
}

export async function checkParticipation(
  concursoId: string,
  userId: string
): Promise<ParticipationStatus> {
  const { data: concurso } = await getSupabase()
    .from('concursos')
    .select('created_by_user_id')
    .eq('id', concursoId)
    .maybeSingle();

  const isCreator = concurso?.created_by_user_id === userId;

  const { data, error } = await getSupabase()
    .from('user_rankings')
    .select('consolidated_data')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  let isParticipating = false;
  let rankingKey: string | null = null;

  const rankings = data?.consolidated_data?.rankings as
    | Record<string, { concurso_id?: string }>
    | undefined;
  if (rankings) {
    for (const [key, entry] of Object.entries(rankings)) {
      if (entry?.concurso_id === concursoId) {
        isParticipating = true;
        rankingKey = key;
        break;
      }
    }
  }

  return { isParticipating, rankingKey, isCreator };
}

export async function checkParticipationLimits(
  userId: string,
  concursoId: string
): Promise<ParticipationLimitsResult> {
  const { data, error } = await getSupabase().rpc('check_free_user_ranking_limits', {
    p_user_id: userId,
    p_concurso_id: concursoId,
  });

  if (error) throw new Error(error.message);
  return (data ?? { allowed: false }) as ParticipationLimitsResult;
}

export async function participateInRanking(
  userId: string,
  concurso: ConcursoParticipationDetail,
  reservationType: QuotaOption,
  selectedBookletId: string | null
): Promise<ParticipateResult> {
  const limits = await checkParticipationLimits(userId, concurso.id);
  if (limits.allowed !== true) {
    return {
      success: false,
      error: limits.message ?? 'Limite de participação atingido',
      requires_upgrade: limits.reason === 'max_participations_reached',
    };
  }

  const rankingData = buildInitialRankingData(
    concurso,
    reservationType,
    selectedBookletId
  );

  const { data, error } = await getSupabase().rpc('participate_in_ranking', {
    p_concurso_id: concurso.id,
    p_reservation_type: reservationType,
    p_selected_booklet_id: selectedBookletId,
    p_ranking_data: rankingData,
  });

  if (error) throw new Error(error.message);

  const result = data as ParticipateResult & { ranking_key?: string };
  if (!result?.success) {
    return {
      success: false,
      error: result?.error ?? 'Erro ao participar do ranking',
      requires_upgrade: result?.requires_upgrade,
    };
  }

  return {
    success: true,
    ranking_key: result.ranking_key,
  };
}

export async function fetchExistingAnswers(
  userId: string,
  rankingKey: string
): Promise<ExistingAnswersPayload> {
  const { data, error } = await getSupabase()
    .from('user_rankings')
    .select('consolidated_data')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data?.consolidated_data) {
    return {
      answers: {},
      subjectives: {},
      selectedBookletId: null,
      editCount: 0,
      reservationType: null,
    };
  }

  const consolidated = data.consolidated_data as {
    rankings?: Record<
      string,
      {
        selected_booklet_id?: string;
        edit_count?: number;
        user_data?: {
          answers?: Record<string, Record<string, Record<string, string>>>;
          subjectives?: Record<string, number>;
          reservation_type?: string;
        };
      }
    >;
  };

  const ranking = consolidated.rankings?.[rankingKey];
  const answers: Record<number, string> = {};
  const bookletId = ranking?.selected_booklet_id ?? null;
  const bookletAnswers = ranking?.user_data?.answers?.[bookletId ?? ''] ?? {};

  if (bookletId && bookletAnswers) {
    Object.values(bookletAnswers).forEach((disciplineAnswers) => {
      Object.entries(disciplineAnswers).forEach(([q, ans]) => {
        const n = parseInt(q, 10);
        if (!Number.isNaN(n)) answers[n] = ans;
      });
    });
  }

  return {
    answers,
    subjectives: ranking?.user_data?.subjectives ?? {},
    selectedBookletId: bookletId,
    editCount: ranking?.edit_count ?? 0,
    reservationType: ranking?.user_data?.reservation_type
      ? normalizeReservationType(ranking.user_data.reservation_type)
      : null,
  };
}

export async function checkEditLimits(
  userId: string,
  rankingKey: string,
  currentEditCount: number
): Promise<{ allowed: boolean; message?: string }> {
  const { data, error } = await getSupabase().rpc('check_free_user_edit_limits', {
    p_user_id: userId,
    p_ranking_id: rankingKey,
    p_current_edit_count: currentEditCount,
  });

  if (error) throw new Error(error.message);
  return (data ?? { allowed: true }) as { allowed: boolean; message?: string };
}

export async function saveAnswersAndRecalculate(
  userId: string,
  rankingKey: string,
  concurso: ConcursoParticipationDetail,
  params: {
    answers: Record<number, string>;
    subjectives: Record<string, number>;
    editCount: number;
    selectedBookletId: string;
  }
): Promise<void> {
  const editCheck = await checkEditLimits(userId, rankingKey, params.editCount);
  if (!editCheck.allowed) {
    throw new Error(editCheck.message ?? 'Limite de edições atingido');
  }

  const { data: currentUserRanking, error: fetchError } = await getSupabase()
    .from('user_rankings')
    .select('consolidated_data')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError || !currentUserRanking?.consolidated_data) {
    throw new Error('Dados de ranking não encontrados');
  }

  const prepared = prepareAnswersData(
    params.answers,
    concurso,
    params.selectedBookletId
  );

  const updatedConsolidatedData = {
    ...(currentUserRanking.consolidated_data as Record<string, unknown>),
  };
  const rankings = {
    ...((updatedConsolidatedData.rankings as Record<string, unknown>) ?? {}),
  };
  const existing = (rankings[rankingKey] as Record<string, unknown>) ?? {};

  const activeSubjectives = {
    discursive: concurso.subjects?.discr ? (params.subjectives.discursive ?? 0) : 0,
    case_study_1: concurso.subjects?.case1 ? (params.subjectives.case_study_1 ?? 0) : 0,
    case_study_2: concurso.subjects?.case2 ? (params.subjectives.case_study_2 ?? 0) : 0,
    case_study_3: concurso.subjects?.case3 ? (params.subjectives.case_study_3 ?? 0) : 0,
    other_subjective: concurso.subjects?.other
      ? (params.subjectives.other_subjective ?? 0)
      : 0,
  };

  let totalAnswers = 0;
  Object.values(prepared.answers).forEach((booklet) => {
    Object.values(booklet).forEach((disc) => {
      totalAnswers += Object.keys(disc).length;
    });
  });

  const existingUserData =
    (existing.user_data as Record<string, unknown> | undefined) ?? {};

  rankings[rankingKey] = {
    ...existing,
    user_data: {
      ...existingUserData,
      answers: prepared.answers,
      all_questions_answered: totalAnswers > 0,
      subjectives: activeSubjectives,
      reservation_type:
        (existingUserData.reservation_type as string | undefined) ?? 'Ampla Concorrência',
    },
    selected_booklet_id: params.selectedBookletId,
    edit_count: params.editCount + 1,
    control_metadata: {
      ...((existing.control_metadata as Record<string, unknown>) ?? {}),
      last_updated: new Date().toISOString(),
    },
  };

  updatedConsolidatedData.rankings = rankings;

  const { data: updateResult, error: updateError } = await getSupabase().rpc(
    'update_consolidated_data_and_recalculate',
    {
      p_user_id: userId,
      p_ranking_id: rankingKey,
      p_concurso_id: concurso.id,
      p_updated_data: updatedConsolidatedData,
    }
  );

  if (updateError) throw new Error(updateError.message);

  const rpcResult = updateResult as { success?: boolean; error?: string } | null;
  if (rpcResult && rpcResult.success === false) {
    throw new Error(rpcResult.error ?? 'Erro ao salvar respostas');
  }
}

export async function leaveRanking(concursoId: string, userId: string): Promise<void> {
  const { data: userRankingData, error: rankingError } = await getSupabase()
    .from('user_rankings')
    .select('consolidated_data')
    .eq('user_id', userId)
    .single();

  if (rankingError) throw new Error(rankingError.message);

  const rankings = userRankingData?.consolidated_data?.rankings as
    | Record<string, unknown>
    | undefined;
  if (!rankings) throw new Error('Você não está participando deste ranking');

  const rankingKey = Object.keys(rankings).find(
    (key) => (rankings[key] as { concurso_id?: string })?.concurso_id === concursoId
  );

  if (!rankingKey) throw new Error('Você não está participando deste ranking');

  const updatedData = { ...userRankingData.consolidated_data };
  delete (updatedData.rankings as Record<string, unknown>)[rankingKey];

  const { error: updateError } = await getSupabase()
    .from('user_rankings')
    .update({ consolidated_data: updatedData })
    .eq('user_id', userId);

  if (updateError) throw new Error(updateError.message);

  await getSupabase().from('score_calculation_logs').delete().eq('user_ranking_id', userId);
}

export function getAvailableQuotas(
  concurso: ConcursoParticipationDetail
): { value: QuotaOption; label: string }[] {
  const config = concurso.has_cota ?? {};
  const all: { value: QuotaOption; label: string; enabled: boolean }[] = [
    { value: 'Ampla Concorrência', label: 'Ampla Concorrência', enabled: true },
    { value: 'PPP', label: 'Pessoas Pretas e Pardas (PPP)', enabled: config.ppp === true },
    { value: 'PCD', label: 'Pessoas com Deficiência (PCD)', enabled: config.pcd === true },
    {
      value: 'Hipossuficientes',
      label: 'Hipossuficientes',
      enabled: config.hip === true,
    },
    { value: 'Indígenas', label: 'Indígenas', enabled: config.ind === true },
    { value: 'Pessoas Trans', label: 'Pessoas Trans', enabled: config.tra === true },
  ];
  return all.filter((q) => q.enabled).map(({ value, label }) => ({ value, label }));
}
