import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase, TABELA_CASOS_SMART } from '../_lib/supabase.js';
import { erro, json, param } from '../_lib/http.js';

export interface DescricaoGrupoPayload {
  id: string;
  main: string;
  subs: string[];
  img: string;
}

export interface CasoSmartRow {
  id: string;
  numero_caso?: number | string | null;
  cliente_registro: number | string;
  cliente_nome: string | null;
  link_cliente: string | null;
  cnpj: string | null;
  adquirente: string;
  versao: string;
  conexao: string;
  modelo: string;
  produto: string;
  caminho: string;
  resumo: string;
  descricoes: DescricaoGrupoPayload[];
  passos: string[];
  link_hedgedoc: string | null;
  link_print: string | null;
  link_video: string | null;
  link_arquivo: string | null;
  link_discord: string | null;
  score: number;
  relatorio_markdown: string;
  created_at: string;
  updated_at: string;
}

const COLUNAS_CASO_SMART = '*';

function paraCasoSmart(row: CasoSmartRow) {
  return {
    id: row.id,
    numeroCaso: row.numero_caso ? String(row.numero_caso) : '',
    registro: String(row.cliente_registro),
    nome: row.cliente_nome ?? '',
    linkCliente: row.link_cliente ?? '',
    cnpj: row.cnpj ?? '',
    adquirente: row.adquirente,
    versao: row.versao,
    conexao: row.conexao,
    modelo: row.modelo,
    produto: row.produto || 'Smart',
    caminho: row.caminho,
    resumo: row.resumo,
    descricoes: Array.isArray(row.descricoes) ? row.descricoes : [],
    passos: Array.isArray(row.passos) ? row.passos : [],
    linkHedgedoc: row.link_hedgedoc ?? '',
    linkPrint: row.link_print ?? '',
    linkVideo: row.link_video ?? '',
    linkArquivo: row.link_arquivo ?? '',
    linkDiscord: row.link_discord ?? '',
    score: Number(row.score) || 0,
    relatorioMarkdown: row.relatorio_markdown || '',
    createdAt: row.created_at,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (req.method === 'POST') return await criar(req, res);
    if (req.method === 'GET') return await listar(req, res);
    if (req.method === 'DELETE') return await excluir(req, res);
    res.setHeader('Allow', 'GET, POST, DELETE');
    return erro(res, 405, 'Método não permitido.');
  } catch (e) {
    return erro(res, 500, e instanceof Error ? e.message : 'Erro inesperado.');
  }
}

async function criar(req: VercelRequest, res: VercelResponse): Promise<void> {
  const corpo = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {});

  const registroBruto = typeof corpo.registro === 'string' ? corpo.registro.trim() : String(corpo.registro ?? '');
  const registro = Number(registroBruto.replace(/\D/g, ''));
  if (!registro || !Number.isInteger(registro) || registro <= 0) {
    return erro(res, 400, 'Informe o registro do cliente (somente números positivos).');
  }

  const numeroCasoBruto = typeof corpo.numeroCaso === 'string' ? corpo.numeroCaso.trim() : String(corpo.numeroCaso ?? '');
  const numeroCasoNum = Number(numeroCasoBruto.replace(/\D/g, ''));
  const numeroCaso = Number.isInteger(numeroCasoNum) && numeroCasoNum > 0 ? numeroCasoNum : null;

  const adquirente = typeof corpo.adquirente === 'string' ? corpo.adquirente.trim() : '';
  const versao = typeof corpo.versao === 'string' ? corpo.versao.trim() : '';
  const conexao = typeof corpo.conexao === 'string' ? corpo.conexao.trim() : '';
  const modelo = typeof corpo.modelo === 'string' ? corpo.modelo.trim() : '';
  const caminho = typeof corpo.caminho === 'string' ? corpo.caminho.trim() : '';
  const resumo = typeof corpo.resumo === 'string' ? corpo.resumo.trim() : '';

  if (!adquirente) return erro(res, 400, 'Informe a adquirência do Smart.');
  if (!versao) return erro(res, 400, 'Informe a versão do Smart.');
  if (!conexao) return erro(res, 400, 'Informe o tipo de conexão.');
  if (!modelo) return erro(res, 400, 'Informe o modelo do dispositivo.');
  if (!caminho) return erro(res, 400, 'Informe o caminho em tela no Smart.');
  if (!resumo) return erro(res, 400, 'Informe a descrição resumida do ocorrido.');

  const nome = typeof corpo.nome === 'string' ? corpo.nome.trim() || null : null;
  const linkCliente = typeof corpo.linkCliente === 'string' ? corpo.linkCliente.trim() || null : null;
  const cnpj = typeof corpo.cnpj === 'string' ? corpo.cnpj.trim() || null : null;
  const produto = typeof corpo.produto === 'string' && corpo.produto.trim() ? corpo.produto.trim() : 'Smart';

  const descricoes = Array.isArray(corpo.descricoes) ? corpo.descricoes : [];
  const passos = Array.isArray(corpo.passos) ? corpo.passos.filter((p: unknown) => typeof p === 'string' && p.trim() !== '') : [];

  const linkHedgedoc = typeof corpo.linkHedgedoc === 'string' ? corpo.linkHedgedoc.trim() || null : null;
  const linkPrint = typeof corpo.linkPrint === 'string' ? corpo.linkPrint.trim() || null : null;
  const linkVideo = typeof corpo.linkVideo === 'string' ? corpo.linkVideo.trim() || null : null;
  const linkArquivo = typeof corpo.linkArquivo === 'string' ? corpo.linkArquivo.trim() || null : null;
  const linkDiscord = typeof corpo.linkDiscord === 'string' ? corpo.linkDiscord.trim() || null : null;

  const score = Math.max(0, Math.min(100, Number(corpo.score) || 0));
  const relatorioMarkdown = typeof corpo.relatorioMarkdown === 'string' ? corpo.relatorioMarkdown : '';

  const objetoInsercao: Record<string, unknown> = {
    cliente_registro: registro,
    cliente_nome: nome,
    link_cliente: linkCliente,
    cnpj,
    adquirente,
    versao,
    conexao,
    modelo,
    produto,
    caminho,
    resumo,
    descricoes,
    passos,
    link_hedgedoc: linkHedgedoc,
    link_print: linkPrint,
    link_video: linkVideo,
    link_arquivo: linkArquivo,
    link_discord: linkDiscord,
    score,
    relatorio_markdown: relatorioMarkdown,
  };

  if (numeroCaso !== null) {
    objetoInsercao.numero_caso = numeroCaso;
  }

  let insercao = await getSupabase()
    .from(TABELA_CASOS_SMART)
    .insert(objetoInsercao)
    .select(COLUNAS_CASO_SMART)
    .single<CasoSmartRow>();

  if (insercao.error && numeroCaso !== null && insercao.error.message.includes('numero_caso')) {
    // Fallback caso a coluna ainda não exista
    delete objetoInsercao.numero_caso;
    insercao = await getSupabase()
      .from(TABELA_CASOS_SMART)
      .insert(objetoInsercao)
      .select(COLUNAS_CASO_SMART)
      .single<CasoSmartRow>();
  }

  if (insercao.error || !insercao.data) {
    return erro(res, 500, insercao.error?.message ?? 'Não foi possível salvar o caso Smart no banco de dados.');
  }

  return json(res, 201, paraCasoSmart(insercao.data));
}

async function listar(req: VercelRequest, res: VercelResponse): Promise<void> {
  const limiteBruto = Number(param(req, 'limit'));
  const limite = Number.isInteger(limiteBruto) && limiteBruto > 0 ? Math.min(limiteBruto, 500) : 100;

  let consulta = getSupabase()
    .from(TABELA_CASOS_SMART)
    .select(COLUNAS_CASO_SMART)
    .order('created_at', { ascending: false })
    .limit(limite);

  const registroParam = param(req, 'registro');
  if (registroParam) {
    const num = Number(registroParam.replace(/\D/g, ''));
    if (num > 0) {
      consulta = consulta.eq('cliente_registro', num);
    }
  }

  const { data, error } = await consulta;
  if (error) {
    return erro(res, 500, error.message);
  }

  const itens = ((data ?? []) as CasoSmartRow[]).map(paraCasoSmart);
  return json(res, 200, itens);
}

async function excluir(req: VercelRequest, res: VercelResponse): Promise<void> {
  const id = param(req, 'id');
  if (!id) return erro(res, 400, 'Informe o id do caso.');

  const { error } = await getSupabase().from(TABELA_CASOS_SMART).delete().eq('id', id);
  if (error) return erro(res, 500, error.message);
  return json(res, 200, { id });
}
