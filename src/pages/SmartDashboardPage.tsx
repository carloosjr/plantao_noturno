import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ADQUIRENTES_CONFIG,
  CONEXOES_SMART,
  baixarArquivoCsv,
  calcularEstatisticasSmart,
  excluirCasoSmart,
  filtrarCasosPorPeriodo,
  gerarCsvCasosSmart,
  listarCasosSmart,
  type CasoSmartRecord,
  type FiltroPeriodoSmart,
} from '../lib/smart';
import { formatarDataHora, formatarPercentual } from '../lib/format';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import BarList, { type ItemBarra } from '../components/BarList';
import EmptyState from '../components/EmptyState';
import Toast, { type Aviso } from '../components/Toast';

export default function SmartDashboardPage() {
  const navigate = useNavigate();

  // Estados principais
  const [casos, setCasos] = useState<CasoSmartRecord[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  // Filtros
  const [periodo, setPeriodo] = useState<FiltroPeriodoSmart>('30');
  const [filtroAdquirente, setFiltroAdquirente] = useState<string>('todas');
  const [filtroConexao, setFiltroConexao] = useState<string>('todas');
  const [filtroQualidade, setFiltroQualidade] = useState<'todas' | 'excelente' | 'bom' | 'critico'>('todas');
  const [busca, setBusca] = useState<string>('');

  // Ações e visualizador modal/drawer
  const [casoSelecionado, setCasoSelecionado] = useState<CasoSmartRecord | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const [confirmarExclusaoId, setConfirmarExclusaoId] = useState<CasoSmartRecord | null>(null);

  // Buscar casos do backend
  const carregarCasos = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const lista = await listarCasosSmart({ limit: 500 });
      setCasos(lista);
    } catch (e) {
      setCasos([]);
      setErro(e instanceof Error ? e.message : 'Não foi possível carregar os casos do Smart.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregarCasos();
  }, [carregarCasos]);

  // 1) Filtrar por período
  const casosNoPeriodo = useMemo(() => {
    return filtrarCasosPorPeriodo(casos, periodo);
  }, [casos, periodo]);

  // 2) Estatísticas calculadas com base no período selecionado
  const stats = useMemo(() => {
    return calcularEstatisticasSmart(casosNoPeriodo);
  }, [casosNoPeriodo]);

  // 3) Casos filtrados pelos controles adicionais (adquirente, qualidade, conexão, busca)
  const casosFiltrados = useMemo(() => {
    return casosNoPeriodo.filter((c) => {
      // Filtro Adquirente
      if (filtroAdquirente !== 'todas' && c.adquirente !== filtroAdquirente) {
        return false;
      }

      // Filtro Conexão
      if (filtroConexao !== 'todas' && c.conexao !== filtroConexao) {
        return false;
      }

      // Filtro Qualidade
      if (filtroQualidade === 'excelente' && (c.score < 85 || !c.score)) return false;
      if (filtroQualidade === 'bom' && (c.score < 70 || c.score >= 85)) return false;
      if (filtroQualidade === 'critico' && (c.score >= 70)) return false;

      // Busca textual
      if (busca.trim()) {
        const termo = busca.toLowerCase().trim();
        const textoCompleto = [
          c.numeroCaso,
          c.registro,
          c.nome,
          c.cnpj,
          c.adquirente,
          c.modelo,
          c.versao,
          c.caminho,
          c.resumo,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!textoCompleto.includes(termo)) {
          return false;
        }
      }

      return true;
    });
  }, [casosNoPeriodo, filtroAdquirente, filtroConexao, filtroQualidade, busca]);

  // Handler de cópia
  async function copiarRelatorio(caso: CasoSmartRecord) {
    try {
      await navigator.clipboard.writeText(caso.relatorioMarkdown);
      setAviso({
        tipo: 'sucesso',
        titulo: 'Relatório copiado!',
        texto: `Markdown do caso #${caso.registro} copiado para a área de transferência.`,
      });
    } catch {
      setAviso({
        tipo: 'erro',
        titulo: 'Erro ao copiar',
        texto: 'Não foi possível copiar o relatório automaticamente.',
      });
    }
  }

  // Handler para carregar caso no Gerador
  function handleEditarNoGerador(caso: CasoSmartRecord) {
    navigate('/smart', { state: { casoParaCarregar: caso } });
  }

  // Handler para excluir
  async function handleConfirmarExcluir() {
    if (!confirmarExclusaoId) return;
    const { id, registro } = confirmarExclusaoId;
    setExcluindoId(id);
    try {
      await excluirCasoSmart(id);
      setCasos((atual) => atual.filter((c) => c.id !== id));
      if (casoSelecionado?.id === id) {
        setCasoSelecionado(null);
      }
      setConfirmarExclusaoId(null);
      setAviso({
        tipo: 'sucesso',
        titulo: 'Caso excluído',
        texto: `O caso do cliente #${registro} foi removido com sucesso.`,
      });
    } catch (e) {
      setAviso({
        tipo: 'erro',
        titulo: 'Erro ao excluir',
        texto: e instanceof Error ? e.message : 'Não foi possível excluir o caso.',
      });
    } finally {
      setExcluindoId(null);
    }
  }

  // Exportar CSV
  function handleExportarCsv() {
    if (casosFiltrados.length === 0) {
      setAviso({
        tipo: 'erro',
        titulo: 'Sem dados para exportar',
        texto: 'Não há registros nos filtros atuais para download.',
      });
      return;
    }
    const csvContent = gerarCsvCasosSmart(casosFiltrados);
    const dataAtual = new Date().toISOString().slice(0, 10);
    baixarArquivoCsv(csvContent, `casos_smart_pos_${dataAtual}.csv`);
    setAviso({
      tipo: 'sucesso',
      titulo: 'Exportação concluída',
      texto: `${casosFiltrados.length} registros baixados com sucesso em CSV.`,
    });
  }

  // Limpar filtros
  const temFiltrosAtivos =
    filtroAdquirente !== 'todas' ||
    filtroConexao !== 'todas' ||
    filtroQualidade !== 'todas' ||
    busca.trim() !== '';

  function limparFiltros() {
    setFiltroAdquirente('todas');
    setFiltroConexao('todas');
    setFiltroQualidade('todas');
    setBusca('');
  }

  // Barras para BarList
  const barrasAdquirente = useMemo<ItemBarra[]>(
    () => stats.porAdquirente.map((i) => ({ rotulo: i.rotulo, quantidade: i.quantidade, percentual: i.percentual })),
    [stats.porAdquirente]
  );

  const barrasVersao = useMemo<ItemBarra[]>(
    () => stats.porVersao.map((i) => ({ rotulo: i.rotulo, quantidade: i.quantidade, percentual: i.percentual })),
    [stats.porVersao]
  );

  const barrasCaminho = useMemo<ItemBarra[]>(
    () => stats.porCaminho.map((i) => ({ rotulo: i.rotulo, quantidade: i.quantidade, percentual: i.percentual })),
    [stats.porCaminho]
  );

  const barrasModelo = useMemo<ItemBarra[]>(
    () => stats.porModelo.map((i) => ({ rotulo: i.rotulo, quantidade: i.quantidade, percentual: i.percentual })),
    [stats.porModelo]
  );

  const listaAdquirentesDisponiveis = useMemo(() => {
    return Object.keys(ADQUIRENTES_CONFIG);
  }, []);

  return (
    <>
      <PageHeader
        breadcrumb="Casos Smart"
        titulo="Dashboard dos Casos do Smart"
        subtitulo="Visão analítica, métricas de qualidade e histórico dos chamados padronizados no Smart POS."
        acoes={
          <>
            <div className="smart-period-select-wrap">
              <select
                className="select"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value as FiltroPeriodoSmart)}
                aria-label="Filtrar período do dashboard"
              >
                <option value="7">Últimos 7 dias</option>
                <option value="15">Últimos 15 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 90 dias</option>
                <option value="tudo">Todo o período</option>
              </select>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => void carregarCasos()}
              disabled={carregando}
              title="Recarregar casos do banco"
            >
              {carregando ? '🔄 Atualizando…' : '↻ Atualizar'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleExportarCsv}
              disabled={casosFiltrados.length === 0}
              title="Exportar casos filtrados em planilha CSV"
            >
              📥 Exportar CSV
            </button>

            <Link to="/smart" className="btn btn-primary" title="Abrir o Gerador de Casos Smart">
              📱 ＋ Novo Caso Smart
            </Link>
          </>
        }
      />

      {erro ? <div className="state-msg error">{erro}</div> : null}

      {/* KPI Cards */}
      <section className="metrics smart-kpi-grid">
        <article className="metric smart-kpi-card">
          <div className="metric-top">
            <div className="metric-label">Total de casos</div>
            <div className="metric-icon" aria-hidden="true">
              📱
            </div>
          </div>
          <div className="metric-value font-mono">{stats.total.toLocaleString('pt-BR')}</div>
          <div className="metric-foot">
            {periodo === 'tudo' ? 'Histórico geral' : `Nos últimos ${periodo} dias`}
          </div>
        </article>

        <article className="metric smart-kpi-card">
          <div className="metric-top">
            <div className="metric-label">Qualidade média</div>
            <div className="metric-icon" aria-hidden="true">
              ⭐
            </div>
          </div>
          <div className="metric-value font-mono">
            <span
              className={`smart-score-val ${
                stats.scoreMedio >= 85
                  ? 'text-emerald'
                  : stats.scoreMedio >= 70
                    ? 'text-amber'
                    : 'text-rose'
              }`}
            >
              {stats.scoreMedio}%
            </span>
          </div>
          <div className="metric-foot">
            {stats.scoreMedio >= 85
              ? 'Conformidade excelente'
              : stats.scoreMedio >= 70
                ? 'Conformidade média'
                : 'Necessita atenção'}
          </div>
        </article>

        <article className="metric smart-kpi-card">
          <div className="metric-top">
            <div className="metric-label">Clientes únicos</div>
            <div className="metric-icon" aria-hidden="true">
              🏢
            </div>
          </div>
          <div className="metric-value font-mono">{stats.clientesUnicos.toLocaleString('pt-BR')}</div>
          <div className="metric-foot">Estabelecimentos distintos</div>
        </article>

        <article className="metric smart-kpi-card">
          <div className="metric-top">
            <div className="metric-label">Adquirente líder</div>
            <div className="metric-icon" aria-hidden="true">
              💳
            </div>
          </div>
          <div className="metric-value font-mono" style={{ fontSize: '20px' }}>
            {stats.adquirenteTop ? stats.adquirenteTop.nome : '—'}
          </div>
          <div className="metric-foot">
            {stats.adquirenteTop
              ? `${stats.adquirenteTop.quantidade} casos (${formatarPercentual(stats.adquirenteTop.percentual)})`
              : 'Sem registros'}
          </div>
        </article>

        <article className="metric smart-kpi-card">
          <div className="metric-top">
            <div className="metric-label">Hardware frequente</div>
            <div className="metric-icon" aria-hidden="true">
              📟
            </div>
          </div>
          <div className="metric-value font-mono" style={{ fontSize: '20px' }}>
            {stats.modeloTop ? stats.modeloTop.nome : '—'}
          </div>
          <div className="metric-foot">
            {stats.modeloTop
              ? `${stats.modeloTop.quantidade} casos (${formatarPercentual(stats.modeloTop.percentual)})`
              : 'Sem registros'}
          </div>
        </article>

        <article className="metric smart-kpi-card">
          <div className="metric-top">
            <div className="metric-label">Taxa com evidências</div>
            <div className="metric-icon" aria-hidden="true">
              📎
            </div>
          </div>
          <div className="metric-value font-mono">{formatarPercentual(stats.taxaEvidencias)}</div>
          <div className="metric-foot">
            {stats.comEvidenciasCount} de {stats.total} com links/mídias
          </div>
        </article>
      </section>

      {/* Gráficos de Distribuição */}
      <div className="layout">
        <Card
          titulo="Distribuição por Adquirente"
          subtitulo="Concentração de bugs por maquininha homologada"
        >
          <BarList
            itens={barrasAdquirente}
            base={stats.total}
            mostrarPercentual
            vazioTexto="Nenhum caso de adquirente registrado no período."
          />
        </Card>

        <Card
          titulo="Módulos & Telas Mais Afetados"
          subtitulo="Áreas do aplicativo Smart com maior incidência de falhas"
        >
          <BarList
            itens={barrasCaminho}
            base={stats.total}
            mostrarPercentual
            vazioTexto="Nenhum caminho registrado no período."
          />
        </Card>
      </div>

      <div className="layout">
        <Card
          titulo="Distribuição por Versão do Smart"
          subtitulo="Incidência em versões atuais vs legadas"
        >
          <BarList
            itens={barrasVersao}
            base={stats.total}
            mostrarPercentual
            vazioTexto="Nenhuma versão registrada no período."
          />
        </Card>

        <Card
          titulo="Dispositivos & Modelos POS"
          subtitulo="Modelos de terminais com mais relatos de erro"
        >
          <BarList
            itens={barrasModelo}
            base={stats.total}
            mostrarPercentual
            vazioTexto="Nenhum modelo registrado no período."
          />
        </Card>
      </div>

      {/* Faixas de Qualidade */}
      <Card
        titulo="Qualidade do Preenchimento dos Relatórios"
        subtitulo="Índice de riqueza técnica dos chamados gerados pela equipe do plantão"
      >
        <div className="smart-quality-bars">
          {stats.faixasQualidade.map((fq) => (
            <div className="smart-quality-bar-item" key={fq.chave}>
              <div className="smart-quality-header">
                <span className="smart-quality-label" style={{ color: fq.cor }}>
                  ● {fq.rotulo}
                </span>
                <span className="smart-quality-numbers font-mono">
                  {fq.quantidade} ({formatarPercentual(fq.percentual)})
                </span>
              </div>
              <div className="smart-progress-track">
                <div
                  className="smart-progress-fill"
                  style={{
                    width: `${fq.percentual}%`,
                    backgroundColor: fq.cor,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Seção da Tabela e Feed de Casos */}
      <Card
        titulo="Histórico Analítico de Casos Smart"
        subtitulo={`Exibindo ${casosFiltrados.length} de ${casosNoPeriodo.length} registros no período selecionado`}
      >
        {/* Barra de Filtros e Busca */}
        <div className="smart-filter-toolbar">
          <div className="smart-filter-inputs">
            <div className="smart-search-box">
              <span className="smart-search-icon" aria-hidden="true">
                🔍
              </span>
              <input
                type="text"
                className="smart-search-input"
                placeholder="Buscar por registro, cliente, CNPJ, resumo, caminho..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                aria-label="Buscar casos"
              />
              {busca ? (
                <button
                  type="button"
                  className="smart-search-clear"
                  onClick={() => setBusca('')}
                  aria-label="Limpar busca"
                >
                  ✕
                </button>
              ) : null}
            </div>

            <div className="smart-filter-select-group">
              <select
                className="select select-sm"
                value={filtroAdquirente}
                onChange={(e) => setFiltroAdquirente(e.target.value)}
                aria-label="Filtrar por adquirente"
              >
                <option value="todas">Todas as Adquirentes</option>
                {listaAdquirentesDisponiveis.map((adq) => (
                  <option value={adq} key={adq}>
                    {adq}
                  </option>
                ))}
              </select>

              <select
                className="select select-sm"
                value={filtroConexao}
                onChange={(e) => setFiltroConexao(e.target.value)}
                aria-label="Filtrar por conexão"
              >
                <option value="todas">Todas as Conexões</option>
                {CONEXOES_SMART.map((con) => (
                  <option value={con} key={con}>
                    {con}
                  </option>
                ))}
              </select>

              <select
                className="select select-sm"
                value={filtroQualidade}
                onChange={(e) =>
                  setFiltroQualidade(
                    e.target.value as 'todas' | 'excelente' | 'bom' | 'critico'
                  )
                }
                aria-label="Filtrar por qualidade"
              >
                <option value="todas">Todas as Qualidades</option>
                <option value="excelente">Excelente (≥ 85%)</option>
                <option value="bom">Bom (70-84%)</option>
                <option value="critico">Atenção (&lt; 70%)</option>
              </select>
            </div>
          </div>

          {temFiltrosAtivos ? (
            <button
              type="button"
              className="btn btn-secondary btn-xs"
              onClick={limparFiltros}
              title="Restaurar todos os filtros"
            >
              ✕ Limpar Filtros
            </button>
          ) : null}
        </div>

        {/* Tabela de Casos */}
        {carregando && casos.length === 0 ? (
          <div className="state-msg">Carregando casos do banco de dados…</div>
        ) : casosFiltrados.length === 0 ? (
          <EmptyState
            titulo="Nenhum caso encontrado"
            texto={
              temFiltrosAtivos
                ? 'Nenhum caso corresponde aos filtros selecionados. Tente ajustar os termos de busca.'
                : 'Nenhum caso registrado no período selecionado. Use o Gerador de Casos para registrar o primeiro.'
            }
          />
        ) : (
          <div className="smart-table-wrapper">
            <table className="smart-table">
              <thead>
                <tr>
                  <th scope="col">Data / Hora</th>
                  <th scope="col">Cliente / Registro</th>
                  <th scope="col">Dispositivo POS</th>
                  <th scope="col">Caminho & Ocorrência</th>
                  <th scope="col" style={{ textAlign: 'center' }}>
                    Qualidade
                  </th>
                  <th scope="col">Evidências</th>
                  <th scope="col" style={{ textAlign: 'right' }}>
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {casosFiltrados.map((c) => {
                  const scoreClasse =
                    c.score <= 40
                      ? 'score-danger'
                      : c.score <= 75
                        ? 'score-warning'
                        : 'score-success';

                  const temHedge = Boolean(c.linkHedgedoc?.trim());
                  const temPrint = Boolean(c.linkPrint?.trim());
                  const temVideo = Boolean(c.linkVideo?.trim());
                  const temArquivo = Boolean(c.linkArquivo?.trim());
                  const temDiscord = Boolean(c.linkDiscord?.trim());

                  return (
                    <tr key={c.id} className="smart-table-row">
                      <td className="font-mono" style={{ fontSize: '12px', whiteSpace: 'nowrap', color: 'var(--muted)' }}>
                        {formatarDataHora(c.createdAt)}
                      </td>

                      <td>
                        <div className="smart-client-cell">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            {c.numeroCaso ? (
                              <span
                                className="smart-reg-badge font-mono"
                                style={{
                                  background: 'rgba(168, 85, 247, 0.15)',
                                  color: '#c084fc',
                                  borderColor: 'rgba(168, 85, 247, 0.3)',
                                }}
                              >
                                Caso #{c.numeroCaso}
                              </span>
                            ) : null}
                            <span className="smart-reg-badge font-mono">#{c.registro}</span>
                          </div>
                          <span className="smart-client-name" title={c.nome || 'Sem nome'}>
                            {c.nome || 'Cliente não informado'}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="smart-pos-cell">
                          <div className="smart-pos-primary">
                            <span className="smart-badge-adq">{c.adquirente}</span>
                            <span className="smart-badge-model">{c.modelo}</span>
                          </div>
                          <div className="smart-pos-secondary font-mono">
                            <span>v{c.versao}</span>
                            <span>•</span>
                            <span>{c.conexao}</span>
                          </div>
                        </div>
                      </td>

                      <td style={{ maxWidth: '300px' }}>
                        <div className="smart-path-summary">
                          <span className="smart-path-label" title={c.caminho}>
                            📍 {c.caminho}
                          </span>
                          <span className="smart-summary-text" title={c.resumo}>
                            {c.resumo}
                          </span>
                        </div>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <span className={`smart-card-score ${scoreClasse} font-mono`} title={`Score: ${c.score}%`}>
                          {c.score}%
                        </span>
                      </td>

                      <td>
                        <div className="smart-evidence-tags">
                          {temHedge ? (
                            <span className="smart-ev-tag hedge" title="Possui link HedgeDoc">
                              📝 Doc
                            </span>
                          ) : null}
                          {temPrint ? (
                            <span className="smart-ev-tag print" title="Possui captura de tela">
                              🖼️ Print
                            </span>
                          ) : null}
                          {temVideo ? (
                            <span className="smart-ev-tag video" title="Possui vídeo da reprodução">
                              🎥 Vídeo
                            </span>
                          ) : null}
                          {temArquivo ? (
                            <span className="smart-ev-tag file" title="Possui arquivo/log">
                              📁 Log
                            </span>
                          ) : null}
                          {temDiscord ? (
                            <span className="smart-ev-tag discord" title="Possui canal/link do Discord">
                              💬 Discord
                            </span>
                          ) : null}
                          {!temHedge && !temPrint && !temVideo && !temArquivo && !temDiscord ? (
                            <span className="smart-ev-tag none" title="Nenhuma evidência anexada">
                              —
                            </span>
                          ) : null}
                        </div>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div className="smart-actions-cell">
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            onClick={() => setCasoSelecionado(c)}
                            title="Visualizar detalhes completos do caso"
                          >
                            👁️ Detalhes
                          </button>

                          <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            onClick={() => void copiarRelatorio(c)}
                            title="Copiar relatório Markdown pronto"
                          >
                            📋 Copiar
                          </button>

                          <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            onClick={() => handleEditarNoGerador(c)}
                            title="Abrir dados deste caso no Gerador de Casos"
                          >
                            ✏️ Gerador
                          </button>

                          <button
                            type="button"
                            className="btn btn-danger-soft btn-xs"
                            onClick={() => setConfirmarExclusaoId(c)}
                            title="Excluir este caso do banco de dados"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal / Drawer de Detalhes do Caso */}
      {casoSelecionado ? (
        <div
          className="smart-modal-backdrop"
          onClick={() => setCasoSelecionado(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-case-title"
        >
          <div
            className="smart-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="smart-modal-header">
              <div>
                <div className="smart-modal-subtitle">Detalhes do Caso Smart</div>
                <h2 id="modal-case-title" className="smart-modal-title">
                  {casoSelecionado.numeroCaso ? `Caso #${casoSelecionado.numeroCaso} • ` : ''}Cliente #{casoSelecionado.registro} — {casoSelecionado.nome || 'Não informado'}
                </h2>
              </div>
              <button
                type="button"
                className="smart-modal-close"
                onClick={() => setCasoSelecionado(null)}
                aria-label="Fechar detalhes"
              >
                ✕
              </button>
            </div>

            <div className="smart-modal-body">
              {/* Badges de Topo */}
              <div className="smart-modal-badges">
                {casoSelecionado.numeroCaso ? (
                  <span
                    className="smart-reg-badge font-mono"
                    style={{
                      background: 'rgba(168, 85, 247, 0.15)',
                      color: '#c084fc',
                      borderColor: 'rgba(168, 85, 247, 0.3)',
                    }}
                  >
                    Caso #{casoSelecionado.numeroCaso}
                  </span>
                ) : null}
                <span className="smart-reg-badge font-mono">Registro #{casoSelecionado.registro}</span>
                <span className="smart-card-tag">{casoSelecionado.adquirente}</span>
                <span className="smart-card-tag">{casoSelecionado.modelo}</span>
                <span className="smart-card-tag font-mono">v{casoSelecionado.versao}</span>
                <span className="smart-card-tag">{casoSelecionado.conexao}</span>
                <span
                  className={`smart-card-score font-mono ${
                    casoSelecionado.score <= 40
                      ? 'score-danger'
                      : casoSelecionado.score <= 75
                        ? 'score-warning'
                        : 'score-success'
                  }`}
                >
                  {casoSelecionado.score}% de qualidade
                </span>
                <span className="smart-card-date font-mono">
                  Criado em: {formatarDataHora(casoSelecionado.createdAt)}
                </span>
              </div>

              {/* Informações do Cliente */}
              <div className="smart-modal-section">
                <h3 className="smart-modal-section-title">🏢 Identificação do Cliente</h3>
                <div className="smart-modal-grid-2">
                  <div>
                    <span className="smart-modal-label">Nome Fantasia:</span>
                    <span className="smart-modal-val">{casoSelecionado.nome || 'Não informado'}</span>
                  </div>
                  <div>
                    <span className="smart-modal-label">CNPJ:</span>
                    <span className="smart-modal-val font-mono">{casoSelecionado.cnpj || 'Não informado'}</span>
                  </div>
                  {casoSelecionado.linkCliente ? (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span className="smart-modal-label">Link do Sistema / Web:</span>
                      <a
                        href={casoSelecionado.linkCliente}
                        target="_blank"
                        rel="noreferrer"
                        className="smart-modal-link"
                      >
                        {casoSelecionado.linkCliente} ↗
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Ocorrência & Caminho */}
              <div className="smart-modal-section">
                <h3 className="smart-modal-section-title">📍 Caminho & Descrição Resumida</h3>
                <div className="smart-modal-callout">
                  <strong>Caminho em tela:</strong> {casoSelecionado.caminho}
                </div>
                <p className="smart-modal-desc-p">{casoSelecionado.resumo}</p>
              </div>

              {/* Descrições Detalhadas */}
              {casoSelecionado.descricoes && casoSelecionado.descricoes.length > 0 ? (
                <div className="smart-modal-section">
                  <h3 className="smart-modal-section-title">📋 Detalhamento em Grupos</h3>
                  <div className="smart-modal-desc-list">
                    {casoSelecionado.descricoes.map((g, gIdx) => (
                      <div className="smart-modal-desc-item" key={g.id || gIdx}>
                        <div className="smart-modal-desc-main">
                          <strong>{gIdx + 1} -</strong> {g.main || 'Não preenchido'}
                        </div>
                        {g.subs && g.subs.length > 0 && g.subs.some((s) => s.trim()) ? (
                          <ul className="smart-modal-subs-list">
                            {g.subs.map((s, sIdx) =>
                              s.trim() ? (
                                <li key={sIdx}>
                                  <strong>
                                    {gIdx + 1}.{sIdx + 1} -
                                  </strong>{' '}
                                  {s}
                                </li>
                              ) : null
                            )}
                          </ul>
                        ) : null}
                        {g.img && g.img.trim() ? (
                          <div className="smart-modal-desc-img">
                            <a href={g.img} target="_blank" rel="noreferrer">
                              <img src={g.img} alt={`Evidência ${gIdx + 1}`} loading="lazy" />
                            </a>
                            <span className="smart-img-caption">Clique na imagem para ampliar</span>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Passos a Reproduzir */}
              {casoSelecionado.passos && casoSelecionado.passos.length > 0 ? (
                <div className="smart-modal-section">
                  <h3 className="smart-modal-section-title">🔢 Passos a Reproduzir</h3>
                  <ol className="smart-modal-steps-list">
                    {casoSelecionado.passos.map((p, pIdx) =>
                      p.trim() ? <li key={pIdx}>{p}</li> : null
                    )}
                  </ol>
                </div>
              ) : null}

              {/* Links e Evidências */}
              <div className="smart-modal-section">
                <h3 className="smart-modal-section-title">📎 Evidências Anexadas</h3>
                <div className="smart-evidences-grid">
                  {casoSelecionado.linkHedgedoc ? (
                    <a
                      href={casoSelecionado.linkHedgedoc}
                      target="_blank"
                      rel="noreferrer"
                      className="smart-ev-card"
                    >
                      <span className="smart-ev-icon">📝</span>
                      <div>
                        <strong>HedgeDoc</strong>
                        <span>{casoSelecionado.linkHedgedoc}</span>
                      </div>
                    </a>
                  ) : null}

                  {casoSelecionado.linkPrint ? (
                    <a
                      href={casoSelecionado.linkPrint}
                      target="_blank"
                      rel="noreferrer"
                      className="smart-ev-card"
                    >
                      <span className="smart-ev-icon">🖼️</span>
                      <div>
                        <strong>Print / Imagem</strong>
                        <span>{casoSelecionado.linkPrint}</span>
                      </div>
                    </a>
                  ) : null}

                  {casoSelecionado.linkVideo ? (
                    <a
                      href={casoSelecionado.linkVideo}
                      target="_blank"
                      rel="noreferrer"
                      className="smart-ev-card"
                    >
                      <span className="smart-ev-icon">🎥</span>
                      <div>
                        <strong>Vídeo de Reprodução</strong>
                        <span>{casoSelecionado.linkVideo}</span>
                      </div>
                    </a>
                  ) : null}

                  {casoSelecionado.linkArquivo ? (
                    <a
                      href={casoSelecionado.linkArquivo}
                      target="_blank"
                      rel="noreferrer"
                      className="smart-ev-card"
                    >
                      <span className="smart-ev-icon">📁</span>
                      <div>
                        <strong>Arquivo / Log Anexo</strong>
                        <span>{casoSelecionado.linkArquivo}</span>
                      </div>
                    </a>
                  ) : null}

                  {casoSelecionado.linkDiscord ? (
                    <div className="smart-ev-card plain">
                      <span className="smart-ev-icon">💬</span>
                      <div>
                        <strong>Referência do Discord</strong>
                        <span>{casoSelecionado.linkDiscord}</span>
                      </div>
                    </div>
                  ) : null}

                  {!casoSelecionado.linkHedgedoc &&
                  !casoSelecionado.linkPrint &&
                  !casoSelecionado.linkVideo &&
                  !casoSelecionado.linkArquivo &&
                  !casoSelecionado.linkDiscord ? (
                    <div className="smart-modal-none">Nenhuma evidência externa foi anexada a este chamado.</div>
                  ) : null}
                </div>
              </div>

              {/* Relatório Formatado Markdown */}
              <div className="smart-modal-section">
                <div className="smart-modal-md-head">
                  <h3 className="smart-modal-section-title" style={{ margin: 0 }}>
                    📄 Relatório Padronizado Markdown
                  </h3>
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    onClick={() => void copiarRelatorio(casoSelecionado)}
                  >
                    📋 Copiar Markdown
                  </button>
                </div>
                <pre className="smart-modal-markdown font-mono">
                  {casoSelecionado.relatorioMarkdown}
                </pre>
              </div>
            </div>

            <div className="smart-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCasoSelecionado(null)}
              >
                Fechar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleEditarNoGerador(casoSelecionado)}
              >
                ✏️ Carregar no Gerador de Casos
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal de Confirmação de Exclusão */}
      {confirmarExclusaoId ? (
        <div
          className="smart-modal-backdrop"
          onClick={() => setConfirmarExclusaoId(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="smart-confirm-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="smart-confirm-icon">⚠️</div>
            <h3 className="smart-confirm-title">Confirmar exclusão</h3>
            <p className="smart-confirm-text">
              Deseja realmente excluir o caso do cliente <strong>#{confirmarExclusaoId.registro}</strong> ({confirmarExclusaoId.nome || 'Sem nome'})?
              Esta ação não pode ser desfeita.
            </p>
            <div className="smart-confirm-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmarExclusaoId(null)}
                disabled={Boolean(excluindoId)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger-soft"
                onClick={() => void handleConfirmarExcluir()}
                disabled={Boolean(excluindoId)}
              >
                {excluindoId ? 'Excluindo…' : '🗑️ Sim, excluir caso'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {aviso ? <Toast aviso={aviso} onFechar={() => setAviso(null)} /> : null}
    </>
  );
}
