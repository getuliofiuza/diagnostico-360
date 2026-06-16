'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ApiKey {
  id: string
  nome: string
  prefix: string
  ativo: boolean
  criado_em: string
  ultima_utilizacao: string | null
  total_chamadas: number
  total_diagnosticos_criados: number
}

export default function AdminApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalNova, setModalNova] = useState(false)
  const [chaveGerada, setChaveGerada] = useState<string | null>(null)

  // Estados do form de criação
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [criando, setCriando] = useState(false)

  const carregar = () => {
    setLoading(true)
    fetch('/api/admin/api-keys')
      .then(r => {
        if (r.status === 403) throw new Error('Acesso negado — apenas administradores')
        if (!r.ok) throw new Error('Erro ao carregar')
        return r.json()
      })
      .then(d => {
        setKeys(d.data || [])
        setError(null)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [])

  const criarChave = async () => {
    if (nome.trim().length < 3) {
      alert('Nome precisa ter pelo menos 3 caracteres')
      return
    }
    setCriando(true)
    try {
      const r = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome.trim(), descricao: descricao.trim() || undefined }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Erro')
      setChaveGerada(d.api_key)
      setNome('')
      setDescricao('')
      carregar()
    } catch (e: any) {
      alert(`Erro: ${e.message}`)
    } finally {
      setCriando(false)
    }
  }

  const revogar = async (k: ApiKey) => {
    if (!confirm(`Revogar a chave "${k.nome}"?\n\nIsso interrompe imediatamente qualquer integração que use essa chave.`)) return
    const r = await fetch(`/api/admin/api-keys/${k.id}`, { method: 'DELETE' })
    if (r.ok) carregar()
  }

  const toggleAtivo = async (k: ApiKey) => {
    const r = await fetch(`/api/admin/api-keys/${k.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !k.ativo }),
    })
    if (r.ok) carregar()
  }

  if (loading && keys.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-3">🔒 {error}</h1>
        <Link href="/diagnosticos" className="text-primary-600 hover:underline font-medium">← Voltar</Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Modal: chave recém-gerada */}
      {chaveGerada && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-2">🔑 Nova API key criada</h2>
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              ⚠️ <strong>Esta é a única vez que esta chave será exibida.</strong> Copie e guarde em local seguro agora.
            </p>
            <div className="bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-lg break-all mb-4">
              {chaveGerada}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => navigator.clipboard.writeText(chaveGerada)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
              >
                📋 Copiar
              </button>
              <button
                onClick={() => setChaveGerada(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: criar nova */}
      {modalNova && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Nova API key</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: Neurocorp 360 Production"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  placeholder="Contexto de uso, qual ambiente, etc."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => { setModalNova(false); setNome(''); setDescricao('') }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await criarChave()
                  setModalNova(false)
                }}
                disabled={criando}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium disabled:opacity-50"
              >
                {criando ? 'Gerando...' : '🔑 Gerar chave'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <span>🔑</span> API Keys
          </h1>
          <p className="text-gray-500 mt-1">Chaves de acesso para sistemas externos consumirem a API</p>
        </div>
        <div className="flex gap-3 items-center">
          <Link href="/admin/diagnosticos" className="text-sm text-amber-700 hover:underline">👑 Diagnósticos</Link>
          <Link href="/admin/usuarios" className="text-sm text-amber-700 hover:underline">👥 Usuários</Link>
          <button
            onClick={() => setModalNova(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
          >
            + Nova chave
          </button>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-900">
        <p className="font-semibold mb-1">Como usar uma API key</p>
        <p>Inclua o header <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs font-mono">X-API-Key: dgn_live_...</code> em todas as requisições para <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs font-mono">/api/v1/*</code>.</p>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Prefixo</th>
                <th className="px-4 py-3 font-medium text-center">Status</th>
                <th className="px-4 py-3 font-medium text-center">Chamadas</th>
                <th className="px-4 py-3 font-medium text-center">Diagnósticos</th>
                <th className="px-4 py-3 font-medium text-center">Última uso</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {keys.map(k => (
                <tr key={k.id} className={`${!k.ativo ? 'opacity-50' : ''} hover:bg-gray-50`}>
                  <td className="px-4 py-3 font-medium text-gray-900">{k.nome}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{k.prefix}…</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      k.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {k.ativo ? '🟢 Ativa' : '⛔ Revogada'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-medium">{k.total_chamadas || 0}</td>
                  <td className="px-4 py-3 text-center font-medium">{k.total_diagnosticos_criados || 0}</td>
                  <td className="px-4 py-3 text-center text-xs text-gray-500">
                    {k.ultima_utilizacao ? new Date(k.ultima_utilizacao).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {k.ativo ? (
                      <button
                        onClick={() => revogar(k)}
                        className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100"
                      >
                        ⛔ Revogar
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleAtivo(k)}
                        className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-medium hover:bg-green-100"
                      >
                        🟢 Reativar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {keys.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    Nenhuma API key criada ainda. Clique em <strong>+ Nova chave</strong> pra começar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
