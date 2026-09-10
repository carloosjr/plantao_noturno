import { CANAIS, TAREFAS } from './data';
import type {
  AcompanhamentoState,
  AgendaLog,
  QueueLog,
  ResponsavelAgenda,
  ResultadoCanal,
  SaudePlantao,
  SaudeTier,
} from './types';

/** Funções puras portadas de `prototipo/acompanhamento.html` (cálculo de saúde e agregações). */

function toMinutos(hhmm: string): number {
  const [horas, minutos] = hhmm.split(':');
  return parseInt(horas, 10) * 60 + parseInt(minutos, 10);
}

export function calcularSaude(state: AcompanhamentoState): SaudePlantao {
  const totalTasks = TAREFAS.length;
  const doneTasks = TAREFAS.filter((tarefa) => state.tarefasConcluidas[tarefa.id]).length;
  const taskScore = totalTasks ? (doneTasks / totalTasks) * 100 : 100;

  const totalChannels = CANAIS.length;
  let lateChannels = 0;
  let channelScoreSum = 0;

  for (const canal of CANAIS) {
    const real = state.canaisReal[canal.id];
    let score = 0;
    if (real) {
      const diff = toMinutos(real) - toMinutos(canal.previsto);
      if (diff > 0) {
        lateChannels += 1;
        score = Math.max(0, 100 - diff * 5);
      } else {
        score = 100;
      }
    }
    channelScoreSum += score;
  }
  const channelScore = totalChannels ? channelScoreSum / totalChannels : 100;
  const overall = Math.round(taskScore * 0.5 + channelScore * 0.5);
  const tier: SaudeTier = overall >= 80 ? 'good' : overall >= 50 ? 'warn' : 'bad';

  return { overall, tier, doneTasks, totalTasks, lateChannels, totalChannels };
}

/** Diferença em minutos entre o horário real e o previsto (positiva = atraso). */
export function diffMinutosCanal(real: string, previsto: string): number {
  return toMinutos(real) - toMinutos(previsto);
}

/** Texto/tier exibidos fora do card do canal (Produtividade, tabela de Fechamento). */
export function resultadoCanal(real: string | null, previsto: string): ResultadoCanal {
  if (!real) return { texto: 'Aguardando', tier: 'wait' };
  const diff = diffMinutosCanal(real, previsto);
  if (diff <= 0) return { texto: 'No horário', tier: 'ok' };
  return { texto: `${diff} min de atraso`, tier: 'warn' };
}

export function duracaoMinutos(log: { inicio: string; fim: string | null }): number | null {
  if (!log.fim) return null;
  return Math.max(0, toMinutos(log.fim) - toMinutos(log.inicio));
}

export function mediaMinutos(logs: { inicio: string; fim: string | null }[]): number | null {
  const duracoes = logs.map(duracaoMinutos).filter((d): d is number => d !== null);
  if (!duracoes.length) return null;
  return Math.round(duracoes.reduce((soma, d) => soma + d, 0) / duracoes.length);
}

export function maiorDuracaoMinutos(logs: { inicio: string; fim: string | null }[]): number | null {
  const duracoes = logs.map(duracaoMinutos).filter((d): d is number => d !== null);
  if (!duracoes.length) return null;
  return Math.max(...duracoes);
}

export function picoFila(logs: QueueLog[]): number | null {
  if (!logs.length) return null;
  return Math.max(...logs.map((log) => log.quantidade || 0));
}

export function tarefasPendentes(state: AcompanhamentoState): { horario: string; titulo: string }[] {
  return TAREFAS.filter((tarefa) => !state.tarefasConcluidas[tarefa.id]).map((tarefa) => ({
    horario: tarefa.horario,
    titulo: tarefa.titulo,
  }));
}

export function contarPorResponsavel(logs: AgendaLog[], responsavel: ResponsavelAgenda): number {
  return logs.filter((log) => log.responsavel === responsavel).length;
}

export interface PontoDeAtencao {
  texto: string;
  tier: 'ok' | 'warn' | 'danger';
}

const RESPONSAVEIS_AGENDA_ORDEM: ResponsavelAgenda[] = ['Matheus', 'Osiel', 'Hercílio'];

/** Lista de pontos de atenção do Fechamento — lógica portada de `computeClosure()`. */
export function pontosDeAtencao(state: AcompanhamentoState, saude: SaudePlantao): PontoDeAtencao[] {
  const pontos: PontoDeAtencao[] = [];

  for (const canal of CANAIS) {
    const real = state.canaisReal[canal.id];
    if (real) {
      const diff = diffMinutosCanal(real, canal.previsto);
      if (diff > 0) pontos.push({ texto: `${canal.nome} atrasou ${diff} min`, tier: 'warn' });
    }
  }

  const pendentes = tarefasPendentes(state);
  if (pendentes.length > 0) {
    pontos.push({ texto: `${pendentes.length} tarefa(s) não concluída(s)`, tier: 'warn' });
  }

  if (state.queueLogs.length > 0) {
    const pico = picoFila(state.queueLogs) ?? 0;
    pontos.push({ texto: `${state.queueLogs.length} fila(s) registrada(s), pico de ${pico} tickets`, tier: 'warn' });
  }

  for (const nome of RESPONSAVEIS_AGENDA_ORDEM) {
    const total = contarPorResponsavel(state.agendaLogs, nome);
    if (total > 0) pontos.push({ texto: `${total} OC(s) indevida(s) na agenda de ${nome}`, tier: 'warn' });
  }

  if (pontos.length === 0) {
    pontos.push({ texto: 'Nenhum ponto de atenção — plantão dentro do esperado', tier: 'ok' });
  }

  if (saude.overall < 50) {
    pontos.unshift({ texto: `Saúde do plantão terminou em ${saude.overall}% — turno em risco`, tier: 'danger' });
  }

  return pontos;
}
