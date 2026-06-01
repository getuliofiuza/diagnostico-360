'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  SwotItem,
  calcularProgresso,
  itemPreenchido,
  corClassificacao,
  obterPrompts,
} from '@/lib/swot/calcular'

interface DiagnosticoResumo {
  id: string
  empresa_nome: string
  setor: string
  porte: string
  respondente_nome: string
  escore_geral: number
  maturidade: string
  criado_em: string
}

interface Analise {
  id?: string
  responsavel_nome?: string | null
  responsavel_papel?: string | null
  sintese_estrategica?: string | null
  status?: string
}

export default function SwotPage() {
  const params = useParams()
  const diagnosticoId = params.diagnosticoId as string

  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [salvoEm, setSalvoEm] = useState<string | null>(null)

  const [diagnostico, setDiagnostico] = useState<DiagnosticoResumo | null>(null)
  const [analise, setAnalise] = useState<Analise>({})
  const [itens, setItens] = useState<SwotItem[]>([])
  const [aberto, setAberto] = useState<number>(0)

  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch(`/api/swot/${diagnosticoId}`)
        const json = await res.json()
        if (!res.ok || !json.success) {
          setErro(json.message || 'Erro ao carregar análise SWOT')
          return
        }
        setDiagnostico(json.diagnostico)
        setAnalise(json.analise || {})
        setItens(json.itens || [])
      } catch (e) {
        setErro('Erro de conexão ao carregar a análise')
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [diagnosticoId])

  const progresso = useMemo(() => calcularProgresso(itens), [itens])

  function atualizarItem(idx: number, campo: keyof SwotItem, valor: any) {
    setItens((prev) => {
      const novo = [...prev]
      novo[idx] = { ...novo[idx], [campo]: valor }
      // marca concluído automaticamente quando os 4 quadrantes têm texto
      if (['forcas', 'fraquezas', 'oportunidades', 'ameacas'].includes(campo as string)) {
        novo[idx].concluido = itemPreenchido(novo[idx])
      }
      return novo
    })
  }

  async function salvar(novoStatus?: string) {
    setSalvando(true)
    setErro('')
    try {
      const res = await fetch(`/api/swot/${diagnosticoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responsavel_nome: analise.responsavel_nome || null,
          responsavel_papel: analise.responsavel_papel || null,
          sintese_estrategica: analise.sintese_estrategica || null,
          status: novoStatus || analise.status || 'EM_ANDAMENTO',
          itens,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setErro(json.message || 'Erro ao salvar')
        return
      }
      if (novoStatus) setAnalise((a) => ({ ...a, status: novoStatus }))
      setSalvoEm(new Date().toLocaleTimeString('pt-BR'))
    } catch {
      setErro('Erro de conexão ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-gray-500">
        Carregando análise SWOT…
      </div>
    )
  }

  if (erro && !diagnostico) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-red-600 mb-4">{erro}</p>
        <Link href="/diagnosticos" className="text-primary-600 hover:underline">
          Voltar para diagnósticos
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 print:max-w-full print:px-0 print:py-0">
      {/* Barra de ações (oculta na impressão) */}
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4 print:hidden">
        <Link
          href={`/diagnostico/${diagnosticoId}`}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          ← Voltar ao diagnóstico
        </Link>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            🖨️ Imprimir / Salvar PDF
          </button>
          <button
            onClick={() => salvar()}
            disabled={salvando}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium disabled:opacity-60"
          >
            {salvando ? 'Salvando…' : '💾 Salvar'}
          </button>
        </div>
      </div>

      {erro && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm print:hidden">
          {erro}
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6 print:border-0 print:p-4 print:mb-3">
        <p className="text-xs font-semibold tracking-wide text-primary-600 uppercase mb-1">
          Neurocorp 360° · Análise SWOT
        </p>
        <h1 className="text-3xl font-bold text-gray-900">{diagnostico?.empresa_nome}</h1>
        <p className="text-gray-500 mt-1">
          {diagnostico?.setor} | {diagnostico?.porte} | {diagnostico?.respondente_nome}
        </p>
        <p className="text-sm text-gray-600 mt-3 max-w-3xl">
          Aprofundamento estratégico dos gaps levantados no Diagnóstico 360° — das áreas{' '}
          <strong>mais críticas</strong> para as <strong>menos críticas</strong>. Conduza com
          autoresponsabilidade: cada quadrante é uma reflexão honesta sobre a realidade da empresa.
        </p>

        {/* Responsável + progresso */}
        <div className="grid md:grid-cols-3 gap-4 mt-6 print:mt-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Conduzido por</label>
            <input
              type="text"
              value={analise.responsavel_nome || ''}
              onChange={(e) => setAnalise((a) => ({ ...a, responsavel_nome: e.target.value }))}
              placeholder="Nome do responsável"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Papel</label>
            <select
              value={analise.responsavel_papel || ''}
              onChange={(e) => setAnalise((a) => ({ ...a, responsavel_papel: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Selecione…</option>
              <option value="Empresário">Empresário</option>
              <option value="Consultor">Consultor</option>
              <option value="Ambos">Ambos</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Progresso ({progresso.concluidos}/{progresso.total} áreas)
            </label>
            <div className="h-9 flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-primary-600 h-3 rounded-full transition-all"
                  style={{ width: `${progresso.pct}%` }}
                />
              </div>
              <span className="ml-2 text-sm font-semibold text-gray-700">{progresso.pct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Matriz SWOT consolidada (2x2) — agrega todas as áreas preenchidas */}
      <MatrizConsolidada itens={itens} />

      {/* Itens SWOT por área (ordenados por criticidade) */}
      <h2 className="text-lg font-bold text-gray-900 mb-3 print:mt-4">
        Aprofundamento por área <span className="font-normal text-gray-500 text-sm">(mais crítica → menos crítica)</span>
      </h2>
      <div className="space-y-4">
        {itens.map((item, idx) => {
          const prompts = obterPrompts(item.area)
          const estaAberto = aberto === idx
          return (
            <div
              key={item.area}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden print:border print:break-inside-avoid"
            >
              {/* Cabeçalho do item */}
              <button
                onClick={() => setAberto(estaAberto ? -1 : idx)}
                className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-gray-50 print:hover:bg-white"
              >
                <div className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white text-sm font-bold flex items-center justify-center">
                    {item.prioridade}
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.area}</h3>
                    <p className="text-xs text-gray-500">
                      Escore {item.escore ?? '—'}/10 · Risco {item.risco_score ?? '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.concluido && (
                    <span className="text-green-600 text-sm print:hidden">✓</span>
                  )}
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded border ${corClassificacao(item.classificacao)}`}
                  >
                    {item.classificacao || '—'}
                  </span>
                  <span className="text-gray-400 print:hidden">{estaAberto ? '▲' : '▼'}</span>
                </div>
              </button>

              {/* Corpo do item (sempre visível na impressão) */}
              <div className={`${estaAberto ? 'block' : 'hidden'} print:block px-5 pb-5`}>
                {/* Grade SWOT 2x2 */}
                <div className="grid md:grid-cols-2 gap-3">
                  <QuadranteCampo
                    titulo="Forças (Strengths)"
                    cor="border-green-300 bg-green-50"
                    prompt={prompts.forcas}
                    valor={item.forcas}
                    onChange={(v) => atualizarItem(idx, 'forcas', v)}
                  />
                  <QuadranteCampo
                    titulo="Fraquezas (Weaknesses)"
                    cor="border-red-300 bg-red-50"
                    prompt={prompts.fraquezas}
                    valor={item.fraquezas}
                    onChange={(v) => atualizarItem(idx, 'fraquezas', v)}
                  />
                  <QuadranteCampo
                    titulo="Oportunidades (Opportunities)"
                    cor="border-blue-300 bg-blue-50"
                    prompt={prompts.oportunidades}
                    valor={item.oportunidades}
                    onChange={(v) => atualizarItem(idx, 'oportunidades', v)}
                  />
                  <QuadranteCampo
                    titulo="Ameaças (Threats)"
                    cor="border-orange-300 bg-orange-50"
                    prompt={prompts.ameacas}
                    valor={item.ameacas}
                    onChange={(v) => atualizarItem(idx, 'ameacas', v)}
                  />
                </div>

                {/* Aprofundamento */}
                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  <CampoTexto
                    titulo="Causa raiz"
                    prompt={prompts.causa_raiz}
                    valor={item.causa_raiz}
                    onChange={(v) => atualizarItem(idx, 'causa_raiz', v)}
                  />
                  <CampoTexto
                    titulo="Estratégia (cruzamento SO/WO/ST/WT)"
                    prompt={prompts.estrategia}
                    valor={item.estrategia}
                    onChange={(v) => atualizarItem(idx, 'estrategia', v)}
                  />
                </div>

                {/* Ação */}
                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Responsável pela ação</label>
                    <input
                      type="text"
                      value={item.acao_responsavel}
                      onChange={(e) => atualizarItem(idx, 'acao_responsavel', e.target.value)}
                      placeholder="Quem assume?"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Prazo</label>
                    <input
                      type="text"
                      value={item.acao_prazo}
                      onChange={(e) => atualizarItem(idx, 'acao_prazo', e.target.value)}
                      placeholder="Ex.: 30-60 dias"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Síntese estratégica */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mt-6 print:border print:break-inside-avoid">
        <h2 className="font-semibold text-gray-900 mb-2">Síntese estratégica</h2>
        <p className="text-xs text-gray-500 mb-2">
          Olhando o conjunto: quais 2-3 movimentos têm maior alavancagem para a empresa nos próximos 90 dias?
        </p>
        <textarea
          value={analise.sintese_estrategica || ''}
          onChange={(e) => setAnalise((a) => ({ ...a, sintese_estrategica: e.target.value }))}
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="Conclusões e prioridades estratégicas…"
        />
      </div>

      {/* Rodapé de ações */}
      <div className="flex flex-wrap justify-between items-center gap-3 mt-6 print:hidden">
        <p className="text-xs text-gray-400">
          {salvoEm ? `Salvo às ${salvoEm}` : 'Alterações não salvas'}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => salvar()}
            disabled={salvando}
            className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-60"
          >
            {salvando ? 'Salvando…' : 'Salvar rascunho'}
          </button>
          <button
            onClick={() => salvar('CONCLUIDA')}
            disabled={salvando}
            className="bg-primary-600 text-white px-5 py-2.5 rounded-lg hover:bg-primary-700 text-sm font-medium disabled:opacity-60"
          >
            ✓ Concluir análise
          </button>
        </div>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Subcomponentes
// ----------------------------------------------------------------------------

function QuadranteCampo({
  titulo,
  cor,
  prompt,
  valor,
  onChange,
}: {
  titulo: string
  cor: string
  prompt: string
  valor: string
  onChange: (v: string) => void
}) {
  return (
    <div className={`rounded-xl border p-3 ${cor}`}>
      <label className="block text-sm font-semibold text-gray-800 mb-1">{titulo}</label>
      <p className="text-[11px] text-gray-500 mb-2 leading-snug print:hidden">{prompt}</p>
      <textarea
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full border border-white/60 bg-white rounded-lg px-2 py-1.5 text-sm focus:border-gray-400"
        placeholder="Escreva aqui…"
      />
    </div>
  )
}

function MatrizConsolidada({ itens }: { itens: SwotItem[] }) {
  // Agrega cada quadrante de todas as áreas, prefixando com o nome da área.
  function agregar(campo: 'forcas' | 'fraquezas' | 'oportunidades' | 'ameacas') {
    return itens
      .filter((i) => (i[campo] || '').trim())
      .map((i) => ({ area: i.area, texto: i[campo].trim() }))
  }

  const blocos = [
    { campo: 'forcas' as const, titulo: 'Forças', cor: 'border-green-300 bg-green-50', tag: 'text-green-700' },
    { campo: 'fraquezas' as const, titulo: 'Fraquezas', cor: 'border-red-300 bg-red-50', tag: 'text-red-700' },
    { campo: 'oportunidades' as const, titulo: 'Oportunidades', cor: 'border-blue-300 bg-blue-50', tag: 'text-blue-700' },
    { campo: 'ameacas' as const, titulo: 'Ameaças', cor: 'border-orange-300 bg-orange-50', tag: 'text-orange-700' },
  ]

  const temAlgo = blocos.some((b) => agregar(b.campo).length > 0)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 print:border print:break-inside-avoid">
      <h2 className="font-bold text-gray-900 mb-1">Matriz SWOT consolidada</h2>
      <p className="text-xs text-gray-500 mb-4">
        Visão agregada de todas as áreas. {temAlgo ? '' : 'Preencha os quadrantes abaixo para vê-la se formar.'}
      </p>
      <div className="grid md:grid-cols-2 gap-3">
        {blocos.map((b) => {
          const itensBloco = agregar(b.campo)
          return (
            <div key={b.campo} className={`rounded-xl border p-3 ${b.cor} min-h-[80px]`}>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">{b.titulo}</h3>
              {itensBloco.length === 0 ? (
                <p className="text-xs text-gray-400 italic">—</p>
              ) : (
                <ul className="space-y-1.5">
                  {itensBloco.map((it, k) => (
                    <li key={k} className="text-xs text-gray-700 leading-snug">
                      <span className={`font-semibold ${b.tag}`}>{it.area}:</span> {it.texto}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CampoTexto({
  titulo,
  prompt,
  valor,
  onChange,
}: {
  titulo: string
  prompt: string
  valor: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{titulo}</label>
      <p className="text-[11px] text-gray-400 mb-1 leading-snug print:hidden">{prompt}</p>
      <textarea
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        placeholder="…"
      />
    </div>
  )
}
