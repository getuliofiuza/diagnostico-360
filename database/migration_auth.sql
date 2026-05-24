-- ============================================================================
-- MIGRAÇÃO: Adicionar autenticação à tabela tenants
-- ============================================================================

-- Adicionar colunas de auth
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plano TEXT DEFAULT 'free';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS email TEXT;

-- Criar índice para busca por owner_id
CREATE INDEX IF NOT EXISTS idx_tenants_owner_id ON tenants(owner_id);
