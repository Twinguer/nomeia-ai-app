import { getSupabase } from '@/lib/supabase';
import type { CargoCardItem, GeneralCardDetail } from '@/types/ranking';

type CargoRow = {
  id: string;
  titulo: string;
  orgao: string | null;
  banca: string | null;
  cargo: string | null;
  state_uf: string | null;
  localidades: string[] | null;
  created_at: string;
  status: string | null;
  total_participants: number | null;
  watermark_image_url: string | null;
  parent_concurso_id: string | null;
};

const CARGO_SELECT = `
  id,
  titulo,
  orgao,
  banca,
  cargo,
  state_uf,
  localidades,
  created_at,
  status,
  total_participants,
  watermark_image_url,
  parent_concurso_id
`;

function formatLocalidade(localidades: string[] | null | undefined): string | null {
  if (!localidades?.length) return null;
  if (localidades.includes('Nacional')) return 'Nacional';
  if (localidades.length > 3) {
    return `${localidades.slice(0, 3).join(', ')} e outras`;
  }
  return localidades.join(', ');
}

export async function getGeneralCard(id: string): Promise<GeneralCardDetail | null> {
  const { data, error } = await getSupabase()
    .from('concursos')
    .select('id, titulo, orgao, banca, localidades, is_unified, watermark_image_url, is_general_card')
    .eq('id', id)
    .eq('is_general_card', true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    id: data.id,
    titulo: data.titulo,
    orgao: data.orgao,
    banca: data.banca,
    localidades: data.localidades ?? null,
    isUnified: !!data.is_unified,
    watermarkImageUrl: data.watermark_image_url,
  };
}

export async function listCargos(
  generalCardId: string,
  stateFilter?: string,
  parentWatermark?: string | null
): Promise<CargoCardItem[]> {
  let query = getSupabase()
    .from('concursos')
    .select(CARGO_SELECT)
    .eq('parent_concurso_id', generalCardId);

  if (stateFilter) {
    query = query.eq('state_uf', stateFilter);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as CargoRow[];

  return Promise.all(
    rows.map(async (row) => {
      const { data: count } = await getSupabase().rpc('count_concurso_participants', {
        concurso_id: row.id,
      });

      const watermark =
        row.watermark_image_url || parentWatermark || null;

      let localidade: string | null = null;
      if (row.state_uf) {
        localidade = row.state_uf;
      } else {
        localidade = formatLocalidade(row.localidades);
      }

      return {
        id: row.id,
        cargo: row.cargo || row.titulo,
        banca: row.banca,
        status: row.status,
        created_at: row.created_at,
        participantCount: count ?? row.total_participants ?? 0,
        localidade,
        stateUf: row.state_uf,
        watermarkImageUrl: watermark,
      };
    })
  );
}

export const ESTADOS_BRASILEIROS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;
