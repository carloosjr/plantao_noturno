# Plantão Noturno

Módulo para **registrar e analisar a origem das demandas** recebidas pela equipe de suporte durante o plantão.

O objetivo não é acompanhar a resolução de chamados: não há status, SLA, prioridade, causa raiz ou encerramento.
O módulo documenta apenas *qual demanda chegou, de qual cliente, para qual técnico do plantão, de onde ela veio,
qual o tipo e se é recorrente*.

## Stack

| Camada    | Tecnologia                                              |
| --------- | ------------------------------------------------------- |
| Frontend  | React 18 + TypeScript + Vite + React Router              |
| API       | Funções serverless da Vercel (`/api`)                    |
| Banco     | PostgreSQL (Supabase — projeto **Service Desk Chat**)    |
| Deploy    | Vercel                                                   |

Não há login nem identificação de usuário. O menu lateral tem duas seções:

- **Origem das demandas** — Registrar continuações e Demandas registradas (Painel do plantão existe
  mas está oculto do menu).
- **Plantão ao vivo** — Acompanhamento, Produtividade, Validação de agenda e Fechamento: checklist e
  saúde do turno em andamento (19h–22h), com estado compartilhado por um único registro de "turno"
  por dia.

## Estrutura

```
api/
  _lib/                          utilitários de servidor (cliente Supabase, helpers HTTP)
  night-shift-demands/
    index.ts                     POST e GET /api/night-shift-demands
    dashboard.ts                 GET  /api/night-shift-demands/dashboard
  plantao-acompanhamento/        endpoints do checklist/turno (ver API REST)
shared/
  domain.ts                      tipos, opções e validação do módulo de demandas
  acompanhamento.ts               tipos e validação do módulo de acompanhamento
src/
  components/                    componentes reutilizáveis (cards, barras, donut, tabela, drawer…)
  lib/                           cliente da API, período, formatação e CSV
    acompanhamento/               dados fixos, cálculo de saúde, cliente da API e o Context/Provider
  pages/                         Painel, Registrar continuações, Demandas registradas, Acompanhamento,
                                  Produtividade, Validação de agenda, Fechamento
supabase/migrations/             schema do banco
prototipo/                       protótipos HTML originais (referência visual, fora do build)
```

## Banco de dados

Todos os objetos usam o prefixo `plantaonoturno_`:

- **`plantaonoturno_demandas`** — tabela de registros.
  - Índices em `created_at`, `cliente_registro`, `tecnico_plantao`, `origem`, `tipo_demanda`, `recorrente`
    (mais índices parciais em `tecnico_anterior` e `grupo_whatsapp`).
  - `check` garante que campos incompatíveis com a origem nunca sejam gravados.
  - RLS habilitada **sem policies**: a tabela só é acessível pela API (service role).
- **`plantaonoturno_dashboard(p_start, p_end)`** — resolve todas as agregações do painel no banco,
  em uma única chamada, evitando trazer registros para o navegador.

### Acompanhamento do plantão

Um registro de **turno** por dia (`data date unique`), resolvido pela data local do navegador (o
turno cruza a virada de dia em UTC, então quem decide "qual dia" é sempre o cliente).

- **`plantaonoturno_turnos`** — um registro por dia: checklist (`tarefas_concluidas` jsonb),
  horário real de cada canal (`canais_real` jsonb), contador de ligações (`call_total`) e os dois
  campos do fechamento (`closure_lead`, `closure_notes`).
- **`plantaonoturno_atendimentos_grupo`**, **`plantaonoturno_filas`** — atendimentos em grupos de
  WhatsApp e filas de tickets registrados durante o turno (`inicio`/`fim` no formato `HH:MM`).
- **`plantaonoturno_agenda_indevida`** — OCs que chegaram indevidamente na agenda de Matheus, Osiel
  ou Hercílio (tela "Validação de agenda").
- Mesma política das demais tabelas: RLS habilitada, sem policies, só acessível pela API.
- Updates concorrentes (checklist, canais, contador de ligações) passam por funções SQL
  (`plantaonoturno_definir_tarefa`, `plantaonoturno_definir_canal`,
  `plantaonoturno_incrementar_ligacoes`) que fazem merge/incremento atômico no banco, em vez de
  ler-alterar-gravar a partir do servidor.

Aplicar o schema:

```bash
supabase db push --linked
```

## API REST

### `POST /api/night-shift-demands`

```json
{
  "clienteRegistro": 12345,
  "tecnicoPlantao": "Osiel",
  "origem": "GRUPO_WHATSAPP",
  "grupoWhatsapp": "Magnum",
  "tipoDemanda": "Fiscal",
  "recorrente": false
}
```

Regras aplicadas na API e reforçadas no banco:

| origem            | obrigatórios                | zerados                                            |
| ----------------- | --------------------------- | -------------------------------------------------- |
| `CONTINUACAO`     | `tecnicoAnterior`           | `grupoWhatsapp`                                     |
| `GRUPO_WHATSAPP`  | `grupoWhatsapp`             | `tecnicoAnterior`, `protocoloAnterior`              |
| `CLIENTE_DIRETO`  | —                           | `tecnicoAnterior`, `protocoloAnterior`, `grupoWhatsapp` |

### `GET /api/night-shift-demands`

Filtros: `startDate`, `endDate`, `clienteRegistro`, `tecnicoPlantao`, `origem`, `tipoDemanda`,
`recorrente`, `limit`.

```
GET /api/night-shift-demands?tecnicoPlantao=Osiel&origem=GRUPO_WHATSAPP
```

Resposta: `{ "total": 0, "limite": 500, "itens": [] }`

### `GET /api/night-shift-demands/dashboard`

Parâmetros: `startDate`, `endDate`.

```json
{
  "total": 0,
  "continuacoes": 0,
  "gruposWhatsapp": 0,
  "clientesDiretos": 0,
  "recorrentes": 0,
  "cargaHerdadaPercentual": 0,
  "porOrigem": [],
  "porTipo": [],
  "porTecnicoAnterior": [],
  "porGrupoWhatsapp": [],
  "recentes": []
}
```

**Carga herdada** = `continuações ÷ total do período × 100`.

### Acompanhamento do plantão

Todos os endpoints abaixo levam `?data=YYYY-MM-DD` (data local do turno) e resolvem/criam o turno
do dia automaticamente. Base: `/api/plantao-acompanhamento`.

| Endpoint          | Método | Body                                          | Uso                                   |
| ------------------ | ------ | ---------------------------------------------- | -------------------------------------- |
| `/`                 | GET    | —                                               | turno + atendimentos + filas + agenda |
| `/tarefas`          | PATCH  | `{ tarefaId, concluida }`                      | marcar/desmarcar uma tarefa           |
| `/canais`           | PATCH  | `{ canalId, horario }` (`horario: ''` limpa)   | horário real de um canal              |
| `/ligacoes`         | POST   | `{ quantidade }`                               | soma ligações ao contador do turno    |
| `/fechamento`       | PATCH  | `{ closureLead?, closureNotes? }`              | responsável e observações do turno    |
| `/grupos`           | POST / PATCH | `{ nome, inicio }` / `{ id, fim }`       | atendimento em grupo (abrir/encerrar) |
| `/filas`            | POST / PATCH | `{ inicio, quantidade }` / `{ id, fim }` | fila de tickets (abrir/encerrar)      |
| `/agenda`           | POST   | `{ responsavel, oc, horario, evidencia }`      | OC indevida (Validação de agenda)     |

## Variáveis de ambiente

Usadas apenas no servidor (nunca chegam ao navegador):

```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

## Desenvolvimento

```bash
npm install
vercel dev        # sobe front + funções serverless em http://localhost:3000
```

Para trabalhar apenas no front com HMR, rode `npm run dev` em paralelo ao `vercel dev`
(o Vite faz proxy de `/api` para a porta 3000).

```bash
npm run build     # typecheck + build de produção
```
