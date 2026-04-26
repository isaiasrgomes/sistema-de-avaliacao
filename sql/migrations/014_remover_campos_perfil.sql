-- Limpeza final do módulo de perfil (campos não utilizados pelo sistema).
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS telefone,
  DROP COLUMN IF EXISTS instituicao,
  DROP COLUMN IF EXISTS foto_url;

DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
