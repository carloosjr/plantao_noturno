import { useState } from 'react';
import { useAcompanhamento } from '../lib/acompanhamento/store';
import { RESPONSAVEIS_AGENDA, type ResponsavelAgenda } from '../lib/acompanhamento/types';
import PageHeader from '../components/PageHeader';

export default function ValidacaoAgendaPage() {
  const { state, registrarAgendaIndevida } = useAcompanhamento();

  const [responsavel, setResponsavel] = useState<ResponsavelAgenda | ''>('');
  const [oc, setOc] = useState('');
  const [horario, setHorario] = useState('');
  const [evidencia, setEvidencia] = useState('');

  function registrar() {
    if (!responsavel || !oc.trim() || !horario) return;
    registrarAgendaIndevida(responsavel, oc.trim(), horario, evidencia.trim());
    setResponsavel('');
    setOc('');
    setHorario('');
    setEvidencia('');
  }

  const registros = [...state.agendaLogs].reverse();

  if (state.carregando) {
    return (
      <>
        <PageHeader
          breadcrumb="Validação de agenda"
          titulo="Validação de agenda"
          subtitulo="OCs que chegaram na agenda de Matheus, Osiel ou Hercílio sem deveriam estar lá"
        />
        <div className="state-msg">Carregando o plantão de hoje…</div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        breadcrumb="Validação de agenda"
        titulo="Validação de agenda"
        subtitulo="OCs que chegaram na agenda de Matheus, Osiel ou Hercílio sem deveriam estar lá"
      />

      {state.erro ? <div className="state-msg error">{state.erro}</div> : null}

      <div className="log-card">
        <div className="log-form">
          <select
            className="log-input log-name"
            aria-label="Atendente"
            value={responsavel}
            onChange={(e) => setResponsavel(e.target.value as ResponsavelAgenda)}
          >
            <option value="" disabled>
              Atendente
            </option>
            {RESPONSAVEIS_AGENDA.map((nome) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
          </select>
          <input
            type="text"
            className="log-input log-name"
            placeholder="OC / chamado"
            value={oc}
            onChange={(e) => setOc(e.target.value)}
          />
          <input
            type="time"
            className="log-input log-time"
            aria-label="Horário em que a OC apareceu"
            value={horario}
            onChange={(e) => setHorario(e.target.value)}
          />
          <input
            type="url"
            className="log-input log-name"
            placeholder="Evidência (link do print)"
            value={evidencia}
            onChange={(e) => setEvidencia(e.target.value)}
          />
          <button type="button" className="btn" onClick={registrar}>
            Registrar
          </button>
        </div>

        {registros.length === 0 ? (
          <p className="log-empty">Nenhuma OC indevida registrada</p>
        ) : (
          <div className="log-list">
            {registros.map((log) => (
              <div className="log-row" key={log.id}>
                <div className="log-row-main">
                  <span className="log-name">
                    {log.responsavel} — {log.oc}
                  </span>
                  <span className="log-time-range">{log.horario}</span>
                </div>
                {log.evidencia ? (
                  <a
                    href={log.evidencia}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="log-status open"
                    style={{ textDecoration: 'none' }}
                  >
                    Evidência
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
