import { CANAIS } from '../lib/acompanhamento/data';
import { contarPorResponsavel, mediaMinutos, resultadoCanal } from '../lib/acompanhamento/health';
import { useAcompanhamento } from '../lib/acompanhamento/store';
import PageHeader from '../components/PageHeader';
import TimedLogList from '../components/TimedLogList';

function canalPor(id: (typeof CANAIS)[number]['id']) {
  return CANAIS.find((canal) => canal.id === id)!;
}

export default function ProdutividadePage() {
  const { state } = useAcompanhamento();

  if (state.carregando) {
    return (
      <>
        <PageHeader
          breadcrumb="Produtividade"
          titulo="Produtividade"
          subtitulo="Indicadores de atendimento alimentados pelos registros do plantão"
        />
        <div className="state-msg">Carregando o plantão de hoje…</div>
      </>
    );
  }

  const canalGrupos = canalPor('grupos');
  const canalLinha = canalPor('linha');
  const canalWorkdesk = canalPor('workdesk');

  const statusGrupos = resultadoCanal(state.canaisReal.grupos ?? null, canalGrupos.previsto);
  const statusLinha = resultadoCanal(state.canaisReal.linha ?? null, canalLinha.previsto);
  const statusWorkdesk = resultadoCanal(state.canaisReal.workdesk ?? null, canalWorkdesk.previsto);

  const gruposConcluidos = state.groupLogs.filter((log) => log.fim);
  const mediaGrupos = mediaMinutos(state.groupLogs);
  const mediaFila = mediaMinutos(state.queueLogs);

  return (
    <>
      <PageHeader
        breadcrumb="Produtividade"
        titulo="Produtividade"
        subtitulo="Indicadores de atendimento alimentados pelos registros do plantão"
      />

      {state.erro ? <div className="state-msg error">{state.erro}</div> : null}

      <p className="section-title">Por atendente</p>
      <div className="people-grid">
        <div className="person-card">
          <p className="person-name">Osiel</p>
          <p className="person-role">Grupos</p>
          <div className="person-stat">
            <span className="ps-label">Status do canal</span>
            <span className={`ps-value ${statusGrupos.tier}`}>{statusGrupos.texto}</span>
          </div>
          <div className="person-stat">
            <span className="ps-label">Atendimentos concluídos</span>
            <span className="ps-value">{gruposConcluidos.length}</span>
          </div>
          <div className="person-stat">
            <span className="ps-label">Tempo médio</span>
            <span className="ps-value">{mediaGrupos !== null ? `${mediaGrupos} min` : '--'}</span>
          </div>
          <div className="person-stat">
            <span className="ps-label">OCs indevidas</span>
            <span className="ps-value">{contarPorResponsavel(state.agendaLogs, 'Osiel')}</span>
          </div>
        </div>

        <div className="person-card">
          <p className="person-name">Matheus</p>
          <p className="person-role">Linha</p>
          <div className="person-stat">
            <span className="ps-label">Status do canal</span>
            <span className={`ps-value ${statusLinha.tier}`}>{statusLinha.texto}</span>
          </div>
          <div className="person-stat">
            <span className="ps-label">Ligações registradas</span>
            <span className="ps-value">{state.callTotal}</span>
          </div>
          <div className="person-stat">
            <span className="ps-label">OCs indevidas</span>
            <span className="ps-value">{contarPorResponsavel(state.agendaLogs, 'Matheus')}</span>
          </div>
        </div>

        <div className="person-card">
          <p className="person-name">Bezerra</p>
          <p className="person-role">Workdesk</p>
          <div className="person-stat">
            <span className="ps-label">Status do canal</span>
            <span className={`ps-value ${statusWorkdesk.tier}`}>{statusWorkdesk.texto}</span>
          </div>
        </div>

        <div className="person-card">
          <p className="person-name">Hercílio</p>
          <p className="person-role">Apoio</p>
          <div className="person-stat">
            <span className="ps-label">OCs indevidas</span>
            <span className="ps-value">{contarPorResponsavel(state.agendaLogs, 'Hercílio')}</span>
          </div>
        </div>
      </div>

      <p className="section-title">Operação</p>
      <div className="metrics metrics-4" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        <article className="metric">
          <p className="metric-label">Filas registradas</p>
          <p className="metric-value">{state.queueLogs.length}</p>
        </article>
        <article className="metric">
          <p className="metric-label">Tempo médio de fila</p>
          <p className="metric-value">{mediaFila !== null ? `${mediaFila} min` : '--'}</p>
        </article>
      </div>

      <p className="section-title">Histórico de atendimentos em grupos</p>
      <TimedLogList
        itens={state.groupLogs}
        vazioTexto="Nenhum atendimento registrado ainda"
        renderTitulo={(log) => log.nome}
        modo="historico"
      />

      <p className="section-title" style={{ marginTop: 24 }}>
        Histórico de filas
      </p>
      <TimedLogList
        itens={state.queueLogs}
        vazioTexto="Nenhuma fila registrada ainda"
        renderTitulo={(log) => `${log.quantidade} ticket(s) em fila`}
        modo="historico"
        rotuloAberto="Em fila"
      />
    </>
  );
}
