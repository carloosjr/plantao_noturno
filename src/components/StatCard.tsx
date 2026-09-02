interface Props {
  rotulo: string;
  icone: string;
  valor: number;
  rodape: string;
}

export default function StatCard({ rotulo, icone, valor, rodape }: Props) {
  return (
    <article className="metric">
      <div className="metric-top">
        <div className="metric-label">{rotulo}</div>
        <div className="metric-icon" aria-hidden="true">
          {icone}
        </div>
      </div>
      <div className="metric-value">{valor.toLocaleString('pt-BR')}</div>
      <div className="metric-foot">{rodape}</div>
    </article>
  );
}
