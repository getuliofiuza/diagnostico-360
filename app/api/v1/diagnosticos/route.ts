// ============================================================================
// API v1 — POST /api/v1/diagnosticos · GET /api/v1/diagnosticos
// ============================================================================
// Endpoints públicos autenticados via X-API-Key
// Usados por sistemas externos (Neurocorp 360, etc) para criar e listar diagnósticos

import { z } from 'zod'
import { NextRequest } from 'next/server'
import { autenticarApiKey, hasScope, errorResponse } from '@/lib/api/auth'
import {
  calcularEscoresPorArea,
  calcularEscoreGeralDireto,
  construirMatrizRisco,
  calcularRiscoGeral,
  gerarPDI,
} from '@/lib/diagnosticos/calcular'
import { classificarMaturidade, Setor, Porte, Area } from '@/types/diagnostico'

// ============================================================================
// SCHEMA — payload de criação
// ============================================================================
const CreateDiagnosticoSchema = z.object({
  // Identificação externa (obrigatório vir do sistema chamador)
  external_workspace_id: z.string().min(1, 'external_workspace_id é obrigatório'),
  external_user_id: z.string().optional(),
  external_system: z.string().optional().default('external'),

  // Dados da empresa
  empresa_nome: z.string().min(3),
  setor: z.enum(['Comércio', 'Serviços', 'Indústria', 'Produtor Rural']),
  porte: z.enum(['Micro', 'Pequena', 'Média', 'Grande']),
  respondente_nome: z.string().min(2),
  respondente_email: z.string().email(),
  respondente_telefone: z.string().optional().nullable(),

  // Localização (opcionais)
  endereco: z.string().optional().nullable(),
  municipio: z.string().optional().nullable(),
  microrregiao: z.string().optional().nullable(),
  mesorregiao: z.string().optional().nullable(),

  // Dados do negócio
  faturamento_anual: z.number().optional().nullable(),
  num_funcionarios: z.number().int().optional().nullable(),
  tempo_mercado_anos: z.number().int().optional().nullable(),
  atividade_cnae: z.string().optional().nullable(),

  // Qualitativos
  narrativa_gestor: z.string().optional().nullable(),
  diferencial_competitivo: z.string().optional().nullable(),
  dores_principais: z.string().optional().nullable(),

  // Respostas (obrigatório)
  respostas: z
    .array(
      z.object({
        questao_id: z.number(),
        resposta: z.string(),
        pontos: z.number().min(0).max(10),
        tema: z.string(),
        resposta_texto: z.string().optional().nullable(),
      })
    )
    .min(1, 'Pelo menos uma resposta é obrigatória'),
}).passthrough()  // aceita campos extras sem rejeitar (forward-compat)

// ============================================================================
// POST /api/v1/diagnosticos — Criar
// ============================================================================
export async function POST(request: NextRequest) {
  // 1. Autenticar
  const auth = await autenticarApiKey(request)
  if (!auth.ok) return errorResponse(auth.status, auth.error)
  if (!hasScope(auth.context, 'diagnosticos:write')) {
    return errorResponse(403, 'API key sem permissão de escrita (scope diagnosticos:write necessário)')
  }
  const { supabase, tenantId, apiKeyId } = auth.context

  // 2. Validar payload
  let payload: z.infer<typeof CreateDiagnosticoSchema>
  try {
    const body = await request.json()
    payload = CreateDiagnosticoSchema.parse(body)
  } catch (err: any) {
    return errorResponse(400, 'Payload inválido', {
      detalhes: err.errors || err.message,
    })
  }

  const v = payload as any
  const { respostas } = payload

  // 3. Calcular escores
  let escores, escoreGeral, maturidade, matrizRisco, riscoGeral, pdi
  try {
    escores = calcularEscoresPorArea(respostas as any)
    escoreGeral = calcularEscoreGeralDireto(respostas as any)
    maturidade = classificarMaturidade(escoreGeral)
    matrizRisco = construirMatrizRisco(escores)
    riscoGeral = calcularRiscoGeral(matrizRisco)
    pdi = gerarPDI(escores)
  } catch (err: any) {
    return errorResponse(500, 'Erro ao calcular escores: ' + err.message)
  }

  // 4. Map escores → colunas
  const escoresMap: Record<string, number> = {}
  const COL_MAP: Record<string, string> = {
    'Planejamento e Estratégia': 'escore_planejamento',
    'Recursos Humanos': 'escore_rh',
    'Estoque': 'escore_estoque',
    'Financeiro': 'escore_financeiro',
    'Tecnologia da Informação': 'escore_tecnologia',
    'Relações Institucionais': 'escore_relacoes',
    'Logística': 'escore_logistica',
    'Marketing e Vendas': 'escore_marketing',
    'Projeções e Tendências': 'escore_tendencias',
    'Gestão de Processos e Governança': 'escore_governanca',
  }
  escores.forEach((e: any) => {
    const col = COL_MAP[e.area]
    if (col) escoresMap[col] = e.escore
  })

  // 5. Campos opcionais (só os que vieram)
  const opcionais: Record<string, any> = {}
  const CAMPOS_OPCIONAIS = [
    'respondente_telefone', 'endereco', 'municipio', 'microrregiao', 'mesorregiao',
    'faturamento_anual', 'num_funcionarios', 'tempo_mercado_anos', 'atividade_cnae',
    'narrativa_gestor', 'diferencial_competitivo', 'dores_principais',
  ]
  for (const c of CAMPOS_OPCIONAIS) {
    if (v[c] !== undefined && v[c] !== null && v[c] !== '') opcionais[c] = v[c]
  }

  // 6. INSERT no banco
  const { data: diagnostico, error: insertError } = await supabase
    .from('diagnosticos_360')
    .insert({
      tenant_id: tenantId,  // tenant especial "API Externa"
      external_system: v.external_system || 'external',
      external_workspace_id: v.external_workspace_id,
      external_user_id: v.external_user_id || null,
      api_key_id: apiKeyId,
      empresa_nome: v.empresa_nome,
      setor: v.setor,
      porte: v.porte,
      respondente_nome: v.respondente_nome,
      respondente_email: v.respondente_email,
      data_aplicacao: new Date().toISOString().split('T')[0],
      ...opcionais,
      ...escoresMap,
      escore_geral: escoreGeral,
      maturidade,
      risco_geral: riscoGeral,
      respostas_json: respostas,
    })
    .select('id')
    .single()

  if (insertError) {
    return errorResponse(500, 'Erro ao salvar: ' + insertError.message)
  }

  // 7. Inserir respostas detalhadas
  const respostasRows = (respostas as any[]).map((r) => ({
    diagnostico_id: diagnostico.id,
    questao_id: r.questao_id,
    resposta: r.resposta,
    pontos: r.pontos,
    tema: r.tema,
    resposta_texto: r.resposta_texto || null,
  }))
  await supabase.from('diagnosticos_360_respostas').insert(respostasRows)

  // 8. Inserir matriz de risco
  const matrizRows = matrizRisco.map((m: any) => ({
    diagnostico_id: diagnostico.id,
    area: m.area,
    escore: m.escore,
    criticidade_peso: m.criticidade_peso,
    risco_score: m.risco_score,
    classificacao: m.classificacao,
    prioridade: m.prioridade,
  }))
  await supabase.from('diagnosticos_360_matriz_risco').insert(matrizRows)

  // 9. Inserir PDE
  const pdiRows = pdi.map((p: any) => ({
    diagnostico_id: diagnostico.id,
    area: p.area,
    escore_atual: p.escore_atual,
    escore_meta: p.escore_meta,
    acao_descricao: p.acao_descricao,
    acao_prazo: p.acao_prazo,
    acao_responsavel: p.acao_responsavel,
    fase: p.fase,
    status: p.status,
  }))
  await supabase.from('diagnosticos_360_pdi').insert(pdiRows)

  // 10. Resposta
  return Response.json(
    {
      id: diagnostico.id,
      external_workspace_id: v.external_workspace_id,
      external_user_id: v.external_user_id || null,
      escore_geral: escoreGeral,
      maturidade,
      risco_geral: riscoGeral,
      report_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://diagnostico-360-taupe.vercel.app'}/diagnostico/${diagnostico.id}`,
      created_at: new Date().toISOString(),
    },
    { status: 201 }
  )
}

// ============================================================================
// GET /api/v1/diagnosticos — Listar por workspace
// ============================================================================
export async function GET(request: NextRequest) {
  const auth = await autenticarApiKey(request)
  if (!auth.ok) return errorResponse(auth.status, auth.error)
  if (!hasScope(auth.context, 'diagnosticos:read')) {
    return errorResponse(403, 'API key sem permissão de leitura')
  }
  const { supabase, apiKeyId } = auth.context

  const url = new URL(request.url)
  const workspaceId = url.searchParams.get('workspace_id') || url.searchParams.get('external_workspace_id')
  const userId = url.searchParams.get('user_id') || url.searchParams.get('external_user_id')
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200)

  let query = supabase
    .from('diagnosticos_360')
    .select(`
      id, empresa_nome, setor, porte,
      respondente_nome, respondente_email,
      escore_geral, maturidade, risco_geral,
      external_workspace_id, external_user_id,
      criado_em
    `)
    .eq('api_key_id', apiKeyId)
    .order('criado_em', { ascending: false })
    .limit(limit)

  if (workspaceId) query = query.eq('external_workspace_id', workspaceId)
  if (userId) query = query.eq('external_user_id', userId)

  const { data, error } = await query
  if (error) return errorResponse(500, error.message)

  return Response.json({
    data: data || [],
    count: data?.length || 0,
  })
}
