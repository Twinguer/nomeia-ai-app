/** Data fim da promo — manter alinhado com get_launch_pro_promo_end_at() na migration. */
export const LAUNCH_PRO_PROMO = {
  enabled: true,
  endAt: '2026-08-17T23:59:59.000Z',
  voucherCode: 'launch_promo',
} as const;

/** Textos exibidos na UI — sem data fixa (promo por tempo limitado). */
export const LAUNCH_PROMO_COPY = {
  durationLabel: 'Por tempo limitado',
  badgeActive: 'Pro de lançamento · por tempo limitado',
  badgeIncluded: 'Incluso por tempo limitado',
  toastSignupTitle: 'Pro grátis no lançamento',
  toastSignupDescription:
    'Cadastre-se e use o Aluno Pro completo por tempo limitado.',
  bannerCompact: 'Lançamento: Aluno Pro grátis por tempo limitado.',
  coachNote:
    'A promo de lançamento do Aluno Pro (por tempo limitado) não inclui o Modo Coach.',
} as const;

export function isLaunchProPromoActive(now = new Date()): boolean {
  if (!LAUNCH_PRO_PROMO.enabled) return false;
  return now.getTime() < new Date(LAUNCH_PRO_PROMO.endAt).getTime();
}

export function isLaunchPromoSubscription(voucherCode: string | null | undefined): boolean {
  return voucherCode === LAUNCH_PRO_PROMO.voucherCode;
}

/** Durante a promo, usuários autenticados têm benefícios Pro (UI); o banco é atualizado via RPC quando disponível. */
export function hasLaunchPromoProAccess(userId: string | null | undefined): boolean {
  return isLaunchProPromoActive() && !!userId;
}

function resolveIsProFromSubscription(subscription: {
  plan: string;
  is_active: boolean;
  expires_at: string | null;
} | null): boolean {
  if (!subscription) return false;
  const isPlanPro = subscription.plan === 'pro';
  const isActive = subscription.is_active === true;
  const hasValidExpiry =
    !subscription.expires_at || new Date(subscription.expires_at) > new Date();
  return isPlanPro && isActive && hasValidExpiry;
}

export function resolveIsProWithBackend(
  subscription: {
    plan: string;
    is_active: boolean;
    expires_at: string | null;
  } | null,
  isProFromBackend: boolean | null | undefined
): boolean {
  if (isProFromBackend === true) return true;
  return resolveIsProFromSubscription(subscription);
}
