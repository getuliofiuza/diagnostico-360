-- ============================================================================
-- MIGRATION: Diagnóstico 360 v2 - Nova área Governança + campos do Anexo XXVII
-- ============================================================================
-- Adiciona a 10ª área (Gestão de Processos e Governança) e todos os campos
-- da 1ª parte do questionário oficial (Anexo XXVII) + sugestões qualitativas

-- 1. Nova coluna de escore para a 10ª área
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS escore_governanca NUMERIC;

-- 2. Localização (do Anexo XXVII - cabeçalho)
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS municipio TEXT;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS microrregiao TEXT;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS mesorregiao TEXT;

-- 3. Dados da empresa (do Anexo XXVII - 1ª PARTE)
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS atividade_cnae TEXT;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS frequencia_clientes_dia INTEGER;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS clientes_efetivos_dia INTEGER;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS area_total_m2 NUMERIC;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS area_construida_m2 NUMERIC;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS possui_filiais BOOLEAN;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS num_filiais INTEGER;

-- 4. Sobre o gestor principal
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS tempo_gestor_anos NUMERIC;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS idade_gestor_faixa TEXT;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS origem_gestor TEXT;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS escolaridade_gestor TEXT;

-- 5. Campos qualitativos (sugeridos pela B&G)
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS narrativa_gestor TEXT;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS diferencial_competitivo TEXT;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS dores_principais TEXT;
