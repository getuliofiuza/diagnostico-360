# 🚀 SETUP - DIAGNÓSTICO 360°

## Pré-requisitos

- Node.js 16+
- npm ou yarn
- Conta Supabase (https://supabase.com)
- PostgreSQL (para desenvolvimento local)

---

## 1. CLONAR E INSTALAR DEPENDÊNCIAS

```bash
# Clone o repositório
git clone <seu-repo>
cd diagnostico-360

# Instale as dependências
npm install
# ou
yarn install
```

---

## 2. CONFIGURAR SUPABASE

### Opção A: Usar Supabase Cloud (RECOMENDADO)

1. Acesse https://supabase.com
2. Crie um novo projeto
3. Copie as credenciais:
   - URL do projeto
   - Chave anon (pública)
   - Chave service role (privada)

4. Copie `.env.example` para `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

5. Preencha as variáveis:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=seu_anon_key
   SUPABASE_SERVICE_ROLE_KEY=seu_service_role_key
   ```

### Opção B: Usar Supabase Localmente

```bash
# Instale Supabase CLI
npm install -g supabase

# Inicie Supabase localmente
supabase start

# Copie as credenciais do output
```

---

## 3. EXECUTAR MIGRATIONS DO BANCO

```bash
# Copie o schema.sql para Supabase
# Via Supabase Dashboard > SQL Editor > Copie o conteúdo de database/schema.sql
# OU via CLI:

supabase db push
```

---

## 4. SEED DO BANCO (DADOS INICIAIS)

```bash
# Executar seed script
npm run db:seed

# Isso popula:
# - Questões (41+ padrão)
# - Dados de benchmark (setor/porte)
```

---

## 5. INICIAR SERVIDOR DE DESENVOLVIMENTO

```bash
npm run dev
# ou
yarn dev
```

Acesse: http://localhost:3000

---

## 6. ESTRUTURA DO PROJETO

```
diagnostico-360/
├── app/                      # Next.js App Router
│   ├── api/                  # Endpoints REST
│   │   ├── diagnosticos/criar/route.ts
│   │   ├── diagnosticos/[id]/route.ts
│   │   └── diagnosticos/route.ts
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── components/               # React components
│   ├── radar-chart.tsx       # Gráfico radar
│   ├── heatmap-table.tsx     # Tabela heatmap
│   └── ...
├── lib/                      # Lógica de negócio
│   └── diagnosticos/
│       ├── calcular.ts       # Cálculos (escore, risco, PDI, etc)
│       └── ...
├── database/                 # SQL migrations
│   └── schema.sql            # Schema completo
├── data/                     # Dados estáticos
│   └── questoes.json         # Banco de questões
├── types/                    # TypeScript types
│   └── diagnostico.ts        # Types do domínio
├── public/                   # Assets estáticos
├── package.json
├── tsconfig.json
└── next.config.js
```

---

## 7. USAR A API

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
      },
      ...
    ]
  }'
```

### Recuperar Diagnóstico

```bash
curl http://localhost:3000/api/diagnosticos/550e8400-e29b-41d4-a716-446655440000
```

### Listar Diagnósticos

```bash
curl "http://localhost:3000/api/diagnosticos?tenant_id=550e8400-e29b-41d4-a716-446655440000&page=1&limit=10"
```

---

## 8. TESTES

```bash
# Rodar testes
npm run test

# Modo watch
npm run test:watch
```

---

## 9. BUILD E DEPLOY

```bash
# Build para produção
npm run build

# Rodar build localmente
npm start

# Deploy no Vercel
vercel deploy --prod
```

---

## 10. TROUBLESHOOTING

### Erro: "Connection refused"
→ Supabase não está rodando. Use `supabase start` ou crie projeto em supabase.com

### Erro: "Authentication failed"
→ Verifique credenciais em `.env.local`

### Erro: "Tables not found"
→ Execute migrations: `supabase db push`

### Porta 3000 em uso
→ Use: `npm run dev -- -p 3001`

---

## 11. INTEGRAÇÃO COM NEUROCORP 360

Para integrar com Neurocorp 360:

1. Configure variáveis de integração em `.env.local`:
   ```
   NEUROCORP_API_URL=https://api.neurocorp360.com.br
   NEUROCORP_API_KEY=seu_api_key
   ```

2. Use o hook `useTenant()` do Neurocorp para auth:
   ```typescript
   import { useTenant } from '@/lib/neurocorp/hooks';
   
   const tenant_id = useTenant();
   ```

3. Componentes no Neurocorp integraram como módulo:
   ```bash
   # Copiar componentes React para Neurocorp
   cp -r components/ ../neurocorp-360/modules/diagnostico-360/
   ```

---

## PRÓXIMOS PASSOS

1. ✅ Setup completo
2. [ ] Criar primeiras páginas React (novo diagnóstico, visualizar resultado)
3. [ ] Implementar gráficos (Radar, Heatmap)
4. [ ] Gerar PDFs
5. [ ] Integrar com Neurocorp 360
6. [ ] Deploy em produção

---

**Dúvidas?** Verifique os comentários no código ou abra uma issue.
