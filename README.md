# Regtech Motos

## Status atual
Fundação técnica (Etapa 1/1.1), modelo de dados (Etapa 2), Storage (Etapa 3/3.1) e autenticação administrativa (Etapa 4.1) concluídos. Nenhuma funcionalidade de negócio (CRUD de produtos, catálogo público, leads) foi desenvolvida ainda, por instrução explícita.

## Banco de dados (Supabase)
Projeto dedicado `regtech-motos` (ref `bjodwjskwnpnqedjasid`, região `sa-east-1`).

Tabelas: `products`, `product_images`, `product_colors`, `product_specs`, `leads`. RLS ativado em todas. Bucket de Storage `product-images` (público, 5MB, JPEG/PNG/WebP). Migrations versionadas em `supabase/migrations/`.

## Autenticação administrativa
`/admin/login` (público) e `/admin` (protegido) usando Supabase Auth. Sem cadastro público — contas de administrador são criadas manualmente no painel do Supabase (Authentication → Users). Proteção validada no servidor via `proxy.ts` (substitui `middleware.ts` no Next.js 16) + verificação redundante na própria página `/admin`. Detalhes completos nos relatórios enviados no chat.

## Stack técnica
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Supabase (`@supabase/supabase-js` + `@supabase/ssr`)
- Deploy: Vercel

Esta stack replica o padrão já usado em outros projetos Next.js/Supabase da Vértice Digital (ex.: Vértice ERP), já que não havia nenhum documento específico do Regtech Motos definindo uma arquitetura diferente.

## Estrutura de pastas
```
regtech-motos/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   └── supabase/
│       ├── client.ts   (cliente para Client Components)
│       ├── server.ts   (cliente para Server Components / Route Handlers)
│       └── storage.ts  (utilitários do bucket product-images)
├── supabase/
│   └── migrations/     (histórico versionado do schema)
├── .env.example
├── .gitignore
├── eslint.config.mjs
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## Variáveis de ambiente necessárias
Ver `.env.example`. Precisam ser preenchidas somente após a definição/criação do projeto Supabase:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Rodando localmente
```
npm install
npm run dev
```

## Pendências (ver relatório completo enviado no chat)
- Preenchimento das variáveis de ambiente reais no painel da Vercel (não é urgente: nenhuma página ainda consulta o Supabase).
- `SUPABASE_SERVICE_ROLE_KEY` deve ser obtida diretamente no painel do Supabase quando for necessária (nunca commitada).
- Etapas futuras: catálogo visual, painel admin, autenticação, formulário de leads, WhatsApp.
