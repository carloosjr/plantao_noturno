import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { NightShiftDemand } from '../../shared/domain';

/** Linha da tabela plantaonoturno_demandas. */
export interface DemandaRow {
  id: string;
  cliente_registro: number | string;
  tecnico_plantao: string;
  origem: string;
  tecnico_anterior: string | null;
  protocolo_anterior: string | null;
  grupo_whatsapp: string | null;
  tipo_demanda: string;
  recorrente: boolean;
  created_at: string;
}

export const COLUNAS_DEMANDA =
  'id, cliente_registro, tecnico_plantao, origem, tecnico_anterior, protocolo_anterior, grupo_whatsapp, tipo_demanda, recorrente, created_at';

export function paraDemanda(row: DemandaRow): NightShiftDemand {
  return {
    id: row.id,
    clienteRegistro: Number(row.cliente_registro),
    tecnicoPlantao: row.tecnico_plantao as NightShiftDemand['tecnicoPlantao'],
    origem: row.origem as NightShiftDemand['origem'],
    tecnicoAnterior: row.tecnico_anterior,
    protocoloAnterior: row.protocolo_anterior,
    grupoWhatsapp: row.grupo_whatsapp,
    tipoDemanda: row.tipo_demanda,
    recorrente: row.recorrente,
    createdAt: row.created_at,
  };
}

export function json(res: VercelResponse, status: number, body: unknown): void {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.send(JSON.stringify(body));
}

export function erro(res: VercelResponse, status: number, mensagem: string, detalhes?: string[]): void {
  json(res, status, detalhes?.length ? { erro: mensagem, detalhes } : { erro: mensagem });
}

/** Lê um parâmetro de query como string simples. */
export function param(req: VercelRequest, nome: string): string | undefined {
  const valor = req.query[nome];
  const texto = Array.isArray(valor) ? valor[0] : valor;
  if (typeof texto !== 'string') return undefined;
  const limpo = texto.trim();
  return limpo === '' ? undefined : limpo;
}

/** Valida uma data ISO recebida por query string. */
export function paramData(req: VercelRequest, nome: string): string | undefined {
  const valor = param(req, nome);
  if (!valor) return undefined;
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? undefined : data.toISOString();
}
