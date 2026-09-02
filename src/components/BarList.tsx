import EmptyState from './EmptyState';
import { formatarPercentual } from '../lib/format';

export interface ItemBarra {
  rotulo: string;
  quantidade: number;
  percentual?: number;
}

interface Props {
  itens: ItemBarra[];
  /** Base para a largura das barras; por padrão usa o maior valor da lista. */
  base?: number;
  mostrarPercentual?: boolean;
  vazioTexto?: string;
}

export default function BarList({ itens, base, mostrarPercentual = false, vazioTexto = 'Sem dados no período.' }: Props) {
  if (itens.length === 0) {
    return <EmptyState texto={vazioTexto} />;
  }

  const maximo = base ?? Math.max(...itens.map((i) => i.quantidade), 0);

  return (
    <div className="bars">
      {itens.map((item) => {
        const largura = maximo > 0 ? (item.quantidade / maximo) * 100 : 0;
        return (
          <div className="bar-row" key={item.rotulo}>
            <div className="bar-label" title={item.rotulo}>
              {item.rotulo}
            </div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${largura}%` }} />
            </div>
            <div className="bar-number">
              {item.quantidade.toLocaleString('pt-BR')}
              {mostrarPercentual && item.percentual !== undefined ? <span>{formatarPercentual(item.percentual)}</span> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
