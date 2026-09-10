/**
 * Domínio do módulo "Acompanhamento do plantão" — checklist e saúde do turno.
 * Tipos de apresentação (client-only); os tipos de dado persistido vêm de
 * `shared/acompanhamento.ts`, compartilhados com a API.
 */
import type {
  AgendaIndevida,
  AtendimentoGrupo,
  CanalId,
  FilaAtendimento,
  ResponsavelAgenda,
  TarefaId,
} from '../../../shared/acompanhamento';

export type { CanalId, ResponsavelAgenda, TarefaId };
export { RESPONSAVEIS_AGENDA } from '../../../shared/acompanhamento';

export interface TarefaDef {
  id: TarefaId;
  horario: string;
  titulo: string;
  descricao: string;
  continua?: boolean;
}

export interface CanalDef {
  id: CanalId;
  nome: string;
  responsavel: string;
  previsto: string;
  statusInicial: string;
  statusInicialTier: 'ok' | 'wait';
}

export type GroupLog = AtendimentoGrupo;
export type QueueLog = FilaAtendimento;
export type AgendaLog = AgendaIndevida;

export const RESPONSAVEIS_FECHAMENTO = ['Matheus', 'Osiel', 'Bezerra', 'Hercílio'] as const;

export interface AcompanhamentoState {
  turnoId: string | null;
  carregando: boolean;
  erro: string | null;
  tarefasConcluidas: Partial<Record<TarefaId, boolean>>;
  canaisReal: Partial<Record<CanalId, string | null>>;
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
