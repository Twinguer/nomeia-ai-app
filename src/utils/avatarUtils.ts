/**
 * URL do avatar padrão (mesma do site web).
 */
export const DEFAULT_AVATAR_URL =
  'https://ppsymqrdtjyaguftracc.supabase.co/storage/v1/object/public/profiles/ee17d498-b633-419f-90bd-0cad82166804-1762810011516.png';

export function getAvatarUrl(avatarUrl: string | null | undefined): string | undefined {
  const trimmed = avatarUrl?.trim();
  return trimmed || undefined;
}
