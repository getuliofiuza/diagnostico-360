# 🧪 GUIA DE TESTES - API DIAGNÓSTICO 360°

## ✅ STATUS: API FUNCIONANDO PERFEITAMENTE!

Demonstração com endpoint de teste que **não requer Supabase**:  
**POST http://localhost:3000/api/diagnosticos/teste**

---

## 📊 EXEMPLO DE RESPOSTA

Escore geral: **7.2/10** (PLENA)  
Áreas críticas: 2 (Financeiro CRÍTICO, RH CRÍTICO)  
Áreas fortes: 5 (Planejamento, Estoque, Tech, Relações, Tendências)

---

## 🚀 TESTE 1: Score Baixo (Empresa em Dificuldade)

```bash
curl -X POST http://localhost:3000/api/diagnosticos/teste \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "test-001",
    "empresa_nome": "Loja Pequena Com Problemas",
    "setor": "Comércio",
    "porte": "Micro",
    "respondente_nome": "Maria Silva",
    "respondente_email": "maria@loja.com",
    "respostas": [
      {"questao_id": 1, "resposta": "E", "pontos": 2, "tema": "Planejamento e Estratégia"},
      {"questao_id": 2, "resposta": "E", "pontos": 2, "tema": "Planejamento e Estratégia"},
      {"questao_id": 3, "resposta": "D", "pontos": 4, "tema": "Recursos Humanos"},
      {"questao_id": 4, "resposta": "E", "pontos": 2, "tema": "Logística"},
      {"questao_id": 5, "resposta": "E", "pontos": 2, "tema": "Financeiro"},
      {"questao_id": 6, "resposta": "E", "pontos": 2, "tema": "Tecnologia da Informação"},
      {"questao_id": 7, "resposta": "D", "pontos": 4, "tema": "Relações Institucionais"},
      {"questao_id": 8, "resposta": "D", "pontos": 4, "tema": "Estoque"},
      {"questao_id": 9, "resposta": "E", "pontos": 2, "tema": "Marketing e Vendas"},
      {"questao_id": 10, "resposta": "E", "pontos": 2, "tema": "Projeções e Tendências"}
    ]
  }' | jq '.escore_geral, .maturidade, .pdi[0:2]'
```

**Resultado esperado:**
- Escore geral: ~2.6/10 (NULA)
- Maturidade: Nula (precisa de ação imediata em todas as áreas)
- PDI com recomendações urgentes

---

## 🚀 TESTE 2: Score Alto (Empresa Excelente)

```bash
curl -X POST http://localhost:3000/api/diagnosticos/teste \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "test-002",
    "empresa_nome": "Consultoria Premium",
    "setor": "Serviços",
    "porte": "Média",
    "respondente_nome": "Fernando Costa",
    "respondente_email": "fernando@consultoria.com",
    "respostas": [
      {"questao_id": 1, "resposta": "A", "pontos": 10, "tema": "Planejamento e Estratégia"},
      {"questao_id": 2, "resposta": "A", "pontos": 10, "tema": "Planejamento e Estratégia"},
      {"questao_id": 3, "resposta": "A", "pontos": 10, "tema": "Recursos Humanos"},
      {"questao_id": 4, "resposta": "A", "pontos": 10, "tema": "Logística"},
      {"questao_id": 5, "resposta": "A", "pontos": 10, "tema": "Financeiro"},
      {"questao_id": 6, "resposta": "A", "pontos": 10, "tema": "Tecnologia da Informação"},
      {"questao_id": 7, "resposta": "A", "pontos": 10, "tema": "Relações Institucionais"},
      {"questao_id": 8, "resposta": "A", "pontos": 10, "tema": "Estoque"},
      {"questao_id": 9, "resposta": "A", "pontos": 10, "tema": "Marketing e Vendas"},
      {"questao_id": 10, "resposta": "A", "pontos": 10, "tema": "Projeções e Tendências"}
    ]
  }' | jq '.escore_geral, .maturidade, .matriz_risco'
```

**Resultado esperado:**
- Escore geral: 10/10 (AVANÇADA)
- Zero áreas críticas
- Narrativa: "Excelência operacional"

---

## 🧪 TESTE 3: Resposta Customizada (Você Define os Scores)

Crie um arquivo `payload.json`:

```json
{
  "tenant_id": "seu-tenant-id",
  "empresa_nome": "Sua Empresa",
  "setor": "Comércio",
  "porte": "Pequena",
  "respondente_nome": "Seu Nome",
  "respondente_email": "seu@email.com",
  "respostas": [
    {"questao_id": 1, "resposta": "A", "pontos": 10, "tema": "Planejamento e Estratégia"},
    {"questao_id": 2, "resposta": "B", "pontos": 8, "tema": "Planejamento e Estratégia"},
    {"questao_id": 3, "resposta": "C", "pontos": 6, "tema": "Recursos Humanos"},
    {"questao_id": 4, "resposta": "D", "pontos": 4, "tema": "Logística"},
    {"questao_id": 5, "resposta": "E", "pontos": 2, "tema": "Financeiro"},
    {"questao_id": 6, "resposta": "A", "pontos": 10, "tema": "Tecnologia da Informação"},
    {"questao_id": 7, "resposta": "B", "pontos": 8, "tema": "Relações Institucionais"},
    {"questao_id": 8, "resposta": "A", "pontos": 10, "tema": "Estoque"},
    {"questao_id": 9, "resposta": "C", "pontos": 6, "tema": "Marketing e Vendas"},
    {"questao_id": 10, "resposta": "A", "pontos": 10, "tema": "Projeções e Tendências"}
  ]
}
```

Depois execute:
```bash
curl -X POST http://localhost:3000/api/diagnosticos/teste \
  -H "Content-Type: application/json" \
  -d @payload.json | jq .
```

---

## 📈 O QUE O ENDPOINT RETORNA

### 1. **Escores por Área** (0-10)
- Planejamento e Estratégia
- Recursos Humanos
- Estoque
- Financeiro
- Tecnologia da Informação
- Relações Institucionais
- Logística
- Marketing e Vendas
- Projeções e Tendências

### 2. **Matriz de Risco** (Priorizado por criticidade)
- Área
- Escore (0-10)
- Risco Score (calculado)
- Classificação (CRÍTICO | ALTO | MÉDIO | BAIXO | OK)
- Prioridade (1 = mais crítico)

### 3. **Dados para Gráficos**
- Radar data (9 eixos)
- Benchmark comparison (vs. setor)

### 4. **Narrativa** (Interpretação em Português)
- Diagnóstico geral
- Áreas críticas (com ações)
- Áreas fortes
- Recomendações

### 5. **PDI** (Plano de Desenvolvimento Individual)
- Ações recomendadas por área
- Fase (Imediata, Curto Prazo, Longo Prazo)
- Prazo estimado
- Descrição detalhada

---

## 🔍 INTERPRETAÇÃO DOS RESULTADOS

### Escore Geral
- **0-2.0**: NULA (ação imediata em todas áreas)
- **2.1-4.0**: BÁSICA (estrutura muito frágil)
- **4.1-6.0**: INICIAL (estrutura presente mas precisa melhorias)
- **6.1-8.0**: PLENA (bem estruturado, oportunidades de otimização)
- **8.1-10.0**: AVANÇADA (excelência operacional)

### Matriz de Risco
Formula: **(10 - escore) × criticidade_por_área**

Áreas com maior criticidade (ponderação):
1. **Financeiro** (3.0x) - Risco máximo: 30
2. **Tecnologia** (2.0x) - Risco máximo: 20
3. **RH** (2.0x) - Risco máximo: 20

---

## 📝 PRÓXIMAS ETAPAS

Depois de testar este endpoint:

### ✅ Usar Supabase Cloud para persistir dados
1. Criar conta em https://supabase.com (grátis)
2. Copiar credenciais em `.env.local`
3. Executar schema.sql no Supabase
4. Testar endpoint de produção: `POST /api/diagnosticos/criar`

### ✅ Criar páginas React
```bash
# Home page
app/page.tsx

# Novo diagnóstico (usa <NovoDiagnostico /> existente)
app/diagnostico/novo/page.tsx

# Visualizar resultados
app/diagnostico/[id]/page.tsx

# Dashboard
app/diagnosticos/page.tsx
```

### ✅ Implementar gráficos
- RadarChart (Recharts)
- HeatmapTable (CSS + table)
- PDITimeline (componente custom)

---

## 🔧 COMO DEBUGAR

Se obter erro, verifique:

```bash
# 1. Dev server rodando?
lsof -i :3000

# 2. Arquivo foi modificado?
curl http://localhost:3000/api/diagnosticos/teste

# 3. Estrutura do payload
jq . payload.json

# 4. Logs do servidor (se disponível)
# Procure por "Erro no endpoint" nos logs
```

---

## ✨ DEMONSTRAÇÃO VISUAL

```
Entrada (Respostas):
┌─────────────────────────┐
│ 10 questões             │
│ Scores: 2-10 cada       │
│ Temas: 9 áreas          │
└─────────────────────────┘
            ↓
┌─────────────────────────┐
│  CÁLCULO               │
│  Agregação por área    │
│  Normalização (0-10)   │
│  Classificação risco   │
│  Geração PDI           │
└─────────────────────────┘
            ↓
Saída (Diagnóstico Completo):
┌──────────────────────────────┐
│ Escore geral: 7.2/10 PLENA   │
│ Matriz risco: 9 itens        │
│ PDI: 15+ ações               │
│ Narrativa: Interpretação     │
│ Gráficos: Radar + Benchmark  │
└──────────────────────────────┘
```

---

**Pronto para testar? Execute o primeiro curl acima! 🚀**
