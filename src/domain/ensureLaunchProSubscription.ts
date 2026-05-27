import { getSupabase } from '@/lib/supabase';
import { isLaunchProPromoActive } from '@/domain/launchPromo';

function isMissingRpcError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === 'PGRST202') return true;
  const msg = error.message ?? '';
  return msg.includes('Could not find the function') || msg.includes('404');
}

let ensureLaunchProRpcUnavailable = false;

/** Garante Pro de lançamento no banco (idempotente). */
export async function ensureLaunchProSubscriptionIfPromoActive(): Promise<void> {
  if (!isLaunchProPromoActive() || ensureLaunchProRpcUnavailable) {
    return;
  }

  const { error } = await getSupabase().rpc('ensure_launch_pro_for_current_user');

  if (isMissingRpcError(error)) {
    ensureLaunchProRpcUnavailable = true;
    return;
  }

  if (error && __DEV__) {
    console.warn('[ensureLaunchPro] RPC falhou:', error.message);
  }
}
