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
  tenant_id: z.string().uuid(),
  empresa_nome: z.string().min(3, 'Nome da empresa é obrigatório'),
  setor: z.enum(['Comércio', 'Serviços']),
  porte: z.enum(['Micro', 'Pequena', 'Média', 'Grande']),
  respondente_nome: z.string().min(2, 'Nome do respondente é obrigatório'),
  respondente_email: z.string().email('Email inválido'),
  respondente_telefone: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
  municipio: z.string().optional().nullable(),
  microrregiao: z.string().optional().nullable(),
  mesorregiao: z.string().optional().nullable(),
  faturamento_anual: z.number().optional().nullable(),
  num_funcionarios: z.number().int().optional().nullable(),
  tempo_mercado_anos: z.number().int().optional().nullable(),
  atividade_cnae: z.string().optional().nullable(),
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
  respostas: z.array(
    z.object({
      questao_id: z.number(),
      resposta: z.string(),
      pontos: z.number().min(0).max(10),
      tema: z.string(),
      resposta_texto: z.string().optional().nullable()
    })
  ).min(1, 'Pelo menos uma resposta é obrigatória')
});

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
      respondente_telefone,
      endereco,
      municipio,
      microrregiao,
      mesorregiao,
      faturamento_anual,
      num_funcionarios,
      tempo_mercado_anos,
      atividade_cnae,
      frequencia_clientes_dia,
      clientes_efetivos_dia,
      area_total_m2,
      area_construida_m2,
      tempo_gestor_anos,
      idade_gestor_faixa,
      origem_gestor,
      escolaridade_gestor,
      narrativa_gestor,
      diferencial_competitivo,
      dores_principais,
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

    // 12. Inserir no banco
    const { data: diagnostico, error: insertError } = await supabase
      .from('diagnosticos_360')
      .insert({
        tenant_id,
        empresa_nome,
        data_aplicacao: new Date().toISOString().split('T')[0],
        respondente_nome,
        respondente_email,
        respondente_telefone: respondente_telefone || null,
        endereco: endereco || null,
        municipio: municipio || null,
        microrregiao: microrregiao || null,
        mesorregiao: mesorregiao || null,
        faturamento_anual: faturamento_anual ?? null,
        num_funcionarios: num_funcionarios ?? null,
        tempo_mercado_anos: tempo_mercado_anos ?? null,
        atividade_cnae: atividade_cnae || null,
        frequencia_clientes_dia: frequencia_clientes_dia ?? null,
        clientes_efetivos_dia: clientes_efetivos_dia ?? null,
        area_total_m2: area_total_m2 ?? null,
        area_construida_m2: area_construida_m2 ?? null,
        tempo_gestor_anos: tempo_gestor_anos ?? null,
        idade_gestor_faixa: idade_gestor_faixa || null,
        origem_gestor: origem_gestor || null,
        escolaridade_gestor: escolaridade_gestor || null,
        narrativa_gestor: narrativa_gestor || null,
        diferencial_competitivo: diferencial_competitivo || null,
        dores_principais: dores_principais || null,
        setor,
        porte,
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
