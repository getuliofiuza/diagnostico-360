# API v1 — Diagnóstico Empresarial 360°

API REST autenticada por chave para sistemas externos (Neurocorp 360, etc.) criarem e consultarem diagnósticos.

**Base URL:** `https://diagnostico-360-taupe.vercel.app/api/v1`

---

## 🔑 Autenticação

Todas as requisições exigem o header **`X-API-Key`**:

```http
X-API-Key: dgn_live_xxxxxxxxxxxxxxxxxxxxxxxx
```

As chaves são geradas pelo admin em **`/admin/api-keys`** (Painel Admin → 🔑 API Keys → Nova chave).

⚠️ A chave em texto claro só é exibida **uma vez** no momento da criação. Guarde em local seguro.

### Erros de autenticação

| Status | Quando | Resposta |
|--------|--------|----------|
| 401 | Header ausente ou formato inválido | `{"error": "API key ausente..."}` |
| 403 | Chave inválida, revogada ou expirada | `{"error": "API key inválida..."}` |
| 403 | Chave sem o scope necessário | `{"error": "API key sem permissão..."}` |

---

## 📋 Endpoints

### `POST /api/v1/diagnosticos` — Criar diagnóstico

Recebe respostas + dados da empresa, calcula escores, persiste e retorna o resultado.

**Headers:**
```http
X-API-Key: dgn_live_...
Content-Type: application/json
```

**Body (obrigatório):**
```json
{
  "external_workspace_id": "ws_abc123",
  "external_user_id": "user_xyz789",
  "external_system": "neurocorp_360",

  "empresa_nome": "Acme Ltda",
  "setor": "Serviços",
  "porte": "Pequena",
  "respondente_nome": "João Silva",
  "respondente_email": "joao@acme.com",

  "respostas": [
    { "questao_id": 1, "resposta": "A", "pontos": 10, "tema": "Planejamento e Estratégia" },
    { "questao_id": 2, "resposta": "B", "pontos": 8, "tema": "Planejamento e Estratégia" }
  ]
}
```

**Body (campos opcionais):**
- `respondente_telefone`, `endereco`, `municipio`, `microrregiao`, `mesorregiao`
- `faturamento_anual`, `num_funcionarios`, `tempo_mercado_anos`
- `atividade_cnae`
- `narrativa_gestor`, `diferencial_competitivo`, `dores_principais`

**Resposta 201:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "external_workspace_id": "ws_abc123",
  "external_user_id": "user_xyz789",
  "escore_geral": 6.4,
  "maturidade": "INICIAL",
  "risco_geral": 8.2,
  "report_url": "https://diagnostico-360-taupe.vercel.app/diagnostico/550e8400-...",
  "created_at": "2026-06-15T13:24:18.000Z"
}
```

**Setores válidos:** `Comércio` · `Serviços` · `Indústria` · `Produtor Rural`
**Portes válidos:** `Micro` · `Pequena` · `Média` · `Grande`

---

### `GET /api/v1/diagnosticos/:id` — Recuperar relatório completo

**Headers:**
```http
X-API-Key: dgn_live_...
```

**Resposta 200:**
```json
{
  "id": "550e8400-...",
  "external_workspace_id": "ws_abc123",
  "external_user_id": "user_xyz789",
  "external_system": "neurocorp_360",

  "empresa": {
    "nome": "Acme Ltda",
    "setor": "Serviços",
    "porte": "Pequena",
    "municipio": "Porto Velho",
    "atividade_cnae": "Consultoria em gestão empresarial",
    "faturamento_anual": 600000,
    "num_funcionarios": 15,
    "tempo_mercado_anos": 5
  },
  "respondente": {
    "nome": "João Silva",
    "email": "joao@acme.com",
    "telefone": "11999999999"
  },
  "qualitativos": {
    "narrativa_gestor": "...",
    "diferencial_competitivo": "...",
    "dores_principais": "..."
  },

  "escore_geral": 6.4,
  "maturidade": "INICIAL",
  "risco_geral": 8.2,
  "escores": [
    { "area": "Planejamento e Estratégia", "escore": 7.2 },
    { "area": "Recursos Humanos", "escore": 5.4 }
  ],
  "matriz_risco": [
    {
      "area": "Financeiro",
      "escore": 4.0,
      "criticidade_peso": 3.0,
      "risco_score": 18.0,
      "classificacao": "CRÍTICO",
      "prioridade": 1
    }
  ],
  "pdi": [
    {
      "area": "Financeiro",
      "escore_atual": 4.0,
      "escore_meta": 7.0,
      "acao_descricao": "Implementar fluxo de caixa diário",
      "acao_prazo": "30 dias",
      "fase": "imediata",
      "status": "pendente"
    }
  ],
  "benchmark": {
    "Planejamento e Estratégia": 6.1,
    "Recursos Humanos": 7.2,
    "Estoque": 5.8,
    "Financeiro": 5.5
  },
  "observacoes": [
    { "questao_id": 42, "tema": "Marketing e Vendas", "texto": "Comentário livre do respondente" }
  ],

  "criado_em": "2026-06-15T13:24:18.000Z",
  "report_url": "https://diagnostico-360-taupe.vercel.app/diagnostico/550e8400-..."
}
```

**Restrição:** o diagnóstico só pode ser lido pela mesma API key que o criou. Tentativa de acesso com chave diferente retorna **403**.

---

### `GET /api/v1/diagnosticos?workspace_id=X` — Listar diagnósticos

**Headers:**
```http
X-API-Key: dgn_live_...
```

**Query params (opcionais):**
- `workspace_id` (ou `external_workspace_id`) — filtra por workspace
- `user_id` (ou `external_user_id`) — filtra por usuário
- `limit` — máximo 200 (default 50)

**Resposta 200:**
```json
{
  "data": [
    {
      "id": "550e8400-...",
      "empresa_nome": "Acme Ltda",
      "setor": "Serviços",
      "porte": "Pequena",
      "respondente_nome": "João Silva",
      "respondente_email": "joao@acme.com",
      "escore_geral": 6.4,
      "maturidade": "INICIAL",
      "risco_geral": 8.2,
      "external_workspace_id": "ws_abc123",
      "external_user_id": "user_xyz789",
      "criado_em": "2026-06-15T13:24:18.000Z"
    }
  ],
  "count": 1
}
```

A lista só inclui diagnósticos criados pela própria API key (isolamento automático por chave).

---

## 🔒 Scopes

Cada API key tem scopes que controlam o que ela pode fazer:

| Scope | Descrição |
|-------|-----------|
| `diagnosticos:read` | Listar e ler diagnósticos |
| `diagnosticos:write` | Criar novos diagnósticos |
| `*` | Wildcard (todos os scopes) |

Por padrão, novas chaves recebem `['diagnosticos:read', 'diagnosticos:write']`.

---

## 📦 Exemplo: Integração Neurocorp 360

```typescript
// src/tools/saude-empresarial/api/diagnostico360.ts

const API_BASE = 'https://diagnostico-360-taupe.vercel.app/api/v1'
const API_KEY = import.meta.env.VITE_DIAGNOSTICO_360_API_KEY

export async function criarDiagnostico(payload: any) {
  const res = await fetch(`${API_BASE}/diagnosticos`, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      external_workspace_id: payload.workspace_id,
      external_user_id: payload.user_id,
      external_system: 'neurocorp_360',
      ...payload.dados,
    }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function obterRelatorio(id: string) {
  const res = await fetch(`${API_BASE}/diagnosticos/${id}`, {
    headers: { 'X-API-Key': API_KEY },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function listarPorWorkspace(workspaceId: string) {
  const res = await fetch(`${API_BASE}/diagnosticos?workspace_id=${workspaceId}`, {
    headers: { 'X-API-Key': API_KEY },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
```

---

## 📊 Códigos de status

| Código | Significado |
|--------|-------------|
| `200` | OK (GET bem-sucedido) |
| `201` | Created (diagnóstico criado) |
| `400` | Payload inválido (validação Zod falhou) |
| `401` | Sem API key |
| `403` | API key inválida, sem permissão ou tentando acessar diagnóstico de outra chave |
| `404` | Diagnóstico não encontrado |
| `500` | Erro interno |

---

## 🛡️ Boas práticas

1. **Guarde a chave em variável de ambiente**, nunca commit no Git
2. **Use chaves diferentes** para staging e production
3. **Revogue imediatamente** se suspeitar de comprometimento (`DELETE /api/admin/api-keys/:id`)
4. **Monitor uso** via painel `/admin/api-keys` (mostra `total_chamadas` e `ultima_utilizacao`)
5. **Passe sempre `external_workspace_id`** — é como você vai filtrar/listar depois
