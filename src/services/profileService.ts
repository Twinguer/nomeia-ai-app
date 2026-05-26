import { getSupabase } from '@/lib/supabase';



export type UserProfileMenu = {

  /** Nome de usuário cadastrado no perfil (campo "Nome de usuário"). */

  name: string;

  avatarUrl: string | null;

};



/** Exibe o nome do perfil ("Nome de usuário" no site). */

export function resolveUserDisplayName(

  profile: Pick<UserProfileMenu, 'name'> | null | undefined,

  metadata?: { name?: string }

): string {

  const name =

    profile?.name?.trim() ||

    (typeof metadata?.name === 'string' ? metadata.name.trim() : '');



  if (name) return name;

  return 'Usuário';

}



export async function fetchUserProfileMenu(userId: string): Promise<UserProfileMenu | null> {

  const supabase = getSupabase();



  const { data, error } = await supabase

    .from('users_profiles')

    .select('name, avatar_url')

    .eq('id', userId)

    .maybeSingle();



  if (!error && data) {

    return {

      name: data.name ?? 'Usuário',

      avatarUrl: data.avatar_url,

    };

  }



  const { data: publicRow, error: publicError } = await supabase

    .from('public_profiles')

    .select('name, avatar_url')

    .eq('id', userId)

    .maybeSingle();



  if (publicError || !publicRow) return null;



  return {

    name: publicRow.name ?? 'Usuário',

    avatarUrl: publicRow.avatar_url,

  };

}


