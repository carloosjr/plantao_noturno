-- Adiciona a coluna tipo na tabela plantaonoturno_casos_smart (Bug ou Melhoria)
alter table if exists public.plantaonoturno_casos_smart
    add column if not exists tipo text not null default 'Bug';

create index if not exists plantaonoturno_casos_smart_tipo_idx
    on public.plantaonoturno_casos_smart (tipo);
