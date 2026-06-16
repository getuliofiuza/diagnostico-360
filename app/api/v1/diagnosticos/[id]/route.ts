// ============================================================================
// API v1 — GET /api/v1/diagnosticos/:id
// ============================================================================
// Retorna relatório completo de um diagnóstico criado via API
// Autenticado por X-API-Key — só retorna se a key for a mesma que criou o registro

import { NextRequest } from 'next/server'
import { autenticarApiKey, hasScope, errorResponse } from '@/lib/api/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Autenticar
  const auth = await autenticarApiKey(request)
  if (!auth.ok) return errorResponse(auth.status, auth.error)
  if (!hasScope(auth.context, 'diagnosticos:read')) {
    return errorResponse(403, 'API key sem permissão de leitura')
  }
  const { supabase, apiKeyId } = auth.context

  // 2. Buscar diagnóstico
  const { data: diagnostico, error } = await supabase
    .from('diagnosticos_360')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !diagnostico) {
    return errorResponse(404, 'Diagnóstico não encontrado')
  }

  // 3. Verificar ownership pela API key
  // Diagnósticos criados via API só são acessíveis pela mesma API key
  if (diagnostico.api_key_id !== apiKeyId) {
    return errorResponse(403, 'Este diagnóstico não pertence à sua API key')
  }

  // 4. Buscar dados relacionados em paralelo
  const [respostasResult, matrizResult, pdiResult] = await Promise.all([
    supabase.from('diagnosticos_360_respostas').select('*').eq('diagnostico_id', params.id),
    supabase.from('diagnosticos_360_matriz_risco').select('*').eq('diagnostico_id', params.id).order('prioridade', { ascending: true }),
    supabase.from('diagnosticos_360_pdi').select('*').eq('diagnostico_id', params.id).order('fase', { ascending: true }),
  ])

  const respostas = respostasResult.data || []
  const matrizRisco = matrizResult.data || []
  const pdi = pdiResult.data || []

  // 5. Montar escores por área (apenas com dados)
  const TODAS_AREAS = [
    { area: 'Planejamento e Estratégia', col: 'escore_planejamento' },
    { area: 'Recursos Humanos', col: 'escore_rh' },
    { area: 'Estoque', col: 'escore_estoque' },
    { area: 'Financeiro', col: 'escore_financeiro' },
    { area: 'Tecnologia da Informação', col: 'escore_tecnologia' },
    { area: 'Relações Institucionais', col: 'escore_relacoes' },
    { area: 'Logística', col: 'escore_logistica' },
    { area: 'Marketing e Vendas', col: 'escore_marketing' },
    { area: 'Projeções e Tendências', col: 'escore_tendencias' },
    { area: 'Gestão de Processos e Governança', col: 'escore_governanca' },
  ]
  const escores = TODAS_AREAS
    .filter(a => diagnostico[a.col] != null)
    .map(a => ({ area: a.area, escore: diagnostico[a.col] as number }))

  // 6. Benchmark de referência (mesmo do app)
  const benchmark: Record<string, number> = {
    'Planejamento e Estratégia': 6.1,
    'Recursos Humanos': diagnostico.setor === 'Serviços' ? 7.2 : 5.8,
    'Estoque': 5.8,
    'Financeiro': 5.5,
    'Tecnologia da Informação': 5.0,
    'Relações Institucionais': 6.0,
    'Logística': 5.5,
    'Marketing e Vendas': 6.3,
    'Projeções e Tendências': 4.8,
    'Gestão de Processos e Governança': 4.5,
  }

  // 7. Observações (respostas "Outras" com texto)
  const observacoes = respostas
    .filter((r: any) => r.resposta === 'F' && r.resposta_texto)
    .map((r: any) => ({ questao_id: r.questao_id, tema: r.tema, texto: r.resposta_texto }))

  // 8. Responder
  return Response.json({
    id: diagnostico.id,
    external_workspace_id: diagnostico.external_workspace_id,
    external_user_id: diagnostico.external_user_id,
    external_system: diagnostico.external_system,

    // Identificação
    empresa: {
      nome: diagnostico.empresa_nome,
      setor: diagnostico.setor,
      porte: diagnostico.porte,
      municipio: diagnostico.municipio,
      atividade_cnae: diagnostico.atividade_cnae,
      faturamento_anual: diagnostico.faturamento_anual,
      num_funcionarios: diagnostico.num_funcionarios,
      tempo_mercado_anos: diagnostico.tempo_mercado_anos,
    },
    respondente: {
      nome: diagnostico.respondente_nome,
      email: diagnostico.respondente_email,
      telefone: diagnostico.respondente_telefone,
    },
    qualitativos: {
      narrativa_gestor: diagnostico.narrativa_gestor,
      diferencial_competitivo: diagnostico.diferencial_competitivo,
      dores_principais: diagnostico.dores_principais,
    },

    // Resultados
    escore_geral: diagnostico.escore_geral,
    maturidade: diagnostico.maturidade,
    risco_geral: diagnostico.risco_geral,
    escores,
    matriz_risco: matrizRisco.map((m: any) => ({
      area: m.area,
      escore: m.escore,
      criticidade_peso: m.criticidade_peso,
      risco_score: m.risco_score,
      classificacao: m.classificacao,
      prioridade: m.prioridade,
    })),
    pdi: pdi.map((p: any) => ({
      area: p.area,
      escore_atual: p.escore_atual,
      escore_meta: p.escore_meta,
      acao_descricao: p.acao_descricao,
      acao_prazo: p.acao_prazo,
      fase: p.fase,
      status: p.status,
    })),
    benchmark,
    observacoes,

    // Meta
    criado_em: diagnostico.criado_em,
    report_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://diagnostico-360-taupe.vercel.app'}/diagnostico/${diagnostico.id}`,
  })
}
