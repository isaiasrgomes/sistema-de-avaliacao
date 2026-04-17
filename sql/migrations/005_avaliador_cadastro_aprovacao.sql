-- Avaliadores: cadastro com e-mail/senha exige aprovação do coordenador antes de acessar a área.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email varchar(255),
  ADD COLUMN IF NOT EXISTS cadastro_aprovado boolean NOT NULL DEFAULT false;

-- E-mail espelhado de auth.users; quem já existe no sistema fica liberado.
UPDATE public.profiles p
SET
  email = lower(trim(u.email)),
  cadastro_aprovado = true
FROM auth.users u
WHERE u.id = p.id;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, nome, email, cadastro_aprovado)
  VALUES (
    NEW.id,
    'AVALIADOR'::public.profile_role,
    COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data ->> 'nome'), ''),
      NULLIF(trim(NEW.raw_user_meta_data ->> 'full_name'), ''),
      split_part(NEW.email, '@', 1)
    ),
    lower(trim(NEW.email)),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
