import type { VercelRequest, VercelResponse } from '@vercel/node';
import { obterTurno } from '../_lib/acompanhamento.js';
import { erro, json, param } from '../_lib/http.js';
import { FUNCAO_DEFINIR_TAREFA, getSupabase } from '../_lib/supabase.js';
import { dataValida, TAREFA_IDS, type TarefaId } from '../../shared/acompanhamento.js';

/**
 * PATCH /api/plantao-acompanhamento/tarefas?data=YYYY-MM-DD
 * Body: { tarefaId, concluida }
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
  const tarefaId = corpo.tarefaId as TarefaId;
  const concluida = corpo.concluida;

  if (!TAREFA_IDS.includes(tarefaId)) {
    return erro(res, 400, 'tarefaId inválido.');
  }
  if (typeof concluida !== 'boolean') {
    return erro(res, 400, 'concluida deve ser booleano.');
  }

  try {
    const supabase = getSupabase();
    const turno = await obterTurno(supabase, data);

    const { data: tarefasConcluidas, error } = await supabase.rpc(FUNCAO_DEFINIR_TAREFA, {
      p_turno_id: turno.id,
      p_tarefa_id: tarefaId,
      p_concluida: concluida,
    });

    if (error) return erro(res, 500, error.message);
    return json(res, 200, { tarefasConcluidas });
  } catch (e) {
    return erro(res, 500, e instanceof Error ? e.message : 'Erro inesperado.');
  }
}
