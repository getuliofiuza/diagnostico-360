'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface DiagItem {
  id: string
  empresa_nome: string
  setor: string
  porte: string
  respondente_nome: string
  respondente_email: string
  respondente_telefone?: string
  municipio?: string
  atividade_cnae?: string
  escore_geral: number
  maturidade: string
  risco_geral: number
  criado_em: string
  tenant_id: string
  tenants?: { nome: string; email: string }
}

function corMaturidade(m: string): string {
  const map: Record<string, string> = {
    'NULA': 'bg-red-100 text-red-700',
    'BÁSICA': 'bg-orange-100 text-orange-700',
    'BASICA': 'bg-orange-100 text-orange-700',
    'INICIAL': 'bg-yellow-100 text-yellow-700',
    'PLENA': 'bg-blue-100 text-blue-700',
    'AVANÇADA': 'bg-green-100 text-green-700',
    'AVANCADA': 'bg-green-100 text-green-700',
  }
  return map[m] || 'bg-gray-100 text-gray-700'
}

export default function AdminDiagnosticosPage() {
  const [items, setItems] = useState<DiagItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [setor, setSetor] = useState('')

  const carregar = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (setor) params.set('setor', setor)
    params.set('limit', '200')

    fetch(`/api/admin/diagnosticos?${params}`)
      .then(res => {
        if (res.status === 403) throw new Error('Acesso negado — você não é administrador')
        if (!res.ok) throw new Error('Erro ao carregar')
        return res.json()
      })
      .then(data => {
        setItems(data.data || [])
        setTotal(data.total || 0)
        setError(null)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    carregar()
  }, []) // eslint-disable-line

  if (loading && items.length === 0) {
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
        <p className="text-gray-600 mb-6">Esta área é restrita ao administrador do sistema.</p>
        <Link href="/diagnosticos" className="text-primary-600 hover:underline font-medium">
          Voltar para meus diagnósticos
        </Link>
      </div>
    )
  }

  // Estatísticas básicas
  const totalCarregado = items.length
  const mediaEscore = items.length > 0
    ? (items.reduce((sum, i) => sum + (i.escore_geral || 0), 0) / items.length).toFixed(1)
    : '—'
  const distribuicaoSetor = items.reduce((acc, i) => {
    acc[i.setor] = (acc[i.setor] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <span>👑</span> Painel Administrativo
          </h1>
          <p className="text-gray-500 mt-1">Todos os diagnósticos do sistema</p>
        </div>
        <Link href="/diagnosticos" className="text-sm text-primary-600 hover:underline">
          ← Meus diagnósticos
        </Link>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs uppercase text-gray-500 font-medium">Total no Sistema</div>
          <div className="text-3xl font-bold text-gray-900">{total}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs uppercase text-gray-500 font-medium">Carregados</div>
          <div className="text-3xl font-bold text-gray-900">{totalCarregado}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs uppercase text-gray-500 font-medium">Escore Médio</div>
          <div className="text-3xl font-bold text-primary-700">{mediaEscore}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs uppercase text-gray-500 font-medium">Setores</div>
          <div className="text-sm font-medium text-gray-700 mt-1 space-y-0.5">
            {Object.entries(distribuicaoSetor).map(([s, n]) => (
              <div key={s} className="flex justify-between">
                <span>{s}</span><span className="text-gray-500">{n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por empresa, nome ou email..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
            onKeyDown={e => e.key === 'Enter' && carregar()}
          />
          <select
            value={setor}
            onChange={e => setSetor(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
          >
            <option value="">Todos os setores</option>
            <option value="Comércio">Comércio</option>
            <option value="Serviços">Serviços</option>
            <option value="Indústria">Indústria</option>
            <option value="Produtor Rural">Produtor Rural</option>
          </select>
          <button
            onClick={carregar}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
          >
            Filtrar
          </button>
          <button
            onClick={() => exportarCSV(items)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            📥 Exportar CSV
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Empresa</th>
                <th className="px-4 py-3 font-medium">Respondente</th>
                <th className="px-4 py-3 font-medium">Setor / Porte</th>
                <th className="px-4 py-3 font-medium">Município</th>
                <th className="px-4 py-3 font-medium text-right">Escore</th>
                <th className="px-4 py-3 font-medium">Maturidade</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(i => (
                <tr key={i.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(i.criado_em).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{i.empresa_nome}</td>
                  <td className="px-4 py-3">
                    <div className="text-gray-700">{i.respondente_nome}</div>
                    <div className="text-xs text-gray-500">{i.respondente_email}</div>
                    {i.respondente_telefone && <div className="text-xs text-gray-500">{i.respondente_telefone}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {i.setor}
                    <div className="text-xs text-gray-500">{i.porte}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{i.municipio || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-lg font-bold text-primary-700">{i.escore_geral}</span>
                    <span className="text-xs text-gray-400">/10</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${corMaturidade(i.maturidade)}`}>
                      {i.maturidade}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/diagnostico/${i.id}`}
                      className="text-primary-600 hover:underline text-xs font-medium"
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    Nenhum diagnóstico encontrado
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

function exportarCSV(items: DiagItem[]) {
  const headers = ['Data', 'Empresa', 'Respondente', 'Email', 'Telefone', 'Setor', 'Porte', 'Municipio', 'CNAE', 'Escore', 'Maturidade', 'Risco Geral']
  const rows = items.map(i => [
    new Date(i.criado_em).toLocaleDateString('pt-BR'),
    i.empresa_nome,
    i.respondente_nome,
    i.respondente_email,
    i.respondente_telefone || '',
    i.setor,
    i.porte,
    i.municipio || '',
    i.atividade_cnae || '',
    i.escore_geral,
    i.maturidade,
    i.risco_geral,
  ])
  const csv = [headers, ...rows]
    .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `diagnosticos-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
