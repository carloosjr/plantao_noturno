import type { AcompanhamentoState, CanalDef, TarefaDef } from './types';

/** Roteiro fixo do plantão — portado do protótipo `prototipo/acompanhamento.html`. */
export const TAREFAS: TarefaDef[] = [
  {
    id: 'revisar-agenda',
    horario: '17:00',
    titulo: 'Revisar agenda',
    descricao: 'Verificar a agenda de Matheus, Bezerra e Osiel e identificar possíveis OCs que possam comprometer o plantão',
  },
  {
    id: 'revisar-andamento',
    horario: '17:30',
    titulo: 'Revisar andamento de tickets do Chat e OCs dos Especialistas',
    descricao: 'Verificar o andamento das OCs e identificar o que será concluído e o que pode avançar para o plantão',
  },
  {
    id: 'validacao-plantao',
    horario: '18:00',
    titulo: 'Validação de OCs direcionadas ao Plantão',
    descricao: 'Toda continuação deve passar pelo Responsável do Plantão. Decidir se realmente precisa continuar hoje ou se pode ficar para outro dia',
  },
  {
    id: 'acompanhar-grupos',
    horario: '18:00',
    titulo: 'Acompanhar grupos',
    descricao: 'Responsável do plantão monitora os grupos de atendimento durante todo o turno',
    continua: true,
  },
  {
    id: 'acompanhar-chat',
    horario: '18:15',
    titulo: 'Acompanhar equipe do Chat no Workdesk',
    descricao: 'Responsável do plantão monitora os atendimentos e a equipe do Chat pelo Workdesk durante todo o turno',
    continua: true,
  },
  {
    id: 'validar-agenda-noite',
    horario: '18:30',
    titulo: 'Validar agenda da equipe do Plantão',
    descricao: 'Verificar a agenda de Matheus, Bezerra e Osiel e identificar possíveis OCs que possam comprometer o plantão',
  },
  {
    id: 'finalizacao-apoio',
    horario: '18:00 – 18:50',
    titulo: 'Finalização e apoio',
    descricao: 'Matheus e Bezerra finalizam seus próprios chamados e as continuações aprovadas. Osiel atua nos Grupos e apoia quando livre',
  },
  {
    id: 'validacao-2',
    horario: '19:00',
    titulo: 'Validação 2 + início oficial',
    descricao: 'Validação de OCs direcionadas ao Plantão; papéis travam por canal: Matheus → Linha, Bezerra → Workdesk, Osiel → Grupos',
  },
  {
    id: 'validar-pitstop',
    horario: '19:00',
    titulo: 'Validar PitStop',
    descricao: 'Conferência de possíveis atendimentos vindos do PitStop antes do início oficial do plantão',
  },
  {
    id: 'ajuste-chat',
    horario: '20:00',
    titulo: 'Ajuste da equipe no WorkDesk',
    descricao: 'Otávio e Gilseph saem',
  },
];

export const CANAIS: CanalDef[] = [
  { id: 'grupos', nome: 'Grupos', responsavel: 'Osiel', previsto: '18:00', statusInicial: 'Ativo', statusInicialTier: 'ok' },
  { id: 'linha', nome: 'Linha', responsavel: 'Matheus', previsto: '19:00', statusInicial: 'Aguardando 19h', statusInicialTier: 'wait' },
  { id: 'workdesk', nome: 'Workdesk', responsavel: 'Bezerra', previsto: '19:00', statusInicial: 'Aguardando 19h', statusInicialTier: 'wait' },
  { id: 'chat', nome: 'Chat', responsavel: 'Otávio / Gilseph', previsto: '20:00', statusInicial: 'Ativo até 20h', statusInicialTier: 'ok' },
];

/** Data local (YYYY-MM-DD) do dispositivo — usada para resolver/filtrar o turno. */
export function dataDeHoje(): string {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/** Estado antes do turno do dia ser carregado do servidor. */
export function estadoInicialAcompanhamento(): AcompanhamentoState {
  return {
    turnoId: null,
    carregando: true,
    erro: null,
    tarefasConcluidas: {},
    canaisReal: {},
    groupLogs: [],
    queueLogs: [],
    ligacoes: [],
    agendaLogs: [],
    closureLead: '',
    closureNotes: '',
  };
}
