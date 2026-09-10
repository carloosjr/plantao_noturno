import type { VercelRequest, VercelResponse } from '@vercel/node';
import { COLUNAS_AGENDA_INDEVIDA, obterTurno, paraAgendaIndevida, type AgendaIndevidaRow } from '../_lib/acompanhamento.js';
import { erro, json, param } from '../_lib/http.js';
import { getSupabase, TABELA_AGENDA_INDEVIDA } from '../_lib/supabase.js';
import { dataValida, horarioValido, RESPONSAVEIS_AGENDA } from '../../shared/acompanhamento.js';

/**
 * POST /api/plantao-acompanhamento/agenda?data=YYYY-MM-DD
 * Body: { responsavel, oc, horario, evidencia }
 * Usado pela tela "Validação de agenda".
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
  const responsavel = corpo.responsavel;
  const oc = typeof corpo.oc === 'string' ? corpo.oc.trim() : '';
  const evidencia = typeof corpo.evidencia === 'string' ? corpo.evidencia.trim() : null;

  if (!RESPONSAVEIS_AGENDA.includes(responsavel)) return erro(res, 400, 'responsavel inválido.');
  if (!oc) return erro(res, 400, 'Informe a OC / chamado.');
  if (!horarioValido(corpo.horario)) return erro(res, 400, 'horario inválido (esperado HH:MM).');

  try {
    const supabase = getSupabase();
    const turno = await obterTurno(supabase, data);

    const { data: row, error } = await supabase
      .from(TABELA_AGENDA_INDEVIDA)
      .insert({ turno_id: turno.id, responsavel, oc, horario: corpo.horario, evidencia: evidencia || null })
      .select(COLUNAS_AGENDA_INDEVIDA)
      .single<AgendaIndevidaRow>();

    if (error || !row) return erro(res, 500, error?.message ?? 'Não foi possível registrar a OC indevida.');
    return json(res, 201, paraAgendaIndevida(row));
  } catch (e) {
    return erro(res, 500, e instanceof Error ? e.message : 'Erro inesperado.');
  }
}
