import type {
  AcompanhamentoBundle,
  AgendaIndevida,
  AtendimentoGrupo,
  CanalId,
  FilaAtendimento,
  Ligacao,
  ResponsavelAgenda,
  TarefaId,
} from '../../../shared/acompanhamento';
import { ApiError } from '../api';

const BASE = '/api/plantao-acompanhamento';

async function tratar<T>(resposta: Response): Promise<T> {
  const texto = await resposta.text();
  const corpo = texto ? JSON.parse(texto) : null;

  if (!resposta.ok) {
    throw new ApiError(corpo?.erro ?? `Falha na requisição (${resposta.status}).`, corpo?.detalhes ?? []);
  }
  return corpo as T;
}

function comData(caminho: string, data: string): string {
  return `${caminho}?data=${encodeURIComponent(data)}`;
}

async function excluirPorId(caminho: string, id: string): Promise<void> {
  const resposta = await fetch(`${caminho}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  await tratar(resposta);
}

export async function carregarAcompanhamento(data: string): Promise<AcompanhamentoBundle> {
  const resposta = await fetch(comData(BASE, data));
  return tratar<AcompanhamentoBundle>(resposta);
}

export async function definirTarefa(
  data: string,
  tarefaId: TarefaId,
  concluida: boolean,
): Promise<Partial<Record<TarefaId, boolean>>> {
  const resposta = await fetch(comData(`${BASE}/tarefas`, data), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tarefaId, concluida }),
  });
  return tratar(resposta);
}

export async function definirCanal(
  data: string,
  canalId: CanalId,
  horario: string,
): Promise<Partial<Record<CanalId, string | null>>> {
  const resposta = await fetch(comData(`${BASE}/canais`, data), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ canalId, horario }),
  });
  return tratar(resposta);
}

export async function registrarLigacoes(data: string, quantidade: number): Promise<Ligacao> {
  const resposta = await fetch(comData(`${BASE}/ligacoes`, data), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantidade }),
  });
  return tratar(resposta);
}

export async function excluirLigacao(id: string): Promise<void> {
  return excluirPorId(`${BASE}/ligacoes`, id);
}

export async function definirFechamento(
  data: string,
  campos: { closureLead?: string; closureNotes?: string },
): Promise<{ closureLead: string | null; closureNotes: string | null }> {
  const resposta = await fetch(comData(`${BASE}/fechamento`, data), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(campos),
  });
  return tratar(resposta);
}

export async function iniciarAtendimentoGrupo(data: string, nome: string, inicio: string): Promise<AtendimentoGrupo> {
  const resposta = await fetch(comData(`${BASE}/grupos`, data), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, inicio }),
  });
  return tratar(resposta);
}

export async function finalizarAtendimentoGrupo(id: string, fim: string): Promise<AtendimentoGrupo> {
  const resposta = await fetch(`${BASE}/grupos`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, fim }),
  });
  return tratar(resposta);
}

export async function excluirAtendimentoGrupo(id: string): Promise<void> {
  return excluirPorId(`${BASE}/grupos`, id);
}

export async function iniciarFila(data: string, inicio: string, quantidade: number): Promise<FilaAtendimento> {
  const resposta = await fetch(comData(`${BASE}/filas`, data), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inicio, quantidade }),
  });
  return tratar(resposta);
}

export async function finalizarFila(id: string, fim: string): Promise<FilaAtendimento> {
  const resposta = await fetch(`${BASE}/filas`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, fim }),
  });
  return tratar(resposta);
}

export async function excluirFila(id: string): Promise<void> {
  return excluirPorId(`${BASE}/filas`, id);
}

export async function registrarAgendaIndevida(
  data: string,
  registro: number,
  responsavel: ResponsavelAgenda,
  oc: string,
  horario: string,
  evidencia: string,
): Promise<AgendaIndevida> {
  const resposta = await fetch(comData(`${BASE}/agenda`, data), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ registro, responsavel, oc, horario, evidencia }),
  });
  return tratar(resposta);
}

export async function excluirAgendaIndevida(id: string): Promise<void> {
  return excluirPorId(`${BASE}/agenda`, id);
}
