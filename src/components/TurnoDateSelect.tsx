import { useAcompanhamento } from '../lib/acompanhamento/store';

/** Seletor do dia do plantão exibido — compartilhado pelas 4 telas do módulo. */
export default function TurnoDateSelect() {
  const { dataTurno, hoje, definirData } = useAcompanhamento();

  return (
    <div className="turno-date-select">
      <input
        type="date"
        aria-label="Selecionar dia do plantão"
        value={dataTurno}
        max={hoje}
        onChange={(e) => definirData(e.target.value)}
      />
      {dataTurno !== hoje ? (
        <button type="button" className="btn btn-secondary sm" onClick={() => definirData(hoje)}>
          Hoje
        </button>
      ) : null}
    </div>
  );
}
