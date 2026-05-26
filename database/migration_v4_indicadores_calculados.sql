-- ============================================================================
-- MIGRATION v4: Setores ampliados + indicadores calculados + campos novos
-- ============================================================================

-- 1. Despesas variáveis (separadas de Custos Variáveis)
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS despesa_variavel_mensal NUMERIC;

-- 2. Renomear conceito: clientes/dia -> clientes/mês e vendas/mês
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS clientes_atendidos_mes INTEGER;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS vendas_servicos_mes INTEGER;

-- 3. Unidade de medida do estoque agora aceita múltipla seleção
-- (a coluna unidade_medida_estoque já existe como TEXT,
-- vamos manter por compat — array vira TEXT[] no novo campo)
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS unidade_medida_estoque_arr TEXT[];

-- 4. Se a coluna setor tinha CHECK constraint, precisamos ampliá-la
-- Se houver erro abaixo, ignore (significa que não havia constraint)
DO $$
BEGIN
  ALTER TABLE diagnosticos_360 DROP CONSTRAINT IF EXISTS diagnosticos_360_setor_check;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
