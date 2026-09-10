import { formatarPercentual } from '../lib/format';

interface Props {
  percentual: number;
  rotulo: string;
}

/** Progresso percentual em formato donut, desenhado com conic-gradient. */
export default function Donut({ percentual, rotulo }: Props) {
  const angulo = Math.min(Math.max(percentual, 0), 100) * 3.6;

  return (
    <div
      className="donut"
      role="img"
      aria-label={`${rotulo}: ${formatarPercentual(percentual)}`}
      style={{ background: `conic-gradient(var(--primary) 0deg ${angulo}deg, var(--panel-alt) ${angulo}deg 360deg)` }}
    >
      <div className="donut-inner">
        <div>
          <div className="donut-value">{formatarPercentual(percentual)}</div>
          <div className="donut-label">{rotulo}</div>
        </div>
      </div>
    </div>
  );
}
