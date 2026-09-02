import type { ReactNode } from 'react';

interface Props {
  titulo?: string;
  subtitulo?: string;
  acoes?: ReactNode;
  className?: string;
  children: ReactNode;
}

export default function Card({ titulo, subtitulo, acoes, className, children }: Props) {
  return (
    <section className={`card${className ? ` ${className}` : ''}`}>
      {titulo ? (
        <div className="card-head">
          <div>
            <div className="card-title">{titulo}</div>
            {subtitulo ? <div className="card-subtitle">{subtitulo}</div> : null}
          </div>
          {acoes}
        </div>
      ) : null}
      {children}
    </section>
  );
}
