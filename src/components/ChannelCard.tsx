import { diffMinutosCanal } from '../lib/acompanhamento/health';
import type { CanalDef } from '../lib/acompanhamento/types';

interface Props {
  canal: CanalDef;
  valor: string | null;
  onChange(valor: string): void;
}

/** Card de canal com horário previsto/real — portado de `.channel-card` do protótipo. */
export default function ChannelCard({ canal, valor, onChange }: Props) {
  const diff = valor ? diffMinutosCanal(valor, canal.previsto) : null;
  const resultado = diff === null ? null : diff <= 0 ? { texto: 'No horário', tier: 'ok' as const } : { texto: `${diff} min de atraso`, tier: 'warn' as const };

  return (
    <div className="channel-card">
      <div className="label">{canal.nome}</div>
      <div className="owner">{canal.responsavel}</div>
      <span className={`pill ${canal.statusInicialTier}`}>{canal.statusInicial}</span>
      <div className="ch-time">
        <div className="ch-row">
          <label>Previsto</label>
          <span className="ch-expected">{canal.previsto}</span>
        </div>
        <input
          type="time"
          className="ch-real"
          aria-label={`Horário real — ${canal.nome}`}
          value={valor ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className={`ch-result${resultado ? ` ${resultado.tier}` : ''}`}>{resultado?.texto ?? ''}</span>
      </div>
    </div>
  );
}
