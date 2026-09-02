export const PERIODOS = [
  { valor: 'hoje', rotulo: 'Hoje' },
  { valor: '7', rotulo: 'Últimos 7 dias' },
  { valor: '30', rotulo: 'Últimos 30 dias' },
  { valor: 'todo', rotulo: 'Todo período' },
] as const;

export type Periodo = (typeof PERIODOS)[number]['valor'];

export interface IntervaloPeriodo {
  startDate?: string;
  endDate?: string;
}

function inicioDoDia(base: Date, diasAtras = 0): Date {
  const d = new Date(base);
  d.setDate(d.getDate() - diasAtras);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fimDoDia(base: Date): Date {
  const d = new Date(base);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Converte o período selecionado em um intervalo ISO para a API. */
export function intervaloDoPeriodo(periodo: Periodo, agora = new Date()): IntervaloPeriodo {
  if (periodo === 'todo') return {};

  const diasAtras = periodo === 'hoje' ? 0 : Number(periodo) - 1;
  return {
    startDate: inicioDoDia(agora, diasAtras).toISOString(),
    endDate: fimDoDia(agora).toISOString(),
  };
}

export function rotuloDoPeriodo(periodo: Periodo): string {
  return PERIODOS.find((p) => p.valor === periodo)?.rotulo ?? '';
}
