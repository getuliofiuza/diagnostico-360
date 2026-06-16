// ============================================================================
// API v1 — POST /api/v1/diagnosticos/:id/email
// ============================================================================
// Envia o relatório por email. Autenticado por X-API-Key (não por sessão),
// para uso por sistemas externos (Neurocorp 360, etc).

import { NextRequest } from 'next/server'
import { Resend } from 'resend'
import { autenticarApiKey, hasScope, errorResponse } from '@/lib/api/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await autenticarApiKey(request)
  if (!auth.ok) return errorResponse(auth.status, auth.error)
  if (!hasScope(auth.context, 'diagnosticos:read')) {
    return errorResponse(403, 'API key sem permissão de leitura')
  }
  const { supabase, apiKeyId } = auth.context

  const { data: diag, error } = await supabase
    .from('diagnosticos_360')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !diag) {
    return errorResponse(404, 'Diagnóstico não encontrado')
  }
  if (diag.api_key_id !== apiKeyId) {
    return errorResponse(403, 'Este diagnóstico não pertence à sua API key')
  }

  const body = await request.json().catch(() => ({}))
  const destinatario = (body?.destinatario as string | undefined) || diag.respondente_email
  if (!destinatario || !destinatario.includes('@')) {
    return errorResponse(400, 'Email do destinatário inválido')
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://diagnostico-360-taupe.vercel.app'
  const reportUrl = `${baseUrl}/diagnostico/${diag.id}`

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    return errorResponse(500, 'Email não configurado', {
      hint: 'Defina RESEND_API_KEY nas variáveis de ambiente da Vercel',
    })
  }

  const resend = new Resend(resendKey)
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Diagnóstico 360 <onboarding@resend.dev>'

  const { error: errorEmail } = await resend.emails.send({
    from: fromEmail,
    to: destinatario,
    subject: `Seu Diagnóstico Empresarial 360 — ${diag.empresa_nome}`,
    html: gerarHTMLEmail({
      empresaNome: diag.empresa_nome,
      respondenteNome: diag.respondente_nome,
      setor: diag.setor,
      porte: diag.porte,
      escoreGeral: diag.escore_geral,
      maturidade: diag.maturidade,
      criadoEm: diag.criado_em,
      reportUrl,
    }),
  })

  if (errorEmail) {
    return errorResponse(500, 'Falha ao enviar: ' + (errorEmail.message || 'desconhecido'))
  }

  return Response.json({ success: true, destinatario })
}

function gerarHTMLEmail(d: {
  empresaNome: string
  respondenteNome: string
  setor: string
  porte: string
  escoreGeral: number
  maturidade: string
  criadoEm: string
  reportUrl: string
}): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Seu Diagnóstico Empresarial 360</title>
</head>
<body style="margin:0; padding:0; background:#f3f4f6; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1e40af,#3730a3); padding:32px; text-align:center;">
              <div style="color:#ffffff; font-size:14px; letter-spacing:2px; opacity:0.9;">DIAGNÓSTICO EMPRESARIAL</div>
              <div style="color:#ffffff; font-size:36px; font-weight:bold; margin-top:4px;">360°</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px 32px;">
              <h1 style="margin:0 0 8px 0; font-size:24px; color:#1f2937;">Olá, ${d.respondenteNome.split(' ')[0]}!</h1>
              <p style="margin:0; font-size:15px; color:#6b7280; line-height:1.6;">
                Seu Diagnóstico Empresarial 360° da <strong>${d.empresaNome}</strong> está pronto.
                Confira abaixo um resumo do resultado e clique no botão para ver o relatório completo.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px;">
                <tr>
                  <td style="padding:24px; text-align:center;">
                    <div style="font-size:13px; color:#6b7280; text-transform:uppercase; letter-spacing:1px;">Índice de Maturidade</div>
                    <div style="font-size:64px; font-weight:bold; color:#1e40af; line-height:1; margin:8px 0;">${d.escoreGeral}</div>
                    <div style="font-size:14px; color:#6b7280; margin-bottom:12px;">de 10</div>
                    <div style="display:inline-block; padding:6px 18px; background:#dbeafe; color:#1e40af; border-radius:999px; font-size:14px; font-weight:600;">
                      ${d.maturidade}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px; color:#4b5563;">
                <tr><td style="padding:6px 0; border-bottom:1px solid #f3f4f6;"><strong>Empresa:</strong> ${d.empresaNome}</td></tr>
                <tr><td style="padding:6px 0; border-bottom:1px solid #f3f4f6;"><strong>Setor:</strong> ${d.setor} | <strong>Porte:</strong> ${d.porte}</td></tr>
                <tr><td style="padding:6px 0;"><strong>Data:</strong> ${new Date(d.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 32px 32px; text-align:center;">
              <a href="${d.reportUrl}" style="display:inline-block; background:#1e40af; color:#ffffff; text-decoration:none; padding:16px 32px; border-radius:12px; font-weight:600; font-size:16px;">
                Ver Relatório Completo →
              </a>
              <p style="margin:16px 0 0 0; font-size:12px; color:#9ca3af;">
                O relatório inclui análise por área, matriz de risco, recomendações estratégicas (PDE) e mais.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb; padding:24px 32px; text-align:center; border-top:1px solid #e5e7eb;">
              <p style="margin:0; font-size:12px; color:#9ca3af; line-height:1.6;">
                Você recebeu este email porque realizou um diagnóstico empresarial através da plataforma B&G / Neurocorp 360.<br>
                Em caso de dúvidas, responda diretamente a este email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
