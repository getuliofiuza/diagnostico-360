#!/bin/bash

# ============================================================================
# TESTES RÁPIDOS DA API - DIAGNÓSTICO 360°
# ============================================================================

echo "🚀 TESTE 1: Empresa com Score Médio-Alto (7.2/10)"
echo "=================================================="

curl -s -X POST http://localhost:3000/api/diagnosticos/teste \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
    "empresa_nome": "TechCorp Comércio",
    "setor": "Comércio",
    "porte": "Pequena",
    "respondente_nome": "João Silva",
    "respondente_email": "joao@techcorp.com",
    "respostas": [
      {"questao_id": 1, "resposta": "A", "pontos": 10, "tema": "Planejamento e Estratégia"},
      {"questao_id": 2, "resposta": "B", "pontos": 8, "tema": "Planejamento e Estratégia"},
      {"questao_id": 3, "resposta": "C", "pontos": 6, "tema": "Recursos Humanos"},
      {"questao_id": 4, "resposta": "D", "pontos": 4, "tema": "Logística"},
      {"questao_id": 5, "resposta": "E", "pontos": 2, "tema": "Financeiro"},
      {"questao_id": 6, "resposta": "A", "pontos": 10, "tema": "Tecnologia da Informação"},
      {"questao_id": 7, "resposta": "B", "pontos": 8, "tema": "Relações Institucionais"},
      {"questao_id": 8, "resposta": "A", "pontos": 10, "tema": "Estoque"},
      {"questao_id": 9, "resposta": "C", "pontos": 6, "tema": "Marketing e Vendas"},
      {"questao_id": 10, "resposta": "A", "pontos": 10, "tema": "Projeções e Tendências"}
    ]
  }' | jq '{escore_geral: .escore_geral, maturidade: .maturidade, areas_criticas: [.matriz_risco[] | select(.classificacao == "CRÍTICO")]}'

echo ""
echo "🚀 TESTE 2: Empresa Excelente (10/10)"
echo "======================================"

curl -s -X POST http://localhost:3000/api/diagnosticos/teste \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "550e8400-e29b-41d4-a716-446655440001",
    "empresa_nome": "Empresa Premium",
    "setor": "Serviços",
    "porte": "Grande",
    "respondente_nome": "Carlos Neves",
    "respondente_email": "carlos@premium.com",
    "respostas": [
      {"questao_id": 1, "resposta": "A", "pontos": 10, "tema": "Planejamento e Estratégia"},
      {"questao_id": 2, "resposta": "A", "pontos": 10, "tema": "Planejamento e Estratégia"},
      {"questao_id": 3, "resposta": "A", "pontos": 10, "tema": "Recursos Humanos"},
      {"questao_id": 4, "resposta": "A", "pontos": 10, "tema": "Logística"},
      {"questao_id": 5, "resposta": "A", "pontos": 10, "tema": "Financeiro"},
      {"questao_id": 6, "resposta": "A", "pontos": 10, "tema": "Tecnologia da Informação"},
      {"questao_id": 7, "resposta": "A", "pontos": 10, "tema": "Relações Institucionais"},
      {"questao_id": 8, "resposta": "A", "pontos": 10, "tema": "Estoque"},
      {"questao_id": 9, "resposta": "A", "pontos": 10, "tema": "Marketing e Vendas"},
      {"questao_id": 10, "resposta": "A", "pontos": 10, "tema": "Projeções e Tendências"}
    ]
  }' | jq '{escore_geral: .escore_geral, maturidade: .maturidade, areas_fortes: [.escores_por_area[] | select(.nivel == "AVANÇADA")] | length}'

echo ""
echo "🚀 TESTE 3: Empresa em Dificuldade (2.6/10)"
echo "==========================================="

curl -s -X POST http://localhost:3000/api/diagnosticos/teste \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "550e8400-e29b-41d4-a716-446655440002",
    "empresa_nome": "Loja Pequena Com Problemas",
    "setor": "Comércio",
    "porte": "Micro",
    "respondente_nome": "Maria Silva",
    "respondente_email": "maria@loja.com",
    "respostas": [
      {"questao_id": 1, "resposta": "E", "pontos": 2, "tema": "Planejamento e Estratégia"},
      {"questao_id": 2, "resposta": "E", "pontos": 2, "tema": "Planejamento e Estratégia"},
      {"questao_id": 3, "resposta": "D", "pontos": 4, "tema": "Recursos Humanos"},
      {"questao_id": 4, "resposta": "E", "pontos": 2, "tema": "Logística"},
      {"questao_id": 5, "resposta": "E", "pontos": 2, "tema": "Financeiro"},
      {"questao_id": 6, "resposta": "E", "pontos": 2, "tema": "Tecnologia da Informação"},
      {"questao_id": 7, "resposta": "D", "pontos": 4, "tema": "Relações Institucionais"},
      {"questao_id": 8, "resposta": "D", "pontos": 4, "tema": "Estoque"},
      {"questao_id": 9, "resposta": "E", "pontos": 2, "tema": "Marketing e Vendas"},
      {"questao_id": 10, "resposta": "E", "pontos": 2, "tema": "Projeções e Tendências"}
    ]
  }' | jq '{escore_geral: .escore_geral, maturidade: .maturidade, areas_criticas: [.matriz_risco[] | select(.classificacao == "CRÍTICO" or .classificacao == "ALTO")] | length}'

echo ""
echo "✅ Todos os testes executados!"
echo ""
echo "📖 Para mais detalhes, veja TESTE_API.md"
