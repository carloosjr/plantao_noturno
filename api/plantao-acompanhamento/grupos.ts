import type { VercelRequest, VercelResponse } from '@vercel/node';
import { COLUNAS_ATENDIMENTO_GRUPO, obterTurno, paraAtendimentoGrupo, type AtendimentoGrupoRow } from '../_lib/acompanhamento.js';
import { erro, json, param } from '../_lib/http.js';
import { getSupabase, TABELA_ATENDIMENTOS_GRUPO } from '../_lib/supabase.js';
import { dataValida, horarioValido } from '../../shared/acompanhamento.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (req.method === 'POST') return await criar(req, res);
    if (req.method === 'PATCH') return await finalizar(req, res);
    res.setHeader('Allow', 'POST, PATCH');
    return erro(res, 405, 'Método não permitido.');
  } catch (e) {
    return erro(res, 500, e instanceof Error ? e.message : 'Erro inesperado.');
  }
}

/** POST /api/plantao-acompanhamento/grupos?data=YYYY-MM-DD — Body: { nome, inicio } */
async function criar(req: VercelRequest, res: VercelResponse): Promise<void> {
  const data = param(req, 'data');
  if (!data || !dataValida(data)) {
    return erro(res, 400, 'Parâmetro "data" inválido (esperado YYYY-MM-DD).');
  }

  const corpo = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {});
  const nome = typeof corpo.nome === 'string' ? corpo.nome.trim() : '';

  if (!nome) return erro(res, 400, 'Informe o grupo / cliente.');
  if (!horarioValido(corpo.inicio)) return erro(res, 400, 'inicio inválido (esperado HH:MM).');

  const supabase = getSupabase();
  const turno = await obterTurno(supabase, data);

  const { data: row, error } = await supabase
    .from(TABELA_ATENDIMENTOS_GRUPO)
    .insert({ turno_id: turno.id, nome, inicio: corpo.inicio })
    .select(COLUNAS_ATENDIMENTO_GRUPO)
    .single<AtendimentoGrupoRow>();

  if (error || !row) return erro(res, 500, error?.message ?? 'Não foi possível registrar o atendimento.');
  return json(res, 201, paraAtendimentoGrupo(row));
}

/** PATCH /api/plantao-acompanhamento/grupos — Body: { id, fim } */
async function finalizar(req: VercelRequest, res: VercelResponse): Promise<void> {
  const corpo = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {});
  const id = typeof corpo.id === 'string' ? corpo.id : '';

  if (!id) return erro(res, 400, 'Informe o id do atendimento.');
  if (!horarioValido(corpo.fim)) return erro(res, 400, 'fim inválido (esperado HH:MM).');

  const { data: row, error } = await getSupabase()
    .from(TABELA_ATENDIMENTOS_GRUPO)
    .update({ fim: corpo.fim })
    .eq('id', id)
    .select(COLUNAS_ATENDIMENTO_GRUPO)
    .single<AtendimentoGrupoRow>();

  if (error || !row) return erro(res, 500, error?.message ?? 'Não foi possível encerrar o atendimento.');
  return json(res, 200, paraAtendimentoGrupo(row));
}
