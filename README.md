# ATLAS NOVA ERA

Painel para quem trabalha com crédito organizar clientes, contratos e
parcelas — com cobrança automática pelo WhatsApp.

> Este projeto está sendo construído em fases. Este README é o guia para
> você (sem precisar saber programar) deixar tudo pronto por fora do código:
> GitHub, Vercel, Supabase, Asaas, Resend e o domínio.

## Como o projeto é organizado

- `/` — site de vendas (landing page)
- `/app` — o sistema (painel) que os assinantes usam depois de logar
- Um único projeto Next.js, um único deploy. No futuro dá para separar
  `/app` para `app.seudominio.com.br` sem reescrever o sistema.

```
src/
  app/
    (site)/        → páginas do site de vendas (rota "/")
    (app)/app/      → páginas do sistema logado (rota "/app")
    api/            → rotas de backend (webhooks, cron, etc.)
  components/       → componentes de tela (shadcn/ui em components/ui)
  lib/              → funções e integrações (Supabase, Asaas, cálculos, etc.)
docs/
  schema.md         → o modelo do banco de dados, explicado
supabase/
  migrations/       → o "histórico" das tabelas do banco (criado na Fase 0)
```

## Rodando localmente (passo a passo)

1. Instale o [Node.js](https://nodejs.org) versão 20 ou mais nova.
2. Baixe as dependências do projeto:
   ```
   npm install
   ```
3. Copie o arquivo de variáveis de ambiente de exemplo:
   ```
   cp .env.example .env.local
   ```
   (no Windows PowerShell: `Copy-Item .env.example .env.local`)
4. Preencha o `.env.local` seguindo os passos abaixo (Supabase, Asaas, Resend...).
5. Rode o site:
   ```
   npm run dev
   ```
6. Abra [http://localhost:3000](http://localhost:3000).

Outros comandos úteis:
- `npm run build` — gera a versão de produção (usado antes de cada publicação)
- `npm run lint` — verifica erros e problemas de estilo no código
- `npm run test:db` — testa as regras de segurança do banco (ex.: uma
  empresa nunca ver dado de outra) sem precisar de um Supabase real

---

## 1. GitHub (guardar e versionar o código)

1. Crie uma conta em [github.com](https://github.com) se ainda não tiver.
2. Crie um repositório novo, **privado**, chamado por exemplo `atlas-nova-era`.
3. No seu computador, dentro desta pasta, rode:
   ```
   git remote add origin https://github.com/SEU-USUARIO/atlas-nova-era.git
   git push -u origin main
   ```
   (já feito — o código está em
   [github.com/joaovictorbragamilhomem-debug/ATLAS-NOVA-ERA](https://github.com/joaovictorbragamilhomem-debug/ATLAS-NOVA-ERA))

## 2. Supabase (banco de dados, login e arquivos)

1. Crie uma conta em [supabase.com](https://supabase.com).
2. Crie um novo projeto (escolha a região **South America (São Paulo)** para
   ficar mais rápido para seus usuários).
3. Anote a senha do banco de dados que o Supabase pedir para você criar —
   guarde em um cofre de senhas, não vamos precisar dela no dia a dia.
4. Em **Project Settings → API**, copie:
   - `Project URL` → cole em `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → cole em `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → cole em `SUPABASE_SERVICE_ROLE_KEY` (⚠️ esta chave
     é secreta — nunca aparece no navegador, só é usada no servidor)
5. **Aplicando as migrações** (cria as tabelas de verdade, com as regras de
   segurança já ligadas): a forma mais simples é abrir, no painel do
   Supabase, **SQL Editor**, e colar o conteúdo de cada arquivo dentro de
   `supabase/migrations/`, **um de cada vez, na ordem em que aparecem** (os
   nomes começam com um número — é a ordem de execução). Quando o projeto
   estiver mais maduro, trocamos isso pelo comando `supabase db push`
   (Supabase CLI), que faz isso automaticamente.

## 3. Vercel (publicar o site)

1. Crie uma conta em [vercel.com](https://vercel.com), de preferência
   entrando com sua conta do GitHub.
2. Clique em **Add New → Project** e escolha o repositório `atlas-nova-era`.
3. Em **Environment Variables**, cole as mesmas variáveis do seu `.env.local`
   (uma a uma — a Vercel não lê o arquivo `.env.local` automaticamente).
4. Clique em **Deploy**.
5. Depois do primeiro deploy, cada `git push` na branch `main` publica uma
   nova versão automaticamente.

## 4. Asaas (cobrança da sua assinatura — Mensal/Anual/Vitalício)

Isso é para cobrar **você cobrando seus clientes assinantes do ATLAS**, não
tem relação com o dinheiro que os seus clientes (os tomadores de crédito)
devem — o ATLAS nunca guarda ou movimenta esse dinheiro.

1. Crie uma conta em [asaas.com](https://www.asaas.com).
2. Comece pelo **ambiente sandbox** (modo de teste, sem dinheiro de verdade):
   [sandbox.asaas.com](https://sandbox.asaas.com).
3. Em **Integrações → API Key**, copie a chave e cole em `ASAAS_API_KEY`.
   Deixe `ASAAS_ENV=sandbox` por enquanto.
4. Em **Integrações → Webhooks**, você vai cadastrar a URL
   `https://SEUDOMINIO/api/webhooks/asaas` — faremos isso juntos na Fase 3,
   quando essa rota existir. Nessa mesma tela você define um token; cole-o
   em `ASAAS_WEBHOOK_SECRET`.
5. Quando tudo estiver testado, trocamos para a chave de produção e
   `ASAAS_ENV=production`.
   (valores dos planos Mensal, Anual e Vitalício já definidos e em produção)

## 5. Resend (envio de e-mails)

1. Crie uma conta em [resend.com](https://resend.com).
2. Cadastre e verifique o seu domínio (registros DNS — veja seção 6).
3. Em **API Keys**, crie uma chave e cole em `RESEND_API_KEY`.
4. Defina o remetente em `RESEND_FROM_EMAIL`, por exemplo
   `"ATLAS NOVA ERA <contato@seudominio.com.br>"`.

## 6. Domínio e DNS

1. Domínio já comprado: `atlasnovaera.com.br` (registro.br).
2. Na Vercel, vá em **Project Settings → Domains** e adicione o domínio.
   (já feito — falta só cadastrar os registros DNS abaixo)
3. A Vercel vai te mostrar registros DNS (tipo `A` ou `CNAME`) para colocar
   no painel de onde você comprou o domínio (Registro.br, etc.).
4. Para o Resend enviar e-mail pelo seu domínio, adicione também os
   registros `DKIM`/`SPF` que o Resend mostrar na tela de verificação.

---

## Variáveis de ambiente

Veja `.env.example` — cada variável tem um comentário dizendo para que serve
e em qual fase ela passa a ser usada.

## Segurança e LGPD (resumo)

- Cada assinante só enxerga os dados da própria organização (regra de banco
  chamada RLS, ativa em todas as tabelas).
- Segredos (chaves de API, tokens) ficam só em variáveis de ambiente, nunca
  no código.
- O ATLAS é **operador** dos dados dos seus clientes; cada assinante é o
  **controlador** (isso ficará explícito nos Termos de Uso).
- O ATLAS não é uma instituição financeira: não empresta, não guarda e não
  movimenta dinheiro de ninguém — apenas registra, calcula e ajuda a cobrar.

## Status do projeto

- [x] Fase 0 — Preparação
- [x] Fase 1 — Identidade visual e design system (veja `/design` rodando o projeto)
- [x] Fase 2 — Site de vendas
- [x] Fase 3 — Contas, equipe e assinatura (login/cadastro, convite de equipe e Asaas prontos;
      falta só o envio de e-mail pelo Resend funcionar de verdade — depende do domínio
      próprio estar com DNS configurado, ver seção 6)
- [x] Fase 4 — Clientes, contratos e parcelas (inclui dashboard, calendário, relatórios,
      ficha pública de captação, importação por CSV e renegociação de contrato)
- [x] Fase 5 — WhatsApp e cobrança automática (API oficial da Meta; falta concluir a
      verificação da empresa na Meta para as mensagens saírem do modo de teste)
- [x] Fase 6 — Central de conversas (`/app/conversas`; mensagens recebidas + resposta
      livre respeitando a janela de 24h da Meta, com o contrato do cliente do lado)
- [ ] Fase 7 — Celular e acabamento
- [ ] Fase 8 — Sugestão de resposta com IA (opcional)
