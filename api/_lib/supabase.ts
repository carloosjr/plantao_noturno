import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cliente: SupabaseClient | null = null;

/**
 * Cliente Supabase com service role: usado somente no servidor.
 * A tabela plantaonoturno_demandas tem RLS habilitada e nenhuma policy,
 * portanto só é acessível por aqui.
 */
export function getSupabase(): SupabaseClient {
  if (cliente) return cliente;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não configuradas.');
  }

  cliente = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cliente;
}

export const TABELA_DEMANDAS = 'plantaonoturno_demandas';
export const FUNCAO_DASHBOARD = 'plantaonoturno_dashboard';
