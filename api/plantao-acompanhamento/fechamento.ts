import type { VercelRequest, VercelResponse } from '@vercel/node';
import { obterTurno } from '../_lib/acompanhamento.js';
import { erro, json, param } from '../_lib/http.js';
import { getSupabase, TABELA_TURNOS } from '../_lib/supabase.js';
import { dataValida } from '../../shared/acompanhamento.js';

interface FechamentoRow {
  closure_lead: string | null;
  closure_notes: string | null;
}

/**
 * PATCH /api/plantao-acompanhamento/fechamento?data=YYYY-MM-DD
 * Body: { closureLead?, closureNotes? }
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

  const atualizacoes: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof corpo.closureLead === 'string') atualizacoes.closure_lead = corpo.closureLead;
  if (typeof corpo.closureNotes === 'string') atualizacoes.closure_notes = corpo.closureNotes;

  if (Object.keys(atualizacoes).length === 1) {
    return erro(res, 400, 'Informe closureLead e/ou closureNotes.');
  }

  try {
    const supabase = getSupabase();
    const turno = await obterTurno(supabase, data);

    const { data: row, error } = await supabase
      .from(TABELA_TURNOS)
      .update(atualizacoes)
      .eq('id', turno.id)
      .select('closure_lead, closure_notes')
      .single<FechamentoRow>();

    if (error || !row) return erro(res, 500, error?.message ?? 'Não foi possível salvar o fechamento.');
    return json(res, 200, { closureLead: row.closure_lead, closureNotes: row.closure_notes });
  } catch (e) {
    return erro(res, 500, e instanceof Error ? e.message : 'Erro inesperado.');
  }
}
