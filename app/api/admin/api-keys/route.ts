// ============================================================================
// API ADMIN — Gerenciar API keys (GET listar · POST criar)
// ============================================================================
// Apenas admins podem criar/listar chaves
// IMPORTANTE: a chave em texto claro é retornada APENAS no POST de criação

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { gerarApiKey } from '@/lib/api/auth'

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
// GET — Listar todas as API keys (sem expor o hash nem a chave)
// ============================================================================
export async function GET() {
  const auth = await verificarAdmin()
  if (auth.erro) return NextResponse.json({ error: auth.erro }, { status: auth.status })
  const { supabase } = auth

  const { data, error } = await supabase!
    .from('api_keys_stats')
    .select('*')
    .order('criado_em', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data || [] })
}

// ============================================================================
// POST — Criar nova API key
// ============================================================================
export async function POST(request: Request) {
  const auth = await verificarAdmin()
  if (auth.erro) return NextResponse.json({ error: auth.erro }, { status: auth.status })
  const { user, supabase } = auth

  const body = await request.json().catch(() => ({}))
  const { nome, descricao, scopes, expira_em } = body

  if (!nome || typeof nome !== 'string' || nome.trim().length < 3) {
    return NextResponse.json({
      error: 'Nome obrigatório (mínimo 3 chars). Ex: "Neurocorp 360 Production"',
    }, { status: 400 })
  }

  // Gera chave
  const { plainKey, prefix, hash } = gerarApiKey()

  // Persiste apenas o hash
  const { data, error } = await supabase!
    .from('api_keys')
    .insert({
      nome: nome.trim(),
      descricao: descricao || null,
      key_hash: hash,
      prefix,
      scopes: Array.isArray(scopes) && scopes.length > 0
        ? scopes
        : ['diagnosticos:read', 'diagnosticos:write'],
      ativo: true,
      expira_em: expira_em || null,
      criado_por: user!.id,
    })
    .select('id, nome, prefix, scopes, criado_em, expira_em')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    api_key: plainKey,  // ⚠️ ÚNICA vez que isso aparece
    aviso: '⚠️ Esta chave NÃO será exibida novamente. Copie e guarde em local seguro.',
    metadata: data,
  }, { status: 201 })
}
