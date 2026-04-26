-- Invalida sessões ativas dos usuários afetados para forçar emissão
-- de novos tokens sem payload inflado.
DELETE FROM auth.sessions
WHERE user_id IN (
  SELECT id
  FROM auth.users
  WHERE COALESCE(raw_user_meta_data, '{}'::jsonb) ? 'foto_url'
);
 
-- Remove qualquer foto em base64 do metadata de autenticação para evitar
-- sessões/cookies gigantes (REQUEST_HEADER_TOO_LARGE / 494 na Vercel).
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) - 'foto_url'
WHERE COALESCE(raw_user_meta_data, '{}'::jsonb) ? 'foto_url';
