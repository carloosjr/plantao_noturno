-- Módulo "Plantão Noturno" — Acompanhamento do plantão.
-- Adiciona o registro do cliente à validação de agenda (mesmo campo usado no
-- registro de continuações). Nullable porque já existem registros lançados
-- antes deste campo existir; a API passa a exigi-lo em novos lançamentos.

alter table public.plantaonoturno_agenda_indevida
    add column if not exists registro bigint;

do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'plantaonoturno_agenda_indevida_registro_check'
    ) then
        alter table public.plantaonoturno_agenda_indevida
            add constraint plantaonoturno_agenda_indevida_registro_check
            check (registro > 0);
    end if;
end $$;
