interface Props {
  icone?: string;
  titulo?: string;
  texto: string;
}

export default function EmptyState({ icone = '🗒️', titulo, texto }: Props) {
  return (
    <div className="empty">
      <div className="empty-icon" aria-hidden="true">
        {icone}
      </div>
      {titulo ? <div className="empty-title">{titulo}</div> : null}
      <div className="empty-text">{texto}</div>
    </div>
  );
}
