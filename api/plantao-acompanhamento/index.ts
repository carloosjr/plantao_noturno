import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  COLUNAS_AGENDA_INDEVIDA,
  COLUNAS_ATENDIMENTO_GRUPO,
  COLUNAS_FILA,
  obterTurno,
  paraAgendaIndevida,
  paraAtendimentoGrupo,
  paraFila,
  paraTurno,
  type AgendaIndevidaRow,
  type AtendimentoGrupoRow,
  type FilaRow,
} from '../_lib/acompanhamento.js';
import { erro, json, param } from '../_lib/http.js';
import { getSupabase, TABELA_AGENDA_INDEVIDA, TABELA_ATENDIMENTOS_GRUPO, TABELA_FILAS } from '../_lib/supabase.js';
import { dataValida, type AcompanhamentoBundle } from '../../shared/acompanhamento.js';

/**
 * GET /api/plantao-acompanhamento?data=YYYY-MM-DD
 * Resolve (ou cria) o turno do dia e devolve tudo que o módulo precisa numa
 * chamada só: turno, atendimentos em grupo, filas e agenda indevida.
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return erro(res, 405, 'Método não permitido.');
  }

  const data = param(req, 'data');
  if (!data || !dataValida(data)) {
    return erro(res, 400, 'Parâmetro "data" inválido (esperado YYYY-MM-DD).');
  }

  try {
    const supabase = getSupabase();
    const turnoRow = await obterTurno(supabase, data);

    const [grupos, filas, agenda] = await Promise.all([
      supabase
        .from(TABELA_ATENDIMENTOS_GRUPO)
        .select(COLUNAS_ATENDIMENTO_GRUPO)
        .eq('turno_id', turnoRow.id)
        .order('created_at', { ascending: true }),
      supabase
        .from(TABELA_FILAS)
        .select(COLUNAS_FILA)
        .eq('turno_id', turnoRow.id)
        .order('created_at', { ascending: true }),
      supabase
        .from(TABELA_AGENDA_INDEVIDA)
        .select(COLUNAS_AGENDA_INDEVIDA)
        .eq('turno_id', turnoRow.id)
        .order('created_at', { ascending: true }),
    ]);

    if (grupos.error) return erro(res, 500, grupos.error.message);
    if (filas.error) return erro(res, 500, filas.error.message);
    if (agenda.error) return erro(res, 500, agenda.error.message);

    const bundle: AcompanhamentoBundle = {
      turno: paraTurno(turnoRow),
      atendimentosGrupo: ((grupos.data ?? []) as AtendimentoGrupoRow[]).map(paraAtendimentoGrupo),
      filas: ((filas.data ?? []) as FilaRow[]).map(paraFila),
      agendaIndevida: ((agenda.data ?? []) as AgendaIndevidaRow[]).map(paraAgendaIndevida),
    };

    return json(res, 200, bundle);
  } catch (e) {
    return erro(res, 500, e instanceof Error ? e.message : 'Erro inesperado.');
  }
}
