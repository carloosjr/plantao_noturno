import { useState } from 'react';
import { GRUPOS_WHATSAPP } from '../../shared/domain';
import { CANAIS, TAREFAS } from '../lib/acompanhamento/data';
import { calcularSaude } from '../lib/acompanhamento/health';
import { useAcompanhamento } from '../lib/acompanhamento/store';
import type { TarefaDef } from '../lib/acompanhamento/types';
import ChannelCard from '../components/ChannelCard';
import HealthGauge from '../components/HealthGauge';
import PageHeader from '../components/PageHeader';
import TimedLogList from '../components/TimedLogList';

function TimelineItem({ tarefa, concluida, onAlternar }: { tarefa: TarefaDef; concluida: boolean; onAlternar(): void }) {
  const badgeTexto = tarefa.continua
    ? concluida
      ? 'Monitorando'
      : 'Não iniciado'
    : concluida
      ? 'Concluída'
      : 'Pendente';

  return (
    <div className={`tl-item${concluida ? ' done' : ''}${tarefa.continua ? ' continuous' : ''}`}>
      <input
        type="checkbox"
        className={`tl-check${tarefa.continua ? ' toggle' : ''}`}
        checked={concluida}
        onChange={onAlternar}
        aria-label={tarefa.titulo}
      />
      <div className="tl-line" />
      <div className="tl-body">
        <div className="tl-time">{tarefa.horario}</div>
        <div className="tl-title">
          {tarefa.titulo}
          {tarefa.continua ? <span className="tl-tag">Contínua</span> : null}
        </div>
        <div className="tl-desc">{tarefa.descricao}</div>
        <span className={`tl-badge ${concluida ? 'done' : 'pending'}`}>{badgeTexto}</span>
      </div>
    </div>
  );
}

export default function AcompanhamentoPage() {
  const {
    state,
    alternarTarefa,
    definirHorarioCanal,
    iniciarAtendimentoGrupo,
    finalizarAtendimentoGrupo,
    iniciarFila,
    finalizarFila,
    registrarLigacoes,
  } = useAcompanhamento();

  const saude = calcularSaude(state);

  const [nomeGrupo, setNomeGrupo] = useState('');
  const [inicioGrupo, setInicioGrupo] = useState('');
  const [inicioFila, setInicioFila] = useState('');
  const [quantidadeFila, setQuantidadeFila] = useState('');
  const [quantidadeLigacoes, setQuantidadeLigacoes] = useState('');

  function adicionarAtendimentoGrupo() {
    if (!nomeGrupo.trim() || !inicioGrupo) return;
    iniciarAtendimentoGrupo(nomeGrupo.trim(), inicioGrupo);
    setNomeGrupo('');
    setInicioGrupo('');
  }

  function adicionarFila() {
    const quantidade = parseInt(quantidadeFila, 10);
    if (!inicioFila || !quantidade || quantidade < 1) return;
    iniciarFila(inicioFila, quantidade);
    setInicioFila('');
    setQuantidadeFila('');
  }

  function adicionarLigacoes() {
    const quantidade = parseInt(quantidadeLigacoes, 10);
    if (!quantidade || quantidade < 1) return;
    registrarLigacoes(quantidade);
    setQuantidadeLigacoes('');
  }

  return (
    <>
      <PageHeader breadcrumb="Acompanhamento" titulo="Acompanhamento" subtitulo="Marque cada etapa conforme for concluída" />

      <HealthGauge
        score={saude.overall}
        tier={saude.tier}
        titulo="Saúde do plantão"
        breakdown={[
          { label: 'Tarefas concluídas', valor: `${saude.doneTasks}/${saude.totalTasks}` },
          { label: 'Canais em atraso', valor: `${saude.lateChannels}/${saude.totalChannels}` },
        ]}
      />

      <p className="section-title">Tarefas</p>
      <div className="timeline">
        {TAREFAS.map((tarefa) => (
          <TimelineItem
            key={tarefa.id}
            tarefa={tarefa}
            concluida={state.tarefasConcluidas[tarefa.id]}
            onAlternar={() => alternarTarefa(tarefa.id)}
          />
        ))}
      </div>

      <p className="section-title">Canais</p>
      <div className="channels">
        {CANAIS.map((canal) => (
          <ChannelCard
            key={canal.id}
            canal={canal}
            valor={state.canaisReal[canal.id]}
            onChange={(valor) => definirHorarioCanal(canal.id, valor)}
          />
        ))}
      </div>

      <p className="section-title">Atendimentos em grupos</p>
      <div className="log-card">
        <div className="log-form">
          <select
            className="log-input log-name"
            aria-label="Grupo de WhatsApp"
            value={nomeGrupo}
            onChange={(e) => setNomeGrupo(e.target.value)}
          >
            <option value="" disabled>
              Selecione o grupo
            </option>
            {GRUPOS_WHATSAPP.map((grupo) => (
              <option key={grupo} value={grupo}>
                {grupo}
              </option>
            ))}
          </select>
          <input
            type="time"
            className="log-input log-time"
            aria-label="Horário de início"
            value={inicioGrupo}
            onChange={(e) => setInicioGrupo(e.target.value)}
          />
          <button type="button" className="btn" onClick={adicionarAtendimentoGrupo}>
            Registrar início
          </button>
        </div>
        <TimedLogList
          itens={state.groupLogs}
          vazioTexto="Nenhum atendimento registrado"
          renderTitulo={(log) => log.nome}
          onFinalizar={finalizarAtendimentoGrupo}
        />
      </div>

      <p className="section-title">Filas</p>
      <div className="log-card">
        <div className="log-form">
          <input
            type="time"
            className="log-input log-time"
            aria-label="Horário de início da fila"
            value={inicioFila}
            onChange={(e) => setInicioFila(e.target.value)}
          />
          <input
            type="number"
            className="log-input log-number"
            placeholder="Tickets em fila"
            min={1}
            value={quantidadeFila}
            onChange={(e) => setQuantidadeFila(e.target.value)}
          />
          <button type="button" className="btn" onClick={adicionarFila}>
            Registrar fila
          </button>
        </div>
        <TimedLogList
          itens={state.queueLogs}
          vazioTexto="Nenhuma fila registrada"
          renderTitulo={(log) => `${log.quantidade} ticket(s) em fila`}
          onFinalizar={finalizarFila}
          rotuloFinalizarBotao="Fila zerou"
          rotuloAberto="Em fila"
          rotuloFechado="Fila zerada"
        />
      </div>

      <p className="section-title">Ligações na central</p>
      <div className="log-card">
        <div className="log-form">
          <input
            type="number"
            className="log-input log-number"
            placeholder="Quantidade"
            min={1}
            value={quantidadeLigacoes}
            onChange={(e) => setQuantidadeLigacoes(e.target.value)}
          />
          <button type="button" className="btn" onClick={adicionarLigacoes}>
            Adicionar
          </button>
          <span className="call-counter">
            <span>{state.callTotal}</span> ligações
          </span>
        </div>
      </div>
    </>
  );
}
