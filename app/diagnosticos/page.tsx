'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface DiagnosticoItem {
  id: string
  empresa_nome: string
  setor: string
  porte: string
  escore_geral: number
  maturidade: string
  criado_em: string
  respondente_nome: string
}

function normalizarChave(str: string): string {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
}

function getCorMaturidade(maturidade: string): string {
  const cores: Record<string, string> = {
    'NULA': 'bg-red-100 text-red-700',
    'BASICA': 'bg-orange-100 text-orange-700',
    'INICIAL': 'bg-yellow-100 text-yellow-700',
    'PLENA': 'bg-blue-100 text-blue-700',
    'AVANCADA': 'bg-green-100 text-green-700',
  }
  return cores[normalizarChave(maturidade)] || 'bg-gray-100 text-gray-700'
}

export default function DiagnosticosPage() {
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/setup', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (!data.tenant_id) throw new Error('Não autenticado')
        return fetch(`/api/diagnosticos?tenant_id=${data.tenant_id}&limit=50`)
      })
      .then(res => {
        if (!res.ok) throw new Error('Erro ao carregar')
        return res.json()
      })
      .then(data => {
        setDiagnosticos(data.data || data.diagnosticos || [])
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Diagnósticos</h1>
          <p className="text-gray-500 mt-1">{diagnosticos.length} diagnóstico(s) realizado(s)</p>
        </div>
        <Link href="/diagnostico/novo" className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium">
          Novo Diagnóstico
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {diagnosticos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Nenhum diagnóstico ainda</h2>
          <p className="text-gray-500 mb-6">Crie seu primeiro diagnóstico para começar</p>
          <Link href="/diagnostico/novo" className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium">
            Criar Diagnóstico
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {diagnosticos.map(d => (
            <div
              key={d.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <Link href={`/diagnostico/${d.id}`} className="flex-1 group">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-700">{d.empresa_nome}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {d.setor} | {d.porte} | {d.respondente_nome}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(d.criado_em).toLocaleDateString('pt-BR')}
                  </p>
                </Link>
                <div className="text-right ml-4">
                  <div className="text-3xl font-bold text-primary-700">{d.escore_geral}</div>
                  <div className="text-xs text-gray-400 mb-1">de 10</div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getCorMaturidade(d.maturidade)}`}>
                    {d.maturidade}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <Link
                  href={`/diagnostico/${d.id}`}
                  className="text-sm text-gray-600 hover:text-primary-700 font-medium"
                >
                  📊 Ver diagnóstico
                </Link>
                <span className="text-gray-300">·</span>
                <Link
                  href={`/swot/${d.id}`}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  🎯 Aprofundar com SWOT
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
