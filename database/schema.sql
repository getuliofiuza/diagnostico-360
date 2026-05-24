-- ============================================================================
-- DIAGNÓSTICO GERENCIAL 360° - SCHEMA COMPLETO
-- ============================================================================
-- Data: 24/05/2026
-- Banco: Supabase (PostgreSQL)
-- Propósito: Multi-tenant diagnostics com isolamento via RLS

-- ============================================================================
-- 1. TABELAS BASE (já existentes no Neurocorp - referência)
-- ============================================================================

-- Assumindo que estas tabelas já existem:
-- - auth.users (do Supabase Auth)
-- - public.tenants (para multi-tenancy)
-- - public.tenant_users (relacionamento)

-- ============================================================================
-- 2. TABELA PRINCIPAL: DIAGNÓSTICOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS diagnosticos_360 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Informações básicas
  empresa_nome TEXT NOT NULL,
  data_aplicacao DATE DEFAULT CURRENT_DATE,
  respondente_nome TEXT NOT NULL,
  respondente_email TEXT NOT NULL,

  -- Configuração
  setor TEXT NOT NULL CHECK (setor IN ('Comércio', 'Serviços')),
  porte TEXT NOT NULL CHECK (porte IN ('Micro', 'Pequena', 'Média', 'Grande')),

  -- Escores por área (0-10)
  escore_planejamento DECIMAL(3,1),
  escore_rh DECIMAL(3,1),
  escore_estoque DECIMAL(3,1),
  escore_financeiro DECIMAL(3,1),
  escore_tecnologia DECIMAL(3,1),
  escore_relacoes DECIMAL(3,1),
  escore_logistica DECIMAL(3,1),
  escore_marketing DECIMAL(3,1),
  escore_tendencias DECIMAL(3,1),

  -- Índices agregados
  escore_geral DECIMAL(3,1),
  maturidade TEXT CHECK (maturidade IN ('NULA', 'BÁSICA', 'INICIAL', 'PLENA', 'AVANÇADA')),
  risco_geral DECIMAL(3,1),

  -- Dados brutos (JSON)
  respostas_json JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Metadata
  criado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT email_valido CHECK (respondente_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Índices para performance
CREATE INDEX idx_diagnosticos_tenant ON diagnosticos_360(tenant_id);
CREATE INDEX idx_diagnosticos_data ON diagnosticos_360(data_aplicacao DESC);
CREATE INDEX idx_diagnosticos_setor_porte ON diagnosticos_360(setor, porte);
CREATE INDEX idx_diagnosticos_maturidade ON diagnosticos_360(maturidade);

-- ============================================================================
-- 3. TABELA: RESPOSTAS DETALHADAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS diagnosticos_360_respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostico_id UUID NOT NULL REFERENCES diagnosticos_360(id) ON DELETE CASCADE,

  questao_id INT NOT NULL,
  resposta TEXT NOT NULL,
  pontos DECIMAL(3,1) NOT NULL,

  tema TEXT NOT NULL,

  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_respostas_diagnostico ON diagnosticos_360_respostas(diagnostico_id);
CREATE INDEX idx_respostas_questao ON diagnosticos_360_respostas(questao_id);

-- ============================================================================
-- 4. TABELA: MATRIZ DE RISCO
-- ============================================================================

CREATE TABLE IF NOT EXISTS diagnosticos_360_matriz_risco (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostico_id UUID NOT NULL REFERENCES diagnosticos_360(id) ON DELETE CASCADE,

  area TEXT NOT NULL,
  escore DECIMAL(3,1) NOT NULL,
  criticidade_peso DECIMAL(3,1) NOT NULL,
  risco_score DECIMAL(3,1) NOT NULL,
  classificacao TEXT NOT NULL CHECK (classificacao IN ('CRÍTICO', 'ALTO', 'MÉDIO', 'BAIXO', 'OK')),
  prioridade INT NOT NULL,

  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_matriz_diagnostico ON diagnosticos_360_matriz_risco(diagnostico_id);
CREATE INDEX idx_matriz_area ON diagnosticos_360_matriz_risco(area);

-- ============================================================================
-- 5. TABELA: PDI (PLANO DE DESENVOLVIMENTO)
-- ============================================================================

CREATE TABLE IF NOT EXISTS diagnosticos_360_pdi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostico_id UUID NOT NULL REFERENCES diagnosticos_360(id) ON DELETE CASCADE,

  area TEXT NOT NULL,
  escore_atual DECIMAL(3,1) NOT NULL,
  escore_meta DECIMAL(3,1),

  acao_descricao TEXT NOT NULL,
  acao_prazo TEXT NOT NULL,
  acao_responsavel TEXT,

  fase INT CHECK (fase IN (1, 2, 3)),  -- 1: Imediata (0-30d), 2: Curto prazo (30-90d), 3: Longo prazo (90+d)
  status TEXT DEFAULT 'PLANEJADO' CHECK (status IN ('PLANEJADO', 'EM_ANDAMENTO', 'CONCLUÍDO')),

  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pdi_diagnostico ON diagnosticos_360_pdi(diagnostico_id);
CREATE INDEX idx_pdi_status ON diagnosticos_360_pdi(status);

-- ============================================================================
-- 6. TABELA: HISTÓRICO (TRENDING)
-- ============================================================================

CREATE TABLE IF NOT EXISTS diagnosticos_360_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostico_id UUID NOT NULL REFERENCES diagnosticos_360(id) ON DELETE CASCADE,

  versao INT DEFAULT 1,
  escore_geral DECIMAL(3,1),
  maturidade TEXT,

  data_snapshot TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_historico_diagnostico ON diagnosticos_360_historico(diagnostico_id);

-- ============================================================================
-- 7. TABELA: BENCHMARK (DADOS DE SETOR)
-- ============================================================================

CREATE TABLE IF NOT EXISTS diagnosticos_360_benchmark (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  setor TEXT NOT NULL,
  porte TEXT NOT NULL,

  area TEXT NOT NULL,
  escore_media DECIMAL(3,1) NOT NULL,
  escore_p25 DECIMAL(3,1),
  escore_p75 DECIMAL(3,1),

  data_atualizacao DATE DEFAULT CURRENT_DATE,
  fonte TEXT,

  UNIQUE(setor, porte, area)
);

CREATE INDEX idx_benchmark_setor_porte ON diagnosticos_360_benchmark(setor, porte);

-- ============================================================================
-- 8. TABELA: QUESTÕES
-- ============================================================================

CREATE TABLE IF NOT EXISTS diagnosticos_360_questoes (
  id INT PRIMARY KEY,

  setor TEXT NOT NULL CHECK (setor IN ('Comércio', 'Serviços')),
  porte TEXT NOT NULL CHECK (porte IN ('Micro', 'Pequena', 'Média', 'Grande', 'Todos')),

  numero INT NOT NULL,
  pergunta TEXT NOT NULL,
  tema TEXT NOT NULL,
  tipo_resposta TEXT DEFAULT 'LIKERT' CHECK (tipo_resposta IN ('LIKERT', 'BINARIA', 'MULTIPLA')),

  opcao_a TEXT,
  opcao_b TEXT,
  opcao_c TEXT,
  opcao_d TEXT,
  opcao_e TEXT,

  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_questoes_setor_porte ON diagnosticos_360_questoes(setor, porte);
CREATE INDEX idx_questoes_tema ON diagnosticos_360_questoes(tema);

-- ============================================================================
-- 9. RLS (ROW LEVEL SECURITY) - ISOLAMENTO DE TENANTS
-- ============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE diagnosticos_360 ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosticos_360_respostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosticos_360_matriz_risco ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosticos_360_pdi ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosticos_360_historico ENABLE ROW LEVEL SECURITY;

-- Políticas: Diagnósticos (SELECT)
CREATE POLICY "Tenants podem ler seus diagnósticos"
  ON diagnosticos_360 FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

-- Políticas: Diagnósticos (INSERT)
CREATE POLICY "Tenants podem criar diagnósticos"
  ON diagnosticos_360 FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

-- Políticas: Diagnósticos (UPDATE)
CREATE POLICY "Tenants podem atualizar seus diagnósticos"
  ON diagnosticos_360 FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

-- Políticas similares para respostas
CREATE POLICY "Tenants podem ler respostas"
  ON diagnosticos_360_respostas FOR SELECT
  USING (
    diagnostico_id IN (
      SELECT id FROM diagnosticos_360 WHERE tenant_id IN (
        SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- 10. FUNÇÕES ÚTEIS
-- ============================================================================

-- Função: Calcular escore por área
CREATE OR REPLACE FUNCTION diagnosticos_360_calcular_escore_area(
  p_diagnostico_id UUID,
  p_area TEXT
)
RETURNS DECIMAL(3,1) AS $$
BEGIN
  RETURN ROUND((
    COALESCE(
      SUM(pontos) FILTER (WHERE tema = p_area)
      OVER (PARTITION BY diagnostico_id),
      0
    ) / NULLIF(
      COUNT(*) FILTER (WHERE tema = p_area)
      OVER (PARTITION BY diagnostico_id),
      0
    )
  )::NUMERIC, 1);
END;
$$ LANGUAGE plpgsql;

-- Função: Classificar maturidade
CREATE OR REPLACE FUNCTION diagnosticos_360_classificar_maturidade(
  p_escore DECIMAL(3,1)
)
RETURNS TEXT AS $$
BEGIN
  IF p_escore >= 8.1 THEN
    RETURN 'AVANÇADA';
  ELSIF p_escore >= 6.1 THEN
    RETURN 'PLENA';
  ELSIF p_escore >= 4.1 THEN
    RETURN 'INICIAL';
  ELSIF p_escore >= 2.1 THEN
    RETURN 'BÁSICA';
  ELSE
    RETURN 'NULA';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Função: Classificar risco
CREATE OR REPLACE FUNCTION diagnosticos_360_classificar_risco(
  p_risco_score DECIMAL(3,1)
)
RETURNS TEXT AS $$
BEGIN
  IF p_risco_score >= 7 THEN
    RETURN 'CRÍTICO';
  ELSIF p_risco_score >= 5 THEN
    RETURN 'ALTO';
  ELSIF p_risco_score >= 3 THEN
    RETURN 'MÉDIO';
  ELSIF p_risco_score >= 1 THEN
    RETURN 'BAIXO';
  ELSE
    RETURN 'OK';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 11. TRIGGERS
-- ============================================================================

-- Trigger: Atualizar timestamp
CREATE OR REPLACE FUNCTION trigger_atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER atualizar_diagnosticos_timestamp
  BEFORE UPDATE ON diagnosticos_360
  FOR EACH ROW
  EXECUTE FUNCTION trigger_atualizar_timestamp();

CREATE TRIGGER atualizar_pdi_timestamp
  BEFORE UPDATE ON diagnosticos_360_pdi
  FOR EACH ROW
  EXECUTE FUNCTION trigger_atualizar_timestamp();

-- ============================================================================
-- 12. DADOS INICIAIS (BENCHMARK)
-- ============================================================================

INSERT INTO diagnosticos_360_benchmark (setor, porte, area, escore_media, fonte)
VALUES
  ('Comércio', 'Micro', 'Planejamento e Estratégia', 6.1, 'SEBRAE 2024'),
  ('Comércio', 'Micro', 'Recursos Humanos', 5.8, 'SEBRAE 2024'),
  ('Comércio', 'Micro', 'Estoque', 6.5, 'SEBRAE 2024'),
  ('Comércio', 'Micro', 'Financeiro', 5.5, 'SEBRAE 2024'),
  ('Comércio', 'Micro', 'Tecnologia da Informação', 4.2, 'SEBRAE 2024'),
  ('Comércio', 'Pequena', 'Planejamento e Estratégia', 6.8, 'SEBRAE 2024'),
  ('Comércio', 'Pequena', 'Recursos Humanos', 6.5, 'SEBRAE 2024'),
  ('Comércio', 'Pequena', 'Estoque', 7.0, 'SEBRAE 2024'),
  ('Comércio', 'Pequena', 'Financeiro', 6.2, 'SEBRAE 2024'),
  ('Comércio', 'Pequena', 'Tecnologia da Informação', 5.0, 'SEBRAE 2024'),
  ('Serviços', 'Micro', 'Planejamento e Estratégia', 5.9, 'SEBRAE 2024'),
  ('Serviços', 'Micro', 'Recursos Humanos', 7.2, 'SEBRAE 2024'),
  ('Serviços', 'Micro', 'Financeiro', 5.3, 'SEBRAE 2024'),
  ('Serviços', 'Pequena', 'Planejamento e Estratégia', 6.5, 'SEBRAE 2024'),
  ('Serviços', 'Pequena', 'Recursos Humanos', 7.8, 'SEBRAE 2024'),
  ('Serviços', 'Pequena', 'Financeiro', 6.0, 'SEBRAE 2024')
ON CONFLICT (setor, porte, area) DO NOTHING;

-- ============================================================================
-- FIM DO SCHEMA
-- ============================================================================
