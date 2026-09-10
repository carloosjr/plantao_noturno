-- Módulo "Plantão Noturno" — Acompanhamento do plantão (checklist, canais,
-- atendimentos em grupo, filas, ligações e validação de agenda).
-- Todos os objetos usam o prefixo "plantaonoturno_".

create table if not exists public.plantaonoturno_turnos (
    id                  uuid primary key default gen_random_uuid(),
    data                date        not null unique,
    tarefas_concluidas  jsonb       not null default '{}'::jsonb,
    canais_real         jsonb       not null default '{}'::jsonb,
    call_total          integer     not null default 0,
    closure_lead        text,
    closure_notes       text,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),

    constraint plantaonoturno_turnos_call_total_check
        check (call_total >= 0)
);

comment on table public.plantaonoturno_turnos is
    'Plantão Noturno: um registro por dia de plantão (checklist, canais, contadores e fechamento).';

create table if not exists public.plantaonoturno_atendimentos_grupo (
    id          uuid primary key default gen_random_uuid(),
    turno_id    uuid        not null references public.plantaonoturno_turnos (id) on delete cascade,
    nome        text        not null,
    inicio      text        not null,
    fim         text,
    created_at  timestamptz not null default now(),

    constraint plantaonoturno_atendimentos_grupo_inicio_check
        check (inicio ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
    constraint plantaonoturno_atendimentos_grupo_fim_check
        check (fim is null or fim ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
);

comment on table public.plantaonoturno_atendimentos_grupo is
    'Plantão Noturno: atendimentos em grupos de WhatsApp registrados durante o turno.';

create table if not exists public.plantaonoturno_filas (
    id          uuid primary key default gen_random_uuid(),
    turno_id    uuid        not null references public.plantaonoturno_turnos (id) on delete cascade,
    inicio      text        not null,
    quantidade  integer     not null,
    fim         text,
    created_at  timestamptz not null default now(),

    constraint plantaonoturno_filas_quantidade_check check (quantidade > 0),
    constraint plantaonoturno_filas_inicio_check
        check (inicio ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
    constraint plantaonoturno_filas_fim_check
        check (fim is null or fim ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
);

comment on table public.plantaonoturno_filas is
    'Plantão Noturno: filas de tickets registradas durante o turno.';

create table if not exists public.plantaonoturno_agenda_indevida (
    id           uuid primary key default gen_random_uuid(),
    turno_id     uuid        not null references public.plantaonoturno_turnos (id) on delete cascade,
    responsavel  text        not null,
    oc           text        not null,
    horario      text        not null,
    evidencia    text,
    created_at   timestamptz not null default now(),

    constraint plantaonoturno_agenda_indevida_responsavel_check
        check (responsavel in ('Matheus', 'Osiel', 'Hercílio')),
    constraint plantaonoturno_agenda_indevida_horario_check
        check (horario ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
);

comment on table public.plantaonoturno_agenda_indevida is
    'Plantão Noturno: OCs que chegaram indevidamente na agenda de Matheus, Osiel ou Hercílio.';

create index if not exists plantaonoturno_atendimentos_grupo_turno_id_idx
    on public.plantaonoturno_atendimentos_grupo (turno_id);
create index if not exists plantaonoturno_filas_turno_id_idx
    on public.plantaonoturno_filas (turno_id);
create index if not exists plantaonoturno_agenda_indevida_turno_id_idx
    on public.plantaonoturno_agenda_indevida (turno_id);
create index if not exists plantaonoturno_agenda_indevida_responsavel_idx
    on public.plantaonoturno_agenda_indevida (responsavel);

-- Mesma política das demais tabelas do módulo: RLS habilitada, sem policies —
-- só acessível pela API (service role).
alter table public.plantaonoturno_turnos enable row level security;
alter table public.plantaonoturno_atendimentos_grupo enable row level security;
alter table public.plantaonoturno_filas enable row level security;
alter table public.plantaonoturno_agenda_indevida enable row level security;

-- Resolve (ou cria) o turno do dia. Idempotente: chamado em toda leitura/escrita.
create or replace function public.plantaonoturno_obter_turno(p_data date)
returns public.plantaonoturno_turnos
language sql
set search_path = public
as $function$
    insert into public.plantaonoturno_turnos (data)
    values (p_data)
    on conflict (data) do update set data = excluded.data
    returning *;
$function$;

-- Merge atômico de uma tarefa no jsonb tarefas_concluidas (evita race condition
-- entre técnicos marcando tarefas diferentes ao mesmo tempo).
create or replace function public.plantaonoturno_definir_tarefa(
    p_turno_id uuid,
    p_tarefa_id text,
    p_concluida boolean
)
returns jsonb
language sql
set search_path = public
as $function$
    update public.plantaonoturno_turnos
       set tarefas_concluidas = tarefas_concluidas || jsonb_build_object(p_tarefa_id, p_concluida),
           updated_at = now()
     where id = p_turno_id
    returning tarefas_concluidas;
$function$;

-- Merge atômico de um canal no jsonb canais_real.
create or replace function public.plantaonoturno_definir_canal(
    p_turno_id uuid,
    p_canal_id text,
    p_horario text
)
returns jsonb
language sql
set search_path = public
as $function$
    update public.plantaonoturno_turnos
       set canais_real = canais_real || jsonb_build_object(p_canal_id, p_horario),
           updated_at = now()
     where id = p_turno_id
    returning canais_real;
$function$;

-- Incremento atômico do contador de ligações.
create or replace function public.plantaonoturno_incrementar_ligacoes(
    p_turno_id uuid,
    p_quantidade integer
)
returns integer
language sql
set search_path = public
as $function$
    update public.plantaonoturno_turnos
       set call_total = call_total + p_quantidade,
           updated_at = now()
     where id = p_turno_id
    returning call_total;
$function$;

revoke all on function public.plantaonoturno_obter_turno(date) from public;
revoke all on function public.plantaonoturno_definir_tarefa(uuid, text, boolean) from public;
revoke all on function public.plantaonoturno_definir_canal(uuid, text, text) from public;
revoke all on function public.plantaonoturno_incrementar_ligacoes(uuid, integer) from public;

grant execute on function public.plantaonoturno_obter_turno(date) to service_role;
grant execute on function public.plantaonoturno_definir_tarefa(uuid, text, boolean) to service_role;
grant execute on function public.plantaonoturno_definir_canal(uuid, text, text) to service_role;
grant execute on function public.plantaonoturno_incrementar_ligacoes(uuid, integer) to service_role;
