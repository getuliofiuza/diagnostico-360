// ============================================================================
// API - POST /api/swot/[diagnosticoId]/email
// ============================================================================
// Envia o relatório da Análise SWOT por email (resumo + link para o relatório).

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export async function POST(
  request: Request,
  { params }: { params: { diagnosticoId: string } }
) {
  try {
    // 1. Autenticação
    const supabaseAuth = createServerClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const destinatarioCustom = body?.destinatario as string | undefined

    // 2. Buscar diagnóstico
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: diag, error } = await supabase
      .from('diagnosticos_360')
      .select('*')
      .eq('id', params.diagnosticoId)
      .single()

    if (error || !diag) {
      return NextResponse.json({ error: 'Diagnóstico não encontrado' }, { status: 404 })
    }

    // 3. Acesso (dono OU admin)
    const { data: userTenant } = await supabase
      .from('tenants')
      .select('id, is_admin')
      .eq('owner_id', user.id)
      .single()

    const ehDono = diag.tenant_id === userTenant?.id
    const ehAdmin = !!userTenant?.is_admin
    if (!ehDono && !ehAdmin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // 4. Buscar a análise SWOT + itens
    const { data: analise } = await supabase
      .from('swot_analises')
      .select('*')
      .eq('diagnostico_id', params.diagnosticoId)
      .single()

    if (!analise) {
      return NextResponse.json(
        { error: 'Análise SWOT ainda não foi iniciada para este diagnóstico' },
        { status: 404 }
      )
    }

    const { data: itens } = await supabase
      .from('swot_itens')
      .select('area, classificacao, concluido, prioridade')
      .eq('swot_id', analise.id)
      .order('prioridade', { ascending: true })

    const lista = itens || []
    const total = lista.length
    const concluidos = lista.filter((i) => i.concluido).length

    // 5. Destinatário
    const destinatario = destinatarioCustom || diag.respondente_email
    if (!destinatario || !destinatario.includes('@')) {
      return NextResponse.json({ error: 'Email do destinatário inválido' }, { status: 400 })
    }

    // 6. URL do relatório SWOT
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://diagnostico-360-taupe.vercel.app'
    const reportUrl = `${baseUrl}/swot/${diag.id}`

    // 7. HTML
    const html = gerarHTMLEmailSwot({
      empresaNome: diag.empresa_nome,
      respondenteNome: diag.respondente_nome,
      setor: diag.setor,
      porte: diag.porte,
      responsavel: analise.responsavel_nome,
      status: analise.status,
      total,
      concluidos,
      areas: lista.map((i) => ({ area: i.area, classificacao: i.classificacao, concluido: i.concluido })),
      reportUrl,
    })

    // 8. Enviar via Resend
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      return NextResponse.json({
        error: 'Email não configurado',
        hint: 'Defina RESEND_API_KEY nas variáveis de ambiente da Vercel'
      }, { status: 500 })
    }

    const resend = new Resend(resendKey)
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Neurocorp 360 <onboarding@resend.dev>'

    const { error: errorEmail } = await resend.emails.send({
      from: fromEmail,
      to: destinatario,
      subject: `Análise SWOT — ${diag.empresa_nome}`,
      html,
    })

    if (errorEmail) {
      console.error('[swot/email] Erro Resend:', errorEmail)
      return NextResponse.json({
        error: 'Falha ao enviar: ' + (errorEmail.message || 'desconhecido')
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, destinatario })
  } catch (err) {
    console.error('[swot/email] Exception:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 }
    )
  }
}

// ============================================================================
// HTML do email
// ============================================================================
function gerarHTMLEmailSwot(d: {
  empresaNome: string
  respondenteNome: string
  setor: string
  porte: string
  responsavel?: string | null
  status?: string | null
  total: number
  concluidos: number
  areas: Array<{ area: string; classificacao: string | null; concluido: boolean }>
  reportUrl: string
}): string {
  const pct = d.total === 0 ? 0 : Math.round((d.concluidos / d.total) * 100)
  const statusLabel = d.status === 'CONCLUIDA' ? 'Concluída' : 'Em andamento'

  const corClass = (c: string | null) => {
    switch ((c || '').toUpperCase()) {
      case 'CRÍTICO': case 'CRITICO': return '#dc2626'
      case 'ALTO': return '#ea580c'
      case 'MÉDIO': case 'MEDIO': return '#ca8a04'
      case 'BAIXO': return '#2563eb'
      default: return '#16a34a'
    }
  }

  const linhasAreas = d.areas.map((a) => `
    <tr>
      <td style="padding:8px 0; border-bottom:1px solid #f3f4f6; font-size:14px; color:#374151;">
        ${a.concluido ? '✅' : '⬜️'} ${a.area}
      </td>
      <td style="padding:8px 0; border-bottom:1px solid #f3f4f6; text-align:right;">
        <span style="font-size:12px; font-weight:600; color:${corClass(a.classificacao)};">${a.classificacao || '—'}</span>
      </td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Análise SWOT</title></head>
<body style="margin:0; padding:0; background:#f3f4f6; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6; padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08);">

        <tr>
          <td style="background:linear-gradient(135deg,#1e40af,#3730a3); padding:32px; text-align:center;">
            <div style="color:#ffffff; font-size:13px; letter-spacing:2px; opacity:0.9;">NEUROCORP 360° · ANÁLISE</div>
            <div style="color:#ffffff; font-size:34px; font-weight:bold; margin-top:4px;">SWOT</div>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 32px 8px 32px;">
            <h1 style="margin:0 0 8px 0; font-size:24px; color:#1f2937;">Olá, ${d.respondenteNome.split(' ')[0]}!</h1>
            <p style="margin:0; font-size:15px; color:#6b7280; line-height:1.6;">
              A Análise SWOT da <strong>${d.empresaNome}</strong> aprofunda os gaps do Diagnóstico 360°,
              área por área, da mais crítica para a menos crítica.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px;">
              <tr><td style="padding:24px; text-align:center;">
                <div style="font-size:13px; color:#6b7280; text-transform:uppercase; letter-spacing:1px;">Progresso · ${statusLabel}</div>
                <div style="font-size:56px; font-weight:bold; color:#1e40af; line-height:1; margin:8px 0;">${pct}%</div>
                <div style="font-size:14px; color:#6b7280;">${d.concluidos} de ${d.total} áreas aprofundadas</div>
              </td></tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:0 32px 8px 32px;">
            <h2 style="font-size:15px; color:#1f2937; margin:0 0 8px 0;">Áreas analisadas</h2>
            <table width="100%" cellpadding="0" cellspacing="0">${linhasAreas}</table>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 32px 32px 32px; text-align:center;">
            <a href="${d.reportUrl}" style="display:inline-block; background:#1e40af; color:#ffffff; text-decoration:none; padding:16px 32px; border-radius:12px; font-weight:600; font-size:16px;">
              Ver Análise SWOT Completa →
            </a>
            ${d.responsavel ? `<p style="margin:16px 0 0 0; font-size:12px; color:#9ca3af;">Conduzida por ${d.responsavel}</p>` : ''}
          </td>
        </tr>

        <tr>
          <td style="background:#f9fafb; padding:24px 32px; text-align:center; border-top:1px solid #e5e7eb;">
            <p style="margin:0; font-size:12px; color:#9ca3af; line-height:1.6;">
              Você recebeu este email através da plataforma B&G / Neurocorp 360.<br>
              Em caso de dúvidas, responda diretamente a este email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
