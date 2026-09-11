import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ORIGEM_LABEL,
  ORIGENS,
  TECNICOS_PLANTAO,
  TIPOS_DEMANDA,
  type NightShiftDemand,
} from '../../shared/domain';
import { listarDemandas, type FiltrosDemandas } from '../lib/api';
import { baixarCsv, gerarCsv } from '../lib/csv';
import Card from '../components/Card';
import DemandaDrawer from '../components/DemandaDrawer';
import DemandasTable from '../components/DemandasTable';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';

interface EstadoFiltros {
  clienteRegistro: string;
  dataInicio: string;
  dataFim: string;
  tecnicoPlantao: string;
  origem: string;
  tipoDemanda: string;
  recorrente: string;
}

const FILTROS_INICIAIS: EstadoFiltros = {
  clienteRegistro: '',
  dataInicio: '',
  dataFim: '',
  tecnicoPlantao: '',
  origem: '',
  tipoDemanda: '',
  recorrente: '',
};

const LIMITE_TELA = 500;
const LIMITE_CSV = 5000;

function paraQuery(filtros: EstadoFiltros, limite: number): FiltrosDemandas {
  return {
    startDate: filtros.dataInicio ? new Date(`${filtros.dataInicio}T00:00:00`).toISOString() : undefined,
    endDate: filtros.dataFim ? new Date(`${filtros.dataFim}T23:59:59.999`).toISOString() : undefined,
    clienteRegistro: filtros.clienteRegistro || undefined,
    tecnicoPlantao: filtros.tecnicoPlantao || undefined,
    origem: filtros.origem || undefined,
    tipoDemanda: filtros.tipoDemanda || undefined,
    recorrente: filtros.recorrente || undefined,
    limit: limite,
  };
}

export default function DemandasPage() {
  const [filtros, setFiltros] = useState<EstadoFiltros>(FILTROS_INICIAIS);
  const [demandas, setDemandas] = useState<NightShiftDemand[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);
  const [selecionada, setSelecionada] = useState<NightShiftDemand | null>(null);

  const alterar = <K extends keyof EstadoFiltros>(campo: K, valor: EstadoFiltros[K]) =>
    setFiltros((atual) => ({ ...atual, [campo]: valor }));

  const buscar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await listarDemandas(paraQuery(filtros, LIMITE_TELA));
      setDemandas(resposta.itens);
      setTotal(resposta.total);
    } catch (e) {
      setDemandas([]);
      setTotal(0);
      setErro(e instanceof Error ? e.message : 'Não foi possível consultar as demandas.');
    } finally {
      setCarregando(false);
    }
  }, [filtros]);

  useEffect(() => {
    void buscar();
  }, [buscar]);

  // Os indicadores refletem exatamente os filtros aplicados.
  const indicadores = useMemo(
    () => ({
      continuacoes: demandas.filter((d) => d.origem === 'CONTINUACAO').length,
      grupos: demandas.filter((d) => d.origem === 'GRUPO_WHATSAPP').length,
      recorrentes: demandas.filter((d) => d.recorrente).length,
    }),
    [demandas],
  );

  async function exportar() {
    setExportando(true);
    try {
      const resposta = await listarDemandas(paraQuery(filtros, LIMITE_CSV));
      const carimbo = new Date().toISOString().slice(0, 10);
      baixarCsv(gerarCsv(resposta.itens), `plantao-noturno-demandas-${carimbo}.csv`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível exportar o CSV.');
    } finally {
      setExportando(false);
    }
  }

  return (
    <>
      <PageHeader
        breadcrumb="Demandas registradas"
        titulo="Demandas registradas"
        subtitulo="Consulte e filtre todas as demandas documentadas pela equipe do plantão."
        acoes={
          <button type="button" className="btn btn-primary" onClick={() => void exportar()} disabled={exportando || carregando}>
            {exportando ? 'Gerando…' : '⭳ Exportar CSV'}
          </button>
        }
      />

      <Card titulo="Filtros" subtitulo="Refine a consulta pelos dados registrados no plantão">
        <div className="filters">
          <div className="field">
            <label htmlFor="fCliente">Registro do cliente</label>
            <input
              id="fCliente"
              type="text"
              inputMode="numeric"
              placeholder="Buscar por número"
              value={filtros.clienteRegistro}
              onChange={(e) => alterar('clienteRegistro', e.target.value.replace(/\D/g, ''))}
            />
          </div>

          <div className="field">
            <label htmlFor="fDataInicio">De</label>
            <input
              id="fDataInicio"
              type="date"
              max={filtros.dataFim || undefined}
              value={filtros.dataInicio}
              onChange={(e) => alterar('dataInicio', e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="fDataFim">Até</label>
            <input
              id="fDataFim"
              type="date"
              min={filtros.dataInicio || undefined}
              value={filtros.dataFim}
              onChange={(e) => alterar('dataFim', e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="fTecnico">Técnico do plantão</label>
            <select id="fTecnico" value={filtros.tecnicoPlantao} onChange={(e) => alterar('tecnicoPlantao', e.target.value)}>
              <option value="">Todos</option>
              {TECNICOS_PLANTAO.map((tecnico) => (
                <option key={tecnico} value={tecnico}>
                  {tecnico}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="fOrigem">Origem</label>
            <select id="fOrigem" value={filtros.origem} onChange={(e) => alterar('origem', e.target.value)}>
              <option value="">Todas</option>
              {ORIGENS.map((origem) => (
                <option key={origem} value={origem}>
                  {ORIGEM_LABEL[origem]}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="fTipo">Tipo da demanda</label>
            <select id="fTipo" value={filtros.tipoDemanda} onChange={(e) => alterar('tipoDemanda', e.target.value)}>
              <option value="">Todos</option>
              {TIPOS_DEMANDA.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="fRecorrente">Recorrente</label>
            <select id="fRecorrente" value={filtros.recorrente} onChange={(e) => alterar('recorrente', e.target.value)}>
              <option value="">Todos</option>
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </select>
          </div>
        </div>

        <div className="filters-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setFiltros(FILTROS_INICIAIS)}>
            Limpar filtros
          </button>
        </div>
      </Card>

      <div style={{ height: 16 }} />

      <section className="metrics metrics-4">
        <StatCard rotulo="Resultados encontrados" icone="R" valor={total} rodape="Registros com os filtros aplicados" />
        <StatCard rotulo="Continuações" icone="↪" valor={indicadores.continuacoes} rodape="Origem: continuação de atendimento" />
        <StatCard rotulo="Grupos de WhatsApp" icone="W" valor={indicadores.grupos} rodape="Origem: grupo de WhatsApp" />
        <StatCard rotulo="Recorrentes" icone="⟳" valor={indicadores.recorrentes} rodape="Marcadas como recorrentes" />
      </section>

      <Card titulo="Demandas" subtitulo="Clique em uma linha para ver os detalhes completos">
        {erro ? <div className="state-msg error">{erro}</div> : null}

        {carregando ? (
          <div className="state-msg">Carregando registros…</div>
        ) : (
          <>
            <DemandasTable
              demandas={demandas}
              onSelecionar={setSelecionada}
              vazioTitulo="Nenhuma demanda encontrada"
              vazioTexto="Ajuste os filtros ou registre uma nova demanda."
            />
            {total > demandas.length ? (
              <p className="table-note">
                Exibindo os {demandas.length.toLocaleString('pt-BR')} registros mais recentes de {total.toLocaleString('pt-BR')}.
                Refine os filtros para ver os demais.
              </p>
            ) : null}
          </>
        )}
      </Card>

      {selecionada ? <DemandaDrawer demanda={selecionada} onFechar={() => setSelecionada(null)} /> : null}
    </>
  );
}
