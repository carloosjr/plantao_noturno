/**
 * Domínio do módulo "Acompanhamento do plantão" — checklist e saúde do turno.
 * Client-side apenas: não é persistido, não passa pela API nem pelo Supabase.
 */

export type TarefaId =
  | 'revisar-agenda'
  | 'revisar-andamento'
  | 'validacao-plantao'
  | 'acompanhar-grupos'
  | 'acompanhar-chat'
  | 'validar-agenda-noite'
  | 'finalizacao-apoio'
  | 'validacao-2'
  | 'validar-pitstop'
  | 'ajuste-chat';

export interface TarefaDef {
  id: TarefaId;
  horario: string;
  titulo: string;
  descricao: string;
  continua?: boolean;
}

export type CanalId = 'grupos' | 'linha' | 'workdesk' | 'chat';

export interface CanalDef {
  id: CanalId;
  nome: string;
  responsavel: string;
  previsto: string;
  statusInicial: string;
  statusInicialTier: 'ok' | 'wait';
}

export interface GroupLog {
  id: number;
  nome: string;
  inicio: string;
  fim: string | null;
}

export interface QueueLog {
  id: number;
  inicio: string;
  quantidade: number;
  fim: string | null;
}

export const RESPONSAVEIS_AGENDA = ['Matheus', 'Osiel', 'Hercílio'] as const;
export type ResponsavelAgenda = (typeof RESPONSAVEIS_AGENDA)[number];

export interface AgendaLog {
  id: number;
  responsavel: ResponsavelAgenda;
  oc: string;
  horario: string;
  evidencia: string;
}

export const RESPONSAVEIS_FECHAMENTO = ['Matheus', 'Osiel', 'Bezerra', 'Hercílio'] as const;

export interface AcompanhamentoState {
  tarefasConcluidas: Record<TarefaId, boolean>;
  canaisReal: Record<CanalId, string | null>;
  groupLogs: GroupLog[];
  queueLogs: QueueLog[];
  callTotal: number;
  agendaLogs: AgendaLog[];
  closureLead: string;
  closureNotes: string;
}

export type SaudeTier = 'good' | 'warn' | 'bad';

export interface SaudePlantao {
  overall: number;
  tier: SaudeTier;
  doneTasks: number;
  totalTasks: number;
  lateChannels: number;
  totalChannels: number;
}

export type ResultadoCanalTier = 'ok' | 'warn' | 'wait';

export interface ResultadoCanal {
  texto: string;
  tier: ResultadoCanalTier;
}
