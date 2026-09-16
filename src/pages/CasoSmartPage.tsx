import { useMemo, useState } from 'react';
import {
  ADQUIRENTES_CONFIG,
  CONEXOES_SMART,
  ESTADO_SMART_VAZIO,
  EXEMPLO_SMART,
  gerarRelatorioSmart,
  validarChecklistSmart,
  type EstadoSmartForm,
} from '../lib/smart';
import PageHeader from '../components/PageHeader';
import Toast, { type Aviso } from '../components/Toast';

export default function CasoSmartPage() {
  const [form, setForm] = useState<EstadoSmartForm>(() => ({ ...EXEMPLO_SMART }));
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const checklist = useMemo(() => validarChecklistSmart(form), [form]);
  const relatorioMarkdown = useMemo(() => gerarRelatorioSmart(form), [form]);

  // Handler para atualizar campos simples
  function alterar<K extends keyof EstadoSmartForm>(campo: K, valor: EstadoSmartForm[K]) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  // Handler ao trocar a Adquirência
  function handleAdquirenteChange(novaAdquirente: string) {
    if (!novaAdquirente) {
      setForm((atual) => ({
        ...atual,
        adquirente: '',
        versao: '',
        conexao: '',
        modelo: '',
      }));
      return;
    }

    const config = ADQUIRENTES_CONFIG[novaAdquirente];
    if (config) {
      setForm((atual) => ({
        ...atual,
        adquirente: novaAdquirente,
        versao: config.versao,
        conexao: config.conexao,
        modelo: config.modelos.length === 1 ? config.modelos[0] : '',
      }));
    } else {
      setForm((atual) => ({
        ...atual,
        adquirente: novaAdquirente,
      }));
    }
  }

  // Modelos disponíveis para a adquirente atual
  const modelosDisponiveis = useMemo(() => {
    if (!form.adquirente || !ADQUIRENTES_CONFIG[form.adquirente]) {
      return [];
    }
    return ADQUIRENTES_CONFIG[form.adquirente].modelos;
  }, [form.adquirente]);

  // Ações de grupos de descrição
  function addDescGroup() {
    setForm((atual) => ({
      ...atual,
      descricoes: [
        ...atual.descricoes,
        { id: String(Date.now()), main: '', subs: [''], img: '' },
      ],
    }));
  }

  function removeDescGroup(index: number) {
    setForm((atual) => ({
      ...atual,
      descricoes: atual.descricoes.filter((_, i) => i !== index),
    }));
  }

  function updateMainDesc(index: number, val: string) {
    setForm((atual) => {
      const novas = [...atual.descricoes];
      novas[index] = { ...novas[index], main: val };
      return { ...atual, descricoes: novas };
    });
  }

  function updateImgDesc(index: number, val: string) {
    setForm((atual) => {
      const novas = [...atual.descricoes];
      novas[index] = { ...novas[index], img: val };
      return { ...atual, descricoes: novas };
    });
  }

  function addSubDesc(groupIndex: number) {
    setForm((atual) => {
      const novas = [...atual.descricoes];
      novas[groupIndex] = {
        ...novas[groupIndex],
        subs: [...novas[groupIndex].subs, ''],
      };
      return { ...atual, descricoes: novas };
    });
  }

  function removeSubDesc(groupIndex: number, subIndex: number) {
    setForm((atual) => {
      const novas = [...atual.descricoes];
      novas[groupIndex] = {
        ...novas[groupIndex],
        subs: novas[groupIndex].subs.filter((_, i) => i !== subIndex),
      };
      return { ...atual, descricoes: novas };
    });
  }

  function updateSubDesc(groupIndex: number, subIndex: number, val: string) {
    setForm((atual) => {
      const novas = [...atual.descricoes];
      const novosSubs = [...novas[groupIndex].subs];
      novosSubs[subIndex] = val;
      novas[groupIndex] = { ...novas[groupIndex], subs: novosSubs };
      return { ...atual, descricoes: novas };
    });
  }

  // Ações de passos
  function addStep() {
    setForm((atual) => ({
      ...atual,
      passos: [...atual.passos, ''],
    }));
  }

  function removeStep(index: number) {
    setForm((atual) => ({
      ...atual,
      passos: atual.passos.filter((_, i) => i !== index),
    }));
  }

  function updateStep(index: number, val: string) {
    setForm((atual) => {
      const novos = [...atual.passos];
      novos[index] = val;
      return { ...atual, passos: novos };
    });
  }

  // Carregar presets
  function carregarExemplo() {
    setForm({
      ...EXEMPLO_SMART,
      descricoes: EXEMPLO_SMART.descricoes.map((d) => ({ ...d, subs: [...d.subs] })),
      passos: [...EXEMPLO_SMART.passos],
    });
    setAviso({
      tipo: 'sucesso',
      titulo: 'Exemplo carregado',
      texto: 'Exemplo de caso com dados homologados do Smart carregado!',
    });
  }

  function carregarModeloVazio() {
    setForm({
      ...ESTADO_SMART_VAZIO,
      descricoes: [{ id: String(Date.now()), main: '', subs: [''], img: '' }],
      passos: [''],
    });
    setAviso({
      tipo: 'sucesso',
      titulo: 'Modelo em branco',
      texto: 'Formulário redefinido com estrutura padrão limpa.',
    });
  }

  function limparFormulario() {
    setForm({
      ...ESTADO_SMART_VAZIO,
      descricoes: [],
      passos: [],
    });
    setAviso({
      tipo: 'sucesso',
      titulo: 'Formulário limpo',
      texto: 'Todos os campos foram limpos.',
    });
  }

  // Copiar para clipboard
  async function copiarRelatorio() {
    try {
      await navigator.clipboard.writeText(relatorioMarkdown);
      setAviso({
        tipo: 'sucesso',
        titulo: 'Copiado com sucesso!',
        texto: 'Relatório do Smart copiado para a área de transferência.',
      });
    } catch {
      // Fallback
      setAviso({
        tipo: 'sucesso',
        titulo: 'Relatório pronto',
        texto: 'Selecione o texto e copie manualmente com Ctrl+C.',
      });
    }
  }

  const badgeAdquirente = form.adquirente && ADQUIRENTES_CONFIG[form.adquirente]
    ? `Homologado v${ADQUIRENTES_CONFIG[form.adquirente].versao}`
    : 'Selecione a Adquirência';

  const scoreCorClasse =
    checklist.score <= 40
      ? 'score-danger'
      : checklist.score <= 75
        ? 'score-warning'
        : 'score-success';

  return (
    <div className="smart-page">
      <PageHeader
        breadcrumb="Padronização de Casos"
        titulo="Softcom Smart"
        subtitulo="Padronização de Casos & Registro de Erros Smart"
        acoes={
          <div className="smart-actions-header">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={carregarModeloVazio}
              title="Gerar modelo em branco"
            >
              📄 Modelo Vazio
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm highlight-spark"
              onClick={carregarExemplo}
              title="Carregar exemplo padrão"
            >
              ✨ Carregar Exemplo Modelo
            </button>
            <button
              type="button"
              className="btn btn-danger-soft btn-sm"
              onClick={limparFormulario}
              title="Limpar formulário"
            >
              🗑 Limpar
            </button>
          </div>
        }
      />

      {/* STATUS BAR & QUALITY SCORE */}
      <div className="smart-status-bar">
        <div className="smart-status-info">
          <span className="smart-info-icon" aria-hidden="true">ℹ</span>
          <span>
            Produto fixado como <strong>Smart</strong>. Os dispositivos são filtrados dinamicamente pela adquirência.
          </span>
        </div>

        <div className="smart-quality-box">
          <span className="smart-quality-label">Qualidade do Chamado:</span>
          <div className="smart-progress-track">
            <div
              className={`smart-progress-fill ${scoreCorClasse}`}
              style={{ width: `${checklist.score}%` }}
            />
          </div>
          <span className={`smart-quality-score ${scoreCorClasse}`}>
            {checklist.score}%
          </span>
        </div>
      </div>

      <div className="smart-layout">
        {/* LEFT COLUMN: FORM */}
        <div className="smart-form-col">
          {/* 1. IDENTIFICAÇÃO DO CLIENTE */}
          <section className="smart-panel">
            <div className="smart-panel-header">
              <div className="smart-step-num num-cyan">1</div>
              <div>
                <h2 className="smart-panel-title">
                  <span className="smart-panel-icon" aria-hidden="true">💳</span>
                  Identificação do Cliente
                </h2>
                <p className="smart-panel-desc">Informações da conta e acesso ao ambiente</p>
              </div>
            </div>

            <div className="smart-grid-2">
              <div>
                <label className="smart-label" htmlFor="smart-registro">
                  Registro <span className="req">*</span>
                </label>
                <div className="client-input-wrap">
                  <span className="client-input-prefix" aria-hidden="true">Nº</span>
                  <input
                    id="smart-registro"
                    type="text"
                    inputMode="numeric"
                    placeholder="Ex: 65190"
                    value={form.registro}
                    onChange={(e) => alterar('registro', e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              <div>
                <label className="smart-label" htmlFor="smart-nome">
                  Nome do Cliente
                </label>
                <input
                  id="smart-nome"
                  type="text"
                  placeholder="Ex: Mercado Silva LTDA"
                  value={form.nome}
                  onChange={(e) => alterar('nome', e.target.value)}
                />
              </div>

              <div>
                <label className="smart-label" htmlFor="smart-link-cliente">
                  Link do Sistema
                </label>
                <input
                  id="smart-link-cliente"
                  type="url"
                  placeholder="Ex: https://exemplo.meusoftcom.com.br/"
                  value={form.linkCliente}
                  onChange={(e) => alterar('linkCliente', e.target.value)}
                />
              </div>

              <div>
                <label className="smart-label" htmlFor="smart-cnpj">
                  CNPJ (quando necessário)
                </label>
                <input
                  id="smart-cnpj"
                  type="text"
                  placeholder="Ex: 00.000.000/0001-00"
                  value={form.cnpj}
                  onChange={(e) => alterar('cnpj', e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* 2. DISPOSITIVO & ADQUIRÊNCIA SMART */}
          <section className="smart-panel smart-panel-highlight">
            <div className="smart-panel-header justify-between">
              <div className="flex items-center gap-3">
                <div className="smart-step-num num-cyan">2</div>
                <div>
                  <h2 className="smart-panel-title">
                    <span className="smart-panel-icon" aria-hidden="true">📱</span>
                    Dispositivo & Adquirência Smart
                  </h2>
                  <p className="smart-panel-desc">Modelos vinculados diretamente à homologação da adquirente</p>
                </div>
              </div>
              <span className={`smart-badge-homologado ${form.adquirente ? 'active' : ''}`}>
                {badgeAdquirente}
              </span>
            </div>

            <div className="smart-grid-2">
              <div>
                <label className="smart-label" htmlFor="smart-adquirente">
                  Adquirência <span className="req">*</span>
                </label>
                <select
                  id="smart-adquirente"
                  value={form.adquirente}
                  onChange={(e) => handleAdquirenteChange(e.target.value)}
                >
                  <option value="">Selecione a adquirência...</option>
                  {Object.keys(ADQUIRENTES_CONFIG).map((adq) => (
                    <option key={adq} value={adq}>
                      {adq}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="smart-label" htmlFor="smart-versao">
                  Versão Atual <span className="req">*</span>
                </label>
                <input
                  id="smart-versao"
                  type="text"
                  className="font-mono"
                  placeholder="Ex: 8.0.0.0"
                  value={form.versao}
                  onChange={(e) => alterar('versao', e.target.value)}
                />
              </div>

              <div>
                <label className="smart-label" htmlFor="smart-conexao">
                  Conexão <span className="req">*</span>
                </label>
                <select
                  id="smart-conexao"
                  value={form.conexao}
                  onChange={(e) => alterar('conexao', e.target.value)}
                >
                  <option value="">Selecione o tipo de conexão...</option>
                  {CONEXOES_SMART.map((con) => (
                    <option key={con} value={con}>
                      {con}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="smart-label" htmlFor="smart-modelo">
                  Modelo do Dispositivo <span className="req">*</span>
                </label>
                <select
                  id="smart-modelo"
                  value={form.modelo}
                  onChange={(e) => alterar('modelo', e.target.value)}
                >
                  <option value="">
                    {form.adquirente
                      ? 'Selecione o modelo homologado...'
                      : 'Selecione a adquirência primeiro...'}
                  </option>
                  {modelosDisponiveis.map((mod) => (
                    <option key={mod} value={mod}>
                      {mod}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* 3. LINHA DE CABEÇALHO (SMART) */}
          <section className="smart-panel">
            <div className="smart-panel-header">
              <div className="smart-step-num num-blue">3</div>
              <div>
                <h2 className="smart-panel-title">
                  <span className="smart-panel-icon" aria-hidden="true">📌</span>
                  Linha de Cabeçalho (Smart)
                </h2>
                <p className="smart-panel-desc">Formato: Smart &gt; Caminho em tela: descrição resumida</p>
              </div>
            </div>

            <div className="smart-grid-2">
              <div>
                <label className="smart-label">Produto</label>
                <input
                  type="text"
                  value="Smart"
                  readOnly
                  disabled
                  className="input-readonly-accent"
                />
              </div>

              <div>
                <label className="smart-label" htmlFor="smart-caminho">
                  Caminho em Tela no Smart <span className="req">*</span>
                </label>
                <input
                  id="smart-caminho"
                  type="text"
                  placeholder="Ex: Mesas>Comanda>Lançamento de Itens"
                  value={form.caminho}
                  onChange={(e) => alterar('caminho', e.target.value)}
                />
              </div>

              <div className="col-span-2">
                <div className="smart-label-row">
                  <label className="smart-label" htmlFor="smart-resumo">
                    Descrição Resumida (máx. 180 caracteres) <span className="req">*</span>
                  </label>
                  <span
                    className={`smart-char-counter ${
                      form.resumo.length > 180 ? 'counter-danger' : ''
                    }`}
                  >
                    {form.resumo.length} / 180
                  </span>
                </div>
                <input
                  id="smart-resumo"
                  type="text"
                  maxLength={180}
                  placeholder="Ex: Ao selecionar observação personalizada no produto, o app do Smart fecha abruptamente."
                  value={form.resumo}
                  onChange={(e) => alterar('resumo', e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* 4. DESCRIÇÃO DETALHADA */}
          <section className="smart-panel">
            <div className="smart-panel-header justify-between">
              <div className="flex items-center gap-3">
                <div className="smart-step-num num-indigo">4</div>
                <div>
                  <h2 className="smart-panel-title">
                    <span className="smart-panel-icon" aria-hidden="true">📝</span>
                    Descrição Detalhada
                  </h2>
                  <p className="smart-panel-desc">Estrutura de itens: 1 -, 1.1 -, 1.2 -, etc.</p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={addDescGroup}
              >
                + Add Item Principal
              </button>
            </div>

            <div className="smart-desc-list">
              {form.descricoes.map((group, gIdx) => (
                <div className="smart-desc-item" key={group.id || gIdx}>
                  <div className="smart-desc-row-main">
                    <span className="smart-desc-index">{gIdx + 1} -</span>
                    <input
                      type="text"
                      className="smart-desc-input-main"
                      placeholder="Descrição do ponto principal"
                      value={group.main}
                      onChange={(e) => updateMainDesc(gIdx, e.target.value)}
                    />
                    <button
                      type="button"
                      className="smart-btn-icon danger"
                      onClick={() => removeDescGroup(gIdx)}
                      title="Remover Item"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Subpassos */}
                  <div className="smart-desc-subs">
                    {group.subs.map((sub, sIdx) => (
                      <div className="smart-desc-row-sub" key={sIdx}>
                        <span className="smart-desc-sub-index">
                          {gIdx + 1}.{sIdx + 1} -
                        </span>
                        <input
                          type="text"
                          className="smart-desc-input-sub"
                          placeholder="Subpasso (ex: Ações > Converter Unidades)"
                          value={sub}
                          onChange={(e) => updateSubDesc(gIdx, sIdx, e.target.value)}
                        />
                        <button
                          type="button"
                          className="smart-btn-icon sub-remove"
                          onClick={() => removeSubDesc(gIdx, sIdx)}
                          title="Remover Subpasso"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    <div className="smart-desc-add-sub">
                      <button
                        type="button"
                        className="smart-btn-link"
                        onClick={() => addSubDesc(gIdx)}
                      >
                        + Adicionar Subpasso ({gIdx + 1}.{group.subs.length + 1})
                      </button>
                    </div>
                  </div>

                  {/* Imagem do ponto */}
                  <div className="smart-desc-img-row">
                    <label className="smart-sublabel">
                      🖼 Imagem deste ponto (Markdown ![](URL) opcional):
                    </label>
                    <input
                      type="text"
                      className="smart-input-xs font-mono"
                      placeholder="https://hedgedoc.softhubs.com.br/uploads/..."
                      value={group.img}
                      onChange={(e) => updateImgDesc(gIdx, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 5. PASSOS A REPRODUZIR */}
          <section className="smart-panel">
            <div className="smart-panel-header justify-between">
              <div className="flex items-center gap-3">
                <div className="smart-step-num num-emerald">5</div>
                <div>
                  <h2 className="smart-panel-title">
                    <span className="smart-panel-icon" aria-hidden="true">🔢</span>
                    Passos a Reproduzir no Smart
                  </h2>
                  <p className="smart-panel-desc">Passos sequenciais curtos (1-, 2-, ...)</p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={addStep}
              >
                + Add Passo
              </button>
            </div>

            <div className="smart-steps-list">
              {form.passos.map((passo, pIdx) => (
                <div className="smart-step-row" key={pIdx}>
                  <span className="smart-step-index">{pIdx + 1}-</span>
                  <input
                    type="text"
                    placeholder={`Descreva o passo ${pIdx + 1}`}
                    value={passo}
                    onChange={(e) => updateStep(pIdx, e.target.value)}
                  />
                  <button
                    type="button"
                    className="smart-btn-icon danger"
                    onClick={() => removeStep(pIdx)}
                    title="Remover Passo"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* 6. EVIDÊNCIAS & ANEXOS */}
          <section className="smart-panel">
            <div className="smart-panel-header">
              <div className="smart-step-num num-purple">6</div>
              <div>
                <h2 className="smart-panel-title">
                  <span className="smart-panel-icon" aria-hidden="true">📎</span>
                  Evidências & Anexos
                </h2>
                <p className="smart-panel-desc">Links de prints, vídeos e registros de conversa</p>
              </div>
            </div>

            <div className="smart-grid-2">
              <div className="col-span-2">
                <label className="smart-label" htmlFor="smart-hedgedoc">
                  🔗 Link do HedgeDoc / Servidor de Retaguarda
                </label>
                <input
                  id="smart-hedgedoc"
                  type="url"
                  placeholder="Ex: https://hedgedoc.softhubs.com.br/..."
                  value={form.linkHedgedoc}
                  onChange={(e) => alterar('linkHedgedoc', e.target.value)}
                />
              </div>

              <div>
                <label className="smart-label" htmlFor="smart-print">
                  🖼 [Print] Link do Print da Tela
                </label>
                <input
                  id="smart-print"
                  type="text"
                  placeholder="Link do print"
                  value={form.linkPrint}
                  onChange={(e) => alterar('linkPrint', e.target.value)}
                />
              </div>

              <div>
                <label className="smart-label" htmlFor="smart-video">
                  🎥 [Vídeo] Gravação da Operação
                </label>
                <input
                  id="smart-video"
                  type="text"
                  placeholder="Link do vídeo gravado"
                  value={form.linkVideo}
                  onChange={(e) => alterar('linkVideo', e.target.value)}
                />
              </div>

              <div>
                <label className="smart-label" htmlFor="smart-arquivo">
                  📁 [Arquivo] Log / Arquivo Anexo
                </label>
                <input
                  id="smart-arquivo"
                  type="text"
                  placeholder="Link do arquivo no Discord"
                  value={form.linkArquivo}
                  onChange={(e) => alterar('linkArquivo', e.target.value)}
                />
              </div>

              <div>
                <label className="smart-label" htmlFor="smart-discord">
                  💬 Thread de Conversa no Discord
                </label>
                <input
                  id="smart-discord"
                  type="text"
                  placeholder="Ex: Discord: #smart-mobile > caso-obs-fechando"
                  value={form.linkDiscord}
                  onChange={(e) => alterar('linkDiscord', e.target.value)}
                />
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: PREVIEW & CHECKLIST */}
        <div className="smart-preview-col">
          <div className="smart-sticky-panel">
            {/* RELATÓRIO SMART FORMATADO */}
            <div className="smart-panel smart-panel-preview">
              <div className="smart-panel-header justify-between">
                <div className="flex items-center gap-2">
                  <span className="smart-md-badge" aria-hidden="true">M↓</span>
                  <h3 className="smart-panel-subtitle">Relatório Smart Formatado</h3>
                </div>
                <span className="smart-badge-pattern">Padrão Equipe</span>
              </div>

              <p className="smart-preview-hint">
                Pronto para envio nos chamados e tickets do time:
              </p>

              <div className="smart-output-wrap">
                <textarea
                  className="smart-output-textarea"
                  readOnly
                  rows={18}
                  value={relatorioMarkdown}
                  aria-label="Relatório Smart Formatado"
                  onFocus={(e) => e.target.select()}
                />

                <button
                  type="button"
                  className="btn btn-primary smart-copy-btn"
                  onClick={copiarRelatorio}
                >
                  📋 Copiar Relatório do Smart
                </button>
              </div>
            </div>

            {/* CHECKLIST DE VALIDAÇÃO */}
            <div className="smart-panel smart-checklist-panel">
              <h4 className="smart-checklist-title">
                <span className="smart-checklist-icon" aria-hidden="true">✔</span>
                Validação do Caso Smart
              </h4>

              <ul className="smart-checklist-items">
                <li className={`smart-chk-item ${checklist.hasCliente ? 'valid' : ''}`}>
                  <span className="smart-chk-icon">{checklist.hasCliente ? '✓' : '✗'}</span>
                  Registro do Cliente
                </li>
                <li className={`smart-chk-item ${checklist.hasDevice ? 'valid' : ''}`}>
                  <span className="smart-chk-icon">{checklist.hasDevice ? '✓' : '✗'}</span>
                  Adquirente, Versão, Conexão e Modelo
                </li>
                <li className={`smart-chk-item ${checklist.hasCaminho ? 'valid' : ''}`}>
                  <span className="smart-chk-icon">{checklist.hasCaminho ? '✓' : '✗'}</span>
                  Cabeçalho Smart &gt; Caminho: Resumo
                </li>
                <li className={`smart-chk-item ${checklist.resumoValid ? 'valid' : ''}`}>
                  <span className="smart-chk-icon">{checklist.resumoValid ? '✓' : '✗'}</span>
                  Resumo dentro do limite (≤ 180 chars)
                </li>
                <li className={`smart-chk-item ${checklist.descValid ? 'valid' : ''}`}>
                  <span className="smart-chk-icon">{checklist.descValid ? '✓' : '✗'}</span>
                  Descrição com itens 1 - e 1.1 -
                </li>
                <li className={`smart-chk-item ${checklist.stepsValid ? 'valid' : ''}`}>
                  <span className="smart-chk-icon">{checklist.stepsValid ? '✓' : '✗'}</span>
                  Passos a reproduzir (1-, 2-)
                </li>
                <li className={`smart-chk-item ${checklist.evidValid ? 'valid' : ''}`}>
                  <span className="smart-chk-icon">{checklist.evidValid ? '✓' : '✗'}</span>
                  Evidência anexada (Print/Vídeo/Discord)
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {aviso ? <Toast aviso={aviso} onFechar={() => setAviso(null)} /> : null}
    </div>
  );
}
