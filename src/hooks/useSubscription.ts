import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { ensureLaunchProSubscriptionIfPromoActive } from '@/domain/ensureLaunchProSubscription';
import {
  hasLaunchPromoProAccess,
  isLaunchProPromoActive,
  isLaunchPromoSubscription,
  resolveIsProWithBackend,
} from '@/domain/launchPromo';
import { getSupabase } from '@/lib/supabase';

export type SubscriptionPlan = 'free' | 'pro';

export type Subscription = {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  is_active: boolean;
  expires_at: string | null;
  voucher_code: string | null;
};

type SubscriptionQueryResult = {
  subscription: Subscription | null;
  isProFromBackend: boolean;
};

function normalizeVoucherCode(code: string): string {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed || trimmed.length > 64) {
    throw new Error('Código de cupom inválido');
  }
  return trimmed;
}

export function useSubscription() {
  const { user } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async (): Promise<SubscriptionQueryResult> => {
      if (!user?.id) {
        return { subscription: null, isProFromBackend: false };
      }

      await ensureLaunchProSubscriptionIfPromoActive();

      const [subResult, proResult] = await Promise.all([
        getSupabase().from('user_subscriptions').select('*').eq('user_id', user.id).maybeSingle(),
        getSupabase().rpc('is_user_pro', { p_user_id: user.id }),
      ]);

      if (subResult.error) throw subResult.error;

      if (proResult.error && __DEV__) {
        console.warn('[useSubscription] is_user_pro RPC:', proResult.error.message);
      }

      return {
        subscription: subResult.data as Subscription | null,
        isProFromBackend: proResult.data === true,
      };
    },
    enabled: !!user?.id,
    staleTime: 0,
  });

  const subscription = data?.subscription ?? null;
  const isProFromBackend = resolveIsProWithBackend(subscription, data?.isProFromBackend);
  const isPro = isProFromBackend || hasLaunchPromoProAccess(user?.id);
  const isFree = !isPro;
  const isLaunchPromo = isPro && isLaunchPromoSubscription(subscription?.voucher_code ?? null);
  const launchPromoActive = isLaunchProPromoActive();
  const maxEditCount = isPro ? Infinity : 3;

  const applyVoucher = async (code: string) => {
    const validatedCode = normalizeVoucherCode(code);
    const { data: result, error } = await getSupabase().rpc('apply_voucher', {
      voucher_code_param: validatedCode,
    });
    if (error) throw error;
    await refetch();
    return result;
  };

  const validateDiscountVoucher = async (code: string) => {
    const validatedCode = normalizeVoucherCode(code);
    const { data: result, error } = await getSupabase().rpc('validate_discount_voucher', {
      voucher_code_param: validatedCode,
    });
    if (error) throw error;
    return result;
  };

  const activateLaunchPro = async () => {
    await ensureLaunchProSubscriptionIfPromoActive();
    await refetch();
  };

  return {
    subscription,
    isLoading,
    isPro,
    isFree,
    isLaunchPromo,
    launchPromoActive,
    maxEditCount,
    refetch,
    applyVoucher,
    validateDiscountVoucher,
    activateLaunchPro,
  };
}
