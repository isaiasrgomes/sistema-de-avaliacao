-- Remove leitura anônima de resultados/projetos usada pela página pública (descontinuada).

DROP POLICY IF EXISTS resultados_select_public_anon ON public.resultados;
DROP POLICY IF EXISTS projetos_select_public_anon ON public.projetos;
DROP POLICY IF EXISTS app_config_select_anon ON public.app_config;
