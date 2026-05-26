import { getSupabase } from '@/lib/supabase';

export async function generateConcursoToken(concursoId: string): Promise<string> {
  const { data: tokenHash, error } = await getSupabase().rpc('generate_secure_token', {
    p_entity_type: 'concurso',
    p_entity_id: concursoId,
    p_metadata: {},
    p_expires_in_minutes: 1440,
  });

  if (error) throw new Error(error.message);
  if (!tokenHash) throw new Error('Token não foi gerado');
  return tokenHash as string;
}

export async function getParticiparWebUrl(concursoId: string): Promise<string> {
  const token = await generateConcursoToken(concursoId);
  return `https://www.nomeiai.com.br/concurso/participar/${token}`;
}
