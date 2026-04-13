-- Permite avaliador remover própria atribuição e avaliação ao declarar impedimento
CREATE POLICY atribuicoes_delete_avaliador ON public.atribuicoes FOR DELETE
  USING (avaliador_id = public.get_avaliador_id_for_auth() OR public.is_coordenador());

CREATE POLICY avaliacoes_delete_avaliador_own ON public.avaliacoes FOR DELETE
  USING (
    public.is_coordenador()
    OR EXISTS (
      SELECT 1 FROM public.atribuicoes att
      WHERE att.id = avaliacoes.atribuicao_id
        AND att.avaliador_id = public.get_avaliador_id_for_auth()
    )
  );
