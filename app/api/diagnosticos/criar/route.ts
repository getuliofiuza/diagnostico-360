// ============================================================================
// API - POST /api/diagnosticos/criar
// ============================================================================
// Cria um novo diagnóstico completo

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {
  calcularEscoresPorArea,
  calcularEscoreGeralDireto,
  construirMatrizRisco,
  calcularRiscoGeral,
  gerarPDI,
  gerarDadosRadar,
  compararComBenchmark,
  gerarNarrativa
} from '@/lib/diagnosticos/calcular';
import {
  CreateDiagnosticoRequest,
  CreateDiagnosticoResponse,
  Resposta,
  Setor,
  Porte,
  NivelMaturidade,
  classificarMaturidade
} from '@/types/diagnostico';

// ============================================================================
// VALIDAÇÃO
// ============================================================================

const CreateDiagnosticoSchema = z.object({
  // Obrigatórios
  tenant_id: z.string().uuid(),
  empresa_nome: z.string().min(3, 'Nome da empresa é obrigatório'),
  setor: z.enum(['Comércio', 'Serviços', 'Indústria', 'Produtor Rural']),
  porte: z.enum(['Micro', 'Pequena', 'Média', 'Grande']),
  respondente_nome: z.string().min(2, 'Nome do respondente é obrigatório'),
  respondente_email: z.string().email('Email inválido'),

  // Opcionais (TIER 1)
  respondente_telefone: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
  municipio: z.string().optional().nullable(),
  microrregiao: z.string().optional().nullable(),
  mesorregiao: z.string().optional().nullable(),
  faturamento_anual: z.number().optional().nullable(),
  num_funcionarios: z.number().int().optional().nullable(),
  tempo_mercado_anos: z.number().int().optional().nullable(),
  atividade_cnae: z.string().optional().nullable(),
  clientes_atendidos_mes: z.number().int().optional().nullable(),
  vendas_servicos_mes: z.number().int().optional().nullable(),
  frequencia_clientes_dia: z.number().int().optional().nullable(),
  clientes_efetivos_dia: z.number().int().optional().nullable(),
  area_total_m2: z.number().optional().nullable(),
  area_construida_m2: z.number().optional().nullable(),
  tempo_gestor_anos: z.number().optional().nullable(),
  idade_gestor_faixa: z.string().optional().nullable(),
  origem_gestor: z.string().optional().nullable(),
  escolaridade_gestor: z.string().optional().nullable(),
  narrativa_gestor: z.string().optional().nullable(),
  diferencial_competitivo: z.string().optional().nullable(),
  dores_principais: z.string().optional().nullable(),

  // TIER 2 — Dados Aprofundados por Área
  criterio_decisao_estrategica: z.string().optional().nullable(),
  deficiencias_gestao: z.array(z.string()).optional().nullable(),
  deficiencias_gestao_outros: z.string().optional().nullable(),

  num_colab_operacional: z.number().int().optional().nullable(),
  num_colab_comercial: z.number().int().optional().nullable(),
  num_colab_administrativo: z.number().int().optional().nullable(),
  media_salarial_operacional: z.number().optional().nullable(),
  media_salarial_comercial: z.number().optional().nullable(),
  media_salarial_administrativo: z.number().optional().nullable(),
  admissoes_trimestre: z.number().int().optional().nullable(),
  demissoes_trimestre: z.number().int().optional().nullable(),
  vagas_abertas: z.number().int().optional().nullable(),
  folha_pagamento_mensal: z.number().optional().nullable(),
  gargalos_rh: z.array(z.string()).optional().nullable(),

  estoque_medio_mensal: z.number().optional().nullable(),
  num_itens_portfolio: z.number().int().optional().nullable(),
  unidade_medida_estoque: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  deficiencias_estoque: z.array(z.string()).optional().nullable(),

  faturamento_mensal: z.number().optional().nullable(),
  custo_fixo_mensal: z.number().optional().nullable(),
  custo_variavel_mensal: z.number().optional().nullable(),
  despesa_variavel_mensal: z.number().optional().nullable(),
  possui_endividamento: z.boolean().optional().nullable(),
  endividamento_banco_pct: z.number().optional().nullable(),
  endividamento_fornecedor_pct: z.number().optional().nullable(),
  endividamento_factoring_pct: z.number().optional().nullable(),
  endividamento_fisco_pct: z.number().optional().nullable(),
  endividamento_sefaz_pct: z.number().optional().nullable(),
  endividamento_outros_pct: z.number().optional().nullable(),
  ticket_medio: z.number().optional().nullable(),
  margem_contribuicao_pct: z.number().optional().nullable(),
  ponto_equilibrio: z.number().optional().nullable(),
  melhores_meses_vendas: z.array(z.string()).optional().nullable(),
  piores_meses_vendas: z.array(z.string()).optional().nullable(),
  deficiencias_financeiro: z.array(z.string()).optional().nullable(),

  ociosidade_vendas: z.string().optional().nullable(),
  criterio_preco_vendas: z.string().optional().nullable(),
  busca_clientes: z.array(z.string()).optional().nullable(),
  cac_novos_clientes: z.number().optional().nullable(),
  posicao_preco_concorrencia: z.string().optional().nullable(),
  deficiencias_marketing: z.array(z.string()).optional().nullable(),

  respostas: z.array(
    z.object({
      questao_id: z.number(),
      resposta: z.string(),
      pontos: z.number().min(0).max(10),
      tema: z.string(),
      resposta_texto: z.string().optional().nullable()
    })
  ).min(1, 'Pelo menos uma resposta é obrigatória')
}).passthrough();

// ============================================================================
// HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Parse body
    const body = await request.json();

    // 2. Validar
    const validacao = CreateDiagnosticoSchema.safeParse(body);
    if (!validacao.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Dados inválidos',
          errors: validacao.error.flatten()
        },
        { status: 400 }
      );
    }

    const v = validacao.data as any;
    const {
      tenant_id,
      empresa_nome,
      setor,
      porte,
      respondente_nome,
      respondente_email,
      respostas
    } = v;

    // 3. Inicializar Supabase (service role para bypass de RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 6. Calcular escores
    const escores = calcularEscoresPorArea(respostas);
    const escore_geral = calcularEscoreGeralDireto(respostas);
    const maturidade = classificarMaturidade(escore_geral);

    // 7. Construir matriz de risco
    const matriz_risco = construirMatrizRisco(escores);
    const risco_geral = calcularRiscoGeral(matriz_risco);

    // 8. Gerar PDI
    const pdi = gerarPDI(escores);

    // 9. Gerar dados para gráficos
    const radar_data = gerarDadosRadar(escores);
    const benchmark = compararComBenchmark(escores, setor as Setor, porte as Porte);

    // 10. Gerar narrativa
    const narrativa = gerarNarrativa(
      escores,
      escore_geral,
      maturidade,
      setor as Setor,
      porte as Porte,
      matriz_risco
    );

    // 11. Mapear escores para colunas específicas
    const escoresMap: Record<string, number> = {};
    escores.forEach(escore => {
      const coluna = mapearAreaParaColuna(escore.area);
      escoresMap[coluna] = escore.escore;
    });

    // 12. Inserir no banco — campos opcionais via spread (apenas os definidos)
    const opcionais: Record<string, any> = {};
    const camposOpcionais = [
      'respondente_telefone', 'endereco', 'municipio', 'microrregiao', 'mesorregiao',
      'faturamento_anual', 'num_funcionarios', 'tempo_mercado_anos',
      'atividade_cnae', 'clientes_atendidos_mes', 'vendas_servicos_mes',
      'frequencia_clientes_dia', 'clientes_efetivos_dia',
      'area_total_m2', 'area_construida_m2',
      'tempo_gestor_anos', 'idade_gestor_faixa', 'origem_gestor', 'escolaridade_gestor',
      'narrativa_gestor', 'diferencial_competitivo', 'dores_principais',
      // TIER 2
      'criterio_decisao_estrategica', 'deficiencias_gestao', 'deficiencias_gestao_outros',
      'num_colab_operacional', 'num_colab_comercial', 'num_colab_administrativo',
      'media_salarial_operacional', 'media_salarial_comercial', 'media_salarial_administrativo',
      'admissoes_trimestre', 'demissoes_trimestre', 'vagas_abertas', 'folha_pagamento_mensal',
      'gargalos_rh',
      'estoque_medio_mensal', 'num_itens_portfolio', 'unidade_medida_estoque', 'deficiencias_estoque',
      'faturamento_mensal', 'custo_fixo_mensal', 'custo_variavel_mensal', 'despesa_variavel_mensal',
      'possui_endividamento',
      'endividamento_banco_pct', 'endividamento_fornecedor_pct', 'endividamento_factoring_pct',
      'endividamento_fisco_pct', 'endividamento_sefaz_pct', 'endividamento_outros_pct',
      'ticket_medio', 'margem_contribuicao_pct', 'ponto_equilibrio',
      'melhores_meses_vendas', 'piores_meses_vendas', 'deficiencias_financeiro',
      'ociosidade_vendas', 'criterio_preco_vendas', 'busca_clientes', 'cac_novos_clientes',
      'posicao_preco_concorrencia', 'deficiencias_marketing'
    ];
    for (const campo of camposOpcionais) {
      const val = v[campo];
      if (val !== undefined && val !== null && val !== '') {
        opcionais[campo] = val;
      }
    }

    const { data: diagnostico, error: insertError } = await supabase
      .from('diagnosticos_360')
      .insert({
        tenant_id,
        empresa_nome,
        data_aplicacao: new Date().toISOString().split('T')[0],
        respondente_nome,
        respondente_email,
        setor,
        porte,
        ...opcionais,
        ...escoresMap,
        escore_geral,
        maturidade,
        risco_geral,
        respostas_json: respostas
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao inserir diagnóstico:', insertError);
      return NextResponse.json(
        {
          success: false,
          message: 'Erro ao salvar diagnóstico',
          error: insertError.message
        },
        { status: 500 }
      );
    }

    // 13. Inserir respostas detalhadas
    const respostasInsert = respostas.map((r: any) => ({
      diagnostico_id: diagnostico.id,
      questao_id: r.questao_id,
      resposta: r.resposta,
      pontos: r.pontos,
      tema: r.tema,
      resposta_texto: r.resposta_texto || null
    }));

    const { error: respostasError } = await supabase
      .from('diagnosticos_360_respostas')
      .insert(respostasInsert);

    if (respostasError) {
      console.error('Erro ao inserir respostas:', respostasError);
    }

    // 14. Inserir matriz de risco
    const matrizInsert = matriz_risco.map(item => ({
      diagnostico_id: diagnostico.id,
      area: item.area,
      escore: item.escore,
      criticidade_peso: item.criticidade_peso,
      risco_score: item.risco_score,
      classificacao: item.classificacao,
      prioridade: item.prioridade
    }));

    const { error: matrizError } = await supabase
      .from('diagnosticos_360_matriz_risco')
      .insert(matrizInsert);

    if (matrizError) {
      console.error('Erro ao inserir matriz de risco:', matrizError);
    }

    // 15. Inserir PDI
    const pdiInsert = pdi.map(acao => ({
      diagnostico_id: diagnostico.id,
      area: acao.area,
      escore_atual: acao.escore_atual,
      escore_meta: acao.escore_meta,
      acao_descricao: acao.acao_descricao,
      acao_prazo: acao.acao_prazo,
      acao_responsavel: acao.acao_responsavel,
      fase: acao.fase,
      status: acao.status
    }));

    const { error: pdiError } = await supabase
      .from('diagnosticos_360_pdi')
      .insert(pdiInsert);

    if (pdiError) {
      console.error('Erro ao inserir PDI:', pdiError);
    }

    // 16. Responder sucesso
    const response: CreateDiagnosticoResponse = {
      id: diagnostico.id,
      escore_geral,
      maturidade,
      status: 'criado',
      message: `Diagnóstico criado com sucesso. Escore: ${escore_geral}/10`
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Erro na criação do diagnóstico:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Desconhecido'
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER
// ============================================================================

/**
 * Mapeia nome da área para nome da coluna no banco
 */
function mapearAreaParaColuna(area: string): string {
  const mapa: Record<string, string> = {
    'Planejamento e Estratégia': 'escore_planejamento',
    'Recursos Humanos': 'escore_rh',
    'Estoque': 'escore_estoque',
    'Financeiro': 'escore_financeiro',
    'Tecnologia da Informação': 'escore_tecnologia',
    'Relações Institucionais': 'escore_relacoes',
    'Logística': 'escore_logistica',
    'Marketing e Vendas': 'escore_marketing',
    'Projeções e Tendências': 'escore_tendencias',
    'Gestão de Processos e Governança': 'escore_governanca'
  };
  return mapa[area] || '';
}
