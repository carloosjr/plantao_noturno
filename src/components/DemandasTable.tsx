import { detalheOrigem, ORIGEM_LABEL, type NightShiftDemand } from '../../shared/domain';
import { formatarDataHora } from '../lib/format';
import EmptyState from './EmptyState';

interface Props {
  demandas: NightShiftDemand[];
  onSelecionar?: (demanda: NightShiftDemand) => void;
  vazioTitulo?: string;
  vazioTexto?: string;
}

export default function DemandasTable({ demandas, onSelecionar, vazioTitulo, vazioTexto }: Props) {
  if (demandas.length === 0) {
    return (
      <EmptyState
        titulo={vazioTitulo ?? 'Nenhuma demanda registrada'}
        texto={vazioTexto ?? 'Assim que a equipe registrar demandas, elas aparecem aqui.'}
      />
    );
  }

  const clicavel = Boolean(onSelecionar);

  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            <th>Data / hora</th>
            <th>Registro do cliente</th>
            <th>Técnico do plantão</th>
            <th>Origem</th>
            <th>Detalhe da origem</th>
            <th>Tipo da demanda</th>
            <th>Recorrente</th>
          </tr>
        </thead>
        <tbody>
          {demandas.map((demanda) => (
            <tr
              key={demanda.id}
              className={clicavel ? 'clickable' : undefined}
              tabIndex={clicavel ? 0 : undefined}
              onClick={clicavel ? () => onSelecionar?.(demanda) : undefined}
              onKeyDown={
                clicavel
                  ? (evento) => {
                      if (evento.key === 'Enter' || evento.key === ' ') {
                        evento.preventDefault();
                        onSelecionar?.(demanda);
                      }
                    }
                  : undefined
              }
            >
              <td>{formatarDataHora(demanda.createdAt)}</td>
              <td className="cell-strong">{demanda.clienteRegistro}</td>
              <td>{demanda.tecnicoPlantao}</td>
              <td>
                <span className={`tag tag-${demanda.origem.toLowerCase()}`}>{ORIGEM_LABEL[demanda.origem]}</span>
              </td>
              <td>{detalheOrigem(demanda)}</td>
              <td>{demanda.tipoDemanda}</td>
              <td>
                <span className={`tag ${demanda.recorrente ? 'tag-sim' : 'tag-nao'}`}>
                  {demanda.recorrente ? 'Sim' : 'Não'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
