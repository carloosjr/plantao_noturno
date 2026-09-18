-- Adiciona a coluna numero_caso na tabela plantaonoturno_casos_smart
alter table if exists public.plantaonoturno_casos_smart
    add column if not exists numero_caso bigint;

create index if not exists plantaonoturno_casos_smart_numero_caso_idx
    on public.plantaonoturno_casos_smart (numero_caso);
