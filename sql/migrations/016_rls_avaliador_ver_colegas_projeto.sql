-- Avaliador vê atribuições, avaliações e nomes dos colegas no mesmo projeto (painel de notas na ficha do projeto).

CREATE POLICY atribuicoes_select_avaliador_mesmo_projeto ON public.atribuicoes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.atribuicoes me
      WHERE me.projeto_id = atribuicoes.projeto_id
        AND me.avaliador_id = public.get_avaliador_id_for_auth()
    )
  );

CREATE POLICY avaliacoes_select_avaliador_mesmo_projeto ON public.avaliacoes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.atribuicoes att
      INNER JOIN public.atribuicoes me
        ON me.projeto_id = att.projeto_id
        AND me.avaliador_id = public.get_avaliador_id_for_auth()
      WHERE att.id = avaliacoes.atribuicao_id
    )
  );

CREATE POLICY avaliadores_select_mesmo_projeto ON public.avaliadores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.atribuicoes att
      INNER JOIN public.atribuicoes me
        ON me.projeto_id = att.projeto_id
        AND me.avaliador_id = public.get_avaliador_id_for_auth()
      WHERE att.avaliador_id = avaliadores.id
    )
  );
