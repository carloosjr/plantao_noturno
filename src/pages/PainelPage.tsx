import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DASHBOARD_VAZIO, ORIGEM_LABEL, percentualDe, type DashboardData } from '../../shared/domain';
import { carregarDashboard } from '../lib/api';
import { formatarPercentual } from '../lib/format';
import { intervaloDoPeriodo, type Periodo } from '../lib/periodo';
import BarList, { type ItemBarra } from '../components/BarList';
import Card from '../components/Card';
import DemandasTable from '../components/DemandasTable';
import Donut from '../components/Donut';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import PeriodoSelect from '../components/PeriodoSelect';
import StatCard from '../components/StatCard';

export default function PainelPage() {
  const [periodo, setPeriodo] = useState<Periodo>('30');
  const [dados, setDados] = useState<DashboardData>(DASHBOARD_VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const buscar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      setDados(await carregarDashboard(intervaloDoPeriodo(periodo)));
    } catch (e) {
      setDados(DASHBOARD_VAZIO);
      setErro(e instanceof Error ? e.message : 'Não foi possível carregar o painel.');
    } finally {
      setCarregando(false);
    }
  }, [periodo]);

  useEffect(() => {
    void buscar();
  }, [buscar]);

  const barrasOrigem = useMemo<ItemBarra[]>(
    () =>
      dados.porOrigem.map((item) => ({
        rotulo: ORIGEM_LABEL[item.origem],
        quantidade: item.quantidade,
        percentual: item.percentual,
      })),
    [dados.porOrigem],
  );

  const barrasTipo = useMemo<ItemBarra[]>(
    () => dados.porTipo.map((item) => ({ rotulo: item.tipoDemanda, quantidade: item.quantidade })),
    [dados.porTipo],
  );

  const barrasTecnicoAnterior = useMemo<ItemBarra[]>(
    () => dados.porTecnicoAnterior.map((item) => ({ rotulo: item.tecnicoAnterior, quantidade: item.quantidade })),
    [dados.porTecnicoAnterior],
  );

  const barrasGrupo = useMemo<ItemBarra[]>(
    () => dados.porGrupoWhatsapp.map((item) => ({ rotulo: item.grupoWhatsapp, quantidade: item.quantidade })),
    [dados.porGrupoWhatsapp],
  );

  const demaisOrigens = dados.total - dados.continuacoes;
  const rodape = (quantidade: number) => `${formatarPercentual(percentualDe(quantidade, dados.total))} das demandas`;

  return (
    <>
      <PageHeader
        breadcrumb="Painel"
        titulo="Painel do plantão"
        subtitulo="Entenda de onde vêm as demandas recebidas pela equipe durante o plantão."
        acoes={
          <>
            <PeriodoSelect valor={periodo} onChange={setPeriodo} aria-label="Filtrar por período" />
            <button type="button" className="btn btn-secondary" onClick={() => void buscar()} disabled={carregando}>
              ↻ Atualizar
            </button>
            <Link to="/registrar" className="btn btn-primary">
              ＋ Registrar demanda
            </Link>
          </>
        }
      />

      {erro ? <div className="state-msg error">{erro}</div> : null}

      <section className="metrics">
        <StatCard rotulo="Demandas recebidas" icone="D" valor={dados.total} rodape="Total no período selecionado" />
        <StatCard rotulo="Continuações" icone="↪" valor={dados.continuacoes} rodape={rodape(dados.continuacoes)} />
        <StatCard rotulo="Grupos de WhatsApp" icone="W" valor={dados.gruposWhatsapp} rodape={rodape(dados.gruposWhatsapp)} />
        <StatCard rotulo="Cliente direto" icone="C" valor={dados.clientesDiretos} rodape={rodape(dados.clientesDiretos)} />
        <StatCard rotulo="Demandas recorrentes" icone="R" valor={dados.recorrentes} rodape={rodape(dados.recorrentes)} />
      </section>

      <div className="layout">
        <Card titulo="Origem das demandas" subtitulo="Distribuição das entradas recebidas pela equipe">
          <BarList itens={barrasOrigem} base={dados.total} mostrarPercentual />
        </Card>

        <Card titulo="Carga herdada" subtitulo="Quanto do plantão veio de atendimentos anteriores">
          <div className="load-box">
            <Donut percentual={dados.cargaHerdadaPercentual} rotulo="carga herdada" />
            <div className="load-list">
              <div className="load-item">
                <span>Continuações</span>
                <strong>{dados.continuacoes.toLocaleString('pt-BR')}</strong>
              </div>
              <div className="load-item">
                <span>Demais origens</span>
                <strong>{demaisOrigens.toLocaleString('pt-BR')}</strong>
              </div>
              <div className="load-item">
                <span>Total</span>
                <strong>{dados.total.toLocaleString('pt-BR')}</strong>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="layout">
        <Card titulo="Tipos de demanda mais recebidos" subtitulo="Assuntos que mais chegam ao plantão">
          <BarList itens={barrasTipo} />
        </Card>

        <Card titulo="Principais origens específicas" subtitulo="Técnicos anteriores e grupos que mais aparecem nos registros">
          <div className="stack">
            <div>
              <div className="detail-label">Continuações por técnico anterior</div>
              <div style={{ marginTop: 12 }}>
                <BarList itens={barrasTecnicoAnterior} vazioTexto="Nenhuma continuação no período." />
              </div>
            </div>
            <div className="divider" style={{ margin: 0 }} />
            <div>
              <div className="detail-label">Demandas por grupo de WhatsApp</div>
              <div style={{ marginTop: 12 }}>
                <BarList itens={barrasGrupo} vazioTexto="Nenhuma demanda de grupo no período." />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card titulo="Demandas recentes" subtitulo="Últimos 15 registros do período selecionado">
        {carregando && dados.recentes.length === 0 ? (
          <div className="state-msg">Carregando registros…</div>
        ) : dados.recentes.length === 0 ? (
          <EmptyState
            titulo="Nenhuma demanda no período"
            texto="Registre uma demanda para começar a acompanhar a origem do plantão."
          />
        ) : (
          <DemandasTable demandas={dados.recentes} />
        )}
      </Card>
    </>
  );
}
