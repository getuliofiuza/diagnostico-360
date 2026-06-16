// ============================================================================
// LIB API — Autenticação por API key (header X-API-Key)
// ============================================================================
// Usado pelos endpoints /api/v1/* para validar chamadas externas
// (ex: Neurocorp 360 e outros sistemas que consomem o Diagnóstico)

import crypto from 'crypto'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const TENANT_API_EXTERNA = '00000000-0000-0000-0000-0000000000a1'

export interface ApiKeyContext {
  apiKeyId: string
  apiKeyNome: string
  scopes: string[]
  supabase: SupabaseClient
  tenantId: string  // tenant especial "API Externa"
}

export interface AuthResult {
  ok: true
  context: ApiKeyContext
}

export interface AuthError {
  ok: false
  status: number
  error: string
}

/**
 * Gera uma nova API key no formato dgn_live_<32 chars>.
 * Retorna { plainKey, prefix, hash } — apenas plainKey deve ser mostrada ao usuário 1 vez.
 */
export function gerarApiKey(): { plainKey: string; prefix: string; hash: string } {
  const random = crypto.randomBytes(24).toString('base64url')  // 32 chars
  const plainKey = `dgn_live_${random}`
  const prefix = plainKey.slice(0, 16)  // "dgn_live_xxxxxxx" pra identificação visual
  const hash = crypto.createHash('sha256').update(plainKey).digest('hex')
  return { plainKey, prefix, hash }
}

/**
 * Calcula hash de uma chave (pra comparar com o armazenado).
 */
function hashKey(plainKey: string): string {
  return crypto.createHash('sha256').update(plainKey).digest('hex')
}

/**
 * Valida API key vinda no header X-API-Key.
 * - Retorna context se válida
 * - Retorna { ok: false, status, error } se inválida
 */
export async function autenticarApiKey(request: Request): Promise<AuthResult | AuthError> {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('X-API-Key')

  if (!apiKey) {
    return {
      ok: false,
      status: 401,
      error: 'API key ausente. Inclua o header X-API-Key na requisição.',
    }
  }

  if (!apiKey.startsWith('dgn_live_')) {
    return {
      ok: false,
      status: 401,
      error: 'API key com formato inválido. Esperado: dgn_live_*',
    }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Busca pela hash (constant-time via DB)
  const hash = hashKey(apiKey)
  const { data: key, error } = await supabase
    .from('api_keys')
    .select('id, nome, scopes, ativo, expira_em, total_chamadas')
    .eq('key_hash', hash)
    .single()

  if (error || !key) {
    return {
      ok: false,
      status: 403,
      error: 'API key inválida ou não encontrada.',
    }
  }

  if (!key.ativo) {
    return {
      ok: false,
      status: 403,
      error: 'API key foi revogada.',
    }
  }

  if (key.expira_em && new Date(key.expira_em) < new Date()) {
    return {
      ok: false,
      status: 403,
      error: 'API key expirada.',
    }
  }

  // Atualiza estatísticas de uso (fire and forget)
  supabase
    .from('api_keys')
    .update({
      ultima_utilizacao: new Date().toISOString(),
      total_chamadas: (key.total_chamadas || 0) + 1,
    })
    .eq('id', key.id)
    .then(() => undefined)

  return {
    ok: true,
    context: {
      apiKeyId: key.id,
      apiKeyNome: key.nome,
      scopes: key.scopes || [],
      supabase,
      tenantId: TENANT_API_EXTERNA,
    },
  }
}

/**
 * Helper pra checar se a key tem um scope específico.
 */
export function hasScope(context: ApiKeyContext, scope: string): boolean {
  return context.scopes.includes(scope) || context.scopes.includes('*')
}

/**
 * Helper de resposta padronizada de erro.
 */
export function errorResponse(status: number, error: string, extras?: Record<string, any>) {
  return Response.json(
    {
      error,
      status,
      ...(extras || {}),
    },
    { status }
  )
}
