/**
 * Domínio do módulo "Plantão Noturno".
 * Compartilhado entre o frontend (src) e as funções serverless (api),
 * para que rótulos, opções e validações existam em um único lugar.
 */

export const TECNICOS_PLANTAO = ['Osiel', 'Hercílio', 'Matheus', 'Bezerra'] as const;
export type TecnicoPlantao = (typeof TECNICOS_PLANTAO)[number];

export const ORIGENS = ['CONTINUACAO', 'GRUPO_WHATSAPP', 'CLIENTE_DIRETO'] as const;
export type Origem = (typeof ORIGENS)[number];

export const ORIGEM_LABEL: Record<Origem, string> = {
  CONTINUACAO: 'Continuação de atendimento',
  GRUPO_WHATSAPP: 'Grupo de WhatsApp',
  CLIENTE_DIRETO: 'Cliente chamou diretamente',
};

export const TIPOS_DEMANDA = [
  'Fiscal',
  'PDV / Caixa',
  'TEF / Pagamentos',
  'Estoque',
  'Financeiro',
  'Banco de dados',
  'Infraestrutura',
  'Implantação',
  'Outro',
] as const;
export type TipoDemanda = (typeof TIPOS_DEMANDA)[number];

export const GRUPOS_WHATSAPP = [
  'Glaçaí',
  'Maná Comendoria',
  'ldorado',
  'TRATT',
  'Sonho Doce',
  'Miss Make',
  'Famiglia Muccini',
  'Belém Velho Restaurante',
  'Materiais MDW',
  'Marterra',
  'Panificadora Prime',
  'Espetinho da Praia',
  'DLIGHT',
  'PORTO 60',
  'JS MOTOS AVELLOZ',
  'Conexfer',
  'Magnum',
  'Liderança Motos',
  'Personalitte',
  'Farina',
  'Grao Forneria',
  'Hidrauldiesel Truck S',
  'Mibra',
] as const;
export type GrupoWhatsapp = (typeof GRUPOS_WHATSAPP)[number];

export interface NightShiftDemand {
  id: string;
  clienteRegistro: number;
  tecnicoPlantao: TecnicoPlantao;
  origem: Origem;
  tecnicoAnterior: string | null;
  protocoloAnterior: string | null;
  grupoWhatsapp: string | null;
  tipoDemanda: string;
  recorrente: boolean;
  createdAt: string;
}

/** Payload aceito por POST /api/night-shift-demands. */
export interface NightShiftDemandInput {
  clienteRegistro: number;
  tecnicoPlantao: TecnicoPlantao;
  origem: Origem;
  tecnicoAnterior: string | null;
  protocoloAnterior: string | null;
  grupoWhatsapp: string | null;
  tipoDemanda: string;
  recorrente: boolean;
}

export interface DashboardData {
  total: number;
  continuacoes: number;
  gruposWhatsapp: number;
  clientesDiretos: number;
  recorrentes: number;
  cargaHerdadaPercentual: number;
  porOrigem: { origem: Origem; quantidade: number; percentual: number }[];
  porTipo: { tipoDemanda: string; quantidade: number }[];
  porTecnicoAnterior: { tecnicoAnterior: string; quantidade: number }[];
  porGrupoWhatsapp: { grupoWhatsapp: string; quantidade: number }[];
  recentes: NightShiftDemand[];
}

export const DASHBOARD_VAZIO: DashboardData = {
  total: 0,
  continuacoes: 0,
  gruposWhatsapp: 0,
  clientesDiretos: 0,
  recorrentes: 0,
  cargaHerdadaPercentual: 0,
  porOrigem: ORIGENS.map((origem) => ({ origem, quantidade: 0, percentual: 0 })),
  porTipo: [],
  porTecnicoAnterior: [],
  porGrupoWhatsapp: [],
  recentes: [],
};

/** Texto exibido na coluna "Detalhe da origem". */
export function detalheOrigem(demanda: Pick<NightShiftDemand, 'origem' | 'tecnicoAnterior' | 'grupoWhatsapp'>): string {
  switch (demanda.origem) {
    case 'CONTINUACAO':
      return demanda.tecnicoAnterior ?? '';
    case 'GRUPO_WHATSAPP':
      return demanda.grupoWhatsapp ?? '';
    case 'CLIENTE_DIRETO':
      return 'Contato direto do cliente';
  }
}

export function percentualDe(parte: number, total: number): number {
  if (!total) return 0;
  return Math.round((parte / total) * 1000) / 10;
}

export type ResultadoValidacao =
  | { ok: true; value: NightShiftDemandInput }
  | { ok: false; erros: string[] };

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

/**
 * Valida o registro e zera os campos incompatíveis com a origem escolhida,
 * garantindo que nunca sejam persistidos dados de outra origem.
 */
export function validarDemanda(entrada: unknown): ResultadoValidacao {
  const erros: string[] = [];
  const dados = (entrada ?? {}) as Record<string, unknown>;

  const registroBruto = typeof dados.clienteRegistro === 'string' ? dados.clienteRegistro.trim() : dados.clienteRegistro;
  const clienteRegistro = Number(registroBruto);
  if (registroBruto === '' || registroBruto === null || registroBruto === undefined || !Number.isInteger(clienteRegistro) || clienteRegistro <= 0) {
    erros.push('Informe o registro do cliente (somente números).');
  }

  const tecnicoPlantao = texto(dados.tecnicoPlantao) as TecnicoPlantao;
  if (!TECNICOS_PLANTAO.includes(tecnicoPlantao)) {
    erros.push('Selecione o técnico do plantão.');
  }

  const origem = texto(dados.origem) as Origem;
  if (!ORIGENS.includes(origem)) {
    erros.push('Selecione a origem da demanda.');
  }

  const tipoDemanda = texto(dados.tipoDemanda) as TipoDemanda;
  if (!TIPOS_DEMANDA.includes(tipoDemanda)) {
    erros.push('Selecione o tipo da demanda.');
  }

  let tecnicoAnterior: string | null = null;
  let protocoloAnterior: string | null = null;
  let grupoWhatsapp: string | null = null;

  if (origem === 'CONTINUACAO') {
    tecnicoAnterior = texto(dados.tecnicoAnterior) || null;
    protocoloAnterior = texto(dados.protocoloAnterior) || null;
    if (!tecnicoAnterior) {
      erros.push('Informe o técnico anterior.');
    }
  } else if (origem === 'GRUPO_WHATSAPP') {
    grupoWhatsapp = texto(dados.grupoWhatsapp) || null;
    if (!grupoWhatsapp || !GRUPOS_WHATSAPP.includes(grupoWhatsapp as GrupoWhatsapp)) {
      erros.push('Selecione o grupo de WhatsApp.');
    }
  }

  if (erros.length) return { ok: false, erros };

  return {
    ok: true,
    value: {
      clienteRegistro,
      tecnicoPlantao,
      origem,
      tecnicoAnterior,
      protocoloAnterior,
      grupoWhatsapp,
      tipoDemanda,
      recorrente: dados.recorrente === true || dados.recorrente === 'true' || dados.recorrente === 'Sim',
    },
  };
}
