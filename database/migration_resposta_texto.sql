-- ============================================================================
-- MIGRATION: Adicionar campo resposta_texto para opção "Outras"
-- ============================================================================
-- Permite ao usuário escrever uma resposta personalizada quando nenhuma das
-- opções (A-E) se encaixa em sua situação. A resposta "F" não conta para a
-- pontuação numérica, mas o texto é destacado no diagnóstico final.

ALTER TABLE diagnosticos_360_respostas ADD COLUMN IF NOT EXISTS resposta_texto TEXT;
