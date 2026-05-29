# 🎯 Diagnóstico Empresarial 360°

Ferramenta SaaS de **diagnóstico de maturidade empresarial** que avalia empresas em **10 áreas estratégicas**, gerando escores, matriz de risco, plano de ação (PDE) e relatório completo. Desenvolvido para a metodologia **B&G / Neurocorp 360**.

**🔗 Em produção:** https://diagnostico-360-taupe.vercel.app

**Status:** ✅ Em produção · **Stack:** Next.js 14 + TypeScript + Supabase

---

## ✨ Funcionalidades

### Diagnóstico
- **100 questões** em **10 áreas** (10 por área), filtradas por setor
- Formulário em 3 etapas: **Configuração → Questionário → Revisão**
- Questionário em **modo Hub** — cada área é um card independente
- Opção **"Outras"** com texto livre por questão (contexto qualitativo)

### Dados capturados (base Anexo XXVII)
- Localização, atividade econômica (CNAE por setor)
- Perfil do gestor (tempo, idade, origem, escolaridade)
- Qualitativos: jornada, diferencial competitivo, dores
- **Financeiro com cálculo automático:**
  - Margem de contribuição, ponto de equilíbrio, ticket médio
  - Folha de pagamento (Σ qtd × salário por categoria)
  - % folha sobre receita com **faixas saudáveis por setor**
  - Endividamento detalhado (banco / fornecedor / fisco / SEFAZ…)

### Relatório
- **Radar com 3 referências:** Sua Empresa · Média Nacional (SEBRAE) · Meta B&G (7.5)
- Escores por área + matriz de risco com impactos médio/longo prazo
- **PDE** (Plano de Desenvolvimento Empresarial) por fases
- Análise interpretativa automática + Nota Metodológica com fontes
- 🖨️ Imprimir / Salvar PDF · 📧 Enviar por Email

### Acesso e Administração
- Cadastro/login via Supabase Auth (multi-tenant)
- **Isolamento:** cada usuário vê apenas os próprios diagnósticos
- **Painel Admin** (`/admin/diagnosticos`): todos os diagnósticos, busca, filtro, export CSV, estatísticas
- **Gerenciar Usuários** (`/admin/usuarios`): promover/remover admins em 1 clique
- Segurança em 3 camadas (UI · página · API server-side)

---

## 🛠️ Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Estilo | Tailwind CSS |
| Banco/Auth | Supabase (PostgreSQL + Auth) |
| Gráficos | Recharts |
| Formulários | React Hook Form + Zod |
| Email | Resend |
| Deploy | Vercel (CI/CD via GitHub) |

---

## 🚀 Início Rápido

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# Preencha as chaves (ver seção abaixo)

# 3. Rodar em desenvolvimento
npm run dev
# Acesse http://localhost:3000

# 4. Build de produção
npm run build && npm start
```

---

## 🔑 Variáveis de Ambiente

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_publica
SUPABASE_SERVICE_ROLE_KEY=sua_chave_secreta   # ⚠️ só backend

# Email (Resend)
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=Diagnóstico 360 <onboarding@resend.dev>  # opcional

# App
NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
```

---

## 📁 Estrutura

```
app/
├── page.tsx                      # Home (10 áreas, como funciona)
├── login/ · cadastro/            # Autenticação
├── diagnostico/novo/             # Formulário (3 etapas)
├── diagnostico/[id]/             # Relatório completo
├── diagnosticos/                 # Lista do usuário
├── admin/diagnosticos/           # 👑 Painel admin (todos)
├── admin/usuarios/               # 👑 Gerenciar admins
└── api/
    ├── diagnosticos/criar/       # POST cria diagnóstico
    ├── diagnosticos/[id]/        # GET relatório (+ controle de acesso)
    ├── diagnosticos/[id]/email/  # POST envia por email
    ├── admin/diagnosticos/       # GET todos (admin)
    ├── admin/usuarios/           # GET/PATCH gerenciar admins
    └── auth/setup/               # cria tenant + verifica is_admin

components/
├── novo-diagnostico.tsx          # Formulário principal
├── radar-chart.tsx               # Radar de 3 linhas
├── currency-input.tsx            # Máscara monetária BR
└── navbar.tsx                    # Menu com dropdown admin

lib/
├── diagnosticos/calcular.ts      # Lógica de escore / risco / PDE / benchmark
└── supabase/                     # Clients (browser / server / middleware)

data/questoes.json                # 100 questões
database/*.sql                    # Schema + 7 migrations
```

---

## 🗄️ Banco de Dados (Supabase)

Tabelas principais:
- `tenants` — usuários/empresas (com `is_admin`, `owner_id`)
- `diagnosticos_360` — diagnóstico + dados da empresa + escores
- `diagnosticos_360_respostas` — respostas individuais
- `diagnosticos_360_matriz_risco` — matriz de risco
- `diagnosticos_360_pdi` — plano de ação (PDE)

As migrations estão em `database/` e devem ser aplicadas em ordem no SQL Editor do Supabase.

---

## 🔌 API

### Criar diagnóstico
```bash
POST /api/diagnosticos/criar
# body: { tenant_id, empresa_nome, setor, porte, respondente_*, respostas[], ...dados }
# retorna: { id, escore_geral, maturidade }
```

### Recuperar relatório
```bash
GET /api/diagnosticos/[id]
# retorna: escores, matriz_risco, pdi, benchmark, narrativa, observacoes
# (controle de acesso: dono OU admin)
```

### Enviar por email
```bash
POST /api/diagnosticos/[id]/email
# body: { destinatario }
```

### Admin
```bash
GET   /api/admin/diagnosticos    # lista todos (admin)
GET   /api/admin/usuarios        # lista usuários
PATCH /api/admin/usuarios        # promover/remover admin
```

---

## 🔐 Como tornar alguém admin

**Opção 1 — pela interface (recomendado):**
`👑 Admin → Gerenciar Usuários → Promover a admin`

**Opção 2 — via SQL:**
```sql
UPDATE tenants SET is_admin = true WHERE email = 'pessoa@email.com';
```

---

## 📜 Scripts

```bash
npm run dev      # servidor de desenvolvimento
npm run build    # build de produção
npm start        # rodar build
```

---

## 🚧 Roadmap

- [ ] Domínio próprio (ex: `diagnostico.bg.com.br`)
- [ ] Benchmark dinâmico (média real da plataforma)
- [ ] Geração de PDF server-side
- [ ] Domínio verificado no Resend
- [ ] Dashboard analítico no admin
- [ ] Integração com os demais tools do Neurocorp 360

---

**Desenvolvido com metodologia B&G / Neurocorp 360.**
