# Regtech Motos

## Status atual
Estrutura inicial do projeto. Nenhuma funcionalidade de negócio (catálogo, produtos, leads) foi desenvolvida ainda, por instrução explícita.

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
│       └── server.ts   (cliente para Server Components / Route Handlers)
├── .env.example
├── .gitignore
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
- Confirmação de qual projeto Supabase será usado (dedicado ou infraestrutura multi-tenant compartilhada).
- Criação do repositório no GitHub (feita manualmente pelo usuário, via interface web).
- Conexão do repositório à Vercel para deploy automático.
- Preenchimento das variáveis de ambiente reais no painel da Vercel.
