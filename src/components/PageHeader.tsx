import type { ReactNode } from 'react';

interface Props {
  breadcrumb: string;
  titulo: string;
  subtitulo: string;
  acoes?: ReactNode;
}

export default function PageHeader({ breadcrumb, titulo, subtitulo, acoes }: Props) {
  return (
    <header className="topbar">
      <div>
        <div className="breadcrumbs">Plantão &nbsp;›&nbsp; {breadcrumb}</div>
        <h1>{titulo}</h1>
        <p className="subtitle">{subtitulo}</p>
      </div>
      {acoes ? <div className="top-actions">{acoes}</div> : null}
    </header>
  );
}
