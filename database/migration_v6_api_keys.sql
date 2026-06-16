-- ============================================================================
-- MIGRATION v6: API headless v1 — autenticação por API key
-- ============================================================================
-- Permite que sistemas externos (Neurocorp 360, etc) consumam o Diagnóstico
-- via API REST autenticada por chave (X-API-Key header).
--
-- Decisões de design:
-- - As chaves são armazenadas APENAS como hash SHA-256 (nunca em texto claro)
-- - O prefixo (12 primeiros chars) fica visível para identificação
-- - external_workspace_id e external_user_id permitem rastrear de qual sistema
--   externo veio o diagnóstico (Neurocorp, outro tool, etc)
-- - Não cria nova tabela tenants — usa um tenant especial "external_api" para
--   diagnósticos criados via API
-- ============================================================================

-- 1. Tabela de API keys
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,                  -- "Neurocorp 360 Production"
  descricao TEXT,                      -- contexto de uso
  key_hash TEXT NOT NULL UNIQUE,       -- SHA-256 da chave (nunca o texto claro)
  prefix TEXT NOT NULL,                -- "dgn_live_a1b2c3..." (12 chars visíveis)
  scopes TEXT[] DEFAULT ARRAY['diagnosticos:read', 'diagnosticos:write'],
  ativo BOOLEAN DEFAULT true,
  ultima_utilizacao TIMESTAMPTZ,
  total_chamadas INTEGER DEFAULT 0,
  criado_por UUID,                     -- user.id do admin que criou
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  expira_em TIMESTAMPTZ                -- NULL = não expira
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(prefix);

-- 2. Colunas em diagnosticos_360 para rastrear origem externa
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS external_system TEXT;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS external_workspace_id TEXT;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS external_user_id TEXT;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS api_key_id UUID REFERENCES api_keys(id);

CREATE INDEX IF NOT EXISTS idx_diagnosticos_external_workspace
  ON diagnosticos_360(external_system, external_workspace_id)
  WHERE external_workspace_id IS NOT NULL;

-- 3. Tenant especial para diagnósticos via API externa
INSERT INTO tenants (id, nome, email, plano)
VALUES ('00000000-0000-0000-0000-0000000000a1', 'API Externa', 'api@diagnostico360.com', 'enterprise')
ON CONFLICT (id) DO NOTHING;

-- 4. View útil pra admin ver estatísticas de uso da API
CREATE OR REPLACE VIEW api_keys_stats AS
SELECT
  k.id,
  k.nome,
  k.prefix,
  k.ativo,
  k.criado_em,
  k.ultima_utilizacao,
  k.total_chamadas,
  COUNT(d.id) as total_diagnosticos_criados
FROM api_keys k
LEFT JOIN diagnosticos_360 d ON d.api_key_id = k.id
GROUP BY k.id, k.nome, k.prefix, k.ativo, k.criado_em, k.ultima_utilizacao, k.total_chamadas;

-- 5. Verificar tudo
SELECT 'api_keys' as tabela, COUNT(*) as registros FROM api_keys
UNION ALL
SELECT 'tenant API externa', COUNT(*) FROM tenants WHERE id = '00000000-0000-0000-0000-0000000000a1';
