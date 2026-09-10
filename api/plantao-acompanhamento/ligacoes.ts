import type { VercelRequest, VercelResponse } from '@vercel/node';
import { obterTurno } from '../_lib/acompanhamento.js';
import { erro, json, param } from '../_lib/http.js';
import { FUNCAO_INCREMENTAR_LIGACOES, getSupabase } from '../_lib/supabase.js';
import { dataValida } from '../../shared/acompanhamento.js';

/**
 * POST /api/plantao-acompanhamento/ligacoes?data=YYYY-MM-DD
 * Body: { quantidade }
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return erro(res, 405, 'Método não permitido.');
  }

  const data = param(req, 'data');
  if (!data || !dataValida(data)) {
    return erro(res, 400, 'Parâmetro "data" inválido (esperado YYYY-MM-DD).');
  }

  const corpo = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {});
  const quantidade = Number(corpo.quantidade);

  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    return erro(res, 400, 'quantidade deve ser um número inteiro positivo.');
  }

  try {
    const supabase = getSupabase();
    const turno = await obterTurno(supabase, data);

    const { data: callTotal, error } = await supabase.rpc(FUNCAO_INCREMENTAR_LIGACOES, {
      p_turno_id: turno.id,
      p_quantidade: quantidade,
    });

    if (error) return erro(res, 500, error.message);
    return json(res, 200, { callTotal });
  } catch (e) {
    return erro(res, 500, e instanceof Error ? e.message : 'Erro inesperado.');
  }
}
