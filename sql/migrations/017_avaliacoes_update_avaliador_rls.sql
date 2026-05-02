-- Avaliador pode atualizar a própria linha em avaliacoes (ex.: corrigir notas após CONCLUIDA).
-- Sem política FOR UPDATE, o Postgres aplica RLS e o UPDATE altera 0 linhas sem erro explícito,
-- o que fazia a UI mostrar "Avaliação atualizada" sem persistir mudanças.

CREATE POLICY avaliacoes_update_avaliador_own ON public.avaliacoes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.atribuicoes att
      WHERE att.id = avaliacoes.atribuicao_id
        AND att.avaliador_id = public.get_avaliador_id_for_auth()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.atribuicoes att
      WHERE att.id = avaliacoes.atribuicao_id
        AND att.avaliador_id = public.get_avaliador_id_for_auth()
    )
  );
