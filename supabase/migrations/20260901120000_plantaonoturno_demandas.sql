-- Módulo "Plantão Noturno"
-- Registro e análise da ORIGEM das demandas recebidas pela equipe de suporte no plantão.
-- Todos os objetos usam o prefixo "plantaonoturno_".

create extension if not exists "pgcrypto";

create table if not exists public.plantaonoturno_demandas (
    id                  uuid primary key default gen_random_uuid(),
    cliente_registro    bigint      not null,
    tecnico_plantao     text        not null,
    origem              text        not null,
    tecnico_anterior    text,
    protocolo_anterior  text,
    grupo_whatsapp      text,
    tipo_demanda        text        not null,
    recorrente          boolean     not null default false,
    created_at          timestamptz not null default now(),

    constraint plantaonoturno_demandas_cliente_registro_check
        check (cliente_registro > 0),

    constraint plantaonoturno_demandas_tecnico_plantao_check
        check (tecnico_plantao in ('Osiel', 'Hercílio', 'Matheus', 'Bezerra')),

    constraint plantaonoturno_demandas_origem_check
        check (origem in ('CONTINUACAO', 'GRUPO_WHATSAPP', 'CLIENTE_DIRETO')),

    constraint plantaonoturno_demandas_tipo_demanda_check
        check (tipo_demanda in (
            'Fiscal',
            'PDV / Caixa',
            'TEF / Pagamentos',
            'Estoque',
            'Financeiro',
            'Banco de dados',
            'Infraestrutura',
            'Implantação',
            'Outro'
        )),

    -- Não permite gravar campos incompatíveis com a origem selecionada.
    constraint plantaonoturno_demandas_origem_coerente_check check (
        case origem
            when 'CONTINUACAO' then
                tecnico_anterior is not null
                and btrim(tecnico_anterior) <> ''
                and grupo_whatsapp is null
            when 'GRUPO_WHATSAPP' then
                grupo_whatsapp is not null
                and btrim(grupo_whatsapp) <> ''
                and tecnico_anterior is null
                and protocolo_anterior is null
            when 'CLIENTE_DIRETO' then
                tecnico_anterior is null
                and protocolo_anterior is null
                and grupo_whatsapp is null
            else false
        end
    )
);

comment on table public.plantaonoturno_demandas is
    'Plantão Noturno: entrada de demandas recebidas pelo plantão (sem fluxo de resolução).';

-- Índices exigidos pelos filtros e pelo painel.
create index if not exists plantaonoturno_demandas_created_at_idx
    on public.plantaonoturno_demandas (created_at desc);
create index if not exists plantaonoturno_demandas_cliente_registro_idx
    on public.plantaonoturno_demandas (cliente_registro);
create index if not exists plantaonoturno_demandas_tecnico_plantao_idx
    on public.plantaonoturno_demandas (tecnico_plantao);
create index if not exists plantaonoturno_demandas_origem_idx
    on public.plantaonoturno_demandas (origem);
create index if not exists plantaonoturno_demandas_tipo_demanda_idx
    on public.plantaonoturno_demandas (tipo_demanda);
create index if not exists plantaonoturno_demandas_recorrente_idx
    on public.plantaonoturno_demandas (recorrente);
create index if not exists plantaonoturno_demandas_tecnico_anterior_idx
    on public.plantaonoturno_demandas (tecnico_anterior)
    where tecnico_anterior is not null;
create index if not exists plantaonoturno_demandas_grupo_whatsapp_idx
    on public.plantaonoturno_demandas (grupo_whatsapp)
    where grupo_whatsapp is not null;

-- A tabela é acessada exclusivamente pela API (service role), que ignora RLS.
-- Sem policies, nenhuma chave pública consegue ler ou gravar.
alter table public.plantaonoturno_demandas enable row level security;

-- Agregações do painel resolvidas no banco, em uma única chamada.
create or replace function public.plantaonoturno_dashboard(
    p_start timestamptz default null,
    p_end   timestamptz default null
)
returns jsonb
language sql
stable
set search_path = public
as $function$
with base as (
    select *
      from public.plantaonoturno_demandas d
     where (p_start is null or d.created_at >= p_start)
       and (p_end   is null or d.created_at <= p_end)
),
totais as (
    select
        count(*)::int                                          as total,
        count(*) filter (where origem = 'CONTINUACAO')::int     as continuacoes,
        count(*) filter (where origem = 'GRUPO_WHATSAPP')::int  as grupos_whatsapp,
        count(*) filter (where origem = 'CLIENTE_DIRETO')::int  as clientes_diretos,
        count(*) filter (where recorrente)::int                 as recorrentes
      from base
),
por_origem as (
    select jsonb_agg(
               jsonb_build_object(
                   'origem',     x.origem,
                   'quantidade', x.quantidade,
                   'percentual', x.percentual
               ) order by x.ordem
           ) as data
      from (
        select
            o.origem,
            o.ordem,
            count(b.id)::int as quantidade,
            case when (select total from totais) = 0 then 0
                 else round(count(b.id)::numeric * 100 / (select total from totais), 1)
            end as percentual
          from (values ('CONTINUACAO', 1), ('GRUPO_WHATSAPP', 2), ('CLIENTE_DIRETO', 3)) as o(origem, ordem)
          left join base b on b.origem = o.origem
         group by o.origem, o.ordem
      ) x
),
por_tipo as (
    select jsonb_agg(jsonb_build_object('tipoDemanda', t.tipo_demanda, 'quantidade', t.quantidade)
                     order by t.quantidade desc, t.tipo_demanda asc) as data
      from (
        select tipo_demanda, count(*)::int as quantidade
          from base group by tipo_demanda
      ) t
),
por_tecnico_anterior as (
    select jsonb_agg(jsonb_build_object('tecnicoAnterior', t.tecnico_anterior, 'quantidade', t.quantidade)
                     order by t.quantidade desc, t.tecnico_anterior asc) as data
      from (
        select tecnico_anterior, count(*)::int as quantidade
          from base
         where origem = 'CONTINUACAO' and tecnico_anterior is not null
         group by tecnico_anterior
      ) t
),
por_grupo as (
    select jsonb_agg(jsonb_build_object('grupoWhatsapp', t.grupo_whatsapp, 'quantidade', t.quantidade)
                     order by t.quantidade desc, t.grupo_whatsapp asc) as data
      from (
        select grupo_whatsapp, count(*)::int as quantidade
          from base
         where origem = 'GRUPO_WHATSAPP' and grupo_whatsapp is not null
         group by grupo_whatsapp
      ) t
),
recentes as (
    select jsonb_agg(r.item order by r.created_at desc) as data
      from (
        select
            b.created_at,
            jsonb_build_object(
                'id',                b.id,
                'clienteRegistro',   b.cliente_registro,
                'tecnicoPlantao',    b.tecnico_plantao,
                'origem',            b.origem,
                'tecnicoAnterior',   b.tecnico_anterior,
                'protocoloAnterior', b.protocolo_anterior,
                'grupoWhatsapp',     b.grupo_whatsapp,
                'tipoDemanda',       b.tipo_demanda,
                'recorrente',        b.recorrente,
                'createdAt',         b.created_at
            ) as item
          from base b
         order by b.created_at desc
         limit 15
      ) r
)
select jsonb_build_object(
    'total',                   t.total,
    'continuacoes',            t.continuacoes,
    'gruposWhatsapp',          t.grupos_whatsapp,
    'clientesDiretos',         t.clientes_diretos,
    'recorrentes',             t.recorrentes,
    'cargaHerdadaPercentual',  case when t.total = 0 then 0
                                    else round(t.continuacoes::numeric * 100 / t.total, 1) end,
    'porOrigem',               coalesce((select data from por_origem), '[]'::jsonb),
    'porTipo',                 coalesce((select data from por_tipo), '[]'::jsonb),
    'porTecnicoAnterior',      coalesce((select data from por_tecnico_anterior), '[]'::jsonb),
    'porGrupoWhatsapp',        coalesce((select data from por_grupo), '[]'::jsonb),
    'recentes',                coalesce((select data from recentes), '[]'::jsonb)
)
from totais t;
$function$;

revoke all on function public.plantaonoturno_dashboard(timestamptz, timestamptz) from public;
grant execute on function public.plantaonoturno_dashboard(timestamptz, timestamptz) to service_role;
