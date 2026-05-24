import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabaseAuth = createServerClient()
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()

    if (authError) {
      console.error('[auth/setup] Auth error:', authError)
      return NextResponse.json({ error: 'Auth: ' + authError.message }, { status: 401 })
    }

    if (!user) {
      console.error('[auth/setup] No user in session')
      return NextResponse.json({ error: 'Nao autenticado - sem usuario' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: existing, error: queryError } = await supabase
      .from('tenants')
      .select('id')
      .eq('owner_id', user.id)
      .order('criado_em', { ascending: true })
      .limit(1)

    if (queryError) {
      console.error('[auth/setup] Query error:', queryError)
      return NextResponse.json({
        error: 'DB Query: ' + queryError.message,
        hint: 'Verifique se a migration SQL foi executada (coluna owner_id na tabela tenants)'
      }, { status: 500 })
    }

    if (existing && existing.length > 0) {
      return NextResponse.json({ tenant_id: existing[0].id })
    }

    const { data: tenant, error: insertError } = await supabase
      .from('tenants')
      .insert({
        nome: user.user_metadata?.empresa || 'Minha Empresa',
        owner_id: user.id,
        plano: 'free',
        email: user.email
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('[auth/setup] Insert error:', insertError)
      return NextResponse.json({
        error: 'DB Insert: ' + insertError.message,
        hint: 'Verifique se as colunas owner_id, plano, email existem na tabela tenants'
      }, { status: 500 })
    }

    return NextResponse.json({ tenant_id: tenant.id })
  } catch (err) {
    console.error('[auth/setup] Exception:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 }
    )
  }
}
