-- ============================================================================
-- MIGRATION TIER 2: Dados aprofundados por área (Anexo XXVII completo)
-- ============================================================================
-- Adiciona todos os campos quantitativos detalhados solicitados:
-- - Planejamento: critério de decisão, deficiências
-- - RH: colaboradores por área, salários, movimentação, vagas, gargalos
-- - Estoque: portfolio, unidade, valor médio, deficiências
-- - Financeiro: faturamento mensal, custos, endividamento %, ticket, margem,
--   ponto equilíbrio, meses de vendas, deficiências
-- - Marketing: ociosidade, critério de preço, busca clientes, CAC, deficiências

-- PLANEJAMENTO ESTRATÉGICO
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS criterio_decisao_estrategica TEXT;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS deficiencias_gestao TEXT[];
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS deficiencias_gestao_outros TEXT;

-- RECURSOS HUMANOS
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS num_colab_operacional INTEGER;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS num_colab_comercial INTEGER;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS num_colab_administrativo INTEGER;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS media_salarial_operacional NUMERIC;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS media_salarial_comercial NUMERIC;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS media_salarial_administrativo NUMERIC;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS admissoes_trimestre INTEGER;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS demissoes_trimestre INTEGER;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS vagas_abertas INTEGER;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS folha_pagamento_mensal NUMERIC;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS gargalos_rh TEXT[];

-- ESTOQUE
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS estoque_medio_mensal NUMERIC;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS num_itens_portfolio INTEGER;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS unidade_medida_estoque TEXT;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS deficiencias_estoque TEXT[];

-- FINANCEIRO
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS faturamento_mensal NUMERIC;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS custo_fixo_mensal NUMERIC;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS custo_variavel_mensal NUMERIC;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS possui_endividamento BOOLEAN;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS endividamento_banco_pct NUMERIC;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS endividamento_fornecedor_pct NUMERIC;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS endividamento_factoring_pct NUMERIC;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS endividamento_fisco_pct NUMERIC;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS endividamento_sefaz_pct NUMERIC;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS endividamento_outros_pct NUMERIC;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS ticket_medio NUMERIC;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS margem_contribuicao_pct NUMERIC;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS ponto_equilibrio NUMERIC;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS melhores_meses_vendas TEXT[];
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS piores_meses_vendas TEXT[];
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS deficiencias_financeiro TEXT[];

-- MARKETING / VENDAS
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS ociosidade_vendas TEXT;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS criterio_preco_vendas TEXT;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS busca_clientes TEXT[];
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS cac_novos_clientes NUMERIC;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS posicao_preco_concorrencia TEXT;
ALTER TABLE diagnosticos_360 ADD COLUMN IF NOT EXISTS deficiencias_marketing TEXT[];
