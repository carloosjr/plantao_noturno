import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import type { AcompanhamentoBundle, CanalId, ResponsavelAgenda, TarefaId } from '../../../shared/acompanhamento';
import {
  carregarAcompanhamento,
  definirCanal as apiDefinirCanal,
  definirFechamento as apiDefinirFechamento,
  definirTarefa as apiDefinirTarefa,
  excluirAgendaIndevida as apiExcluirAgendaIndevida,
  excluirAtendimentoGrupo as apiExcluirAtendimentoGrupo,
  excluirFila as apiExcluirFila,
  excluirLigacao as apiExcluirLigacao,
  finalizarAtendimentoGrupo as apiFinalizarAtendimentoGrupo,
  finalizarFila as apiFinalizarFila,
  iniciarAtendimentoGrupo as apiIniciarAtendimentoGrupo,
  iniciarFila as apiIniciarFila,
  registrarAgendaIndevida as apiRegistrarAgendaIndevida,
  registrarLigacoes as apiRegistrarLigacoes,
} from './api';
import { dataDeHoje, estadoInicialAcompanhamento } from './data';
import type { AcompanhamentoState, AgendaLog, GroupLog, LigacaoLog, QueueLog } from './types';

const DEBOUNCE_OBSERVACOES_MS = 600;

type Acao =
  | { tipo: 'CARREGANDO' }
  | { tipo: 'BUNDLE_CARREGADO'; bundle: AcompanhamentoBundle }
  | { tipo: 'ERRO_CARREGAR'; mensagem: string }
  | { tipo: 'ALTERNAR_TAREFA'; id: TarefaId }
  | { tipo: 'DEFINIR_HORARIO_CANAL'; id: CanalId; valor: string | null }
  | { tipo: 'GRUPO_LOG_ADICIONADO'; log: GroupLog }
  | { tipo: 'GRUPO_LOG_ATUALIZADO'; log: GroupLog }
  | { tipo: 'GRUPO_LOG_REMOVIDO'; id: string }
  | { tipo: 'FILA_LOG_ADICIONADO'; log: QueueLog }
  | { tipo: 'FILA_LOG_ATUALIZADO'; log: QueueLog }
  | { tipo: 'FILA_LOG_REMOVIDO'; id: string }
  | { tipo: 'LIGACAO_ADICIONADA'; log: LigacaoLog }
  | { tipo: 'LIGACAO_REMOVIDA'; id: string }
  | { tipo: 'AGENDA_LOG_ADICIONADO'; log: AgendaLog }
  | { tipo: 'AGENDA_LOG_REMOVIDO'; id: string }
  | { tipo: 'DEFINIR_RESPONSAVEL_FECHAMENTO'; valor: string }
  | { tipo: 'DEFINIR_OBSERVACOES'; valor: string };

function reducer(state: AcompanhamentoState, acao: Acao): AcompanhamentoState {
  switch (acao.tipo) {
    case 'CARREGANDO':
      return { ...state, carregando: true, erro: null };

    case 'BUNDLE_CARREGADO':
      return {
        ...state,
        turnoId: acao.bundle.turno.id,
        carregando: false,
        erro: null,
        tarefasConcluidas: acao.bundle.turno.tarefasConcluidas,
        canaisReal: acao.bundle.turno.canaisReal,
        closureLead: acao.bundle.turno.closureLead ?? '',
        closureNotes: acao.bundle.turno.closureNotes ?? '',
        groupLogs: acao.bundle.atendimentosGrupo,
        queueLogs: acao.bundle.filas,
        ligacoes: acao.bundle.ligacoes,
        agendaLogs: acao.bundle.agendaIndevida,
      };

    case 'ERRO_CARREGAR':
      return { ...state, carregando: false, erro: acao.mensagem };

    case 'ALTERNAR_TAREFA':
      return {
        ...state,
        tarefasConcluidas: { ...state.tarefasConcluidas, [acao.id]: !state.tarefasConcluidas[acao.id] },
      };

    case 'DEFINIR_HORARIO_CANAL':
      return {
        ...state,
        canaisReal: { ...state.canaisReal, [acao.id]: acao.valor },
      };

    case 'GRUPO_LOG_ADICIONADO':
      return { ...state, groupLogs: [...state.groupLogs, acao.log] };

    case 'GRUPO_LOG_ATUALIZADO':
      return { ...state, groupLogs: state.groupLogs.map((log) => (log.id === acao.log.id ? acao.log : log)) };

    case 'GRUPO_LOG_REMOVIDO':
      return { ...state, groupLogs: state.groupLogs.filter((log) => log.id !== acao.id) };

    case 'FILA_LOG_ADICIONADO':
      return { ...state, queueLogs: [...state.queueLogs, acao.log] };

    case 'FILA_LOG_ATUALIZADO':
      return { ...state, queueLogs: state.queueLogs.map((log) => (log.id === acao.log.id ? acao.log : log)) };

    case 'FILA_LOG_REMOVIDO':
      return { ...state, queueLogs: state.queueLogs.filter((log) => log.id !== acao.id) };

    case 'LIGACAO_ADICIONADA':
      return { ...state, ligacoes: [...state.ligacoes, acao.log] };

    case 'LIGACAO_REMOVIDA':
      return { ...state, ligacoes: state.ligacoes.filter((log) => log.id !== acao.id) };

    case 'AGENDA_LOG_ADICIONADO':
      return { ...state, agendaLogs: [...state.agendaLogs, acao.log] };

    case 'AGENDA_LOG_REMOVIDO':
      return { ...state, agendaLogs: state.agendaLogs.filter((log) => log.id !== acao.id) };

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
  dataTurno: string;
  hoje: string;
  definirData(data: string): void;
  alternarTarefa(id: TarefaId): void;
  definirHorarioCanal(id: CanalId, valor: string): void;
  iniciarAtendimentoGrupo(nome: string, inicio: string): void;
  finalizarAtendimentoGrupo(id: string, fim: string): void;
  excluirAtendimentoGrupo(id: string): void;
  iniciarFila(inicio: string, quantidade: number): void;
  finalizarFila(id: string, fim: string): void;
  excluirFila(id: string): void;
  registrarLigacoes(quantidade: number, horario?: string, evidencia?: string): void;
  excluirLigacao(id: string): void;
  registrarAgendaIndevida(registro: number, responsavel: ResponsavelAgenda, oc: string, horario: string, evidencia: string): void;
  excluirAgendaIndevida(id: string): void;
  definirResponsavelFechamento(valor: string): void;
  definirObservacoes(valor: string): void;
}

const AcompanhamentoContext = createContext<AcompanhamentoContextValue | null>(null);

export function AcompanhamentoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, estadoInicialAcompanhamento);
  const hoje = useMemo(dataDeHoje, []);
  const [dataTurno, setDataTurno] = useState(hoje);
  const notasTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelado = false;
    dispatch({ tipo: 'CARREGANDO' });
    carregarAcompanhamento(dataTurno)
      .then((bundle) => {
        if (!cancelado) dispatch({ tipo: 'BUNDLE_CARREGADO', bundle });
      })
      .catch((e) => {
        if (!cancelado) {
          dispatch({ tipo: 'ERRO_CARREGAR', mensagem: e instanceof Error ? e.message : 'Não foi possível carregar o plantão selecionado.' });
        }
      });
    return () => {
      cancelado = true;
    };
  }, [dataTurno]);

  useEffect(
    () => () => {
      if (notasTimeout.current) clearTimeout(notasTimeout.current);
    },
    [],
  );

  const value = useMemo<AcompanhamentoContextValue>(
    () => ({
      state,
      dataTurno,
      hoje,

      definirData: (data) => {
        if (data) setDataTurno(data);
      },

      alternarTarefa: (id) => {
        const concluida = !state.tarefasConcluidas[id];
        dispatch({ tipo: 'ALTERNAR_TAREFA', id });
        apiDefinirTarefa(dataTurno, id, concluida).catch((e) => console.error('Falha ao salvar tarefa:', e));
      },

      definirHorarioCanal: (id, valor) => {
        dispatch({ tipo: 'DEFINIR_HORARIO_CANAL', id, valor: valor || null });
        apiDefinirCanal(dataTurno, id, valor).catch((e) => console.error('Falha ao salvar canal:', e));
      },

      iniciarAtendimentoGrupo: (nome, inicio) => {
        apiIniciarAtendimentoGrupo(dataTurno, nome, inicio)
          .then((log) => dispatch({ tipo: 'GRUPO_LOG_ADICIONADO', log }))
          .catch((e) => console.error('Falha ao registrar atendimento:', e));
      },

      finalizarAtendimentoGrupo: (id, fim) => {
        apiFinalizarAtendimentoGrupo(id, fim)
          .then((log) => dispatch({ tipo: 'GRUPO_LOG_ATUALIZADO', log }))
          .catch((e) => console.error('Falha ao encerrar atendimento:', e));
      },

      excluirAtendimentoGrupo: (id) => {
        dispatch({ tipo: 'GRUPO_LOG_REMOVIDO', id });
        apiExcluirAtendimentoGrupo(id).catch((e) => console.error('Falha ao excluir atendimento:', e));
      },

      iniciarFila: (inicio, quantidade) => {
        apiIniciarFila(dataTurno, inicio, quantidade)
          .then((log) => dispatch({ tipo: 'FILA_LOG_ADICIONADO', log }))
          .catch((e) => console.error('Falha ao registrar fila:', e));
      },

      finalizarFila: (id, fim) => {
        apiFinalizarFila(id, fim)
          .then((log) => dispatch({ tipo: 'FILA_LOG_ATUALIZADO', log }))
          .catch((e) => console.error('Falha ao encerrar fila:', e));
      },

      excluirFila: (id) => {
        dispatch({ tipo: 'FILA_LOG_REMOVIDO', id });
        apiExcluirFila(id).catch((e) => console.error('Falha ao excluir fila:', e));
      },

      registrarLigacoes: (quantidade, horario, evidencia) => {
        apiRegistrarLigacoes(dataTurno, quantidade, horario, evidencia)
          .then((log) => dispatch({ tipo: 'LIGACAO_ADICIONADA', log }))
          .catch((e) => console.error('Falha ao registrar ligações:', e));
      },

      excluirLigacao: (id) => {
        dispatch({ tipo: 'LIGACAO_REMOVIDA', id });
        apiExcluirLigacao(id).catch((e) => console.error('Falha ao excluir ligações:', e));
      },

      registrarAgendaIndevida: (registro, responsavel, oc, horario, evidencia) => {
        apiRegistrarAgendaIndevida(dataTurno, registro, responsavel, oc, horario, evidencia)
          .then((log) => dispatch({ tipo: 'AGENDA_LOG_ADICIONADO', log }))
          .catch((e) => console.error('Falha ao registrar OC indevida:', e));
      },

      excluirAgendaIndevida: (id) => {
        dispatch({ tipo: 'AGENDA_LOG_REMOVIDO', id });
        apiExcluirAgendaIndevida(id).catch((e) => console.error('Falha ao excluir OC indevida:', e));
      },

      definirResponsavelFechamento: (valor) => {
        dispatch({ tipo: 'DEFINIR_RESPONSAVEL_FECHAMENTO', valor });
        apiDefinirFechamento(dataTurno, { closureLead: valor }).catch((e) => console.error('Falha ao salvar responsável:', e));
      },

      definirObservacoes: (valor) => {
        dispatch({ tipo: 'DEFINIR_OBSERVACOES', valor });
        if (notasTimeout.current) clearTimeout(notasTimeout.current);
        notasTimeout.current = setTimeout(() => {
          apiDefinirFechamento(dataTurno, { closureNotes: valor }).catch((e) => console.error('Falha ao salvar observações:', e));
        }, DEBOUNCE_OBSERVACOES_MS);
      },
    }),
    [state, dataTurno, hoje],
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
