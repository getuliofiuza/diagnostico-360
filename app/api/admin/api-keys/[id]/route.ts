// ============================================================================
// API ADMIN — PATCH /api/admin/api-keys/[id] · DELETE /api/admin/api-keys/[id]
// ============================================================================
// Atualizar (ativar/desativar) ou revogar (deletar) uma API key

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

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

// PATCH — Ativar/desativar
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await verificarAdmin()
  if (auth.erro) return NextResponse.json({ error: auth.erro }, { status: auth.status })
  const { supabase } = auth

  const body = await request.json().catch(() => ({}))
  const { ativo, nome, descricao } = body

  const updates: Record<string, any> = {}
  if (typeof ativo === 'boolean') updates.ativo = ativo
  if (typeof nome === 'string' && nome.trim().length >= 3) updates.nome = nome.trim()
  if (typeof descricao === 'string') updates.descricao = descricao

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 })
  }

  const { error } = await supabase!.from('api_keys').update(updates).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, updated: updates })
}

// DELETE — Revogar permanentemente
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const auth = await verificarAdmin()
  if (auth.erro) return NextResponse.json({ error: auth.erro }, { status: auth.status })
  const { supabase } = auth

  // Em vez de DELETE de verdade, marca como inativo (preserva histórico)
  // pra não quebrar referência em diagnosticos_360.api_key_id
  const { error } = await supabase!
    .from('api_keys')
    .update({ ativo: false })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, action: 'revoked' })
}
