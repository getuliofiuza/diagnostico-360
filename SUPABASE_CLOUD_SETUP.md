# ⚡ SUPABASE CLOUD SETUP (5 min)

## 1. CREATE SUPABASE ACCOUNT

1. Go to https://supabase.com
2. Click "Sign up"
3. Use GitHub or Email (GitHub is faster)
4. Create your account

## 2. CREATE NEW PROJECT

1. Click "New Project"
2. Fill in:
   - **Name**: `diagnostico-360`
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose the closest to you (e.g., us-east-1)
3. Click "Create new project"
4. Wait 2-3 minutes for the project to initialize

## 3. GET YOUR CREDENTIALS

Once the project is ready:

1. Go to **Settings** → **API** (or Project Settings)
2. You'll see:
   - **Project URL** (copy this)
   - **anon key** (public key, copy this)
   - **service_role key** (private key, copy this)

3. Open `.env.local` and update:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_URL.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## 4. LOAD DATABASE SCHEMA

1. In Supabase Dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy entire content from `database/schema.sql` (locally)
4. Paste into the SQL editor
5. Click "Run"
6. Wait for it to complete

## 5. RESTART DEV SERVER

```bash
# Kill the current server (Ctrl+C if running in terminal)
# Then restart:
npm run dev
```

## 6. TEST API

```bash
# Test creating a diagnostic
curl -X POST http://localhost:3000/api/diagnosticos/criar \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
    "empresa_nome": "Test Company",
    "setor": "Comércio",
    "porte": "Pequena",
    "respondente_nome": "João Silva",
    "respondente_email": "joao@test.com",
    "respostas": [
      {"questao_id": 1, "resposta": "A", "pontos": 10, "tema": "Planejamento e Estratégia"},
      {"questao_id": 2, "resposta": "B", "pontos": 8, "tema": "Planejamento e Estratégia"},
      {"questao_id": 3, "resposta": "C", "pontos": 6, "tema": "RH e Gestão de Pessoas"},
      {"questao_id": 4, "resposta": "D", "pontos": 4, "tema": "Logística e Cadeia de Suprimentos"},
      {"questao_id": 5, "resposta": "E", "pontos": 2, "tema": "Gestão Financeira"},
      {"questao_id": 6, "resposta": "A", "pontos": 10, "tema": "Tecnologia da Informação"},
      {"questao_id": 7, "resposta": "B", "pontos": 8, "tema": "Relações com Clientes e Fornecedores"},
      {"questao_id": 8, "resposta": "A", "pontos": 10, "tema": "Estoque e Inventário"},
      {"questao_id": 9, "resposta": "C", "pontos": 6, "tema": "Marketing e Comunicação"},
      {"questao_id": 10, "resposta": "A", "pontos": 10, "tema": "Tendências e Inovação"}
    ]
  }'
```

You should get a response like:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "escore_geral": 7.4,
  "maturidade": "INICIAL",
  "status": "criado"
}
```

## 7. RETRIEVE DIAGNOSTIC

```bash
curl http://localhost:3000/api/diagnosticos/550e8400-e29b-41d4-a716-446655440001
```

## ⏱️ TOTAL TIME: ~5 minutes

---

**Troubleshooting:**
- "Invalid credentials" → Check that you copied the keys correctly
- "Tables not found" → Make sure you ran the SQL schema
- "Port 3000 in use" → Kill the process: `lsof -i :3000` then `kill PID`

Done! Now your API is fully functional. 🚀
