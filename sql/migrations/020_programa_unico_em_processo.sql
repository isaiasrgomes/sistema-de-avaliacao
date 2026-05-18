-- Apenas um programa pode estar EM_PROCESSO por vez (inscrições públicas).

CREATE UNIQUE INDEX IF NOT EXISTS idx_programas_unico_em_processo
  ON public.programas ((1))
  WHERE status = 'EM_PROCESSO'::public.programa_status AND deleted_at IS NULL;

COMMENT ON INDEX public.idx_programas_unico_em_processo IS
  'Garante no máximo um programa ativo para inscrição e monitoramento simultâneo';
