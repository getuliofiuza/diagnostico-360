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

const CABECALHO_PERGUNTAS = 'Exemplos de perguntas profundas:';

// Monta o texto de fundo (placeholder) a partir de uma lista de perguntas.
function bloco(perguntas: string[]): string {
  return [CABECALHO_PERGUNTAS, ...perguntas.map((p) => `• ${p}`)].join('\n');
}

// Banco completo: 4 quadrantes × 10 áreas. As perguntas são apenas EXEMPLOS
// para provocar reflexão — aparecem como texto de fundo e somem ao digitar.
const BANCO_PERGUNTAS: Record<Area, PerguntasProfundas> = {
  [Area.FINANCEIRO]: {
    forcas: bloco([
      'Tenho clareza real do meu lucro mensal, ou trabalho por "sensação"?',
      'Qual prática financeira minha já é melhor que a da maioria dos concorrentes?',
      'Meu controle de caixa me permite tomar decisão com confiança hoje?',
      'Que reserva ou margem me dá fôlego que outros negócios não têm?',
    ]),
    fraquezas: bloco([
      'Meu preço cobre todos os custos e ainda me remunera, ou estou no vermelho sem ver?',
      'Quantos dias a empresa sobreviveria se as vendas parassem amanhã?',
      'Misturo dinheiro pessoal e da empresa? O quanto isso distorce minhas decisões?',
      'O que eu evito olhar nas finanças porque sei que está mal resolvido?',
    ]),
    oportunidades: bloco([
      'Que linha de crédito ou renegociação eu poderia usar a meu favor agora?',
      'Se eu precificasse por valor (não por custo), quanto a mais eu ganharia?',
      'Que automação contábil/financeira me daria dados melhores para decidir?',
      'Onde estou deixando dinheiro na mesa por falta de controle?',
    ]),
    ameacas: bloco([
      'Se o banco cortasse meu crédito amanhã, o que aconteceria?',
      'Uma queda de 20% nas vendas me levaria à insolvência em quanto tempo?',
      'Quanto da minha margem depende de um único cliente ou produto?',
      'Que custo fora de controle pode corroer meu lucro nos próximos meses?',
    ]),
  },
  [Area.PLANEJAMENTO]: {
    forcas: bloco([
      'Tenho visão/missão clara que realmente guia as decisões do dia a dia?',
      'Que leitura de mercado minha já se provou certeira no passado?',
      'Existe um plano escrito que a equipe conhece e segue?',
      'Qual decisão estratégica recente deu certo por ter sido planejada?',
    ]),
    fraquezas: bloco([
      'Minhas decisões são planejadas ou quase sempre reativas ("apagar incêndio")?',
      'Eu sei dizer onde quero a empresa em 3 anos — com números?',
      'Tenho indicadores que me dizem se estou indo bem, ou só a sensação?',
      'Com que frequência reviso a estratégia, ou só toco o operacional?',
    ]),
    oportunidades: bloco([
      'Que tendência de mercado, se eu me planejar agora, vira vantagem?',
      'Como esta própria análise SWOT pode virar rotina estratégica?',
      'Que método (BSC, OKR) traria foco ao meu planejamento?',
      'Onde a falta de planejamento dos concorrentes abre espaço para mim?',
    ]),
    ameacas: bloco([
      'Sem plano, qual oportunidade de mercado eu já perdi por demora?',
      'Que concorrente mais estruturado pode me ultrapassar enquanto reajo?',
      'A estagnação por falta de rumo me tornaria irrelevante em quanto tempo?',
      'Falta de planejamento dificultaria captar recurso/investimento quando eu precisar?',
    ]),
  },
  [Area.RH]: {
    forcas: bloco([
      'Que conhecimento ou talento da minha equipe é difícil de encontrar no mercado?',
      'Onde minha rotatividade é baixa e o clima é bom — e por quê?',
      'Que prática de gestão de pessoas já me diferencia?',
      'Qual líder interno eu confio para tocar a operação sem mim?',
    ]),
    fraquezas: bloco([
      'Se meu melhor funcionário pedisse demissão hoje, o que pararia de funcionar?',
      'As pessoas sabem o que se espera delas, ou cada um interpreta do seu jeito?',
      'Por que as pessoas realmente saem da minha empresa? Eu já perguntei de verdade?',
      'Eu desenvolvo minha equipe ou só cobro resultado?',
    ]),
    oportunidades: bloco([
      'Que parceria (escola técnica, curso) resolveria meu gap de mão de obra?',
      'Um plano de carreira ou PLR aumentaria retenção e engajamento?',
      'Que programa de capacitação elevaria a produtividade rapidamente?',
      'Como me tornar um "imã" de bons profissionais na minha região?',
    ]),
    ameacas: bloco([
      'A perda de uma pessoa-chave levaria embora know-how crítico?',
      'Um clima organizacional ruim pode contaminar minha melhor equipe?',
      'O custo de recrutar e treinar sempre de novo está crescendo?',
      'A falta de gente preparada me impede de aceitar mais clientes/escalar?',
    ]),
  },
  [Area.ESTOQUE]: {
    forcas: bloco([
      'Conheço o giro dos meus itens e tenho baixa perda/obsolescência?',
      'Meu controle de estoque evita ruptura nos produtos que mais vendem?',
      'Que prática de compras/estoque já me dá vantagem de custo?',
      'Tenho boa relação com fornecedores que garante reposição confiável?',
    ]),
    fraquezas: bloco([
      'Quanto capital está parado em estoque que não gira?',
      'Quantas vendas eu perco por falta do item certo na hora certa?',
      'Sei o que comprar com base em dados, ou no "achismo"?',
      'Tenho perdas por validade, avaria ou produto encalhado?',
    ]),
    oportunidades: bloco([
      'Uma curva ABC mudaria minha forma de comprar e estocar?',
      'Integrar estoque com vendas reduziria ruptura e excesso ao mesmo tempo?',
      'Que negociação com fornecedor (prazo, lote) liberaria meu caixa?',
      'Um modelo just-in-time caberia em parte do meu portfólio?',
    ]),
    ameacas: bloco([
      'Capital empatado em estoque pode me faltar como capital de giro?',
      'Um fornecedor falhar comprometeria minhas vendas?',
      'Mudança de demanda deixaria meu estoque obsoleto rápido?',
      'Ruptura recorrente está empurrando clientes para o concorrente?',
    ]),
  },
  [Area.TECNOLOGIA]: {
    forcas: bloco([
      'Que sistema ou dado bem organizado já me faz ganhar tempo/decisão?',
      'Minha equipe adota tecnologia com facilidade?',
      'Onde a tecnologia já me dá vantagem sobre concorrentes locais?',
      'Que processo eu já automatizei e não imagino mais fazer manual?',
    ]),
    fraquezas: bloco([
      'Quantas horas minha equipe perde em retrabalho e processo manual?',
      'Meus dados estão seguros, ou um problema técnico me pararia?',
      'Dependo de planilhas soltas que só uma pessoa entende?',
      'Estou vulnerável a falhas, perda de dados ou ataques?',
    ]),
    oportunidades: bloco([
      'Que automação eliminaria meu maior gargalo operacional?',
      'Um BI/painel me daria inteligência que hoje não tenho?',
      'Migrar para a nuvem reduziria custo e risco?',
      'Onde a IA poderia me dar produtividade antes dos concorrentes?',
    ]),
    ameacas: bloco([
      'Se eu não evoluir, em quanto tempo fico defasado frente à concorrência?',
      'Um vazamento ou perda de dados teria qual impacto legal/reputacional?',
      'A falta de sistemas me impede de crescer sem aumentar custo na mesma proporção?',
      'Que risco de segurança eu venho ignorando?',
    ]),
  },
  [Area.RELACOES]: {
    forcas: bloco([
      'Minha reputação na praça abre portas para mim?',
      'Que parcerias institucionais já me trazem resultado?',
      'Estou em dia com obrigações legais e isso me dá tranquilidade?',
      'Que relação de confiança (sindicato, associação, poder público) eu já tenho?',
    ]),
    fraquezas: bloco([
      'Tenho pendências legais/multas que viraram passivo escondido?',
      'Minha imagem anda desgastada com algum público importante?',
      'Falta um programa estruturado de relacionamento institucional?',
      'Conheço de fato as obrigações regulatórias do meu setor?',
    ]),
    oportunidades: bloco([
      'Que parceria estratégica destravaria crescimento ou credibilidade?',
      'Ações de responsabilidade social fortaleceriam minha marca?',
      'Participar de associações setoriais me daria voz e informação?',
      'Onde uma boa relação institucional viraria vantagem competitiva?',
    ]),
    ameacas: bloco([
      'Um passivo legal pode estourar e comprometer o negócio?',
      'Posso perder licença/autorização por descuido regulatório?',
      'Um dano reputacional teria efeito permanente sobre minhas vendas?',
      'Mudança de legislação pode me pegar despreparado?',
    ]),
  },
  [Area.LOGISTICA]: {
    forcas: bloco([
      'Entrego no prazo de forma confiável e isso fideliza clientes?',
      'Tenho custo logístico sob controle frente aos concorrentes?',
      'Minha malha de entrega/coleta já é bem definida?',
      'Que parceiro logístico me dá vantagem de prazo ou preço?',
    ]),
    fraquezas: bloco([
      'Atrasos de entrega estão me custando clientes?',
      'O frete está corroendo minha margem sem eu perceber?',
      'Dependo demais de um único transportador?',
      'Minhas rotas/entregas são planejadas ou improvisadas?',
    ]),
    oportunidades: bloco([
      'Roteirização reduziria custo e prazo ao mesmo tempo?',
      'Parcerias de frete ou hubs ampliariam meu alcance?',
      'Integrar logística ao e-commerce abriria novo canal?',
      'Onde a logística pode virar diferencial e não só custo?',
    ]),
    ameacas: bloco([
      'Atrasos recorrentes empurram clientes para a concorrência?',
      'Aumento de combustível/frete pode inviabilizar minha margem?',
      'A falha de um parceiro logístico pararia minhas entregas?',
      'Gargalos de entrega limitam meu crescimento?',
    ]),
  },
  [Area.MARKETING]: {
    forcas: bloco([
      'Tenho base de clientes fiel e indicações constantes (boca a boca)?',
      'Minha marca é reconhecida e respeitada na minha região?',
      'Que canal de vendas já me traz resultado previsível?',
      'O que faz o cliente me escolher e voltar?',
    ]),
    fraquezas: bloco([
      'Eu sei quanto custa conquistar um cliente novo e quanto ele me dá de retorno?',
      'De onde vêm meus clientes hoje — eu controlo isso ou é sorte/indicação?',
      'Se minha maior fonte de clientes secasse, eu teria um plano B?',
      'Minha gestão comercial é estruturada ou desorganizada?',
    ]),
    oportunidades: bloco([
      'Presença digital/CRM aumentaria minhas vendas previsíveis?',
      'Um programa de indicação multiplicaria meus melhores clientes?',
      'Que canal novo (online, parcerias) eu nunca explorei?',
      'Onde os concorrentes comunicam mal e eu poderia me destacar?',
    ]),
    ameacas: bloco([
      'A dependência de poucos clientes me deixa exposto?',
      'Um concorrente com marketing forte pode encolher meu mercado?',
      'CAC subindo e conversão caindo: minha venda fica inviável?',
      'Minha marca é fraca a ponto de eu competir só por preço?',
    ]),
  },
  [Area.TENDENCIAS]: {
    forcas: bloco([
      'Estou atento ao mercado e costumo perceber mudanças antes dos outros?',
      'Já acertei ao antecipar alguma tendência? Como fiz?',
      'Tenho abertura para experimentar novos modelos/produtos?',
      'Que visão de futuro minha já se mostrou valiosa?',
    ]),
    fraquezas: bloco([
      'Decido por dados de tendência ou por intuição?',
      'Mudanças de mercado costumam me pegar de surpresa?',
      'Tenho plano de sucessão/continuidade para o negócio?',
      'Reservo tempo para pensar o futuro, ou só toco o presente?',
    ]),
    oportunidades: bloco([
      'Que transformação digital me posicionaria à frente?',
      'Qual novo modelo de negócio eu poderia testar com baixo risco?',
      'Que tendência do meu setor ainda é ignorada pelos concorrentes?',
      'Como antecipar o que meu cliente vai querer amanhã?',
    ]),
    ameacas: bloco([
      'Meu modelo de negócio pode ficar obsoleto em poucos anos?',
      'Que disrupção (tecnologia, novo entrante) ameaça meu setor?',
      'Posso perder relevância se continuar fazendo igual?',
      'A falta de sucessão põe em risco a continuidade da empresa?',
    ]),
  },
  [Area.GOVERNANCA]: {
    forcas: bloco([
      'Tenho algum processo-chave documentado e papéis bem definidos?',
      'Existem reuniões de gestão recorrentes que geram decisão?',
      'Que rotina de governança já me dá previsibilidade?',
      'Em que ponto a empresa funciona bem mesmo sem mim?',
    ]),
    fraquezas: bloco([
      'Quantas decisões por dia ainda passam obrigatoriamente por mim?',
      'Se eu me afastasse 60 dias, a empresa funcionaria ou pararia?',
      'Nossos processos estão na cabeça das pessoas ou documentados?',
      'Confio na minha equipe para decidir, ou centralizo por medo de errar?',
    ]),
    oportunidades: bloco([
      'Estruturar comitês (financeiro, compliance) traria mais controle?',
      'Implementar gestão de riscos evitaria surpresas?',
      'Padronizar processos-chave reduziria retrabalho e dependência?',
      'Um plano de sucessão prepararia a empresa para escalar?',
    ]),
    ameacas: bloco([
      'Se eu (liderança) me afastar, a empresa entra em colapso?',
      'A informalidade me expõe a passivos jurídicos?',
      'Decisões centralizadas viram gargalo que impede crescer?',
      'A dependência de "heróis operacionais" é uma bomba-relógio?',
    ]),
  },
};

export function obterPerguntasProfundas(area: string): PerguntasProfundas {
  return (
    BANCO_PERGUNTAS[area as Area] || {
      forcas: bloco([
        'O que esta área já faz bem e poderia ser usado como alavanca?',
        'Que recurso desta área seria mais doloroso de perder?',
      ]),
      fraquezas: bloco([
        'O que eu evito olhar nesta área porque sei que está mal resolvido?',
        'O que depende só de mim e travaria se eu faltasse 30 dias?',
      ]),
      oportunidades: bloco([
        'Que fator externo, se eu agir antes, viraria vantagem nesta área?',
        'Que recurso subutilizado eu poderia aproveitar aqui?',
      ]),
      ameacas: bloco([
        'Se este gap continuar 12 meses, qual é o pior cenário concreto?',
        'Que dependência externa poderia me derrubar nesta área?',
      ]),
    }
  );
}
