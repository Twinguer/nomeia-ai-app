import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
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

function normalizeVoucherCode(code: string): string {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed || trimmed.length > 64) {
    throw new Error('Código de cupom inválido');
  }
  return trimmed;
}

export function useSubscription() {
  const { user } = useAuth();

  const { data: subscription, isLoading, refetch } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Subscription | null;
    },
    enabled: !!user?.id,
    staleTime: 0,
  });

  const hasSubscription = !!subscription;
  const isPlanPro = subscription?.plan === 'pro';
  const isActive = subscription?.is_active === true;
  const hasValidExpiry =
    !subscription?.expires_at || new Date(subscription.expires_at) > new Date();

  const isPro = hasSubscription && isPlanPro && isActive && hasValidExpiry;
  const isFree = !isPro;
  const maxEditCount = isPro ? Infinity : 3;

  const applyVoucher = async (code: string) => {
    const validatedCode = normalizeVoucherCode(code);
    const { data, error } = await getSupabase().rpc('apply_voucher', {
      voucher_code_param: validatedCode,
    });
    if (error) throw error;
    await refetch();
    return data;
  };

  const validateDiscountVoucher = async (code: string) => {
    const validatedCode = normalizeVoucherCode(code);
    const { data, error } = await getSupabase().rpc('validate_discount_voucher', {
      voucher_code_param: validatedCode,
    });
    if (error) throw error;
    return data;
  };

  return {
    subscription,
    isLoading,
    isPro,
    isFree,
    maxEditCount,
    refetch,
    applyVoucher,
    validateDiscountVoucher,
  };
}
