-- Módulo "Plantão Noturno" — Acompanhamento do plantão.
-- Permite informar a hora da última ligação recebida, em vez de depender só
-- do horário em que o lançamento foi feito na tela (created_at).

alter table public.plantaonoturno_ligacoes
    add column if not exists horario text;

alter table public.plantaonoturno_ligacoes
    add constraint plantaonoturno_ligacoes_horario_check
    check (horario is null or horario ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
