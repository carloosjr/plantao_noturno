import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AgendaIndevida,
  AtendimentoGrupo,
  FilaAtendimento,
  Ligacao,
  ResponsavelAgenda,
  TurnoAcompanhamento,
} from '../../shared/acompanhamento.js';
import { FUNCAO_OBTER_TURNO } from './supabase.js';

/** Linha de plantaonoturno_turnos. */
export interface TurnoRow {
  id: string;
  data: string;
  tarefas_concluidas: Record<string, boolean> | null;
  canais_real: Record<string, string | null> | null;
  closure_lead: string | null;
  closure_notes: string | null;
}

export function paraTurno(row: TurnoRow): TurnoAcompanhamento {
  return {
    id: row.id,
    data: row.data,
    tarefasConcluidas: row.tarefas_concluidas ?? {},
    canaisReal: row.canais_real ?? {},
    closureLead: row.closure_lead,
    closureNotes: row.closure_notes,
  };
}

/** Resolve (ou cria) o turno do dia via `plantaonoturno_obter_turno`. */
export async function obterTurno(supabase: SupabaseClient, data: string): Promise<TurnoRow> {
  const { data: row, error } = await supabase.rpc(FUNCAO_OBTER_TURNO, { p_data: data });
  if (error || !row) {
    throw new Error(error?.message ?? 'Não foi possível resolver o turno do dia.');
  }
  return row as TurnoRow;
}

export const COLUNAS_TURNO = 'id, data, tarefas_concluidas, canais_real, closure_lead, closure_notes';

/** Linha de plantaonoturno_atendimentos_grupo. */
export interface AtendimentoGrupoRow {
  id: string;
  turno_id: string;
  nome: string;
  inicio: string;
  fim: string | null;
}

export const COLUNAS_ATENDIMENTO_GRUPO = 'id, turno_id, nome, inicio, fim';

export function paraAtendimentoGrupo(row: AtendimentoGrupoRow): AtendimentoGrupo {
  return { id: row.id, turnoId: row.turno_id, nome: row.nome, inicio: row.inicio, fim: row.fim };
}

/** Linha de plantaonoturno_filas. */
export interface FilaRow {
  id: string;
  turno_id: string;
  inicio: string;
  quantidade: number;
  fim: string | null;
}

export const COLUNAS_FILA = 'id, turno_id, inicio, quantidade, fim';

export function paraFila(row: FilaRow): FilaAtendimento {
  return { id: row.id, turnoId: row.turno_id, inicio: row.inicio, quantidade: row.quantidade, fim: row.fim };
}

/** Linha de plantaonoturno_agenda_indevida. */
export interface AgendaIndevidaRow {
  id: string;
  turno_id: string;
  registro: number | string | null;
  responsavel: string;
  oc: string;
  horario: string;
  evidencia: string | null;
}

export const COLUNAS_AGENDA_INDEVIDA = 'id, turno_id, registro, responsavel, oc, horario, evidencia';

export function paraAgendaIndevida(row: AgendaIndevidaRow): AgendaIndevida {
  return {
    id: row.id,
    turnoId: row.turno_id,
    registro: row.registro === null ? null : Number(row.registro),
    responsavel: row.responsavel as ResponsavelAgenda,
    oc: row.oc,
    horario: row.horario,
    evidencia: row.evidencia,
  };
}

/** Linha de plantaonoturno_ligacoes. */
export interface LigacaoRow {
  id: string;
  turno_id: string;
  quantidade: number;
  horario: string | null;
  created_at: string;
}

export const COLUNAS_LIGACAO = 'id, turno_id, quantidade, horario, created_at';

export function paraLigacao(row: LigacaoRow): Ligacao {
  return {
    id: row.id,
    turnoId: row.turno_id,
    quantidade: row.quantidade,
    horario: row.horario,
    criadoEm: row.created_at,
  };
}
