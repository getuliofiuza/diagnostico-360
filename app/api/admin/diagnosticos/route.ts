// ============================================================================
// API ADMIN - GET /api/admin/diagnosticos
// ============================================================================
// Lista TODOS os diagnósticos do sistema. Somente para usuários is_admin=true

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    // 1. Verificar autenticação
    const supabaseAuth = createServerClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // 2. Verificar se é admin
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: tenant } = await supabase
      .from('tenants')
      .select('is_admin')
      .eq('owner_id', user.id)
      .single()

    if (!tenant?.is_admin) {
      return NextResponse.json({ error: 'Acesso negado — apenas administradores' }, { status: 403 })
    }

    // 3. Paginação e filtros (opcionais)
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '100')
    const search = url.searchParams.get('search') || ''
    const setor = url.searchParams.get('setor') || ''

    // 4. Listar TODOS os diagnósticos com dados do tenant
    let query = supabase
      .from('diagnosticos_360')
      .select(`
        id, empresa_nome, setor, porte,
        respondente_nome, respondente_email, respondente_telefone,
        municipio, atividade_cnae,
        escore_geral, maturidade, risco_geral,
        criado_em,
        tenant_id,
        tenants!inner(nome, email)
      `)
      .order('criado_em', { ascending: false })
      .limit(limit)

    if (search) {
      query = query.or(`empresa_nome.ilike.%${search}%,respondente_nome.ilike.%${search}%,respondente_email.ilike.%${search}%`)
    }
    if (setor) {
      query = query.eq('setor', setor)
    }

    const { data, error } = await query

    if (error) {
      console.error('[admin/diagnosticos] Erro:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 5. Estatísticas agregadas
    const { count: total } = await supabase
      .from('diagnosticos_360')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      data: data || [],
      total: total || 0,
    })
  } catch (err) {
    console.error('[admin/diagnosticos] Exception:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 }
    )
  }
}
