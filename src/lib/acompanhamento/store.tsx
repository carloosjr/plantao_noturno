import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';
import { estadoInicialAcompanhamento } from './data';
import type { AcompanhamentoState, AgendaLog, CanalId, GroupLog, QueueLog, ResponsavelAgenda, TarefaId } from './types';

type Acao =
  | { tipo: 'ALTERNAR_TAREFA'; id: TarefaId }
  | { tipo: 'DEFINIR_HORARIO_CANAL'; id: CanalId; valor: string }
  | { tipo: 'INICIAR_ATENDIMENTO_GRUPO'; nome: string; inicio: string }
  | { tipo: 'FINALIZAR_ATENDIMENTO_GRUPO'; id: number; fim: string }
  | { tipo: 'INICIAR_FILA'; inicio: string; quantidade: number }
  | { tipo: 'FINALIZAR_FILA'; id: number; fim: string }
  | { tipo: 'REGISTRAR_LIGACOES'; quantidade: number }
  | { tipo: 'REGISTRAR_AGENDA_INDEVIDA'; responsavel: ResponsavelAgenda; oc: string; horario: string; evidencia: string }
  | { tipo: 'DEFINIR_RESPONSAVEL_FECHAMENTO'; valor: string }
  | { tipo: 'DEFINIR_OBSERVACOES'; valor: string };

function proximoId(itens: { id: number }[]): number {
  return itens.reduce((maior, item) => Math.max(maior, item.id), 0) + 1;
}

function reducer(state: AcompanhamentoState, acao: Acao): AcompanhamentoState {
  switch (acao.tipo) {
    case 'ALTERNAR_TAREFA':
      return {
        ...state,
        tarefasConcluidas: { ...state.tarefasConcluidas, [acao.id]: !state.tarefasConcluidas[acao.id] },
      };

    case 'DEFINIR_HORARIO_CANAL':
      return {
        ...state,
        canaisReal: { ...state.canaisReal, [acao.id]: acao.valor || null },
      };

    case 'INICIAR_ATENDIMENTO_GRUPO': {
      const log: GroupLog = { id: proximoId(state.groupLogs), nome: acao.nome, inicio: acao.inicio, fim: null };
      return { ...state, groupLogs: [...state.groupLogs, log] };
    }

    case 'FINALIZAR_ATENDIMENTO_GRUPO':
      return {
        ...state,
        groupLogs: state.groupLogs.map((log) => (log.id === acao.id ? { ...log, fim: acao.fim } : log)),
      };

    case 'INICIAR_FILA': {
      const log: QueueLog = { id: proximoId(state.queueLogs), inicio: acao.inicio, quantidade: acao.quantidade, fim: null };
      return { ...state, queueLogs: [...state.queueLogs, log] };
    }

    case 'FINALIZAR_FILA':
      return {
        ...state,
        queueLogs: state.queueLogs.map((log) => (log.id === acao.id ? { ...log, fim: acao.fim } : log)),
      };

    case 'REGISTRAR_LIGACOES':
      return { ...state, callTotal: state.callTotal + acao.quantidade };

    case 'REGISTRAR_AGENDA_INDEVIDA': {
      const log: AgendaLog = {
        id: proximoId(state.agendaLogs),
        responsavel: acao.responsavel,
        oc: acao.oc,
        horario: acao.horario,
        evidencia: acao.evidencia,
      };
      return { ...state, agendaLogs: [...state.agendaLogs, log] };
    }

    case 'DEFINIR_RESPONSAVEL_FECHAMENTO':
      return { ...state, closureLead: acao.valor };

    case 'DEFINIR_OBSERVACOES':
      return { ...state, closureNotes: acao.valor };

    default:
      return state;
  }
}

interface AcompanhamentoContextValue {
  state: AcompanhamentoState;
  alternarTarefa(id: TarefaId): void;
  definirHorarioCanal(id: CanalId, valor: string): void;
  iniciarAtendimentoGrupo(nome: string, inicio: string): void;
  finalizarAtendimentoGrupo(id: number, fim: string): void;
  iniciarFila(inicio: string, quantidade: number): void;
  finalizarFila(id: number, fim: string): void;
  registrarLigacoes(quantidade: number): void;
  registrarAgendaIndevida(responsavel: ResponsavelAgenda, oc: string, horario: string, evidencia: string): void;
  definirResponsavelFechamento(valor: string): void;
  definirObservacoes(valor: string): void;
}

const AcompanhamentoContext = createContext<AcompanhamentoContextValue | null>(null);

export function AcompanhamentoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, estadoInicialAcompanhamento);

  const value = useMemo<AcompanhamentoContextValue>(
    () => ({
      state,
      alternarTarefa: (id) => dispatch({ tipo: 'ALTERNAR_TAREFA', id }),
      definirHorarioCanal: (id, valor) => dispatch({ tipo: 'DEFINIR_HORARIO_CANAL', id, valor }),
      iniciarAtendimentoGrupo: (nome, inicio) => dispatch({ tipo: 'INICIAR_ATENDIMENTO_GRUPO', nome, inicio }),
      finalizarAtendimentoGrupo: (id, fim) => dispatch({ tipo: 'FINALIZAR_ATENDIMENTO_GRUPO', id, fim }),
      iniciarFila: (inicio, quantidade) => dispatch({ tipo: 'INICIAR_FILA', inicio, quantidade }),
      finalizarFila: (id, fim) => dispatch({ tipo: 'FINALIZAR_FILA', id, fim }),
      registrarLigacoes: (quantidade) => dispatch({ tipo: 'REGISTRAR_LIGACOES', quantidade }),
      registrarAgendaIndevida: (responsavel, oc, horario, evidencia) =>
        dispatch({ tipo: 'REGISTRAR_AGENDA_INDEVIDA', responsavel, oc, horario, evidencia }),
      definirResponsavelFechamento: (valor) => dispatch({ tipo: 'DEFINIR_RESPONSAVEL_FECHAMENTO', valor }),
      definirObservacoes: (valor) => dispatch({ tipo: 'DEFINIR_OBSERVACOES', valor }),
    }),
    [state],
  );

  return <AcompanhamentoContext.Provider value={value}>{children}</AcompanhamentoContext.Provider>;
}

export function useAcompanhamento(): AcompanhamentoContextValue {
  const contexto = useContext(AcompanhamentoContext);
  if (!contexto) {
    throw new Error('useAcompanhamento deve ser usado dentro de <AcompanhamentoProvider>.');
  }
  return contexto;
}
