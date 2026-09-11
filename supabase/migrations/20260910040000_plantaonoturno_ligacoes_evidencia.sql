-- Módulo "Plantão Noturno" — Acompanhamento do plantão.
-- Permite anexar a evidência (link do print) de um lançamento de ligações,
-- mesmo padrão já usado em plantaonoturno_agenda_indevida.

alter table public.plantaonoturno_ligacoes
    add column if not exists evidencia text;
