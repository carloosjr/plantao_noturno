import type { SaudeTier } from '../lib/acompanhamento/types';

const CIRCUNFERENCIA = 326.7;

const STATUS_POR_TIER: Record<SaudeTier, string> = {
  good: 'Turno saudável',
  warn: 'Atenção necessária',
  bad: 'Turno em risco',
};

interface Props {
  score: number;
  tier: SaudeTier;
  titulo: string;
  breakdown: { label: string; valor: string }[];
}

/** Indicador circular de saúde do plantão — portado de `.health-card` do protótipo. */
export default function HealthGauge({ score, tier, titulo, breakdown }: Props) {
  const offset = CIRCUNFERENCIA * (1 - Math.min(Math.max(score, 0), 100) / 100);

  return (
    <div className="health-card">
      <div className="health-gauge">
        <svg viewBox="0 0 120 120" role="img" aria-label={`Saúde do plantão: ${score}%`}>
          <circle className="health-track" cx="60" cy="60" r="52" />
          <circle
            className={`health-arc health-arc-${tier}`}
            cx="60"
            cy="60"
            r="52"
            strokeDasharray={CIRCUNFERENCIA}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="health-center">
          <span className="health-value">{score}</span>
          <span className="health-pct">%</span>
        </div>
      </div>
      <div className="health-info">
        <p className="health-title">{titulo}</p>
        <p className={`health-status ${tier}`}>{STATUS_POR_TIER[tier]}</p>
        <div className="health-breakdown">
          {breakdown.map((item) => (
            <div className="hb-row" key={item.label}>
              <span className="hb-label">{item.label}</span>
              <span className="hb-value">{item.valor}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
