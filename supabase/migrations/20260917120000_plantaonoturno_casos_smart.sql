-- Módulo "Plantão Noturno" — Gerador de Casos Smart.
-- Registro e padronização dos casos e bugs encontrados na aplicação Smart POS.
-- Todos os objetos usam o prefixo "plantaonoturno_".

create table if not exists public.plantaonoturno_casos_smart (
    id                  uuid primary key default gen_random_uuid(),
    cliente_registro    bigint      not null,
    cliente_nome        text,
    link_cliente        text,
    cnpj                text,

    adquirente          text        not null,
    versao              text        not null,
    conexao             text        not null,
    modelo              text        not null,

    produto             text        not null default 'Smart',
    caminho             text        not null,
    resumo              text        not null,

    descricoes          jsonb       not null default '[]'::jsonb,
    passos              jsonb       not null default '[]'::jsonb,

    link_hedgedoc       text,
    link_print          text,
    link_video          text,
    link_arquivo        text,
    link_discord        text,

    score               integer     not null default 0,
    relatorio_markdown  text        not null,

    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),

    constraint plantaonoturno_casos_smart_cliente_registro_check
        check (cliente_registro > 0),

    constraint plantaonoturno_casos_smart_score_check
        check (score >= 0 and score <= 100)
);

comment on table public.plantaonoturno_casos_smart is
    'Plantão Noturno: casos e bugs de POS gerados e padronizados pelo Gerador de Caso Smart.';

create index if not exists plantaonoturno_casos_smart_created_at_idx
    on public.plantaonoturno_casos_smart (created_at desc);

create index if not exists plantaonoturno_casos_smart_cliente_registro_idx
    on public.plantaonoturno_casos_smart (cliente_registro);

create index if not exists plantaonoturno_casos_smart_adquirente_idx
    on public.plantaonoturno_casos_smart (adquirente);

-- Mesma política das demais tabelas do módulo: RLS habilitada, sem policies públicas —
-- só acessível pela API (service role).
alter table public.plantaonoturno_casos_smart enable row level security;
