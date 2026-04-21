-- Permite ao coordenador recusar cadastro de avaliador (permanece não aprovado e não pode acessar a área).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cadastro_recusado boolean NOT NULL DEFAULT false;
