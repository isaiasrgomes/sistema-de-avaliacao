-- Otimizações para atribuição automática em lote
-- Acelera filtro por projetos + avaliadores com impedimento
CREATE INDEX IF NOT EXISTS idx_impedimentos_projeto_avaliador
  ON public.impedimentos (projeto_id, avaliador_id);

-- Acelera leitura de carga atual por avaliador (pendente/em andamento)
CREATE INDEX IF NOT EXISTS idx_atribuicoes_status_avaliador
  ON public.atribuicoes (status, avaliador_id);
