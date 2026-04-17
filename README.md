# Avaliação e ranqueamento (Edital 45/2026)

Repositório: [github.com/isaiasrgomes/sistema-de-avaliacao](https://github.com/isaiasrgomes/sistema-de-avaliacao)

Sistema web para importação de inscrições (CSV), triagem, atribuição de avaliadores, avaliação com notas ponderadas, detecção de necessidade de 3º avaliador (CV ≥ 30%), ranking com desempate, cota mínima de 50% para o Sertão, recursos, auditoria e exportação CSV/PDF.

## Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, TailwindCSS, componentes no padrão shadcn/ui, Sonner (toasts), React Hook Form + Zod.
- **Backend:** Supabase (PostgreSQL, Auth, RLS). Cliente oficial `@supabase/supabase-js` e `@supabase/ssr` (sem Prisma).
- **PDF:** pdfkit (rotas em `/api/relatorios/pdf`).

## Configuração

1. Crie um projeto em [Supabase](https://supabase.com) e habilite **Auth** (e-mail + magic link e/ou senha).
2. No **SQL Editor**, execute **na ordem** os arquivos em `sql/migrations/`:
   - `001_initial_schema.sql`
   - `002_rls_delete_atribuicao.sql`
   - `003_recursos_nota.sql`
3. (Opcional, ambiente de teste) Rode `sql/seed/seed_demo.sql` para popular dados de demonstração.
4. Copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Em produção, defina `NEXT_PUBLIC_SITE_URL` com a URL pública do app (ex.: `https://seu-dominio.com`) para os e-mails de magic link/callback não usarem `localhost`.
   - Em desenvolvimento, o sistema usa automaticamente a origem atual (`localhost`) para evitar erro de PKCE por troca de domínio no callback.
6. (Opcional) Defina `NEXT_PUBLIC_IDLE_TIMEOUT_MINUTES` para expirar sessão por inatividade (padrão: `30` minutos).

### Magic link em localhost (obrigatório no painel Supabase)

Sem isso, o e-mail abre o link mas você volta para o login **sem sessão**:

1. **Authentication → URL Configuration**
   - **Site URL:** `http://localhost:3000` (ou a porta que você usa, ex.: `http://localhost:3001`).
   - **Redirect URLs:** inclua pelo menos:
     - `http://localhost:3000/auth/confirm`
     - `http://localhost:3000/auth/callback` (compatibilidade com links antigos)
     - `http://localhost:3000/**` (wildcard facilita troca de porta durante testes).

2. Confirme que o app está rodando **na mesma URL** da Site URL (mesmo host e porta).

3. Se ainda falhar: em **Authentication → Providers → Email**, mantenha “Confirm email” conforme sua política; para testes rápidos você pode definir **senha** ao usuário no painel (Users → usuário → “Send password recovery” ou crie senha manualmente) e usar **Entrar com senha**.

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Primeiro coordenador

1. Crie um usuário em **Authentication → Users** (ou cadastre-se pela tela de login).
2. Na tabela `public.profiles`, defina `role = 'COORDENADOR'` para o `id` desse usuário:

```sql
UPDATE public.profiles SET role = 'COORDENADOR' WHERE id = 'UUID_DO_USUARIO';
```

3. Cadastre avaliadores em **/admin/avaliadores** com o **mesmo e-mail** que usarão no login (magic link ou senha).

## Regras implementadas (resumo)

- **Nota ponderada:** \((equipe×6)+(mercado×6)+(produto×4)+(tecnologia×4)\), entre 20 e 100 (trigger no banco).
- **CV (2 avaliações):** \(\text{CV} = (|A-B| / \text{média}) × 100\), com média \((A+B)/2\). Se CV ≥ 30%, status `AGUARDANDO_3O_AVALIADOR`.
- **Nota final:** média das 2 ou 3 notas ponderadas concluídas.
- **Desempate:** nota final → média equipe → mercado → produto → tecnologia → `timestamp_submissao` mais antigo.
- **Cota Sertão:** `vagas_sertao = ceil(total_vagas × 0.5)`; preenchimento conforme `lib/services/ranking.ts` (`aplicarCota`).
- **Importação CSV:** mapeamento flexível de colunas, deduplicação (CPF mais recente; mesmo nome com CPFs diferentes mantém submissão mais antiga), UF = PE, `is_sertao` via `municipios_sertao`.
- **Impedimento:** remove atribuição e avaliação do avaliador; projeto volta para `EM_AVALIACAO` (ações em `app/actions/avaliador.ts`).
- **Desclassificação:** cancela atribuições `PENDENTE` / `EM_ANDAMENTO`; avaliações já concluídas permanecem no banco mas o projeto não entra no ranking (`status = DESCLASSIFICADO`).
- **Página pública:** somente após `resultado_final_liberado = true` em `app_config`; exibe selecionados e suplentes, ordem alfabética.

## Deploy

### GitHub Pages e este projeto

O [GitHub Pages](https://pages.github.com/) hospeda apenas arquivos estáticos (HTML/CSS/JS). Este sistema usa **rotas de API** (`/api/...`), **middleware** (proteção de `/admin` e `/avaliador`), **renderização no servidor** e **Supabase com cookies de sessão**. Por isso **não é possível** publicar a aplicação completa só no GitHub Pages sem reescrever grande parte do código (por exemplo, eliminando API routes e middleware).

**Recomendação:** faça o deploy com a mesma conta do GitHub usando **Vercel** (plano gratuito): importe o repositório [isaiasrgomes/sistema-de-avaliacao](https://github.com/isaiasrgomes/sistema-de-avaliacao), configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`, e use Node 18+.

### Caminho base (subpasta)

Se no futuro você publicar em um domínio com subpasta (por exemplo, outro host estático com proxy), defina `NEXT_PUBLIC_BASE_PATH` (ex.: `/sistema-de-avaliacao`) no ambiente de build. Em produção na raiz do domínio, deixe vazio.

### Supabase em produção

Mantenha as políticas RLS ativas; em **Auth → URL Configuration**, inclua a URL de produção e os callbacks `https://SEU_DOMINIO/auth/confirm` e `https://SEU_DOMINIO/auth/callback` (legado).

### CI

O workflow `.github/workflows/ci.yml` executa `lint` e `build` em cada push/PR para a branch `main` ou `master`.

## Estrutura principal

- `app/admin/*` — painel do coordenador  
- `app/avaliador/*` — painel do avaliador  
- `app/resultado` — resultado público  
- `app/actions/*` — server actions  
- `lib/services/*` — CSV, ranking, cota, CV, PDF, auditoria  
- `sql/migrations/*` — schema, RLS e ajustes  

## Observações

- O **service role** (`SUPABASE_SERVICE_ROLE_KEY`) está previsto em `lib/supabase/admin.ts` para extensões futuras; o fluxo atual usa a sessão do coordenador com RLS.
- Se o Postgres rejeitar `EXECUTE PROCEDURE` nos triggers, troque para `EXECUTE FUNCTION` (PostgreSQL 14+) nos arquivos de migração.
- Ajuste a lista em `municipios_sertao` conforme o edital para o cálculo automático de `is_sertao` na importação.
