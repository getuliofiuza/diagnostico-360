// ============================================================================
// NEUROCORP 360° — LÓGICA DA ANÁLISE SWOT
// ============================================================================
// A SWOT é uma EXTENSÃO do Diagnóstico 360°. Ela não recalcula escores:
// herda os gaps da matriz de risco do diagnóstico (já ordenada do mais
// crítico ao menos crítico) e estrutura o aprofundamento área por área.
// ============================================================================

import { Area, ClassificacaoRisco } from '@/types/diagnostico';

// ----------------------------------------------------------------------------
// Tipos
// ----------------------------------------------------------------------------

export interface MatrizRiscoItemLike {
  area: string;
  escore: number;
  risco_score: number;
  classificacao: string;
  prioridade: number;
}

export interface SwotItem {
  id?: string;
  area: string;
  escore: number | null;
  risco_score: number | null;
  classificacao: string | null;
  prioridade: number;

  forcas: string;
  fraquezas: string;
  oportunidades: string;
  ameacas: string;

  causa_raiz: string;
  estrategia: string;
  acao_responsavel: string;
  acao_prazo: string;

  concluido: boolean;
}

export interface PromptsArea {
  forcas: string;
  fraquezas: string;
  oportunidades: string;
  ameacas: string;
  causa_raiz: string;
  estrategia: string;
}

// ----------------------------------------------------------------------------
// Deriva os itens SWOT a partir da matriz de risco do diagnóstico
// ----------------------------------------------------------------------------
// Mantém a ordem da matriz (mais crítico primeiro). Caso a matriz venha
// vazia ou desordenada, ordena por risco_score desc como fallback.

export function derivarItensSwot(matriz: MatrizRiscoItemLike[]): SwotItem[] {
  const ordenada = [...(matriz || [])].sort((a, b) => {
    if (a.prioridade && b.prioridade) return a.prioridade - b.prioridade;
    return (b.risco_score ?? 0) - (a.risco_score ?? 0);
  });

  return ordenada.map((m, idx) => ({
    area: m.area,
    escore: m.escore ?? null,
    risco_score: m.risco_score ?? null,
    classificacao: m.classificacao ?? null,
    prioridade: m.prioridade || idx + 1,
    forcas: '',
    fraquezas: '',
    oportunidades: '',
    ameacas: '',
    causa_raiz: '',
    estrategia: '',
    acao_responsavel: '',
    acao_prazo: '',
    concluido: false,
  }));
}

// ----------------------------------------------------------------------------
// Mescla itens persistidos (do banco) com a estrutura derivada do diagnóstico.
// Garante que toda área do diagnóstico tenha um item, preservando o que já
// foi preenchido e atualizando o snapshot de risco.
// ----------------------------------------------------------------------------

export function mesclarItens(
  derivados: SwotItem[],
  salvos: Partial<SwotItem>[]
): SwotItem[] {
  const porArea = new Map<string, Partial<SwotItem>>();
  (salvos || []).forEach((s) => {
    if (s.area) porArea.set(s.area, s);
  });

  return derivados.map((d) => {
    const s = porArea.get(d.area);
    if (!s) return d;
    return {
      ...d,
      id: s.id ?? d.id,
      // texto preenchido pelo consultor tem prioridade
      forcas: s.forcas ?? d.forcas,
      fraquezas: s.fraquezas ?? d.fraquezas,
      oportunidades: s.oportunidades ?? d.oportunidades,
      ameacas: s.ameacas ?? d.ameacas,
      causa_raiz: s.causa_raiz ?? d.causa_raiz,
      estrategia: s.estrategia ?? d.estrategia,
      acao_responsavel: s.acao_responsavel ?? d.acao_responsavel,
      acao_prazo: s.acao_prazo ?? d.acao_prazo,
      concluido: s.concluido ?? d.concluido,
    };
  });
}

// ----------------------------------------------------------------------------
// Progresso de preenchimento (para barra/indicador)
// ----------------------------------------------------------------------------

export function calcularProgresso(itens: SwotItem[]): {
  total: number;
  concluidos: number;
  pct: number;
} {
  const total = itens.length;
  const concluidos = itens.filter((i) => i.concluido).length;
  const pct = total === 0 ? 0 : Math.round((concluidos / total) * 100);
  return { total, concluidos, pct };
}

// Considera um item "preenchido o suficiente" quando os 4 quadrantes têm texto.
export function itemPreenchido(i: SwotItem): boolean {
  return (
    !!i.forcas.trim() &&
    !!i.fraquezas.trim() &&
    !!i.oportunidades.trim() &&
    !!i.ameacas.trim()
  );
}

// ----------------------------------------------------------------------------
// Badge de cor por classificação de risco (alinhado ao diagnóstico)
// ----------------------------------------------------------------------------

export function corClassificacao(classificacao: string | null): string {
  switch ((classificacao || '').toUpperCase()) {
    case 'CRÍTICO':
    case 'CRITICO':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'ALTO':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'MÉDIO':
    case 'MEDIO':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'BAIXO':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    default:
      return 'bg-green-100 text-green-800 border-green-300';
  }
}

// ----------------------------------------------------------------------------
// Prompts orientadores por área — guiam o consultor/empresário no
// aprofundamento de cada quadrante. Específicos do contexto MPE brasileiro.
// ----------------------------------------------------------------------------

const PROMPTS_GENERICO: PromptsArea = {
  forcas:
    'O que esta área já faz bem hoje e pode ser usado como alavanca? (pessoas, ferramentas, processos, histórico)',
  fraquezas:
    'Quais lacunas internas explicam o escore atual? (falta de processo, de pessoas, de dados, de controle)',
  oportunidades:
    'Que fatores externos (mercado, tecnologia, parcerias, regulação) poderiam acelerar a melhoria desta área?',
  ameacas:
    'O que acontece com o negócio se este gap NÃO for tratado? Quais riscos externos se agravam?',
  causa_raiz:
    'Por que este gap existe? Vá além do sintoma — pergunte "por quê" 5 vezes.',
  estrategia:
    'Cruze os quadrantes: como usar Forças para capturar Oportunidades (SO) e neutralizar Ameaças (ST)? Como corrigir Fraquezas (WO/WT)?',
};

const PROMPTS_POR_AREA: Partial<Record<Area, Partial<PromptsArea>>> = {
  [Area.FINANCEIRO]: {
    forcas: 'Há controle de fluxo de caixa, DRE, margem conhecida? Capital de giro saudável em algum ponto?',
    fraquezas: 'Falta capital de giro? Dificuldade de formar preço? Mistura PF/PJ? Sem DRE mensal?',
    oportunidades: 'Linhas de crédito, renegociação de dívidas, precificação por valor, automação contábil.',
    ameacas: 'Insolvência, dependência de crédito caro, descapitalização, decisões sem dados.',
    causa_raiz: 'O gap financeiro é de FALTA DE DADOS, de DISCIPLINA de gestão, ou de MODELO de negócio?',
  },
  [Area.RH]: {
    forcas: 'Equipe engajada, baixa rotatividade em algum setor, conhecimento técnico interno?',
    fraquezas: 'Alta rotatividade, despreparo técnico, falta de mão de obra, ausência de avaliação de desempenho?',
    oportunidades: 'Programas de capacitação, parcerias com escolas técnicas, plano de carreira, PLR.',
    ameacas: 'Perda de know-how, clima tóxico, custos crescentes de recrutamento, dificuldade de escalar.',
    causa_raiz: 'O problema é de ATRAÇÃO, de RETENÇÃO, de DESENVOLVIMENTO ou de LIDERANÇA?',
  },
  [Area.GOVERNANCA]: {
    forcas: 'Algum processo documentado, papéis definidos, reuniões de gestão recorrentes?',
    fraquezas: 'Dependência de "heróis operacionais", decisões centralizadas, retrabalho, sem plano de sucessão?',
    oportunidades: 'Estruturar comitês, implementar gestão de riscos, padronizar processos-chave.',
    ameacas: 'Colapso se a liderança se afasta, passivos jurídicos, gargalos que impedem escalar.',
    causa_raiz: 'A centralização é por FALTA DE PROCESSO, por FALTA DE CONFIANÇA ou por PERFIL do gestor?',
  },
  [Area.PLANEJAMENTO]: {
    forcas: 'Existe visão/missão clara? Algum plano escrito? Leitura de mercado pelo gestor?',
    fraquezas: 'Decisões reativas, sem plano formal, sem indicadores estratégicos, sem SWOT regular?',
    oportunidades: 'Monitoramento de mercado, BSC, planejamento de 3-5 anos, este próprio processo SWOT.',
    ameacas: 'Estagnação, irrelevância competitiva, perda de oportunidades, dificuldade de captação.',
    causa_raiz: 'A falta de planejamento é por URGÊNCIA do dia a dia, por FALTA DE MÉTODO ou de PRIORIDADE?',
  },
  [Area.MARKETING]: {
    forcas: 'Base de clientes formada, indicações/boca a boca, marca reconhecida localmente?',
    fraquezas: 'Mau gerenciamento comercial, CAC alto, baixa conversão, dependência de poucos clientes?',
    oportunidades: 'Presença digital, CRM, programa de indicação, expansão de canais, ROI de marketing.',
    ameacas: 'Queda de vendas, encolhimento de mercado, marca fraca, dependência de poucos clientes.',
    causa_raiz: 'O gap é de GERAÇÃO de demanda, de CONVERSÃO, de RETENÇÃO ou de POSICIONAMENTO?',
  },
  [Area.TECNOLOGIA]: {
    forcas: 'Sistemas em uso, dados organizados, equipe que adota tecnologia?',
    fraquezas: 'Processos manuais, retrabalho, vulnerabilidade a falhas/ataques, dados em planilhas soltas?',
    oportunidades: 'Automação, BI/inteligência de negócios, cloud, integração de sistemas, IA.',
    ameacas: 'Defasagem competitiva, incapacidade de escalar, riscos de segurança e vazamento.',
    causa_raiz: 'A defasagem é por FALTA DE INVESTIMENTO, de CONHECIMENTO ou de PRIORIDADE?',
  },
  [Area.RELACOES]: {
    forcas: 'Boa reputação, parcerias institucionais, conformidade legal em dia?',
    fraquezas: 'Conflitos legais pontuais, multas, imagem deteriorada, sem programa de relacionamento?',
    oportunidades: 'Parcerias estratégicas, responsabilidade social, associações setoriais.',
    ameacas: 'Passivos significativos, perda de licenças, danos reputacionais permanentes.',
    causa_raiz: 'O risco institucional é de CONFORMIDADE, de RELACIONAMENTO ou de IMAGEM?',
  },
  [Area.TENDENCIAS]: {
    forcas: 'Gestor atento ao mercado, leitura de tendências, experimentação?',
    fraquezas: 'Decisões por intuição, surpresas com mudanças de mercado, sem planejamento sucessório?',
    oportunidades: 'Transformação digital, novos modelos de negócio, antecipação de tendências.',
    ameacas: 'Obsolescência do modelo, perda de relevância, disrupção por concorrentes.',
    causa_raiz: 'A baixa antecipação é por FALTA DE INFORMAÇÃO, de TEMPO ou de VISÃO de futuro?',
  },
  [Area.ESTOQUE]: {
    forcas: 'Controle de itens, giro conhecido, baixa perda/obsolescência?',
    fraquezas: 'Estoque parado, ruptura, sem controle de giro, capital empatado?',
    oportunidades: 'Curva ABC, integração com vendas, gestão de fornecedores, just-in-time.',
    ameacas: 'Capital empatado, perdas por validade/obsolescência, ruptura que derruba vendas.',
    causa_raiz: 'O problema é de PREVISÃO de demanda, de CONTROLE ou de RELAÇÃO com fornecedor?',
  },
  [Area.LOGISTICA]: {
    forcas: 'Entregas no prazo, custos logísticos sob controle, malha definida?',
    fraquezas: 'Atrasos, custo de frete alto, sem roteirização, dependência de poucos transportadores?',
    oportunidades: 'Roteirização, parcerias de frete, hubs, integração com e-commerce.',
    ameacas: 'Perda de clientes por atraso, margem corroída por frete, gargalos de entrega.',
    causa_raiz: 'O gap logístico é de PROCESSO, de CUSTO ou de INFRAESTRUTURA?',
  },
};

export function obterPrompts(area: string): PromptsArea {
  const especifico = PROMPTS_POR_AREA[area as Area] || {};
  return { ...PROMPTS_GENERICO, ...especifico };
}
