import { useState, type ReactNode } from 'react';
import { duracaoMinutos } from '../lib/acompanhamento/health';

export interface TimedLogItemBase {
  id: number;
  inicio: string;
  fim: string | null;
}

interface Props<T extends TimedLogItemBase> {
  itens: T[];
  vazioTexto: string;
  renderTitulo(item: T): ReactNode;
  /** 'interativo' permite registrar o fim de um item em aberto; 'historico' é somente leitura. */
  modo?: 'interativo' | 'historico';
  onFinalizar?(id: number, fim: string): void;
  rotuloFinalizarBotao?: string;
  rotuloAberto?: string;
  rotuloFechado?: string;
}

function LinhaAberta({
  rotuloFinalizarBotao,
  onFinalizar,
}: {
  rotuloFinalizarBotao: string;
  onFinalizar(fim: string): void;
}) {
  const [fim, setFim] = useState('');
  return (
    <div className="log-row-actions">
      <input
        type="time"
        className="log-input log-time"
        aria-label="Horário de encerramento"
        value={fim}
        onChange={(e) => setFim(e.target.value)}
      />
      <button
        type="button"
        className="btn sm"
        disabled={!fim}
        onClick={() => onFinalizar(fim)}
      >
        {rotuloFinalizarBotao}
      </button>
    </div>
  );
}

/** Lista genérica "início agora → fim depois" — portada dos log-cards do protótipo. */
export default function TimedLogList<T extends TimedLogItemBase>({
  itens,
  vazioTexto,
  renderTitulo,
  modo = 'interativo',
  onFinalizar,
  rotuloFinalizarBotao = 'Registrar fim',
  rotuloAberto = 'Em andamento',
  rotuloFechado = 'Concluído',
}: Props<T>) {
  if (itens.length === 0) {
    return <p className="log-empty">{vazioTexto}</p>;
  }

  const ordenados = [...itens].reverse();

  return (
    <div className="log-list">
      {ordenados.map((item) => (
        <div className="log-row" key={item.id}>
          <div className="log-row-main">
            <span className="log-name">{renderTitulo(item)}</span>
            <span className="log-time-range">
              {item.inicio} &rarr; {item.fim ?? '--:--'}
            </span>
          </div>

          {item.fim ? (
            <span className="log-status closed">
              {modo === 'historico' ? `${duracaoMinutos(item)} min` : rotuloFechado}
            </span>
          ) : modo === 'interativo' && onFinalizar ? (
            <>
              <LinhaAberta rotuloFinalizarBotao={rotuloFinalizarBotao} onFinalizar={(fim) => onFinalizar(item.id, fim)} />
              <span className="log-status open">{rotuloAberto}</span>
            </>
          ) : (
            <span className="log-status open">{rotuloAberto}</span>
          )}
        </div>
      ))}
    </div>
  );
}
