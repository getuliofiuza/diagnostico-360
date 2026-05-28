'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Usuario {
  tenant_id: string
  owner_id: string
  nome: string
  email: string | null
  is_admin: boolean
  plano: string
  criado_em: string
  total_diagnosticos: number
}

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ texto: string; tipo: 'sucesso' | 'erro' } | null>(null)

  const carregar = () => {
    setLoading(true)
    fetch('/api/admin/usuarios')
      .then(res => {
        if (res.status === 403) throw new Error('Acesso negado — apenas administradores')
        if (!res.ok) throw new Error('Erro ao carregar')
        return res.json()
      })
      .then(data => {
        setUsuarios(data.data || [])
        setError(null)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    carregar()
  }, [])

  const mostrarToast = (texto: string, tipo: 'sucesso' | 'erro' = 'sucesso') => {
    setToast({ texto, tipo })
    setTimeout(() => setToast(null), 3500)
  }

  const toggleAdmin = async (u: Usuario) => {
    const novoStatus = !u.is_admin
    const confirma = window.confirm(
      novoStatus
        ? `Promover "${u.email || u.nome}" a ADMINISTRADOR?\n\nEle terá acesso a TODOS os diagnósticos do sistema.`
        : `Remover acesso ADMINISTRADOR de "${u.email || u.nome}"?\n\nEle continuará vendo apenas os próprios diagnósticos.`
    )
    if (!confirma) return

    setUpdatingId(u.tenant_id)
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: u.tenant_id, is_admin: novoStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar')

      // Atualiza estado local
      setUsuarios(prev => prev.map(x => x.tenant_id === u.tenant_id ? { ...x, is_admin: novoStatus } : x))
      mostrarToast(
        novoStatus
          ? `✅ ${u.email || u.nome} agora é administrador`
          : `🔒 Acesso admin removido de ${u.email || u.nome}`,
        'sucesso'
      )
    } catch (e: any) {
      mostrarToast(`❌ ${e.message}`, 'erro')
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading && usuarios.length === 0) {
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
        <Link href="/diagnosticos" className="text-primary-600 hover:underline font-medium">
          ← Voltar
        </Link>
      </div>
    )
  }

  const usuariosFiltrados = usuarios.filter(u => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      u.email?.toLowerCase().includes(s) ||
      u.nome?.toLowerCase().includes(s)
    )
  })

  const total = usuarios.length
  const totalAdmins = usuarios.filter(u => u.is_admin).length
  const totalNovos7d = usuarios.filter(u => {
    const dias = (Date.now() - new Date(u.criado_em).getTime()) / (1000 * 60 * 60 * 24)
    return dias <= 7
  }).length

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-lg shadow-lg font-medium text-sm animate-fadeIn ${
            toast.tipo === 'sucesso' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.texto}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <span>👥</span> Gerenciar Usuários
          </h1>
          <p className="text-gray-500 mt-1">Promova ou remova permissões de administrador</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/diagnosticos" className="text-sm text-primary-600 hover:underline">
            👑 Diagnósticos (admin)
          </Link>
          <Link href="/diagnosticos" className="text-sm text-gray-600 hover:underline">
            Meus diagnósticos
          </Link>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs uppercase text-gray-500 font-medium">Total de Usuários</div>
          <div className="text-3xl font-bold text-gray-900">{total}</div>
        </div>
        <div className="bg-white border border-amber-200 rounded-xl p-4">
          <div className="text-xs uppercase text-amber-700 font-medium">Administradores</div>
          <div className="text-3xl font-bold text-amber-700 flex items-center gap-2">
            {totalAdmins} <span className="text-xl">👑</span>
          </div>
        </div>
        <div className="bg-white border border-blue-200 rounded-xl p-4">
          <div className="text-xs uppercase text-blue-700 font-medium">Novos (últimos 7 dias)</div>
          <div className="text-3xl font-bold text-blue-700">{totalNovos7d}</div>
        </div>
      </div>

      {/* Busca */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por email ou nome..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
        />
      </div>

      {/* Tabela */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Usuário</th>
                <th className="px-4 py-3 font-medium">Empresa</th>
                <th className="px-4 py-3 font-medium text-center">Diagnósticos</th>
                <th className="px-4 py-3 font-medium text-center">Cadastrado em</th>
                <th className="px-4 py-3 font-medium text-center">Plano</th>
                <th className="px-4 py-3 font-medium text-right">Permissão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuariosFiltrados.map(u => (
                <tr key={u.tenant_id} className={`${u.is_admin ? 'bg-amber-50/50' : ''} hover:bg-gray-50`}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {u.email || '(sem email)'}
                      {u.is_admin && (
                        <span className="ml-2 px-2 py-0.5 bg-amber-200 text-amber-900 text-xs font-bold rounded">
                          👑 ADMIN
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{u.nome || '—'}</td>
                  <td className="px-4 py-3 text-center font-medium text-gray-700">
                    {u.total_diagnosticos}
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-500">
                    {new Date(u.criado_em).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded uppercase font-medium">
                      {u.plano || 'free'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleAdmin(u)}
                      disabled={updatingId === u.tenant_id}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
                        u.is_admin
                          ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                          : 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'
                      }`}
                    >
                      {updatingId === u.tenant_id
                        ? '...'
                        : u.is_admin
                          ? '🔒 Remover acesso admin'
                          : '👑 Promover a admin'}
                    </button>
                  </td>
                </tr>
              ))}
              {usuariosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-4 text-center">
        Total: <strong>{usuariosFiltrados.length}</strong> usuário(s) {search && `(filtrado de ${total})`}
      </p>
    </div>
  )
}
