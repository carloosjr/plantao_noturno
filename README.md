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

Não há login nem identificação de usuário. O menu lateral possui somente três opções:
**Painel do plantão**, **Registrar demanda** e **Demandas registradas**.

## Estrutura

```
api/
  _lib/                          utilitários de servidor (cliente Supabase, helpers HTTP)
  night-shift-demands/
    index.ts                     POST e GET /api/night-shift-demands
    dashboard.ts                 GET  /api/night-shift-demands/dashboard
shared/domain.ts                 tipos, opções e validação usados pelo front e pela API
src/
  components/                    componentes reutilizáveis (cards, barras, donut, tabela, drawer…)
  lib/                           cliente da API, período, formatação e CSV
  pages/                         Painel, Registrar e Demandas registradas
supabase/migrations/             schema do banco
prototipo/                       protótipo HTML original (referência visual, fora do build)
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
