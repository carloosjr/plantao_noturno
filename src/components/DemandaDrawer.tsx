import { useEffect } from 'react';
import { ORIGEM_LABEL, type NightShiftDemand } from '../../shared/domain';
import { formatarDataHora } from '../lib/format';

interface Props {
  demanda: NightShiftDemand;
  onFechar: () => void;
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="detail-row">
      <div className="detail-label">{rotulo}</div>
      <div className="detail-value">{valor}</div>
    </div>
  );
}

export default function DemandaDrawer({ demanda, onFechar }: Props) {
  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onFechar();
    };
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [onFechar]);

  return (
    <div className="drawer-backdrop" onClick={onFechar} role="presentation">
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Detalhes da demanda"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="drawer-head">
          <div>
            <div className="card-title">Detalhes da demanda</div>
            <div className="card-subtitle">Registro {demanda.clienteRegistro}</div>
          </div>
          <button type="button" className="drawer-close" onClick={onFechar} aria-label="Fechar detalhes">
            ✕
          </button>
        </div>

        <Linha rotulo="Data e hora" valor={formatarDataHora(demanda.createdAt)} />
        <Linha rotulo="Registro do cliente" valor={String(demanda.clienteRegistro)} />
        <Linha rotulo="Técnico do plantão" valor={demanda.tecnicoPlantao} />
        <Linha rotulo="Origem" valor={ORIGEM_LABEL[demanda.origem]} />

        {demanda.origem === 'CONTINUACAO' && demanda.tecnicoAnterior ? (
          <Linha rotulo="Técnico anterior" valor={demanda.tecnicoAnterior} />
        ) : null}

        {demanda.origem === 'CONTINUACAO' && demanda.protocoloAnterior ? (
          <Linha rotulo="Protocolo anterior" valor={demanda.protocoloAnterior} />
        ) : null}

        {demanda.origem === 'GRUPO_WHATSAPP' && demanda.grupoWhatsapp ? (
          <Linha rotulo="Nome do grupo" valor={demanda.grupoWhatsapp} />
        ) : null}

        <Linha rotulo="Tipo da demanda" valor={demanda.tipoDemanda} />
        <Linha rotulo="Recorrente" valor={demanda.recorrente ? 'Sim' : 'Não'} />
      </aside>
    </div>
  );
}
