import { PERIODOS, type Periodo } from '../lib/periodo';

interface Props {
  valor: Periodo;
  onChange: (periodo: Periodo) => void;
  id?: string;
  'aria-label'?: string;
}

export default function PeriodoSelect({ valor, onChange, id, ...resto }: Props) {
  return (
    <select id={id} value={valor} onChange={(e) => onChange(e.target.value as Periodo)} {...resto}>
      {PERIODOS.map((periodo) => (
        <option key={periodo.valor} value={periodo.valor}>
          {periodo.rotulo}
        </option>
      ))}
    </select>
  );
}
