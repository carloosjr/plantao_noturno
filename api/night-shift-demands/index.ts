import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase, TABELA_DEMANDAS } from '../_lib/supabase.js';
import { COLUNAS_DEMANDA, erro, json, param, paramData, paraDemanda, type DemandaRow } from '../_lib/http.js';
import { ORIGENS, TECNICOS_PLANTAO, TIPOS_DEMANDA, validarDemanda } from '../../shared/domain.js';

const LIMITE_PADRAO = 500;
const LIMITE_MAXIMO = 5000;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (req.method === 'POST') return await criar(req, res);
    if (req.method === 'GET') return await listar(req, res);
    res.setHeader('Allow', 'GET, POST');
    return erro(res, 405, 'Método não permitido.');
  } catch (e) {
    return erro(res, 500, e instanceof Error ? e.message : 'Erro inesperado.');
  }
}

async function criar(req: VercelRequest, res: VercelResponse): Promise<void> {
  const corpo = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body;
  const validacao = validarDemanda(corpo);

  if (!validacao.ok) {
    return erro(res, 400, 'Dados inválidos.', validacao.erros);
  }

  const d = validacao.value;
  const { data, error } = await getSupabase()
    .from(TABELA_DEMANDAS)
    .insert({
      cliente_registro: d.clienteRegistro,
      tecnico_plantao: d.tecnicoPlantao,
      origem: d.origem,
      tecnico_anterior: d.tecnicoAnterior,
      protocolo_anterior: d.protocoloAnterior,
      grupo_whatsapp: d.grupoWhatsapp,
      tipo_demanda: d.tipoDemanda,
      recorrente: d.recorrente,
    })
    .select(COLUNAS_DEMANDA)
    .single<DemandaRow>();

  if (error || !data) {
    return erro(res, 500, error?.message ?? 'Não foi possível registrar a demanda.');
  }

  return json(res, 201, paraDemanda(data));
}

async function listar(req: VercelRequest, res: VercelResponse): Promise<void> {
  const limiteBruto = Number(param(req, 'limit'));
  const limite = Number.isInteger(limiteBruto) && limiteBruto > 0 ? Math.min(limiteBruto, LIMITE_MAXIMO) : LIMITE_PADRAO;

  let consulta = getSupabase()
    .from(TABELA_DEMANDAS)
    .select(COLUNAS_DEMANDA, { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(limite);

  const startDate = paramData(req, 'startDate');
  if (startDate) consulta = consulta.gte('created_at', startDate);

  const endDate = paramData(req, 'endDate');
  if (endDate) consulta = consulta.lte('created_at', endDate);

  const clienteRegistro = param(req, 'clienteRegistro');
  if (clienteRegistro) {
    const numero = Number(clienteRegistro);
    if (!Number.isInteger(numero) || numero <= 0) {
      return erro(res, 400, 'clienteRegistro deve ser um número inteiro positivo.');
    }
    consulta = consulta.eq('cliente_registro', numero);
  }

  const tecnicoPlantao = param(req, 'tecnicoPlantao');
  if (tecnicoPlantao) {
    if (!TECNICOS_PLANTAO.includes(tecnicoPlantao as (typeof TECNICOS_PLANTAO)[number])) {
      return erro(res, 400, 'tecnicoPlantao inválido.');
    }
    consulta = consulta.eq('tecnico_plantao', tecnicoPlantao);
  }

  const origem = param(req, 'origem');
  if (origem) {
    if (!ORIGENS.includes(origem as (typeof ORIGENS)[number])) {
      return erro(res, 400, 'origem inválida.');
    }
    consulta = consulta.eq('origem', origem);
  }

  const tipoDemanda = param(req, 'tipoDemanda');
  if (tipoDemanda) {
    if (!TIPOS_DEMANDA.includes(tipoDemanda as (typeof TIPOS_DEMANDA)[number])) {
      return erro(res, 400, 'tipoDemanda inválido.');
    }
    consulta = consulta.eq('tipo_demanda', tipoDemanda);
  }

  const recorrente = param(req, 'recorrente');
  if (recorrente === 'true' || recorrente === 'false') {
    consulta = consulta.eq('recorrente', recorrente === 'true');
  }

  const { data, error, count } = await consulta;
  if (error) {
    return erro(res, 500, error.message);
  }

  const itens = ((data ?? []) as DemandaRow[]).map(paraDemanda);
  return json(res, 200, { total: count ?? itens.length, limite, itens });
}
