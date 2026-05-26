'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { RadarChartDiagnostico } from '@/components/radar-chart'

interface Escore {
  area: string
  escore: number
  nivel?: string
}

interface RiscoItem {
  area: string
  escore: number
  risco_score: number
  classificacao: string
  prioridade: number
}

interface PDIItem {
  area: string
  acao_descricao: string
  acao_prazo: string
  fase: number
  status: string
  escore_atual: number
  escore_meta: number
}

interface ObservacaoItem {
  questao_id: number
  tema: string
  texto: string
}

interface DiagnosticoData {
  id: string
  empresa_nome: string
  setor: string
  porte: string
  respondente_nome: string
  escore_geral: number
  maturidade: string
  criado_em: string
  escores: Escore[]
  matriz_risco: RiscoItem[]
  pdi: PDIItem[]
  narrativa: string
  benchmark?: Array<{ area: string; media_setor: number }>
  radar_data?: Array<{ area: string; escore: number }>
  observacoes?: ObservacaoItem[]
}

const CORES_MATURIDADE: Record<string, string> = {
  'NULA': 'bg-red-100 text-red-800 border-red-300',
  'BASICA': 'bg-orange-100 text-orange-800 border-orange-300',
  'INICIAL': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'PLENA': 'bg-blue-100 text-blue-800 border-blue-300',
  'AVANCADA': 'bg-green-100 text-green-800 border-green-300',
}

const CORES_RISCO: Record<string, string> = {
  'CRITICO': 'bg-red-600 text-white',
  'ALTO': 'bg-orange-500 text-white',
  'MEDIO': 'bg-yellow-400 text-gray-900',
  'BAIXO': 'bg-blue-400 text-white',
  'OK': 'bg-green-500 text-white',
}

function normalizarChave(str: string): string {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
}

function getCorMaturidade(maturidade: string): string {
  return CORES_MATURIDADE[normalizarChave(maturidade)] || 'bg-gray-100 text-gray-800'
}

function getCorRisco(classificacao: string): string {
  return CORES_RISCO[normalizarChave(classificacao)] || 'bg-gray-400 text-white'
}

const IMPACTOS_AREA: Record<string, { medio: string; longo: string }> = {
  'PLANEJAMENTO E ESTRATEGIA': {
    medio: 'Decisoes reativas, perda de oportunidades de mercado, retrabalho frequente',
    longo: 'Estagnacao do crescimento, irrelevancia competitiva, dificuldade de captacao'
  },
  'RECURSOS HUMANOS': {
    medio: 'Alta rotatividade, baixa produtividade, custos crescentes com recrutamento',
    longo: 'Perda de know-how, dificuldade de escalar equipe, clima organizacional toxico'
  },
  'ESTOQUE': {
    medio: 'Capital empatado, rupturas frequentes, perdas por obsolescencia',
    longo: 'Margem comprometida, insatisfacao de clientes, perda de market share'
  },
  'FINANCEIRO': {
    medio: 'Fluxo de caixa apertado, dependencia de credito caro, decisoes sem dados',
    longo: 'Insolvencia, descapitalizacao, impossibilidade de investir em crescimento'
  },
  'TECNOLOGIA DA INFORMACAO': {
    medio: 'Processos manuais, retrabalho, vulnerabilidade a falhas e ataques',
    longo: 'Defasagem competitiva, incapacidade de escalar, riscos de seguranca graves'
  },
  'RELACOES INSTITUCIONAIS': {
    medio: 'Conflitos legais pontuais, multas, deterioracao de imagem',
    longo: 'Passivos significativos, perda de licencas, danos reputacionais permanentes'
  },
  'LOGISTICA': {
    medio: 'Atrasos de entrega, custos elevados, reclamacoes de clientes',
    longo: 'Perda de contratos, insatisfacao cronica, perda de competitividade'
  },
  'MARKETING E VENDAS': {
    medio: 'Queda no volume de vendas, custo de aquisicao alto, baixa conversao',
    longo: 'Encolhimento de mercado, dependencia de poucos clientes, marca fraca'
  },
  'PROJECOES E TENDENCIAS': {
    medio: 'Surpresas com mudancas de mercado, decisoes baseadas em intuicao',
    longo: 'Obsolescencia do modelo de negocio, perda de relevancia, disrupcao por concorrentes'
  },
  'GESTAO DE PROCESSOS E GOVERNANCA': {
    medio: 'Retrabalho, dependencia de "herois operacionais", decisoes centralizadas geram gargalos',
    longo: 'Colapso institucional se lideranca se afasta, exposicao a passivos juridicos, impossibilidade de escalar'
  }
}

function getImpactos(area: string, classificacao: string): { medio: string; longo: string } | null {
  const cls = normalizarChave(classificacao)
  if (cls === 'OK' || cls === 'BAIXO') return null

  const areaKey = normalizarChave(area)
  return IMPACTOS_AREA[areaKey] || null
}

function BarraEscore({ escore, label }: { escore: number; label: string }) {
  const pct = (escore / 10) * 100
  let cor = 'bg-red-500'
  if (escore >= 8) cor = 'bg-green-500'
  else if (escore >= 6) cor = 'bg-blue-500'
  else if (escore >= 4) cor = 'bg-yellow-500'
  else if (escore >= 2) cor = 'bg-orange-500'

  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="w-48 text-sm text-gray-700 truncate" title={label}>{label}</div>
      <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
        <div className={`${cor} h-6 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800">
          {escore}/10
        </span>
      </div>
    </div>
  )
}

export default function DiagnosticoResultadoPage() {
  const params = useParams()
  const id = params.id as string
  const [data, setData] = useState<DiagnosticoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/diagnosticos/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Diagnóstico não encontrado')
        return res.json()
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-500">Carregando diagnóstico...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Erro</h1>
        <p className="text-gray-600 mb-6">{error || 'Diagnóstico não encontrado'}</p>
        <Link href="/diagnosticos" className="text-primary-600 hover:underline">Voltar para diagnósticos</Link>
      </div>
    )
  }

  const faseLabel = (fase: number) => {
    if (fase === 1) return 'Imediata (0-30 dias)'
    if (fase === 2) return 'Curto prazo (30-90 dias)'
    return 'Longo prazo (90+ dias)'
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{data.empresa_nome}</h1>
            <p className="text-gray-500 mt-1">{data.setor} | {data.porte} | {data.respondente_nome}</p>
            <p className="text-sm text-gray-400 mt-1">
              {new Date(data.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-primary-700">{data.escore_geral}</div>
            <div className="text-sm text-gray-500 mb-2">de 10</div>
            <span className={`inline-block px-4 py-1 rounded-full text-sm font-semibold border ${getCorMaturidade(data.maturidade)}`}>
              {data.maturidade}
            </span>
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Visão Geral - Radar de Maturidade</h2>
        <p className="text-sm text-gray-500 mb-4">Comparativo dos escores da sua empresa com a média do setor ({data.setor})</p>
        <RadarChartDiagnostico
          escores={data.escores}
          benchmark={data.benchmark}
        />
      </div>

      {/* Escores por Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Escores por Area</h2>
          {data.escores
            .sort((a, b) => b.escore - a.escore)
            .map(e => (
              <BarraEscore key={e.area} escore={e.escore} label={e.area} />
            ))}
        </div>

        {/* Matriz de Risco */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Matriz de Risco</h2>
          <p className="text-sm text-gray-500 mb-6">Impactos esperados se o risco nao for mitigado</p>
          <div className="space-y-3">
            {data.matriz_risco
              .sort((a, b) => a.prioridade - b.prioridade)
              .map(item => {
                const impactos = getImpactos(item.area, item.classificacao)
                return (
                  <div key={item.area} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 text-sm">{item.area}</div>
                        <div className="text-xs text-gray-500">Escore: {item.escore}/10 | Risco: {item.risco_score}</div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getCorRisco(item.classificacao)}`}>
                        {item.classificacao}
                      </span>
                    </div>
                    {impactos && (
                      <div className="mt-2 pt-2 border-t border-gray-200 space-y-1.5">
                        <div className="flex items-start gap-2 text-xs">
                          <span className="font-semibold text-orange-700 shrink-0">Médio prazo (3-12m):</span>
                          <span className="text-gray-600">{impactos.medio}</span>
                        </div>
                        <div className="flex items-start gap-2 text-xs">
                          <span className="font-semibold text-red-700 shrink-0">Longo prazo (1-3a):</span>
                          <span className="text-gray-600">{impactos.longo}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </div>
      </div>

      {/* Narrativa */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Análise Interpretativa</h2>
        <div className="prose max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
          {data.narrativa}
        </div>
      </div>

      {/* Observações Personalizadas (respostas "Outras") */}
      {data.observacoes && data.observacoes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                <span>📝</span> Observações Personalizadas do Respondente
              </h2>
              <p className="text-sm text-amber-800 mt-1">
                Situações específicas que não se encaixaram nas opções padrão. Use esses contextos para interpretação qualitativa do diagnóstico.
              </p>
            </div>
            <span className="bg-amber-200 text-amber-900 text-sm font-bold px-3 py-1 rounded-full whitespace-nowrap">
              {data.observacoes.length} {data.observacoes.length === 1 ? 'observação' : 'observações'}
            </span>
          </div>

          <div className="space-y-4">
            {Array.from(new Set(data.observacoes.map(o => o.tema))).map(tema => {
              const obsArea = data.observacoes!.filter(o => o.tema === tema)
              return (
                <div key={tema} className="bg-white border border-amber-100 rounded-lg p-4">
                  <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      {obsArea.length}
                    </span>
                    {tema}
                  </h3>
                  <div className="space-y-2">
                    {obsArea.map((obs, i) => (
                      <div key={i} className="border-l-4 border-amber-300 pl-3 py-1">
                        <p className="text-sm text-gray-700 italic">"{obs.texto}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* PDI */}
      {data.pdi && data.pdi.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Plano de Desenvolvimento (PDI)</h2>

          {[1, 2, 3].map(fase => {
            const acoesFase = data.pdi.filter(a => a.fase === fase)
            if (acoesFase.length === 0) return null
            return (
              <div key={fase} className="mb-8 last:mb-0">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${fase === 1 ? 'bg-red-500' : fase === 2 ? 'bg-yellow-500' : 'bg-green-500'}`} />
                  {faseLabel(fase)}
                </h3>
                <div className="space-y-3">
                  {acoesFase.map((acao, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-lg border-l-4 border-primary-400">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <span className="text-xs font-semibold text-primary-600 uppercase">{acao.area}</span>
                          <p className="text-gray-800 mt-1">{acao.acao_descricao}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Prazo: {acao.acao_prazo} | Escore atual: {acao.escore_atual} &rarr; Meta: {acao.escore_meta}
                          </p>
                        </div>
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">{acao.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Acoes */}
      <div className="flex gap-4 justify-center">
        <Link href="/diagnosticos" className="bg-white text-gray-700 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors font-medium">
          Ver todos os diagnósticos
        </Link>
        <Link href="/diagnostico/novo" className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium">
          Novo Diagnóstico
        </Link>
      </div>
    </div>
  )
}
