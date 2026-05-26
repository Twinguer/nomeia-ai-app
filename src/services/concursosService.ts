import { getSupabase } from '@/lib/supabase';
import type { ConcursoDetail, RankingCardItem } from '@/types/ranking';

type ConcursoRow = {
  id: string;
  titulo: string;
  orgao: string | null;
  banca: string | null;
  cargo?: string | null;
  vagas?: number | null;
  created_at: string;
  status: string | null;
  created_by_user_id?: string | null;
  is_admin_created?: boolean | null;
  localidades?: string[] | null;
  is_general_card?: boolean | null;
  parent_concurso_id?: string | null;
  total_participants?: number | null;
  watermark_image_url?: string | null;
  exam_type?: string | null;
  disciplines?: unknown;
  subjects?: Record<string, unknown> | null;
};

const CONCURSO_SELECT = `
  id,
  titulo,
  orgao,
  banca,
  cargo,
  vagas,
  created_at,
  status,
  created_by_user_id,
  is_admin_created,
  localidades,
  is_general_card,
  parent_concurso_id,
  total_participants,
  watermark_image_url,
  exam_type,
  disciplines,
  subjects
`;

function formatLocalidade(localidades: string[] | null | undefined): string | null {
  if (!localidades?.length) return null;
  if (localidades.includes('Nacional')) return 'Nacional';
  if (localidades.length > 3) {
    return `${localidades.slice(0, 3).join(', ')} e outras`;
  }
  return localidades.join(', ');
}

async function fetchCreatorName(
  userId: string | null | undefined,
  isAdmin: boolean | null | undefined
): Promise<string | null> {
  if (!userId || isAdmin) return null;
  const { data } = await getSupabase()
    .from('users_profiles')
    .select('name')
    .eq('id', userId)
    .maybeSingle();
  return data?.name ?? null;
}

async function getParticipantCount(concurso: ConcursoRow): Promise<number> {
  const supabase = getSupabase();
  if (concurso.is_general_card) {
    const { data, error } = await supabase.rpc('get_general_card_participant_count', {
      p_general_card_id: concurso.id,
    });
    if (error) return concurso.total_participants ?? 0;
    return data ?? 0;
  }
  const { data, error } = await supabase.rpc('count_concurso_participants', {
    concurso_id: concurso.id,
  });
  if (error) return 0;
  return data ?? 0;
}

function rowToCard(
  concurso: ConcursoRow,
  participantCount: number,
  creatorName: string | null
): RankingCardItem {
  const isGeneral = !!concurso.is_general_card;
  return {
    id: concurso.id,
    examDate: concurso.created_at || new Date().toISOString(),
    banca: concurso.banca,
    concursoTitle: concurso.orgao || concurso.titulo,
    cargoTitle: isGeneral ? null : concurso.titulo,
    participantCount,
    creatorName,
    isAdminCreated: !!concurso.is_admin_created,
    status: concurso.status,
    localidade: formatLocalidade(concurso.localidades ?? null),
    isGeneralCard: isGeneral,
    watermarkImageUrl: concurso.watermark_image_url ?? null,
  };
}

async function mapRowsToCards(rows: ConcursoRow[], generalOnly: boolean): Promise<RankingCardItem[]> {
  const cards = await Promise.all(
    rows.map(async (row) => {
      if (generalOnly && !row.is_general_card) return null;
      const participantCount = await getParticipantCount(row);
      const creatorName = await fetchCreatorName(row.created_by_user_id, row.is_admin_created);
      return rowToCard(row, participantCount, creatorName);
    })
  );
  return cards.filter((c): c is RankingCardItem => c !== null);
}

/** Lista rankings — mesma lógica da web (`useRankingsData`). */
export async function listConcursos(): Promise<RankingCardItem[]> {
  const { data: concursos, error } = await getSupabase()
    .from('concursos')
    .select(CONCURSO_SELECT)
    .eq('is_general_card', true)
    .order('created_at', { ascending: false });

  if (error) {
    if (
      error.message?.includes('is_general_card') ||
      error.message?.includes('does not exist')
    ) {
      const { data: fallback, error: fallbackError } = await getSupabase()
        .from('concursos')
        .select(CONCURSO_SELECT)
        .order('created_at', { ascending: false })
        .limit(80);
      if (fallbackError) throw new Error(fallbackError.message);
      return mapRowsToCards((fallback ?? []) as ConcursoRow[], false);
    }
    throw new Error(error.message);
  }

  return mapRowsToCards((concursos ?? []) as ConcursoRow[], true);
}

export async function getConcursoDetail(id: string): Promise<ConcursoDetail | null> {
  const { data, error } = await getSupabase()
    .from('concursos')
    .select(CONCURSO_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as ConcursoRow;
  const participantCount = await getParticipantCount(row);
  const creatorName = await fetchCreatorName(row.created_by_user_id, row.is_admin_created);

  return {
    id: row.id,
    titulo: row.titulo,
    orgao: row.orgao,
    banca: row.banca,
    cargo: row.cargo ?? null,
    status: row.status,
    vagas: row.vagas ?? null,
    created_at: row.created_at,
    localidade: formatLocalidade(row.localidades ?? null),
    localidades: row.localidades ?? null,
    participantCount,
    isAdminCreated: !!row.is_admin_created,
    creatorName,
    exam_type: row.exam_type ?? null,
    disciplines: row.disciplines ?? null,
    subjects: (row.subjects as ConcursoDetail['subjects']) ?? null,
  };
}

export async function getConcursoById(id: string): Promise<ConcursoDetail | null> {
  return getConcursoDetail(id);
}
