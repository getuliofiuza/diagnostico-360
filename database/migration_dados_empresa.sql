-- ============================================================================
-- MIGRATION: Adicionar campos de dados da empresa
-- ============================================================================
-- Campos quantitativos e de contato que estavam faltando comparado ao template original

ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS respondente_telefone TEXT;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS endereco TEXT;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS faturamento_anual NUMERIC;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS num_funcionarios INTEGER;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS tempo_mercado_anos INTEGER;
