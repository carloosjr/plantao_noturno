import { CANAIS } from '../lib/acompanhamento/data';
import {
  calcularSaude,
  contarPorResponsavel,
  maiorDuracaoMinutos,
  mediaMinutos,
  picoFila,
  pontosDeAtencao,
  resultadoCanal,
  tarefasPendentes,
  totalLigacoes,
} from '../lib/acompanhamento/health';
import { useAcompanhamento } from '../lib/acompanhamento/store';
import { RESPONSAVEIS_FECHAMENTO } from '../lib/acompanhamento/types';
import HealthGauge from '../components/HealthGauge';
import PageHeader from '../components/PageHeader';

const RESPONSAVEIS_AGENDA_ORDEM = ['Matheus', 'Osiel', 'Hercílio'] as const;

export default function FechamentoPage() {
  const { state, definirResponsavelFechamento, definirObservacoes } = useAcompanhamento();

  if (state.carregando) {
    return (
      <>
        <PageHeader
          breadcrumb="Fechamento"
          titulo="Fechamento do plantão"
          subtitulo="Resumo do turno para revisão no dia seguinte"
        />
        <div className="state-msg">Carregando o plantão de hoje…</div>
      </>
    );
  }

  const saude = calcularSaude(state);
  const pontos = pontosDeAtencao(state, saude);
  const pendentes = tarefasPendentes(state);
  const gruposConcluidos = state.groupLogs.filter((log) => log.fim);
  const mediaGrupos = mediaMinutos(state.groupLogs);
  const maiorGrupo = maiorDuracaoMinutos(state.groupLogs);
  const mediaFila = mediaMinutos(state.queueLogs);
  const pico = picoFila(state.queueLogs);

  return (
    <>
      <PageHeader
        breadcrumb="Fechamento"
        titulo="Fechamento do plantão"
        subtitulo="Resumo do turno para revisão no dia seguinte"
      />

      {state.erro ? <div className="state-msg error">{state.erro}</div> : null}

      <div className="closure-meta">
        <div className="cm-item">
          <span className="cm-label">Janela</span>
          <span className="cm-value">19h00 – 22h00</span>
        </div>
        <div className="cm-item">
          <span className="cm-label">Responsável do plantão</span>
          <select
            className="log-input log-name"
            aria-label="Responsável do plantão"
            value={state.closureLead}
            onChange={(e) => definirResponsavelFechamento(e.target.value)}
          >
            <option value="" disabled>
              Selecionar
            </option>
            {RESPONSAVEIS_FECHAMENTO.map((nome) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="section-title">Pontos de atenção</p>
      <div className="attention-list">
        {pontos.map((ponto) => (
          <div className={`attention-item ${ponto.tier}`} key={ponto.texto}>
            {ponto.texto}
          </div>
        ))}
      </div>

      <HealthGauge score={saude.overall} tier={saude.tier} titulo="Saúde final do plantão" breakdown={[]} />

      <p className="section-title">Tarefas</p>
      <div className="log-card">
        <div className="person-stat" style={{ borderTop: 'none' }}>
          <span className="ps-label">Concluídas</span>
          <span className="ps-value">
            {saude.doneTasks}/{saude.totalTasks}
          </span>
        </div>
        <div className="log-list" style={{ marginTop: 10 }}>
          {pendentes.length === 0 ? (
            <p className="log-empty">Todas as tarefas foram concluídas</p>
          ) : (
            pendentes.map((tarefa) => (
              <div className="log-row" key={tarefa.titulo}>
                <div className="log-row-main">
                  <span className="log-name">{tarefa.titulo}</span>
                  <span className="log-time-range">{tarefa.horario}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <p className="section-title">Canais</p>
      <table className="closure-table">
        <thead>
          <tr>
            <th>Canal</th>
            <th>Previsto</th>
            <th>Real</th>
            <th>Resultado</th>
          </tr>
        </thead>
        <tbody>
          {CANAIS.map((canal) => {
            const real = state.canaisReal[canal.id] ?? null;
            const resultado = resultadoCanal(real, canal.previsto);
            return (
              <tr key={canal.id}>
                <td>{canal.nome}</td>
                <td style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{canal.previsto}</td>
                <td style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{real ?? '—'}</td>
                <td className={`status-${resultado.tier}`}>{resultado.texto}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="section-title">Atendimentos em grupos</p>
      <div className="metrics" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <article className="metric">
          <p className="metric-label">Concluídos</p>
          <p className="metric-value">{gruposConcluidos.length}</p>
        </article>
        <article className="metric">
          <p className="metric-label">Tempo médio</p>
          <p className="metric-value">{mediaGrupos !== null ? `${mediaGrupos} min` : '--'}</p>
        </article>
        <article className="metric">
          <p className="metric-label">Mais demorado</p>
          <p className="metric-value">{maiorGrupo !== null ? `${maiorGrupo} min` : '--'}</p>
        </article>
      </div>

      <p className="section-title">Filas</p>
      <div className="metrics" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <article className="metric">
          <p className="metric-label">Total registradas</p>
          <p className="metric-value">{state.queueLogs.length}</p>
        </article>
        <article className="metric">
          <p className="metric-label">Tempo médio até zerar</p>
          <p className="metric-value">{mediaFila !== null ? `${mediaFila} min` : '--'}</p>
        </article>
        <article className="metric">
          <p className="metric-label">Pico de tickets</p>
          <p className="metric-value">{pico ?? '--'}</p>
        </article>
      </div>

      <p className="section-title">Ligações</p>
      <div className="metrics" style={{ gridTemplateColumns: 'repeat(1, minmax(0, 1fr))', maxWidth: 220 }}>
        <article className="metric">
          <p className="metric-label">Total na central</p>
          <p className="metric-value">{totalLigacoes(state.ligacoes)}</p>
        </article>
      </div>

      <p className="section-title">OCs indevidas por atendente</p>
      <div className="log-card">
        {RESPONSAVEIS_AGENDA_ORDEM.map((nome) => (
          <div className="person-stat" key={nome}>
            <span className="ps-label">{nome}</span>
            <span className="ps-value">{contarPorResponsavel(state.agendaLogs, nome)}</span>
          </div>
        ))}
      </div>

      <p className="section-title">Observações</p>
      <textarea
        className="log-input"
        style={{ width: '100%', minHeight: 90, resize: 'vertical' }}
        placeholder="Registre aqui contexto que os números não capturam..."
        value={state.closureNotes}
        onChange={(e) => definirObservacoes(e.target.value)}
      />
    </>
  );
}
