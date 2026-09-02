import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GRUPOS_WHATSAPP,
  ORIGEM_LABEL,
  ORIGENS,
  TECNICOS_PLANTAO,
  TIPOS_DEMANDA,
  validarDemanda,
  type Origem,
} from '../../shared/domain';
import { ApiError, registrarDemanda } from '../lib/api';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import Toast, { type Aviso } from '../components/Toast';

interface EstadoFormulario {
  clienteRegistro: string;
  tecnicoPlantao: string;
  origem: Origem;
  tecnicoAnterior: string;
  protocoloAnterior: string;
  grupoWhatsapp: string;
  tipoDemanda: string;
  recorrente: 'Sim' | 'Não';
}

const ESTADO_INICIAL: EstadoFormulario = {
  clienteRegistro: '',
  tecnicoPlantao: '',
  origem: 'CONTINUACAO',
  tecnicoAnterior: '',
  protocoloAnterior: '',
  grupoWhatsapp: '',
  tipoDemanda: '',
  recorrente: 'Não',
};

function ResumoItem({ icone, rotulo, valor }: { icone: string; rotulo: string; valor: string }) {
  return (
    <div className="summary-item">
      <div className="summary-icon" aria-hidden="true">
        {icone}
      </div>
      <div>
        <div className="summary-label">{rotulo}</div>
        <div className="summary-value">{valor || '—'}</div>
      </div>
    </div>
  );
}

export default function RegistrarPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<EstadoFormulario>(ESTADO_INICIAL);
  const [erros, setErros] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const alterar = <K extends keyof EstadoFormulario>(campo: K, valor: EstadoFormulario[K]) =>
    setForm((atual) => ({ ...atual, [campo]: valor }));

  const trocarOrigem = (origem: Origem) =>
    setForm((atual) => ({
      ...atual,
      origem,
      // Limpa os dados que não pertencem à nova origem.
      tecnicoAnterior: origem === 'CONTINUACAO' ? atual.tecnicoAnterior : '',
      protocoloAnterior: origem === 'CONTINUACAO' ? atual.protocoloAnterior : '',
      grupoWhatsapp: origem === 'GRUPO_WHATSAPP' ? atual.grupoWhatsapp : '',
    }));

  const detalheResumo = useMemo(() => {
    if (form.origem === 'CONTINUACAO') return form.tecnicoAnterior;
    if (form.origem === 'GRUPO_WHATSAPP') return form.grupoWhatsapp;
    return 'Contato direto do cliente';
  }, [form.origem, form.tecnicoAnterior, form.grupoWhatsapp]);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();

    const validacao = validarDemanda({ ...form, recorrente: form.recorrente === 'Sim' });
    if (!validacao.ok) {
      setErros(validacao.erros);
      return;
    }

    setErros([]);
    setEnviando(true);
    try {
      const demanda = await registrarDemanda(validacao.value);
      setForm(ESTADO_INICIAL);
      setAviso({
        tipo: 'sucesso',
        titulo: 'Demanda registrada',
        texto: `Registro ${demanda.clienteRegistro} salvo em ${ORIGEM_LABEL[demanda.origem].toLowerCase()}.`,
      });
    } catch (e) {
      const detalhes = e instanceof ApiError ? e.detalhes : [];
      setErros(detalhes);
      setAviso({
        tipo: 'erro',
        titulo: 'Não foi possível registrar',
        texto: e instanceof Error ? e.message : 'Tente novamente em instantes.',
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <PageHeader
        breadcrumb="Registrar demanda"
        titulo="Novo registro de demanda"
        subtitulo="Registre rapidamente de onde vêm as demandas recebidas pelo plantão."
      />

      <div className="form-layout">
        <form className="stack" onSubmit={enviar} noValidate>
          <Card>
            <div className="grid-2">
              <div>
                <div className="section-title">
                  1. Registro do cliente <span className="req">*</span>
                </div>
                <div className="client-input-wrap">
                  <span className="client-input-prefix" aria-hidden="true">
                    Nº
                  </span>
                  <input
                    id="clienteRegistro"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    autoFocus
                    placeholder="Digite o registro do cliente"
                    aria-label="Registro do cliente"
                    value={form.clienteRegistro}
                    onChange={(e) => alterar('clienteRegistro', e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              <div>
                <div className="section-title">
                  2. Técnico do plantão <span className="req">*</span>
                </div>
                <select
                  id="tecnicoPlantao"
                  aria-label="Técnico do plantão"
                  value={form.tecnicoPlantao}
                  onChange={(e) => alterar('tecnicoPlantao', e.target.value)}
                >
                  <option value="">Selecione o técnico</option>
                  {TECNICOS_PLANTAO.map((tecnico) => (
                    <option key={tecnico} value={tecnico}>
                      {tecnico}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="divider" />

            <div className="section-title">
              3. Origem da demanda <span className="req">*</span>
            </div>
            <div className="origin-grid">
              {ORIGENS.map((origem) => (
                <label className="radio-line" key={origem}>
                  <input
                    type="radio"
                    name="origem"
                    value={origem}
                    checked={form.origem === origem}
                    onChange={() => trocarOrigem(origem)}
                  />
                  {ORIGEM_LABEL[origem]}
                </label>
              ))}
            </div>
          </Card>

          {form.origem === 'CONTINUACAO' ? (
            <Card className="highlight">
              <div className="section-title primary">4. Dados da continuação</div>
              <div className="grid-2">
                <div>
                  <label htmlFor="tecnicoAnterior">
                    Técnico anterior <span className="req">*</span>
                  </label>
                  <input
                    id="tecnicoAnterior"
                    type="text"
                    autoComplete="off"
                    placeholder="Digite o nome do técnico"
                    value={form.tecnicoAnterior}
                    onChange={(e) => alterar('tecnicoAnterior', e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="protocoloAnterior">Protocolo / chamado anterior</label>
                  <input
                    id="protocoloAnterior"
                    type="text"
                    autoComplete="off"
                    placeholder="Ex.: 2026-12345"
                    value={form.protocoloAnterior}
                    onChange={(e) => alterar('protocoloAnterior', e.target.value)}
                  />
                </div>
              </div>
              <div className="hint">ⓘ Use estes dados para identificar de qual atendimento anterior a demanda veio.</div>
            </Card>
          ) : null}

          {form.origem === 'GRUPO_WHATSAPP' ? (
            <Card className="highlight">
              <div className="section-title primary">4. Dados do grupo de WhatsApp</div>
              <label htmlFor="grupoWhatsapp">
                Nome do grupo <span className="req">*</span>
              </label>
              <select
                id="grupoWhatsapp"
                value={form.grupoWhatsapp}
                onChange={(e) => alterar('grupoWhatsapp', e.target.value)}
              >
                <option value="">Selecione o grupo</option>
                {GRUPOS_WHATSAPP.map((grupo) => (
                  <option key={grupo} value={grupo}>
                    {grupo}
                  </option>
                ))}
              </select>
              <div className="hint">ⓘ Informe o grupo que originou a demanda para permitir análise posterior.</div>
            </Card>
          ) : null}

          <Card>
            <div className="section-title">
              5. Tipo da demanda <span className="req">*</span>
            </div>
            <select
              id="tipoDemanda"
              aria-label="Tipo da demanda"
              value={form.tipoDemanda}
              onChange={(e) => alterar('tipoDemanda', e.target.value)}
            >
              <option value="">Selecione o tipo</option>
              {TIPOS_DEMANDA.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>

            <div style={{ height: 16 }} />

            <label>É uma demanda recorrente?</label>
            <div className="radio-wrap">
              {(['Não', 'Sim'] as const).map((opcao) => (
                <label className="radio-line" key={opcao}>
                  <input
                    type="radio"
                    name="recorrente"
                    value={opcao}
                    checked={form.recorrente === opcao}
                    onChange={() => alterar('recorrente', opcao)}
                  />
                  {opcao}
                </label>
              ))}
            </div>
          </Card>

          {erros.length > 0 ? (
            <div className="form-errors" role="alert">
              Revise os campos obrigatórios:
              <ul>
                {erros.map((mensagem) => (
                  <li key={mensagem}>{mensagem}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="footer-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setForm(ESTADO_INICIAL);
                setErros([]);
                navigate('/painel');
              }}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={enviando}>
              {enviando ? 'Registrando…' : '💾 Registrar demanda'}
            </button>
          </div>
        </form>

        <aside className="card summary">
          <h3>Resumo do registro</h3>
          <ResumoItem icone="C" rotulo="Registro do cliente" valor={form.clienteRegistro} />
          <ResumoItem icone="T" rotulo="Técnico do plantão" valor={form.tecnicoPlantao} />
          <ResumoItem icone="O" rotulo="Origem" valor={ORIGEM_LABEL[form.origem]} />
          <ResumoItem icone="D" rotulo="Detalhe da origem" valor={detalheResumo} />
          <ResumoItem icone="T" rotulo="Tipo da demanda" valor={form.tipoDemanda} />
          <div className="summary-note">ⓘ O objetivo é registrar rapidamente o que chegou e de onde veio.</div>
        </aside>
      </div>

      {aviso ? <Toast aviso={aviso} onFechar={() => setAviso(null)} /> : null}
    </>
  );
}
