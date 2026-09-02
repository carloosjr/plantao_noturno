import type { DashboardData, NightShiftDemand, NightShiftDemandInput } from '../../shared/domain';

const BASE = '/api/night-shift-demands';

export interface FiltrosDemandas {
  startDate?: string;
  endDate?: string;
  clienteRegistro?: string;
  tecnicoPlantao?: string;
  origem?: string;
  tipoDemanda?: string;
  recorrente?: string;
  limit?: number;
}

export interface ListaDemandas {
  total: number;
  limite: number;
  itens: NightShiftDemand[];
}

export class ApiError extends Error {
  readonly detalhes: string[];

  constructor(mensagem: string, detalhes: string[] = []) {
    super(mensagem);
    this.name = 'ApiError';
    this.detalhes = detalhes;
  }
}

async function tratar<T>(resposta: Response): Promise<T> {
  const texto = await resposta.text();
  const corpo = texto ? JSON.parse(texto) : null;

  if (!resposta.ok) {
    throw new ApiError(corpo?.erro ?? `Falha na requisição (${resposta.status}).`, corpo?.detalhes ?? []);
  }
  return corpo as T;
}

function querystring(filtros: FiltrosDemandas): string {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== null && valor !== '') {
      params.set(chave, String(valor));
    }
  }
  const texto = params.toString();
  return texto ? `?${texto}` : '';
}

export async function listarDemandas(filtros: FiltrosDemandas): Promise<ListaDemandas> {
  const resposta = await fetch(`${BASE}${querystring(filtros)}`);
  return tratar<ListaDemandas>(resposta);
}

export async function carregarDashboard(intervalo: { startDate?: string; endDate?: string }): Promise<DashboardData> {
  const resposta = await fetch(`${BASE}/dashboard${querystring(intervalo)}`);
  return tratar<DashboardData>(resposta);
}

export async function registrarDemanda(dados: NightShiftDemandInput): Promise<NightShiftDemand> {
  const resposta = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  return tratar<NightShiftDemand>(resposta);
}
