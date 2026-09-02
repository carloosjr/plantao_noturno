import { useEffect } from 'react';

export interface Aviso {
  tipo: 'sucesso' | 'erro';
  titulo: string;
  texto: string;
}

interface Props {
  aviso: Aviso;
  onFechar: () => void;
}

export default function Toast({ aviso, onFechar }: Props) {
  useEffect(() => {
    const id = window.setTimeout(onFechar, 3500);
    return () => window.clearTimeout(id);
  }, [aviso, onFechar]);

  return (
    <div className={`toast${aviso.tipo === 'erro' ? ' error' : ''}`} role="status" aria-live="polite">
      <strong>{aviso.titulo}</strong>
      <span>{aviso.texto}</span>
    </div>
  );
}
