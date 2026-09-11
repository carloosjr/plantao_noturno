import type { VercelRequest, VercelResponse } from '@vercel/node';
import { COLUNAS_LIGACAO, obterTurno, paraLigacao, type LigacaoRow } from '../_lib/acompanhamento.js';
import { erro, json, param } from '../_lib/http.js';
import { getSupabase, TABELA_LIGACOES } from '../_lib/supabase.js';
import { dataValida, horarioValido } from '../../shared/acompanhamento.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (req.method === 'POST') return await criar(req, res);
    if (req.method === 'DELETE') return await excluir(req, res);
    res.setHeader('Allow', 'POST, DELETE');
    return erro(res, 405, 'Método não permitido.');
  } catch (e) {
    return erro(res, 500, e instanceof Error ? e.message : 'Erro inesperado.');
  }
}

/** POST /api/plantao-acompanhamento/ligacoes?data=YYYY-MM-DD — Body: { quantidade, horario? } */
async function criar(req: VercelRequest, res: VercelResponse): Promise<void> {
  const data = param(req, 'data');
  if (!data || !dataValida(data)) {
    return erro(res, 400, 'Parâmetro "data" inválido (esperado YYYY-MM-DD).');
  }

  const corpo = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {});
  const quantidade = Number(corpo.quantidade);

  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    return erro(res, 400, 'quantidade deve ser um número inteiro positivo.');
  }

  const horario = corpo.horario || null;
  if (horario !== null && !horarioValido(horario)) {
    return erro(res, 400, 'horario inválido (esperado HH:MM).');
  }

  const supabase = getSupabase();
  const turno = await obterTurno(supabase, data);

  const { data: row, error } = await supabase
    .from(TABELA_LIGACOES)
    .insert({ turno_id: turno.id, quantidade, horario })
    .select(COLUNAS_LIGACAO)
    .single<LigacaoRow>();

  if (error || !row) return erro(res, 500, error?.message ?? 'Não foi possível registrar as ligações.');
  return json(res, 201, paraLigacao(row));
}

/** DELETE /api/plantao-acompanhamento/ligacoes?id=... */
async function excluir(req: VercelRequest, res: VercelResponse): Promise<void> {
  const id = param(req, 'id');
  if (!id) return erro(res, 400, 'Informe o id do lançamento.');

  const { error } = await getSupabase().from(TABELA_LIGACOES).delete().eq('id', id);
  if (error) return erro(res, 500, error.message);
  return json(res, 200, { id });
}
