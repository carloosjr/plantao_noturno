-- Módulo "Plantão Noturno" — Acompanhamento do plantão.
-- Adiciona "Bezerra" à lista de atendentes de Validação de agenda.

alter table public.plantaonoturno_agenda_indevida
    drop constraint if exists plantaonoturno_agenda_indevida_responsavel_check;

alter table public.plantaonoturno_agenda_indevida
    add constraint plantaonoturno_agenda_indevida_responsavel_check
    check (responsavel in ('Matheus', 'Osiel', 'Bezerra', 'Hercílio'));
