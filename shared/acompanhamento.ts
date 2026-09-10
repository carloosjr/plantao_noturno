/**
 * Domínio do módulo "Acompanhamento do plantão" (checklist, canais, atendimentos
 * em grupo, filas, ligações e validação de agenda).
 * Compartilhado entre o frontend (src) e as funções serverless (api).
 */

export const TAREFA_IDS = [
  'revisar-agenda',
  'revisar-andamento',
  'validacao-plantao',
  'acompanhar-grupos',
  'acompanhar-chat',
  'validar-agenda-noite',
  'finalizacao-apoio',
  'validacao-2',
  'validar-pitstop',
  'ajuste-chat',
] as const;
export type TarefaId = (typeof TAREFA_IDS)[number];

export const CANAL_IDS = ['grupos', 'linha', 'workdesk', 'chat'] as const;
export type CanalId = (typeof CANAL_IDS)[number];

export const RESPONSAVEIS_AGENDA = ['Matheus', 'Osiel', 'Bezerra', 'Hercílio'] as const;
export type ResponsavelAgenda = (typeof RESPONSAVEIS_AGENDA)[number];

const HORARIO_REGEX = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
export function horarioValido(valor: unknown): valor is string {
  return typeof valor === 'string' && HORARIO_REGEX.test(valor);
}

/** Data no formato `YYYY-MM-DD` (data local do turno, calculada no navegador). */
const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export function dataValida(valor: unknown): valor is string {
  return typeof valor === 'string' && DATA_REGEX.test(valor);
}

export interface TurnoAcompanhamento {
  id: string;
  data: string;
  tarefasConcluidas: Partial<Record<TarefaId, boolean>>;
  canaisReal: Partial<Record<CanalId, string | null>>;
  closureLead: string | null;
  closureNotes: string | null;
}

export interface AtendimentoGrupo {
  id: string;
  turnoId: string;
  nome: string;
  inicio: string;
  fim: string | null;
}

export interface FilaAtendimento {
  id: string;
  turnoId: string;
  inicio: string;
  quantidade: number;
  fim: string | null;
}

export interface AgendaIndevida {
  id: string;
  turnoId: string;
  registro: number | null;
  responsavel: ResponsavelAgenda;
  oc: string;
  horario: string;
  evidencia: string | null;
}

export interface Ligacao {
  id: string;
  turnoId: string;
  quantidade: number;
  criadoEm: string;
}

/** Resposta de `GET /api/plantao-acompanhamento`. */
export interface AcompanhamentoBundle {
  turno: TurnoAcompanhamento;
  atendimentosGrupo: AtendimentoGrupo[];
  filas: FilaAtendimento[];
  agendaIndevida: AgendaIndevida[];
  ligacoes: Ligacao[];
}
