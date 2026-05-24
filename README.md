# 🎯 DIAGNÓSTICO GERENCIAL 360°
## Ferramenta Premium de Diagnóstico Empresarial

**Status**: 🚧 Em desenvolvimento (Fase 1 - 30% completo)  
**Versão**: 1.0.0-alpha  
**Stack**: Next.js 14 + TypeScript + Supabase + React  

---

## 🚀 INÍCIO RÁPIDO (5 min)

```bash
# 1. Clone
git clone <seu-repo>
cd diagnostico-360

# 2. Instale dependências
npm install

# 3. Configure variáveis
cp .env.example .env.local
# Preencha SUPABASE_URL e SUPABASE_KEY

# 4. Setup banco
npm run db:migrate
npm run db:seed

# 5. Rode
npm run dev

# ✅ Acesse: http://localhost:3000
```

---

## 📚 DOCUMENTAÇÃO

| Documento | Para quem | Tempo |
|-----------|-----------|-------|
| **SETUP.md** | Developers | 10 min |
| **DESENVOLVIMENTO.md** | Tech leads | 15 min |
| **/docs/ESPECIFICAÇÃO.md** | Arquitetos | 45 min |
| **/docs/GUIA_IMPLEMENTAÇÃO.md** | Devs sprint-by-sprint | 1h+ |

---

## 🏗️ ARQUITETURA

### Backend
```
Supabase PostgreSQL
    ↓
[API REST]
  ├─ POST /api/diagnosticos/criar
  ├─ GET  /api/diagnosticos/[id]
  └─ GET  /api/diagnosticos (list)
    ↓
[Lógica de negócio]
  ├─ Cálculo de escores (0-10)
  ├─ Matriz de risco
  ├─ PDI automático
  └─ Geração de narrativa
```

### Frontend
```
Next.js App Router
    ↓
React Components
  ├─ <NovoDiagnostico /> — 3 steps form
  ├─ <VisualizarDiagnostico /> — resultados
  ├─ <RadarChart /> — 9 áreas
  ├─ <HeatmapTable /> — matriz risco
  └─ <PDITimeline /> — plano de ação
```

---

## 📊 FUNCIONALIDADES

### MVP (Fase 1-2)
- ✅ Criar diagnóstico (formulário 3 steps)
- ✅ Calcular escores (9 áreas, 0-10)
- ✅ Matriz de risco (crítico/alto/médio/baixo)
- ✅ PDI automático (plano de ação)
- ⏳ Visualizar resultados (gráficos radar/heatmap)
- ⏳ PDF relatório
- ⏳ Autenticação (Supabase)

### Fase 3+
- Dashboard histórico (trending)
- Benchmark vs. setor
- White-label (cliente coloca marca)
- Integração com Neurocorp 360
- API pública

---

## 📂 ESTRUTURA

```
diagnostico-360/
├── app/                          # Next.js 14 (App Router)
│   ├── api/diagnosticos/         # Endpoints REST
│   │   ├── criar/route.ts        # POST criar
│   │   ├── [id]/route.ts         # GET um
│   │   └── route.ts              # GET list
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home (a fazer)
│
├── components/                   # React components
│   ├── novo-diagnostico.tsx      # ✅ Form 3 steps
│   ├── visualizar-diagnostico.tsx # ⏳ A fazer
│   ├── radar-chart.tsx           # ⏳ A fazer
│   ├── heatmap-table.tsx         # ⏳ A fazer
│   └── pdi-timeline.tsx          # ⏳ A fazer
│
├── lib/                          # Lógica de negócio
│   └── diagnosticos/
│       ├── calcular.ts           # ✅ Cálculos
│       └── ...
│
├── types/                        # TypeScript
│   └── diagnostico.ts            # ✅ Types completos
│
├── database/                     # SQL
│   └── schema.sql                # ✅ Schema completo
│
├── data/                         # Dados estáticos
│   └── questoes.json             # ✅ Questões base (41)
│
├── public/                       # Assets estáticos
├── package.json                  # ✅ Dependências
├── tsconfig.json                 # ✅ TypeScript config
├── next.config.js                # ✅ Next config
├── .env.example                  # ✅ Template env
├── SETUP.md                      # ✅ Setup guide
└── DESENVOLVIMENTO.md            # ✅ Progress report
```

---

## 🔧 TECNOLOGIAS

### Core
- **Next.js 14** — Framework React
- **TypeScript** — Type safety
- **React Hook Form** — Formulários
- **Zod** — Validação

### Backend
- **Supabase** — PostgreSQL + Auth + Storage
- **Node.js** — Runtime

### Visualização
- **Recharts** — Gráficos (radar, heatmap, etc)
- **Tailwind CSS** — Styling

### Testing (futuro)
- **Jest** — Unit tests
- **Testing Library** — Component tests
- **Cypress** — E2E tests

---

## 📋 CHECKLIST DESENVOLVIMENTO

### Fase 1: Fundação ✅ (30%)
- [x] Schema PostgreSQL
- [x] Tipos TypeScript
- [x] Lógica de cálculo
- [x] API endpoints (3)
- [x] Componente form
- [ ] Páginas React
- [ ] Componentes gráficos

### Fase 2: MVP ⏳
- [ ] Autenticação Supabase
- [ ] Visualização resultados
- [ ] PDF generation
- [ ] Dashboard listagem
- [ ] Testes (jest + cypress)

### Fase 3: Premium
- [ ] Integração Neurocorp
- [ ] Benchmark real
- [ ] White-label
- [ ] API pública
- [ ] Documentação API

---

## 🚀 USAR A API

### Criar Diagnóstico

```bash
curl -X POST http://localhost:3000/api/diagnosticos/criar \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
    "empresa_nome": "XYZ Consultoria",
    "setor": "Comércio",
    "porte": "Pequena",
    "respondente_nome": "João Silva",
    "respondente_email": "joao@xyz.com.br",
    "respostas": [
      {
        "questao_id": 1,
        "resposta": "A",
        "pontos": 10,
        "tema": "Planejamento e Estratégia"
      }
    ]
  }'

# Response:
# {
#   "id": "550e8400-e29b-41d4-a716-446655440001",
#   "escore_geral": 7.2,
#   "maturidade": "PLENA",
#   "status": "criado"
# }
```

### Recuperar Diagnóstico

```bash
curl http://localhost:3000/api/diagnosticos/550e8400-e29b-41d4-a716-446655440001

# Response: Diagnóstico completo com:
# - escores por área
# - matriz de risco
# - PDI (ações)
# - benchmark
# - dados para gráficos
```

### Listar Diagnósticos

```bash
curl "http://localhost:3000/api/diagnosticos?tenant_id=...&page=1&limit=10"
```

---

## 🔑 VARIÁVEIS DE AMBIENTE

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=seu_anon_key
SUPABASE_SERVICE_ROLE_KEY=seu_service_role_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Integração Neurocorp (futuro)
# NEUROCORP_API_URL=...
# NEUROCORP_API_KEY=...
```

---

## 📝 SCRIPTS

```bash
# Desenvolvimento
npm run dev              # Rodar servidor dev
npm run build            # Build para prod
npm start                # Rodar build

# Database
npm run db:migrate       # Executar migrations
npm run db:seed          # Popular dados iniciais

# Testes (futuro)
npm run test             # Jest tests
npm run test:watch       # Jest watch
npm run e2e              # Cypress E2E
```

---

## 🤝 CONTRIBUINDO

1. Crie uma branch: `git checkout -b feature/sua-feature`
2. Commit: `git commit -am 'Add feature'`
3. Push: `git push origin feature/sua-feature`
4. Pull Request

**Padrão de código**:
- TypeScript strict
- ESLint + Prettier
- Componentes React funcionais
- Testes para funcionalidades críticas

---

## 🐛 TROUBLESHOOTING

### Erro: "Connection refused"
```bash
# Supabase não está rodando
supabase start
```

### Erro: "NEXT_PUBLIC_SUPABASE_URL is not set"
```bash
# Variáveis de ambiente não definidas
cp .env.example .env.local
# Preencha com suas credenciais
```

### Porta 3000 em uso
```bash
npm run dev -- -p 3001
```

### Banco desincronizado
```bash
npm run db:migrate
npm run db:seed
```

---

## 📞 SUPORTE

- **Docs**: Ver `SETUP.md` e `DESENVOLVIMENTO.md`
- **Issues**: Abra uma issue no GitHub
- **Email**: [seu-email@example.com]

---

## 📄 LICENÇA

Propriedade privada. Desenvolvimento sob demanda.

---

## 🎯 ROADMAP

- **Semana 1-2**: Fundação + API ← **AQUI AGORA**
- **Semana 3-4**: Frontend + Componentes
- **Semana 5-6**: Auth + PDF
- **Semana 7-8**: Integração Neurocorp
- **Semana 9-10**: Testes + Deploy

---

## 📊 STATUS

**Última atualização**: 24/05/2026  
**Código**: [GitHub]  
**Deploy**: Staging (via Vercel)  

```
Foundation Phase: ████████░░░░░░░░ 30%
Total Project: ███░░░░░░░░░░░░░░░ 15%
```

---

**Pronto para desenvolver? Comece por `SETUP.md`** 🚀

Dúvidas? Abra uma issue ou envie um email.
