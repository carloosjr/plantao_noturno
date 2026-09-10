-- Módulo "Plantão Noturno" — Acompanhamento do plantão.
-- Ligações da central deixam de ser só um contador (plantaonoturno_turnos.call_total)
-- e passam a ter um registro por lançamento, para permitir excluir um lançamento
-- específico (mesmo padrão de atendimentos em grupo e filas). O total passa a ser
-- a soma dos lançamentos; a coluna call_total fica sem uso (não é removida para
-- evitar uma migração destrutiva numa tabela em produção).

create table if not exists public.plantaonoturno_ligacoes (
    id          uuid primary key default gen_random_uuid(),
    turno_id    uuid        not null references public.plantaonoturno_turnos (id) on delete cascade,
    quantidade  integer     not null,
    created_at  timestamptz not null default now(),

    constraint plantaonoturno_ligacoes_quantidade_check check (quantidade > 0)
);

comment on table public.plantaonoturno_ligacoes is
    'Plantão Noturno: lançamentos de ligações recebidas na central durante o turno.';

create index if not exists plantaonoturno_ligacoes_turno_id_idx
    on public.plantaonoturno_ligacoes (turno_id);

alter table public.plantaonoturno_ligacoes enable row level security;
