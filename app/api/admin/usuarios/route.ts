// ============================================================================
// API ADMIN - GET/PATCH /api/admin/usuarios
// ============================================================================
// Lista todos os usuários (GET) e permite promover/rebaixar admin (PATCH)
// Acesso restrito a admins

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

// Helper: verifica se o user logado é admin
async function verificarAdmin() {
  const supabaseAuth = createServerClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return { erro: 'Não autenticado', status: 401 }

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
    return { erro: 'Acesso negado — apenas administradores', status: 403 }
  }
  return { user, supabase, status: 200 }
}

// ============================================================================
// GET — Lista todos os usuários
// ============================================================================
export async function GET() {
  try {
    const auth = await verificarAdmin()
    if (auth.erro) return NextResponse.json({ error: auth.erro }, { status: auth.status })
    const { supabase } = auth

    // 1. Buscar todos os tenants (cada user = 1 tenant)
    const { data: tenants, error } = await supabase!
      .from('tenants')
      .select('id, owner_id, nome, email, is_admin, plano, criado_em')
      .order('criado_em', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 2. Contar diagnósticos de cada tenant
    const tenantIds = (tenants || []).map((t: any) => t.id)
    const { data: diagCounts } = await supabase!
      .from('diagnosticos_360')
      .select('tenant_id')
      .in('tenant_id', tenantIds)

    const counts: Record<string, number> = {}
    ;(diagCounts || []).forEach((d: any) => {
      counts[d.tenant_id] = (counts[d.tenant_id] || 0) + 1
    })

    // 3. Buscar emails dos owners no Supabase Auth (mais confiável que o email do tenant)
    const usuariosEnriquecidos = (tenants || []).map((t: any) => ({
      tenant_id: t.id,
      owner_id: t.owner_id,
      nome: t.nome,
      email: t.email,
      is_admin: !!t.is_admin,
      plano: t.plano,
      criado_em: t.criado_em,
      total_diagnosticos: counts[t.id] || 0,
    }))

    return NextResponse.json({
      data: usuariosEnriquecidos,
      total: usuariosEnriquecidos.length,
      total_admins: usuariosEnriquecidos.filter(u => u.is_admin).length,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PATCH — Atualiza is_admin de um usuário
// ============================================================================
export async function PATCH(request: Request) {
  try {
    const auth = await verificarAdmin()
    if (auth.erro) return NextResponse.json({ error: auth.erro }, { status: auth.status })
    const { user, supabase } = auth

    const body = await request.json()
    const { tenant_id, is_admin } = body

    if (!tenant_id || typeof is_admin !== 'boolean') {
      return NextResponse.json({
        error: 'Parâmetros inválidos: tenant_id (string) e is_admin (boolean) são obrigatórios'
      }, { status: 400 })
    }

    // 1. Verificar se o tenant existe
    const { data: target } = await supabase!
      .from('tenants')
      .select('id, owner_id, email, is_admin')
      .eq('id', tenant_id)
      .single()

    if (!target) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // 2. Proteção: admin não pode se rebaixar sozinho se for o último admin
    if (target.owner_id === user!.id && !is_admin) {
      const { count } = await supabase!
        .from('tenants')
        .select('*', { count: 'exact', head: true })
        .eq('is_admin', true)

      if ((count || 0) <= 1) {
        return NextResponse.json({
          error: 'Você é o último administrador — não pode remover seu próprio acesso. Primeiro promova outro usuário.'
        }, { status: 400 })
      }
    }

    // 3. Atualizar
    const { error } = await supabase!
      .from('tenants')
      .update({ is_admin })
      .eq('id', tenant_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      email: target.email,
      is_admin,
      action: is_admin ? 'promoted' : 'demoted'
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 }
    )
  }
}
