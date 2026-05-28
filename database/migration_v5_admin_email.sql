-- ============================================================================
-- MIGRATION v5: Sistema Admin + Isolamento por usuário + Email
-- ============================================================================

-- 1. Coluna is_admin em tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 2. Marcar o usuário getuliofiuza@gmail.com como ADMIN
-- (substitua pelo seu email se for outro)
UPDATE tenants
SET is_admin = true
WHERE email = 'getuliofiuza@gmail.com';

-- 3. Verificar quem é admin (apenas leitura)
SELECT id, nome, email, is_admin
FROM tenants
WHERE is_admin = true;
