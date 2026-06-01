'use client'

import React, { useEffect, useState } from 'react'
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
  respondente_email?: string
  respondente_telefone?: string
  endereco?: string
  municipio?: string
  microrregiao?: string
  mesorregiao?: string
  atividade_cnae?: string
  faturamento_anual?: number
  num_funcionarios?: number
  tempo_mercado_anos?: number
  frequencia_clientes_dia?: number
  clientes_efetivos_dia?: number
  clientes_atendidos_mes?: number
  vendas_servicos_mes?: number
  area_total_m2?: number
  area_construida_m2?: number
  tempo_gestor_anos?: number
  idade_gestor_faixa?: string
  origem_gestor?: string
  escolaridade_gestor?: string
  narrativa_gestor?: string
  diferencial_competitivo?: string
  dores_principais?: string
  // TIER 2
  criterio_decisao_estrategica?: string
  deficiencias_gestao?: string[]
  num_colab_operacional?: number
  num_colab_comercial?: number
  num_colab_administrativo?: number
  media_salarial_operacional?: number
  media_salarial_comercial?: number
  media_salarial_administrativo?: number
  admissoes_trimestre?: number
  demissoes_trimestre?: number
  vagas_abertas?: number
  folha_pagamento_mensal?: number
  gargalos_rh?: string[]
  estoque_medio_mensal?: number
  num_itens_portfolio?: number
  unidade_medida_estoque?: string | string[]
  deficiencias_estoque?: string[]
  faturamento_mensal?: number
  custo_fixo_mensal?: number
  custo_variavel_mensal?: number
  despesa_variavel_mensal?: number
  possui_endividamento?: boolean
  endividamento_banco_pct?: number
  endividamento_fornecedor_pct?: number
  endividamento_factoring_pct?: number
  endividamento_fisco_pct?: number
  endividamento_sefaz_pct?: number
  endividamento_outros_pct?: number
  ticket_medio?: number
  margem_contribuicao_pct?: number
  ponto_equilibrio?: number
  melhores_meses_vendas?: string[]
  piores_meses_vendas?: string[]
  deficiencias_financeiro?: string[]
  ociosidade_vendas?: string
  criterio_preco_vendas?: string
  posicao_preco_concorrencia?: string
  busca_clientes?: string[]
  cac_novos_clientes?: number
  deficiencias_marketing?: string[]
  escore_geral: number
  maturidade: string
  criado_em: string
  escores: Escore[]
  matriz_risco: RiscoItem[]
  pdi: PDIItem[]
  narrativa: string
  benchmark?: Array<{ area: string; media_setor: number; meta_bg?: number; fonte?: string }>
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
    medio: 'Decisões reativas, perda de oportunidades de mercado, retrabalho frequente',
    longo: 'Estagnação do crescimento, irrelevância competitiva, dificuldade de captação'
  },
  'RECURSOS HUMANOS': {
    medio: 'Alta rotatividade, baixa produtividade, custos crescentes com recrutamento',
    longo: 'Perda de know-how, dificuldade de escalar equipe, clima organizacional tóxico'
  },
  'ESTOQUE': {
    medio: 'Capital empatado, rupturas frequentes, perdas por obsolescência',
    longo: 'Margem comprometida, insatisfação de clientes, perda de market share'
  },
  'FINANCEIRO': {
    medio: 'Fluxo de caixa apertado, dependência de crédito caro, decisões sem dados',
    longo: 'Insolvência, descapitalização, impossibilidade de investir em crescimento'
  },
  'TECNOLOGIA DA INFORMACAO': {
    medio: 'Processos manuais, retrabalho, vulnerabilidade a falhas e ataques',
    longo: 'Defasagem competitiva, incapacidade de escalar, riscos de segurança graves'
  },
  'RELACOES INSTITUCIONAIS': {
    medio: 'Conflitos legais pontuais, multas, deterioração de imagem',
    longo: 'Passivos significativos, perda de licenças, danos reputacionais permanentes'
  },
  'LOGISTICA': {
    medio: 'Atrasos de entrega, custos elevados, reclamações de clientes',
    longo: 'Perda de contratos, insatisfação crônica, perda de competitividade'
  },
  'MARKETING E VENDAS': {
    medio: 'Queda no volume de vendas, custo de aquisição alto, baixa conversão',
    longo: 'Encolhimento de mercado, dependência de poucos clientes, marca fraca'
  },
  'PROJECOES E TENDENCIAS': {
    medio: 'Surpresas com mudanças de mercado, decisões baseadas em intuição',
    longo: 'Obsolescência do modelo de negócio, perda de relevância, disrupção por concorrentes'
  },
  'GESTAO DE PROCESSOS E GOVERNANCA': {
    medio: 'Retrabalho, dependência de "heróis operacionais", decisões centralizadas geram gargalos',
    longo: 'Colapso institucional se liderança se afasta, exposição a passivos jurídicos, impossibilidade de escalar'
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
    <div className="max-w-6xl mx-auto px-4 py-8 print:max-w-full print:px-0 print:py-0">
      {/* Barra de Ações (oculta na impressão) */}
      <div className="flex justify-end gap-2 mb-4 print:hidden">
        <Link
          href={`/swot/${data.id}`}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium flex items-center gap-2"
        >
          🎯 Aprofundar com SWOT
        </Link>
        <button
          onClick={() => window.print()}
          className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-2"
        >
          🖨️ Imprimir / Salvar PDF
        </button>
        <EnviarEmailButton diagId={data.id} respondenteEmail={data.respondente_email} />
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6 print:border-0 print:p-4 print:mb-3">
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
        <p className="text-sm text-gray-500 mb-4">
          Compare sua empresa com a média nacional das MPEs ({data.setor}) e a meta B&G de excelência operacional.
        </p>
        <RadarChartDiagnostico
          escores={data.escores}
          benchmark={data.benchmark}
        />
      </div>

      {/* Escores por Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Escores por Área</h2>
          {data.escores
            .sort((a, b) => b.escore - a.escore)
            .map(e => (
              <BarraEscore key={e.area} escore={e.escore} label={e.area} />
            ))}
        </div>

        {/* Matriz de Risco */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Matriz de Risco</h2>
          <p className="text-sm text-gray-500 mb-6">Impactos esperados se o risco não for mitigado</p>
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

      {/* Dados da Empresa (Anexo XXVII + dados aprofundados) */}
      <DadosDaEmpresaSection data={data} />

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

      {/* PDE */}
      {data.pdi && data.pdi.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Plano de Desenvolvimento Empresarial (PDE)</h2>

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

      {/* Nota Metodológica */}
      <NotaMetodologica />

      {/* Acoes */}
      <div className="flex gap-4 justify-center print:hidden">
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

// ============================================================================
// Botão Enviar por Email
// ============================================================================
function EnviarEmailButton({ diagId, respondenteEmail }: { diagId: string; respondenteEmail?: string }) {
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [emailDestino, setEmailDestino] = useState(respondenteEmail || '')
  const [mostrarInput, setMostrarInput] = useState(false)

  const handleEnviar = async () => {
    if (!emailDestino || !emailDestino.includes('@')) {
      setErro('Informe um email válido')
      return
    }
    setEnviando(true)
    setErro(null)
    try {
      const res = await fetch(`/api/diagnosticos/${diagId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinatario: emailDestino }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar')
      setEnviado(true)
      setMostrarInput(false)
      setTimeout(() => setEnviado(false), 4000)
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
        ✅ Email enviado para {emailDestino}
      </div>
    )
  }

  return (
    <div className="relative">
      {!mostrarInput ? (
        <button
          onClick={() => setMostrarInput(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium flex items-center gap-2"
        >
          📧 Enviar por Email
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="email"
            value={emailDestino}
            onChange={e => setEmailDestino(e.target.value)}
            placeholder="email@destino.com"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 w-64"
          />
          <button
            onClick={handleEnviar}
            disabled={enviando}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium disabled:opacity-50"
          >
            {enviando ? 'Enviando...' : 'Enviar'}
          </button>
          <button
            onClick={() => { setMostrarInput(false); setErro(null); }}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ✕
          </button>
        </div>
      )}
      {erro && (
        <div className="absolute right-0 mt-2 bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded text-xs">
          {erro}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// COMPONENTE: Nota Metodológica
// ============================================================================

function NotaMetodologica() {
  const fontes = [
    {
      titulo: 'SEBRAE — Sondagem de Pequenos Negócios',
      descricao: 'Pesquisa periódica com MPEs brasileiras, abrangendo gestão financeira, marketing, planejamento e perspectivas de mercado.',
      url: 'https://datasebrae.com.br/'
    },
    {
      titulo: 'SEBRAE — Sobrevivência das Empresas no Brasil',
      descricao: 'Estudo sobre fatores que influenciam a longevidade das micro e pequenas empresas, com ênfase em gestão e estruturação.',
      url: 'https://sebrae.com.br/sites/PortalSebrae/estudos_pesquisas/sobrevivencia-das-empresas-no-brasildestaque5,97186615f0bbf510VgnVCM1000004c00210aRCRD'
    },
    {
      titulo: 'SEBRAE — MPE Indicadores',
      descricao: 'Indicadores de desempenho, faturamento e estrutura operacional de micro e pequenas empresas.',
      url: 'https://datasebrae.com.br/mpe/'
    },
    {
      titulo: 'IBGE — Demografia das Empresas (CEMPRE)',
      descricao: 'Cadastro Central de Empresas — dados sobre nascimento, sobrevivência e estrutura das empresas brasileiras.',
      url: 'https://www.ibge.gov.br/estatisticas/economicas/comercio/9016-estatisticas-do-cadastro-central-de-empresas.html'
    },
    {
      titulo: 'GEM Brasil — Global Entrepreneurship Monitor',
      descricao: 'Pesquisa internacional sobre empreendedorismo aplicada ao contexto brasileiro.',
      url: 'https://datasebraeindicadores.sebrae.com.br/resources/sites/data-sebrae/data-sebrae.html'
    }
  ]

  return (
    <details className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
      <summary className="cursor-pointer font-bold text-gray-900 text-lg flex items-center gap-2">
        <span>📚</span> Nota Metodológica e Fontes
      </summary>
      <div className="mt-4 space-y-4 text-sm text-gray-700">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Sobre o Índice de Maturidade Empresarial</h3>
          <p>
            O escore final (0 a 10) é calculado pela média ponderada das 10 áreas avaliadas. Cada área recebe um peso de criticidade baseado em seu impacto na sustentabilidade do negócio (Financeiro e Governança têm os pesos mais altos).
          </p>
          <p className="mt-2">
            As respostas seguem escala Likert de 5 pontos (A=10, B=8, C=6, D=4, E=2). A opção &ldquo;Outras&rdquo; (F) captura contexto qualitativo mas não pontua, evitando distorções.
          </p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="font-semibold text-orange-900 mb-2">Sobre a Média Nacional</h3>
          <p>
            Os valores apresentados como &ldquo;Média Nacional&rdquo; são estimativas derivadas de múltiplas pesquisas oficiais sobre maturidade gerencial das MPEs brasileiras, convertidas para a escala 0-10 deste diagnóstico.
          </p>
          <p className="mt-2 text-xs text-orange-800">
            ⚠️ <strong>Importante:</strong> Estes valores servem como referência geral para contextualização. À medida que mais diagnósticos forem realizados na plataforma B&G, a média nacional será atualizada com dados reais e segmentados por setor/porte.
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">Sobre a Meta B&G de Excelência (7.5)</h3>
          <p>
            O valor 7.5 representa o nível considerado pela metodologia B&G como sólido para uma empresa saudável e sustentável. Trata-se de um referencial aspiracional, não de uma média de mercado.
          </p>
          <p className="mt-2">
            Empresas que atingem ou ultrapassam este patamar em todas as áreas demonstram maturidade operacional consistente, com processos formalizados, governança ativa e capacidade de escalar.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Fontes consultadas</h3>
          <ul className="space-y-3">
            {fontes.map((f, i) => (
              <li key={i} className="border-l-4 border-gray-200 pl-4 py-1">
                <a href={f.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary-700 hover:underline">
                  {f.titulo} ↗
                </a>
                <p className="text-xs text-gray-600 mt-1">{f.descricao}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-xs text-gray-500 italic border-t pt-3">
          Diagnóstico Empresarial 360° — desenvolvido com metodologia B&G / Neurocorp 360.
          Última atualização da Nota Metodológica: maio de 2026.
        </div>
      </div>
    </details>
  )
}

// ============================================================================
// COMPONENTE: Dados da Empresa (Anexo XXVII + dados aprofundados)
// ============================================================================

function fmtBRL(v?: number) {
  if (v == null) return '—'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function fmtPct(v?: number) {
  if (v == null) return '—'
  return `${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
}

function fmtList(v?: string[]) {
  if (!v || v.length === 0) return null
  return v.join(', ')
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === '') return null
  return (
    <div>
      <div className="text-xs uppercase text-gray-500 font-medium">{label}</div>
      <div className="text-sm text-gray-900">{value}</div>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  const arr = React.Children.toArray(children)
  const hasContent = arr.some(c => !!c)
  if (!hasContent) return null
  return (
    <details className="border border-gray-200 rounded-lg overflow-hidden mb-3" open>
      <summary className="cursor-pointer px-4 py-3 bg-gray-50 font-semibold text-gray-800 hover:bg-gray-100">
        <span className="mr-2">{icon}</span> {title}
      </summary>
      <div className="p-4">
        {children}
      </div>
    </details>
  )
}

function DadosDaEmpresaSection({ data }: { data: DiagnosticoData }) {
  const temEndiv = data.possui_endividamento || [
    data.endividamento_banco_pct,
    data.endividamento_fornecedor_pct,
    data.endividamento_factoring_pct,
    data.endividamento_fisco_pct,
    data.endividamento_sefaz_pct,
    data.endividamento_outros_pct
  ].some(v => v != null && v > 0)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Dados da Empresa</h2>
      <p className="text-sm text-gray-500 mb-4">Informações contextuais do questionário</p>

      {/* Identificação e Localização */}
      <Section title="Identificação e Localização" icon="📍">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Empresa" value={data.empresa_nome} />
          <Field label="Setor" value={data.setor} />
          <Field label="Porte" value={data.porte} />
          <Field label="CNAE" value={data.atividade_cnae} />
          <Field label="Município" value={data.municipio} />
          <Field label="Microrregião" value={data.microrregiao} />
          <Field label="Mesorregião" value={data.mesorregiao} />
          <Field label="Endereço" value={data.endereco} />
          <Field label="Telefone" value={data.respondente_telefone} />
        </div>
      </Section>

      {/* Negócio */}
      <Section title="Dados do Negócio" icon="🏢">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Faturamento Anual" value={fmtBRL(data.faturamento_anual)} />
          <Field label="Funcionários" value={data.num_funcionarios} />
          <Field label="Tempo de mercado" value={data.tempo_mercado_anos ? `${data.tempo_mercado_anos} anos` : null} />
          <Field label="Área total" value={data.area_total_m2 ? `${data.area_total_m2} m²` : null} />
          <Field label="Área construída" value={data.area_construida_m2 ? `${data.area_construida_m2} m²` : null} />
        </div>
      </Section>

      {/* Gestor */}
      <Section title="Sobre o Gestor Principal" icon="👔">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <Field label="Tempo na função" value={data.tempo_gestor_anos ? `${data.tempo_gestor_anos} anos` : null} />
          <Field label="Faixa etária" value={data.idade_gestor_faixa} />
          <Field label="Origem" value={data.origem_gestor} />
          <Field label="Escolaridade" value={data.escolaridade_gestor} />
        </div>
        {data.narrativa_gestor && (
          <div className="mt-3">
            <div className="text-xs uppercase text-gray-500 font-medium mb-1">Jornada do Gestor</div>
            <p className="text-sm text-gray-700 italic bg-gray-50 p-3 rounded">"{data.narrativa_gestor}"</p>
          </div>
        )}
        {data.diferencial_competitivo && (
          <div className="mt-3">
            <div className="text-xs uppercase text-gray-500 font-medium mb-1">Diferencial Competitivo</div>
            <p className="text-sm text-gray-700 italic bg-gray-50 p-3 rounded">"{data.diferencial_competitivo}"</p>
          </div>
        )}
        {data.dores_principais && (
          <div className="mt-3">
            <div className="text-xs uppercase text-gray-500 font-medium mb-1">Dores Principais</div>
            <p className="text-sm text-gray-700 italic bg-red-50 p-3 rounded border-l-4 border-red-300">"{data.dores_principais}"</p>
          </div>
        )}
      </Section>

      {/* Planejamento */}
      {(data.criterio_decisao_estrategica || fmtList(data.deficiencias_gestao)) && (
        <Section title="Planejamento Estratégico" icon="🎯">
          <div className="space-y-3">
            <Field label="Critério para decisões estratégicas" value={data.criterio_decisao_estrategica} />
            {data.deficiencias_gestao && data.deficiencias_gestao.length > 0 && (
              <div>
                <div className="text-xs uppercase text-gray-500 font-medium mb-1">Principais deficiências em gestão</div>
                <div className="flex flex-wrap gap-2">
                  {data.deficiencias_gestao.map(d => (
                    <span key={d} className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">{d}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* RH */}
      {(data.num_colab_operacional || data.num_colab_comercial || data.num_colab_administrativo ||
        data.admissoes_trimestre || data.demissoes_trimestre || data.vagas_abertas) && (
        <Section title="Recursos Humanos" icon="👥">
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[
              { titulo: 'Operacional', qtd: data.num_colab_operacional, sal: data.media_salarial_operacional },
              { titulo: 'Comercial', qtd: data.num_colab_comercial, sal: data.media_salarial_comercial },
              { titulo: 'Administrativo', qtd: data.num_colab_administrativo, sal: data.media_salarial_administrativo },
            ].map(c => (
              <div key={c.titulo} className="border border-gray-200 rounded p-3 bg-gray-50">
                <div className="text-xs uppercase text-gray-500 font-medium">{c.titulo}</div>
                <div className="text-2xl font-bold text-gray-900">{c.qtd ?? '—'}</div>
                <div className="text-xs text-gray-600">Média salarial: {fmtBRL(c.sal)}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Admissões (trim)" value={data.admissoes_trimestre} />
            <Field label="Demissões (trim)" value={data.demissoes_trimestre} />
            <Field label="Vagas abertas" value={data.vagas_abertas} />
            <Field label="Folha de pagamento" value={fmtBRL(data.folha_pagamento_mensal)} />
          </div>
          {data.gargalos_rh && data.gargalos_rh.length > 0 && (
            <div className="mt-3">
              <div className="text-xs uppercase text-gray-500 font-medium mb-1">Gargalos identificados</div>
              <div className="flex flex-wrap gap-2">
                {data.gargalos_rh.map(g => <span key={g} className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">{g}</span>)}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Estoque */}
      {(data.estoque_medio_mensal || data.num_itens_portfolio) && (
        <Section title="Estoque" icon="📦">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Itens portfólio" value={data.num_itens_portfolio} />
            <Field
              label="Unidade de medida"
              value={Array.isArray(data.unidade_medida_estoque)
                ? data.unidade_medida_estoque.join(', ')
                : data.unidade_medida_estoque}
            />
            <Field label="Estoque médio mensal" value={fmtBRL(data.estoque_medio_mensal)} />
          </div>
          {data.deficiencias_estoque && data.deficiencias_estoque.length > 0 && (
            <div className="mt-3">
              <div className="text-xs uppercase text-gray-500 font-medium mb-1">Deficiências em estoque</div>
              <div className="flex flex-wrap gap-2">
                {data.deficiencias_estoque.map(d => <span key={d} className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">{d}</span>)}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Financeiro */}
      {(data.faturamento_mensal || data.custo_fixo_mensal || data.ticket_medio || temEndiv) && (
        <Section title="Financeiro" icon="💰">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Field label="Faturamento mensal" value={fmtBRL(data.faturamento_mensal)} />
            <Field label="Custo fixo" value={fmtBRL(data.custo_fixo_mensal)} />
            <Field label="Custo variável" value={fmtBRL(data.custo_variavel_mensal)} />
            <Field label="Despesa variável" value={fmtBRL(data.despesa_variavel_mensal)} />
            <Field label="Clientes atendidos/mês" value={data.clientes_atendidos_mes} />
            <Field label="Vendas/serviços/mês" value={data.vendas_servicos_mes} />
            <Field label="Ticket médio" value={fmtBRL(data.ticket_medio)} />
            <Field label="Margem de contribuição" value={fmtPct(data.margem_contribuicao_pct)} />
            <Field label="Ponto de equilíbrio" value={fmtBRL(data.ponto_equilibrio)} />
          </div>

          {temEndiv && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
              <div className="font-semibold text-red-900 mb-2">⚠️ Endividamento</div>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Banco" value={fmtPct(data.endividamento_banco_pct)} />
                <Field label="Fornecedor" value={fmtPct(data.endividamento_fornecedor_pct)} />
                <Field label="Factoring" value={fmtPct(data.endividamento_factoring_pct)} />
                <Field label="Receita Federal" value={fmtPct(data.endividamento_fisco_pct)} />
                <Field label="SEFAZ" value={fmtPct(data.endividamento_sefaz_pct)} />
                <Field label="Outros" value={fmtPct(data.endividamento_outros_pct)} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {data.melhores_meses_vendas && data.melhores_meses_vendas.length > 0 && (
              <div>
                <div className="text-xs uppercase text-gray-500 font-medium mb-1">Melhores meses</div>
                <div className="flex flex-wrap gap-1">
                  {data.melhores_meses_vendas.map(m => <span key={m} className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">{m}</span>)}
                </div>
              </div>
            )}
            {data.piores_meses_vendas && data.piores_meses_vendas.length > 0 && (
              <div>
                <div className="text-xs uppercase text-gray-500 font-medium mb-1">Piores meses</div>
                <div className="flex flex-wrap gap-1">
                  {data.piores_meses_vendas.map(m => <span key={m} className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">{m}</span>)}
                </div>
              </div>
            )}
          </div>

          {data.deficiencias_financeiro && data.deficiencias_financeiro.length > 0 && (
            <div className="mt-3">
              <div className="text-xs uppercase text-gray-500 font-medium mb-1">Deficiências financeiras</div>
              <div className="flex flex-wrap gap-2">
                {data.deficiencias_financeiro.map(d => <span key={d} className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">{d}</span>)}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Marketing */}
      {(data.ociosidade_vendas || data.criterio_preco_vendas || data.cac_novos_clientes || (data.busca_clientes && data.busca_clientes.length > 0)) && (
        <Section title="Marketing e Vendas" icon="📈">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <Field label="Ociosidade em vendas" value={data.ociosidade_vendas} />
            <Field label="Critério de preço" value={data.criterio_preco_vendas} />
            <Field label="Posição vs concorrência" value={data.posicao_preco_concorrencia} />
            <Field label="CAC" value={fmtBRL(data.cac_novos_clientes)} />
          </div>
          {data.busca_clientes && data.busca_clientes.length > 0 && (
            <div className="mt-3">
              <div className="text-xs uppercase text-gray-500 font-medium mb-1">Como busca novos clientes</div>
              <div className="flex flex-wrap gap-2">
                {data.busca_clientes.map(b => <span key={b} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{b}</span>)}
              </div>
            </div>
          )}
          {data.deficiencias_marketing && data.deficiencias_marketing.length > 0 && (
            <div className="mt-3">
              <div className="text-xs uppercase text-gray-500 font-medium mb-1">Deficiências em Marketing/Vendas</div>
              <div className="flex flex-wrap gap-2">
                {data.deficiencias_marketing.map(d => <span key={d} className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">{d}</span>)}
              </div>
            </div>
          )}
        </Section>
      )}
    </div>
  )
}
