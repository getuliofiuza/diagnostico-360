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

// Todas as 10 áreas do diagnóstico, na ordem padrão (usada como fallback de
// ordenação para áreas que não foram avaliadas no diagnóstico daquele setor).
const TODAS_AREAS: string[] = [
  Area.FINANCEIRO,
  Area.GOVERNANCA,
  Area.RH,
  Area.TECNOLOGIA,
  Area.PLANEJAMENTO,
  Area.MARKETING,
  Area.RELACOES,
  Area.TENDENCIAS,
  Area.ESTOQUE,
  Area.LOGISTICA,
];

function itemVazio(area: string, prioridade: number, base?: Partial<SwotItem>): SwotItem {
  return {
    area,
    escore: base?.escore ?? null,
    risco_score: base?.risco_score ?? null,
    classificacao: base?.classificacao ?? null,
    prioridade,
    forcas: '',
    fraquezas: '',
    oportunidades: '',
    ameacas: '',
    causa_raiz: '',
    estrategia: '',
    acao_responsavel: '',
    acao_prazo: '',
    concluido: false,
  };
}

export function derivarItensSwot(matriz: MatrizRiscoItemLike[]): SwotItem[] {
  // 1. Áreas avaliadas no diagnóstico, ordenadas (mais crítico primeiro)
  const avaliadas = [...(matriz || [])].sort((a, b) => {
    if (a.prioridade && b.prioridade) return a.prioridade - b.prioridade;
    return (b.risco_score ?? 0) - (a.risco_score ?? 0);
  });

  const itens: SwotItem[] = avaliadas.map((m, idx) =>
    itemVazio(m.area, m.prioridade || idx + 1, {
      escore: m.escore ?? null,
      risco_score: m.risco_score ?? null,
      classificacao: m.classificacao ?? null,
    })
  );

  // 2. Completa com as áreas que NÃO foram avaliadas no diagnóstico
  //    (ex.: Estoque/Logística em empresas de Serviços) — entram ao final,
  //    sem escore/risco, para que a SWOT cubra sempre as 10 áreas.
  const jaIncluidas = new Set(itens.map((i) => i.area));
  let prox = itens.length;
  TODAS_AREAS.forEach((area) => {
    if (!jaIncluidas.has(area)) {
      prox += 1;
      itens.push(itemVazio(area, prox, { classificacao: 'NÃO AVALIADO' }));
    }
  });

  return itens;
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
    case 'NÃO AVALIADO':
    case 'NAO AVALIADO':
      return 'bg-gray-100 text-gray-600 border-gray-300';
    case 'OK':
      return 'bg-green-100 text-green-800 border-green-300';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-300';
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

// ----------------------------------------------------------------------------
// Perguntas profundas (socráticas) por quadrante — exibidas como TEXTO DE FUNDO
// (placeholder) dentro de cada campo. Provocam reflexão honesta e somem ao
// começar a digitar. Servem para qualquer área.
// ----------------------------------------------------------------------------

export interface PerguntasProfundas {
  forcas: string;
  fraquezas: string;
  oportunidades: string;
  ameacas: string;
}

const CABECALHO_PERGUNTAS = 'Para refletir (exemplos):';

// Monta o texto de fundo (placeholder) a partir de uma lista de perguntas.
function bloco(perguntas: string[]): string {
  return [CABECALHO_PERGUNTAS, ...perguntas.map((p) => `• ${p}`)].join('\n');
}

// Banco completo: 4 quadrantes × 10 áreas. As perguntas são apenas EXEMPLOS
// para provocar reflexão — aparecem como texto de fundo e somem ao digitar.
const BANCO_PERGUNTAS: Record<Area, PerguntasProfundas> = {
  [Area.FINANCEIRO]: {
    forcas: bloco([
      'Você sabe quanto sobrou de dinheiro no mês passado?',
      'Consegue pagar suas contas sem aperto?',
      'Tem uma reserva guardada para emergências?',
      'O que você faz bem com o dinheiro da empresa?',
    ]),
    fraquezas: bloco([
      'Seu preço cobre tudo e ainda sobra para você?',
      'Se as vendas parassem, por quantos dias a empresa aguenta?',
      'Você mistura o dinheiro seu com o da empresa?',
      'Qual conta te tira o sono todo mês?',
    ]),
    oportunidades: bloco([
      'Tem alguma dívida cara que dá para trocar por uma mais barata?',
      'Se cobrasse um pouco mais, o cliente ainda compraria?',
      'O que ajudaria você a enxergar melhor as contas?',
      'Onde você sente que está perdendo dinheiro à toa?',
    ]),
    ameacas: bloco([
      'Se o banco cortasse seu crédito amanhã, o que aconteceria?',
      'Se vendesse 20% menos, a empresa segura?',
      'Você depende muito de um cliente só para pagar as contas?',
      'Que gasto vem crescendo e pode apertar o caixa?',
    ]),
  },
  [Area.PLANEJAMENTO]: {
    forcas: bloco([
      'Você sabe onde quer chegar com a empresa?',
      'Sua equipe conhece esse objetivo?',
      'Já tomou uma decisão pensada que deu muito certo?',
      'O que te ajuda a enxergar o caminho do negócio?',
    ]),
    fraquezas: bloco([
      'Você planeja ou vive apagando incêndio?',
      'Sabe dizer onde quer a empresa daqui a 3 anos?',
      'Tem como saber se o mês foi bom, ou é só no sentimento?',
      'Quando foi a última vez que parou para pensar a empresa?',
    ]),
    oportunidades: bloco([
      'Tem alguma mudança no mercado que dá para aproveitar?',
      'Esta análise pode virar um hábito seu de vez em quando?',
      'O que ajudaria você a manter o foco no que importa?',
      'Onde os concorrentes estão perdidos e você poderia avançar?',
    ]),
    ameacas: bloco([
      'Já perdeu alguma chance boa por demorar a decidir?',
      'Algum concorrente mais organizado pode te passar para trás?',
      'Ficar parado pode te deixar para trás em quanto tempo?',
      'Sem rumo, seria difícil conseguir dinheiro quando precisar?',
    ]),
  },
  [Area.RH]: {
    forcas: bloco([
      'Você tem alguém na equipe que faz muita falta quando some?',
      'Onde as pessoas ficam e trabalham felizes? Por quê?',
      'O que você faz bem para cuidar da sua equipe?',
      'Em quem você confia para tocar as coisas sem você?',
    ]),
    fraquezas: bloco([
      'Se seu melhor funcionário saísse hoje, o que pararia?',
      'As pessoas sabem o que esperam delas, ou cada um faz do seu jeito?',
      'Você já perguntou de verdade por que as pessoas vão embora?',
      'Você ensina sua equipe ou só cobra resultado?',
    ]),
    oportunidades: bloco([
      'Algum curso ou parceria resolveria a falta de mão de obra?',
      'Um plano de crescimento faria as pessoas quererem ficar?',
      'O que faria sua equipe render mais rápido?',
      'Como fazer bons profissionais quererem trabalhar com você?',
    ]),
    ameacas: bloco([
      'Perder uma pessoa-chave levaria embora um conhecimento importante?',
      'Um clima ruim pode contagiar o resto da equipe?',
      'Está cada vez mais caro contratar e treinar gente nova?',
      'A falta de gente preparada te impede de pegar mais clientes?',
    ]),
  },
  [Area.ESTOQUE]: {
    forcas: bloco([
      'Você sabe o que vende mais e o que fica parado?',
      'Quase nunca falta o produto que o cliente procura?',
      'O que você faz bem na hora de comprar e estocar?',
      'Tem fornecedor de confiança que nunca te deixa na mão?',
    ]),
    fraquezas: bloco([
      'Quanto dinheiro está parado em produto que não vende?',
      'Quantas vendas você perde por faltar o item na hora?',
      'Você compra com base em números ou no "achismo"?',
      'Tem produto vencendo, estragando ou encalhado?',
    ]),
    oportunidades: bloco([
      'Separar o que mais vende mudaria sua forma de comprar?',
      'Ligar o estoque às vendas evitaria falta e sobra?',
      'Negociar prazo com fornecedor sobraria mais dinheiro no caixa?',
      'Dá para comprar só quando precisa, sem estocar tanto?',
    ]),
    ameacas: bloco([
      'Dinheiro parado no estoque pode te faltar para pagar contas?',
      'Se um fornecedor falhar, suas vendas param?',
      'Uma mudança no gosto do cliente deixaria seu estoque parado?',
      'Faltar produto está empurrando cliente para o concorrente?',
    ]),
  },
  [Area.TECNOLOGIA]: {
    forcas: bloco([
      'Algum sistema ou planilha já te faz ganhar tempo?',
      'Sua equipe se vira bem com a tecnologia que tem?',
      'O que você já faz no automático e não voltaria a fazer na mão?',
      'A tecnologia já te ajuda a sair na frente por aqui?',
    ]),
    fraquezas: bloco([
      'Quanto tempo sua equipe perde refazendo trabalho na mão?',
      'Seus dados estão seguros, ou um problema te pararia?',
      'Você depende de uma planilha que só uma pessoa entende?',
      'Já pensou no que acontece se perder seus arquivos?',
    ]),
    oportunidades: bloco([
      'O que dá para automatizar e tirar esse peso das costas?',
      'Um painel simples te mostraria coisas que hoje você não vê?',
      'Guardar tudo na nuvem traria mais segurança e menos custo?',
      'Onde a tecnologia te colocaria na frente dos concorrentes?',
    ]),
    ameacas: bloco([
      'Sem se atualizar, em quanto tempo você fica para trás?',
      'Perder dados de clientes traria que tipo de problema?',
      'A falta de sistema te impede de crescer sem gastar muito mais?',
      'Que risco de segurança você vem deixando de lado?',
    ]),
  },
  [Area.RELACOES]: {
    forcas: bloco([
      'Seu nome na praça abre portas para você?',
      'Tem alguma parceria que já te traz resultado?',
      'Está com tudo certo na parte legal e isso te deixa tranquilo?',
      'Que boas relações você já construiu (clientes, parceiros)?',
    ]),
    fraquezas: bloco([
      'Tem alguma pendência legal ou multa te incomodando?',
      'Sua imagem anda arranhada com algum público importante?',
      'Você cuida do relacionamento com parceiros ou deixa solto?',
      'Você conhece bem as regras do seu ramo?',
    ]),
    oportunidades: bloco([
      'Que parceria te abriria portas ou daria mais credibilidade?',
      'Uma ação social fortaleceria seu nome na região?',
      'Entrar numa associação do seu ramo te daria voz e informação?',
      'Onde uma boa relação viraria vantagem para você?',
    ]),
    ameacas: bloco([
      'Alguma pendência legal pode estourar e atrapalhar o negócio?',
      'Você pode perder uma licença por descuido com as regras?',
      'Um problema de imagem grudaria no seu nome por muito tempo?',
      'Uma mudança na lei pode te pegar de surpresa?',
    ]),
  },
  [Area.LOGISTICA]: {
    forcas: bloco([
      'Você entrega no prazo e o cliente confia nisso?',
      'Seu custo de entrega está sob controle?',
      'Suas entregas seguem uma rotina organizada?',
      'Tem parceiro de entrega que te dá vantagem de prazo ou preço?',
    ]),
    fraquezas: bloco([
      'Atrasos na entrega estão te custando clientes?',
      'O frete está comendo seu lucro sem você perceber?',
      'Você depende de um entregador só?',
      'Suas entregas são planejadas ou improvisadas na hora?',
    ]),
    oportunidades: bloco([
      'Organizar melhor as rotas baixaria custo e prazo?',
      'Uma parceria de frete ampliaria seu alcance?',
      'Entregar para vendas online abriria um novo caminho?',
      'A entrega poderia virar um diferencial seu, não só custo?',
    ]),
    ameacas: bloco([
      'Atrasos seguidos empurram o cliente para o concorrente?',
      'Combustível ou frete mais caro inviabiliza seu lucro?',
      'Se um parceiro de entrega falhar, suas entregas param?',
      'A entrega trava o crescimento do seu negócio?',
    ]),
  },
  [Area.MARKETING]: {
    forcas: bloco([
      'Você tem clientes fiéis que indicam você?',
      'Seu nome é conhecido e respeitado na região?',
      'Tem um jeito de trazer cliente que funciona sempre?',
      'O que faz o cliente te escolher e voltar?',
    ]),
    fraquezas: bloco([
      'Você sabe quanto gasta para conquistar um cliente novo?',
      'De onde vêm seus clientes? Você controla isso ou é sorte?',
      'Se a sua maior fonte de clientes secasse, teria um plano B?',
      'Sua parte de vendas é organizada ou bagunçada?',
    ]),
    oportunidades: bloco([
      'Estar mais presente na internet traria mais vendas?',
      'Pedir indicação aos bons clientes traria mais como eles?',
      'Tem algum jeito de vender que você nunca testou?',
      'Onde os concorrentes comunicam mal e você poderia se destacar?',
    ]),
    ameacas: bloco([
      'Depender de poucos clientes te deixa exposto?',
      'Um concorrente com marketing forte pode te tomar mercado?',
      'Está cada vez mais caro e difícil fechar uma venda?',
      'Seu nome é fraco a ponto de só competir por preço?',
    ]),
  },
  [Area.TENDENCIAS]: {
    forcas: bloco([
      'Você costuma perceber as mudanças antes dos outros?',
      'Já acertou ao apostar em uma novidade? Como foi?',
      'Você gosta de testar coisas novas no negócio?',
      'Que visão de futuro sua já valeu a pena?',
    ]),
    fraquezas: bloco([
      'Você decide olhando o mercado ou no sentimento?',
      'As mudanças do mercado costumam te pegar de surpresa?',
      'Já pensou em quem tocaria o negócio se você parasse?',
      'Você reserva um tempo para pensar no futuro da empresa?',
    ]),
    oportunidades: bloco([
      'Que novidade poderia te colocar na frente?',
      'Tem algo novo que dá para testar sem arriscar muito?',
      'Que tendência do seu ramo os concorrentes ainda ignoram?',
      'Como adivinhar o que seu cliente vai querer amanhã?',
    ]),
    ameacas: bloco([
      'Seu jeito de trabalhar pode ficar ultrapassado em poucos anos?',
      'Alguma novidade ou novo concorrente ameaça seu ramo?',
      'Continuar fazendo igual pode te deixar para trás?',
      'Sem alguém para suceder, o que acontece com a empresa?',
    ]),
  },
  [Area.GOVERNANCA]: {
    forcas: bloco([
      'Tem alguma rotina ou tarefa que já funciona sozinha?',
      'Vocês fazem reuniões que realmente resolvem coisas?',
      'O que na empresa já anda bem mesmo sem você por perto?',
      'As pessoas sabem quem cuida de cada coisa?',
    ]),
    fraquezas: bloco([
      'Quantas decisões por dia ainda precisam passar por você?',
      'Se você sumisse por 2 meses, a empresa andaria ou pararia?',
      'As coisas estão na cabeça das pessoas ou anotadas?',
      'Você confia na equipe para decidir ou centraliza tudo?',
    ]),
    oportunidades: bloco([
      'Anotar como cada tarefa é feita facilitaria a vida?',
      'Definir quem decide o quê tiraria peso de você?',
      'Padronizar o jeito de trabalhar reduziria retrabalho?',
      'Preparar alguém de confiança ajudaria a empresa a crescer?',
    ]),
    ameacas: bloco([
      'Se você se afastar, a empresa entra em crise?',
      'A bagunça pode te trazer problema com a lei?',
      'Tudo passar por você vira um gargalo que trava o crescimento?',
      'Depender de poucas pessoas-chave é uma bomba-relógio?',
    ]),
  },
};

export function obterPerguntasProfundas(area: string): PerguntasProfundas {
  return (
    BANCO_PERGUNTAS[area as Area] || {
      forcas: bloco([
        'O que você já faz bem nesta área?',
        'O que faria mais falta se você perdesse?',
      ]),
      fraquezas: bloco([
        'O que aqui você sabe que está mal resolvido?',
        'O que só funciona se você estiver presente?',
      ]),
      oportunidades: bloco([
        'O que dá para aproveitar para melhorar esta área?',
        'O que você já tem e poderia usar melhor?',
      ]),
      ameacas: bloco([
        'Se nada mudar aqui, qual é o pior que pode acontecer?',
        'De quem ou do quê você depende demais nesta área?',
      ]),
    }
  );
}

// ============================================================================
// PLANO DE AÇÕES ESTRATÉGICAS — MATRIZ TOWS (SWOT cruzada)
// ============================================================================
// Distribui as 10 áreas em 4 quadrantes estratégicos, conforme o escore do
// diagnóstico. Cada quadrante representa um cruzamento da SWOT e uma postura
// estratégica priorizada. Escore/status são puxados do diagnóstico; estratégia
// vem como sugestão (placeholder) e os campos editáveis salvam no banco.
// ----------------------------------------------------------------------------

export type QuadranteTows = 'O1' | 'O2' | 'O3' | 'O4';

export interface DefQuadrante {
  id: QuadranteTows;
  codigo: string;      // "O.1"
  rotulo: string;      // "VULNERABILIDADES"
  cruzamento: string;  // "Fraquezas × Ameaças"
  prioridade: string;  // "PRIORIDADE 1 — Eliminar urgente"
  emoji: string;
  // classes de cor (cabeçalho e fundo das linhas)
  corHeader: string;
  corLinha: string;
  rotuloItem: string;  // "Vulnerabilidade"
}

export const QUADRANTES_TOWS: DefQuadrante[] = [
  {
    id: 'O1',
    codigo: 'O.1',
    rotulo: 'VULNERABILIDADES',
    cruzamento: 'Fraquezas × Ameaças',
    prioridade: 'PRIORIDADE 1 — Eliminar urgente',
    emoji: '🔴',
    corHeader: 'bg-red-700 text-white',
    corLinha: 'bg-red-50',
    rotuloItem: 'Vulnerabilidade',
  },
  {
    id: 'O2',
    codigo: 'O.2',
    rotulo: 'AÇÕES OFENSIVAS',
    cruzamento: 'Forças × Oportunidades',
    prioridade: 'PRIORIDADE 2 — Aproveitar vantagens',
    emoji: '🟢',
    corHeader: 'bg-green-700 text-white',
    corLinha: 'bg-green-50',
    rotuloItem: 'Ação Ofensiva',
  },
  {
    id: 'O3',
    codigo: 'O.3',
    rotulo: 'DEBILIDADES',
    cruzamento: 'Fraquezas × Oportunidades',
    prioridade: 'PRIORIDADE 3 — Converter fraquezas',
    emoji: '🟡',
    corHeader: 'bg-orange-600 text-white',
    corLinha: 'bg-orange-50',
    rotuloItem: 'Debilidade',
  },
  {
    id: 'O4',
    codigo: 'O.4',
    rotulo: 'AÇÕES DEFENSIVAS',
    cruzamento: 'Forças × Ameaças',
    prioridade: 'PRIORIDADE 4 — Defender posições',
    emoji: '🔵',
    corHeader: 'bg-blue-600 text-white',
    corLinha: 'bg-blue-50',
    rotuloItem: 'Ação Defensiva',
  },
];

// Semáforo do escore (igual à legenda do template)
export function semaforoEscore(escore: number | null): { emoji: string; cor: string; label: string } {
  if (escore == null) return { emoji: '⚪️', cor: 'text-gray-400', label: 'Não avaliado' };
  if (escore < 5.0) return { emoji: '🔴', cor: 'text-red-600', label: 'Crítico' };
  if (escore < 7.0) return { emoji: '🟡', cor: 'text-yellow-600', label: 'Atenção' };
  return { emoji: '🟢', cor: 'text-green-600', label: 'Saudável' };
}

// Ícone por área (para a coluna "ÁREA 360°")
const ICONE_AREA: Record<string, string> = {
  [Area.FINANCEIRO]: '💰',
  [Area.PLANEJAMENTO]: '🎯',
  [Area.RH]: '👥',
  [Area.ESTOQUE]: '📦',
  [Area.TECNOLOGIA]: '💻',
  [Area.RELACOES]: '🤝',
  [Area.LOGISTICA]: '🚛',
  [Area.MARKETING]: '📈',
  [Area.TENDENCIAS]: '🔮',
  [Area.GOVERNANCA]: '⚖️',
};

export function iconeArea(area: string): string {
  return ICONE_AREA[area] || '•';
}

// Estratégia sugerida por área + quadrante (placeholder editável)
const ESTRATEGIA_SUGERIDA: Partial<Record<Area, Partial<Record<QuadranteTows, string>>>> = {
  [Area.FINANCEIRO]: {
    O1: 'Implantar controle de caixa e DRE para estancar o risco financeiro imediato',
    O2: 'Alavancar a saúde financeira para investir em crescimento',
    O3: 'Estruturar formação de preço e capital de giro',
    O4: 'Proteger a estabilidade financeira e a segurança jurídica dos contratos',
  },
  [Area.RH]: {
    O1: 'Reestruturar políticas de RH: retenção, sucessão e capacitação urgente',
    O2: 'Usar a equipe forte como base para escalar a operação',
    O3: 'Desenvolver integração, motivação e comunicação interna',
    O4: 'Preservar benefícios e clima organizacional para reter talentos-chave',
  },
  [Area.GOVERNANCA]: {
    O1: 'Implantar controles internos e governança para reduzir dependência da liderança',
    O2: 'Padronizar processos para sustentar a expansão',
    O3: 'Implantar cultura de controles internos e padronização de processos',
    O4: 'Blindar a operação contra passivos com processos formais',
  },
  [Area.PLANEJAMENTO]: {
    O1: 'Definir plano e metas claras para sair do modo reativo',
    O2: 'Potencializar o planejamento formal e o uso de dados para expansão',
    O3: 'Implantar rotina de planejamento e monitoramento de mercado',
    O4: 'Manter capacidade de planejar frente à instabilidade do mercado',
  },
  [Area.MARKETING]: {
    O1: 'Reorganizar a gestão comercial para estancar a queda de vendas',
    O2: 'Ampliar presença de mercado e fidelização de clientes',
    O3: 'Estruturar marketing digital e monitoramento da concorrência',
    O4: 'Defender o relacionamento com clientes-chave e a marca',
  },
  [Area.TECNOLOGIA]: {
    O1: 'Mitigar riscos de segurança e dependência de processos manuais',
    O2: 'Usar tecnologia/dados como vantagem competitiva',
    O3: 'Capacitar a equipe em TI e modernizar ferramentas de gestão',
    O4: 'Proteger dados e garantir continuidade operacional',
  },
  [Area.RELACOES]: {
    O1: 'Regularizar pendências legais e reduzir exposição a passivos',
    O2: 'Expandir parcerias institucionais estratégicas',
    O3: 'Estruturar programa de relacionamento institucional',
    O4: 'Defender o relacionamento com stakeholders estratégicos',
  },
  [Area.TENDENCIAS]: {
    O1: 'Reduzir o risco de obsolescência do modelo de negócio',
    O2: 'Antecipar tendências e testar novos modelos de negócio',
    O3: 'Estruturar leitura de mercado e planejamento sucessório',
    O4: 'Proteger a relevância do negócio frente a disrupções',
  },
  [Area.ESTOQUE]: {
    O1: 'Estancar perdas e ruptura de estoque crítico',
    O2: 'Otimizar giro e capital de giro via gestão de estoque',
    O3: 'Implantar curva ABC e integração estoque-vendas',
    O4: 'Proteger o caixa reduzindo capital empatado',
  },
  [Area.LOGISTICA]: {
    O1: 'Resolver atrasos e gargalos de entrega que custam clientes',
    O2: 'Transformar a logística em diferencial competitivo',
    O3: 'Implantar roteirização e parcerias de frete',
    O4: 'Proteger a margem frente à alta de custos logísticos',
  },
};

export function estrategiaSugerida(area: string, q: QuadranteTows): string {
  return ESTRATEGIA_SUGERIDA[area as Area]?.[q] || '';
}

// Classifica cada área da SWOT em um quadrante TOWS, conforme o escore.
//   escore < 5.0  -> O.1 Vulnerabilidades (crítico, eliminar urgente)
//   5.0–6.9       -> O.3 Debilidades (atenção, converter)
//   >= 7.0        -> O.2 Ofensivas (forte, aproveitar)
//   não avaliado  -> O.4 Defensivas (postura de proteção/preparação)
export function quadranteDaArea(item: SwotItem): QuadranteTows {
  if (item.escore == null) return 'O4';
  if (item.escore < 5.0) return 'O1';
  if (item.escore < 7.0) return 'O3';
  return 'O2';
}

export interface LinhaPlano {
  area: string;
  escore: number | null;
  estrategiaSugerida: string;
}

// Agrupa os itens nos 4 quadrantes, prontos para render.
export function montarPlanoTows(itens: SwotItem[]): Record<QuadranteTows, LinhaPlano[]> {
  const grupos: Record<QuadranteTows, LinhaPlano[]> = { O1: [], O2: [], O3: [], O4: [] };
  itens.forEach((i) => {
    const q = quadranteDaArea(i);
    grupos[q].push({
      area: i.area,
      escore: i.escore,
      estrategiaSugerida: estrategiaSugerida(i.area, q),
    });
  });
  return grupos;
}
