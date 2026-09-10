import type { VercelRequest, VercelResponse } from '@vercel/node';
import { COLUNAS_FILA, obterTurno, paraFila, type FilaRow } from '../_lib/acompanhamento.js';
import { erro, json, param } from '../_lib/http.js';
import { getSupabase, TABELA_FILAS } from '../_lib/supabase.js';
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

/** POST /api/plantao-acompanhamento/filas?data=YYYY-MM-DD — Body: { inicio, quantidade } */
async function criar(req: VercelRequest, res: VercelResponse): Promise<void> {
  const data = param(req, 'data');
  if (!data || !dataValida(data)) {
    return erro(res, 400, 'Parâmetro "data" inválido (esperado YYYY-MM-DD).');
  }

  const corpo = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {});
  const quantidade = Number(corpo.quantidade);

  if (!horarioValido(corpo.inicio)) return erro(res, 400, 'inicio inválido (esperado HH:MM).');
  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    return erro(res, 400, 'quantidade deve ser um número inteiro positivo.');
  }

  const supabase = getSupabase();
  const turno = await obterTurno(supabase, data);

  const { data: row, error } = await supabase
    .from(TABELA_FILAS)
    .insert({ turno_id: turno.id, inicio: corpo.inicio, quantidade })
    .select(COLUNAS_FILA)
    .single<FilaRow>();

  if (error || !row) return erro(res, 500, error?.message ?? 'Não foi possível registrar a fila.');
  return json(res, 201, paraFila(row));
}

/** PATCH /api/plantao-acompanhamento/filas — Body: { id, fim } */
async function finalizar(req: VercelRequest, res: VercelResponse): Promise<void> {
  const corpo = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {});
  const id = typeof corpo.id === 'string' ? corpo.id : '';

  if (!id) return erro(res, 400, 'Informe o id da fila.');
  if (!horarioValido(corpo.fim)) return erro(res, 400, 'fim inválido (esperado HH:MM).');

  const { data: row, error } = await getSupabase()
    .from(TABELA_FILAS)
    .update({ fim: corpo.fim })
    .eq('id', id)
    .select(COLUNAS_FILA)
    .single<FilaRow>();

  if (error || !row) return erro(res, 500, error?.message ?? 'Não foi possível encerrar a fila.');
  return json(res, 200, paraFila(row));
}
