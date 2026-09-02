import type { VercelRequest, VercelResponse } from '@vercel/node';
import { FUNCAO_DASHBOARD, getSupabase } from '../_lib/supabase';
import { erro, json, paramData } from '../_lib/http';
import type { DashboardData } from '../../shared/domain';

/**
 * GET /api/night-shift-demands/dashboard?startDate=&endDate=
 * As agregações são resolvidas inteiramente no banco (função plantaonoturno_dashboard).
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return erro(res, 405, 'Método não permitido.');
  }

  try {
    const { data, error } = await getSupabase().rpc(FUNCAO_DASHBOARD, {
      p_start: paramData(req, 'startDate') ?? null,
      p_end: paramData(req, 'endDate') ?? null,
    });

    if (error) return erro(res, 500, error.message);

    return json(res, 200, data as DashboardData);
  } catch (e) {
    return erro(res, 500, e instanceof Error ? e.message : 'Erro inesperado.');
  }
}
