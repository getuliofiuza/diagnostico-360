-- ============================================================================
-- NEUROCORP 360° — MÓDULO ANÁLISE SWOT
-- ============================================================================
-- Extensão do Diagnóstico 360°: aprofunda os GAPS levantados, área por área,
-- ordenados do mais crítico ao menos crítico.
--
-- Cole este SQL inteiro no SQL Editor do Supabase e clique "Run".
-- (Idempotente — pode rodar mais de uma vez sem erro.)
-- ============================================================================

-- ============================================================================
-- 1. TABELA: ANÁLISE SWOT (1 por diagnóstico)
-- ============================================================================

CREATE TABLE IF NOT EXISTS swot_analises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostico_id UUID NOT NULL REFERENCES diagnosticos_360(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Quem está conduzindo o aprofundamento (autoresponsabilidade)
  responsavel_nome TEXT,
  responsavel_papel TEXT CHECK (responsavel_papel IN ('Empresário', 'Consultor', 'Ambos')),

  -- Síntese estratégica consolidada (preenchida ao final)
  sintese_estrategica TEXT,

  status TEXT NOT NULL DEFAULT 'EM_ANDAMENTO'
    CHECK (status IN ('EM_ANDAMENTO', 'CONCLUIDA')),

  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Uma análise SWOT por diagnóstico
  UNIQUE (diagnostico_id)
);

CREATE INDEX IF NOT EXISTS idx_swot_diagnostico ON swot_analises(diagnostico_id);
CREATE INDEX IF NOT EXISTS idx_swot_tenant ON swot_analises(tenant_id);

-- ============================================================================
-- 2. TABELA: ITENS SWOT (1 por área do diagnóstico)
-- ============================================================================
-- Cada área avaliada no diagnóstico vira um "item" de aprofundamento SWOT.
-- A ordem (prioridade) acompanha a matriz de risco: mais crítico primeiro.

CREATE TABLE IF NOT EXISTS swot_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swot_id UUID NOT NULL REFERENCES swot_analises(id) ON DELETE CASCADE,

  -- Contexto herdado do diagnóstico (snapshot, para não depender de recálculo)
  area TEXT NOT NULL,
  escore DECIMAL(3,1),
  risco_score DECIMAL(4,1),
  classificacao TEXT,        -- CRÍTICO | ALTO | MÉDIO | BAIXO | OK
  prioridade INT NOT NULL,   -- 1 = mais crítico

  -- Os 4 quadrantes da SWOT (preenchimento do consultor/empresário)
  forcas TEXT,           -- Strengths  — o que a empresa JÁ tem que sustenta esta área
  fraquezas TEXT,        -- Weaknesses — lacunas internas que geram o gap
  oportunidades TEXT,    -- Opportunities — fatores externos a aproveitar
  ameacas TEXT,          -- Threats — riscos externos se o gap não for tratado

  -- Aprofundamento e ação (autoresponsabilidade)
  causa_raiz TEXT,
  estrategia TEXT,            -- estratégia cruzada (SO/WO/ST/WT)
  acao_responsavel TEXT,
  acao_prazo TEXT,

  concluido BOOLEAN NOT NULL DEFAULT false,

  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE (swot_id, area)
);

CREATE INDEX IF NOT EXISTS idx_swot_itens_swot ON swot_itens(swot_id);
CREATE INDEX IF NOT EXISTS idx_swot_itens_prioridade ON swot_itens(swot_id, prioridade);

-- ============================================================================
-- 3. TRIGGERS: atualizar timestamp
-- ============================================================================
-- Reaproveita trigger_atualizar_timestamp() já criado no schema base.

DROP TRIGGER IF EXISTS atualizar_swot_analises_timestamp ON swot_analises;
CREATE TRIGGER atualizar_swot_analises_timestamp
  BEFORE UPDATE ON swot_analises
  FOR EACH ROW
  EXECUTE FUNCTION trigger_atualizar_timestamp();

DROP TRIGGER IF EXISTS atualizar_swot_itens_timestamp ON swot_itens;
CREATE TRIGGER atualizar_swot_itens_timestamp
  BEFORE UPDATE ON swot_itens
  FOR EACH ROW
  EXECUTE FUNCTION trigger_atualizar_timestamp();

-- ============================================================================
-- FIM - Clique "Run" para executar!
-- ============================================================================
