import type { VercelRequest, VercelResponse } from '@vercel/node';
import { obterTurno } from '../_lib/acompanhamento.js';
import { erro, json, param } from '../_lib/http.js';
import { FUNCAO_DEFINIR_CANAL, getSupabase } from '../_lib/supabase.js';
import { CANAL_IDS, dataValida, horarioValido, type CanalId } from '../../shared/acompanhamento.js';

/**
 * PATCH /api/plantao-acompanhamento/canais?data=YYYY-MM-DD
 * Body: { canalId, horario }
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return erro(res, 405, 'Método não permitido.');
  }

  const data = param(req, 'data');
  if (!data || !dataValida(data)) {
    return erro(res, 400, 'Parâmetro "data" inválido (esperado YYYY-MM-DD).');
  }

  const corpo = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {});
  const canalId = corpo.canalId as CanalId;
  // horario vazio/nulo limpa o campo (usuário apagou o horário no input).
  const horario = corpo.horario === '' || corpo.horario === null || corpo.horario === undefined ? null : corpo.horario;

  if (!CANAL_IDS.includes(canalId)) {
    return erro(res, 400, 'canalId inválido.');
  }
  if (horario !== null && !horarioValido(horario)) {
    return erro(res, 400, 'horario inválido (esperado HH:MM).');
  }

  try {
    const supabase = getSupabase();
    const turno = await obterTurno(supabase, data);

    const { data: canaisReal, error } = await supabase.rpc(FUNCAO_DEFINIR_CANAL, {
      p_turno_id: turno.id,
      p_canal_id: canalId,
      p_horario: horario,
    });

    if (error) return erro(res, 500, error.message);
    return json(res, 200, { canaisReal });
  } catch (e) {
    return erro(res, 500, e instanceof Error ? e.message : 'Erro inesperado.');
  }
}
