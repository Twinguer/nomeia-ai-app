import { getSupabase } from '@/lib/supabase';
import { getSupabaseConfig } from '@/lib/env';

export type CreateCheckoutResponse = {
  url: string;
  session_id: string;
};

async function ensureSession() {
  const { data, error } = await getSupabase().auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error('Usuário não autenticado. Faça login novamente.');
  }
  return data.session;
}

export const paymentService = {
  async createCheckout(planId: string, voucherCode?: string): Promise<CreateCheckoutResponse> {
    await ensureSession();
    const body: { planId: string; voucherCode?: string } = { planId };
    if (voucherCode) body.voucherCode = voucherCode;

    const { data, error } = await getSupabase().functions.invoke('create-checkout', { body });
    if (error) throw new Error(error.message || 'Erro ao criar checkout');
    if (!data?.url) throw new Error('URL de checkout indisponível');
    return data as CreateCheckoutResponse;
  },

  async verifySubscription(): Promise<{ success: boolean }> {
    await ensureSession();
    const { data, error } = await getSupabase().functions.invoke('verify-subscription');
    if (error) throw new Error(error.message);
    return (data ?? { success: false }) as { success: boolean };
  },
};

export function getSupabaseStorageKey(): string {
  const { url } = getSupabaseConfig();
  const ref = new URL(url).hostname.split('.')[0];
  return `sb-${ref}-auth-token`;
}
