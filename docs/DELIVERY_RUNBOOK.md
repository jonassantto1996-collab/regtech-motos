# Regtech Motors — Runbook de entrega e rollback

## Antes de publicar
1. Exigir CI verde na branch de entrega.
2. Confirmar que o deploy Preview está `READY`.
3. Executar um backup dos objetos do Storage:
   ```
   npm run backup:storage -- ./backups/pre-release
   ```
4. Confirmar no Supabase **Database > Backups** que existe backup diário recente.
5. Fazer smoke test: Home, catálogo, produto, login, recuperação de senha, Leads, estoque e NF-e.
6. Somente então promover/mergear a versão aprovada para produção.

## Banco de dados
O projeto Supabase está em plano Pro. O plano mantém backups automáticos diários com retenção de 7 dias.

Importante: o backup do banco não restaura os arquivos físicos do Supabase Storage. Por isso o backup local do Storage é obrigatório antes de operações destrutivas ou antes de uma publicação relevante.

## Storage
Backup:
```
npm run backup:storage -- ./backups/pre-release
```

Restauração deliberada:
```
ALLOW_STORAGE_RESTORE=YES npm run restore:storage -- ./backups/pre-release
```

Nunca commitar a pasta `backups/`.

## Rollback de aplicação
- Preferência: voltar para o último deployment Vercel com estado `READY` conhecido e CI verde.
- Em Git, usar revert do commit problemático; evitar force-push na branch de produção.
- Após rollback, repetir smoke test do Admin e do site.

## Rollback do banco
- Migrações são versionadas em `supabase/migrations/`.
- Para perda/corrupção de dados, restaurar um backup pelo Supabase Dashboard.
- Restaurar banco causa indisponibilidade durante o processo.
- Não restaurar banco para corrigir apenas um bug de frontend.

## Domínio e autenticação
Antes da produção final:
- configurar `NEXT_PUBLIC_SITE_URL` com o domínio definitivo;
- adicionar o mesmo domínio/URL de callback permitido no Supabase Auth;
- validar o fluxo completo **Esqueci minha senha → e-mail → callback → nova senha → login**;
- confirmar que o domínio definitivo aponta para o deployment atual de produção.

## Variáveis obrigatórias
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_WHATSAPP_NUMBER`

`VERCEL_URL` e `VERCEL_ENV` são fornecidas automaticamente pela Vercel e são usadas para manter recuperação de senha funcional também em Preview.
