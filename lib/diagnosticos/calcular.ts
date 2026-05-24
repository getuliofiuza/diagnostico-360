// ============================================================================
// LÓGICA DE CÁLCULO - DIAGNÓSTICO 360°
// ============================================================================

import {
  Resposta,
  Area,
  Escore,
  MatrizRiscoItem,
  AcaoPDI,
  BenchmarkItem,
  AREAS_DIAGNOSTICO,
  CRITICIDADE_POR_AREA,
  NivelMaturidade,
  classificarMaturidade,
  classificarRisco,
  obterCriticidade,
  FasePDI,
  StatusPDI,
  Setor,
  Porte,
  ClassificacaoRisco
} from '@/types/diagnostico';

/**
 * Calcula escore de uma área específica
 * Fórmula: (Soma dos pontos / Quantidade de questões) * 10
 */
export function calcularEscorePorArea(
  respostas: Resposta[],
  area: Area
): Escore {
  // Filtrar apenas respostas pontuadas (A-E), ignorar "F" (Outras)
  const respostasArea = respostas.filter(r => r.tema === area && r.resposta !== 'F');

  if (respostasArea.length === 0) {
    return {
      area,
      pontos: 0,
      maximo: 0,
      escore: 0,
      nivel: NivelMaturidade.NULA
    };
  }

  const pontos = respostasArea.reduce((sum, r) => sum + r.pontos, 0);
  const maximo = respostasArea.length * 10; // 10 = peso máximo de uma resposta
  const escore = Math.round((pontos / maximo) * 100) / 10; // 0-10

  return {
    area,
    pontos,
    maximo,
    escore,
    nivel: classificarMaturidade(escore)
  };
}

/**
 * Calcula todos os escores por área (somente áreas com respostas)
 */
export function calcularEscoresPorArea(respostas: Resposta[]): Escore[] {
  return AREAS_DIAGNOSTICO
    .map(area => calcularEscorePorArea(respostas, area))
    .filter(e => e.maximo > 0);
}

/**
 * Calcula escore geral (média de todas as áreas)
 */
export function calcularEscoreGeral(escores: Escore[]): number {
  if (escores.length === 0) return 0;
  const soma = escores.reduce((sum, e) => sum + e.escore, 0);
  return Math.round((soma / escores.length) * 10) / 10;
}

/**
 * Calcula escore geral diretamente de respostas
 */
export function calcularEscoreGeralDireto(respostas: Resposta[]): number {
  const escores = calcularEscoresPorArea(respostas);
  return calcularEscoreGeral(escores);
}

/**
 * Calcula risco de uma área
 * Fórmula: (10 - escore) * criticidade
 * Quanto menor o escore, maior o risco
 */
export function calcularRiscoArea(escore: number, area: Area): number {
  const criticidade = obterCriticidade(area);
  const risco = (10 - escore) * criticidade;
  return Math.round(risco * 10) / 10;
}

/**
 * Constrói matriz de risco completa
 */
export function construirMatrizRisco(escores: Escore[]): MatrizRiscoItem[] {
  const matriz = escores.map(escore => ({
    area: escore.area,
    escore: escore.escore,
    criticidade_peso: obterCriticidade(escore.area),
    risco_score: calcularRiscoArea(escore.escore, escore.area),
    classificacao: ClassificacaoRisco.CRITICO, // Será atualizado abaixo
    prioridade: 0 // Será atualizado abaixo
  }));

  // Classificar risco
  matriz.forEach(item => {
    item.classificacao = classificarRisco(item.risco_score) as ClassificacaoRisco;
  });

  // Ordenar por risco (descendente) e atribuir prioridade
  matriz.sort((a, b) => b.risco_score - a.risco_score);
  matriz.forEach((item, index) => {
    item.prioridade = index + 1;
  });

  return matriz;
}

/**
 * Calcula risco geral (média de todos os riscos)
 */
export function calcularRiscoGeral(matriz: MatrizRiscoItem[]): number {
  if (matriz.length === 0) return 0;
  const soma = matriz.reduce((sum, item) => sum + item.risco_score, 0);
  return Math.round((soma / matriz.length) * 10) / 10;
}

/**
 * Gera PDI (Plano de Desenvolvimento Individual)
 * Baseado em escores e regras de recomendação
 */
export function gerarPDI(escores: Escore[]): AcaoPDI[] {
  const pdi: AcaoPDI[] = [];

  // Banco de recomendações
  const recomendacoes = obterRecomendacoes();

  escores.forEach(escore => {
    // Encontrar recomendação que se aplica
    const recomendacao = recomendacoes.find(
      r => r.area === escore.area &&
        escore.escore >= r.min_escore &&
        escore.escore <= r.max_escore
    );

    if (recomendacao) {
      pdi.push({
        id: `pdi_${escore.area}_${Date.now()}`,
        area: escore.area,
        escore_atual: escore.escore,
        escore_meta: recomendacao.meta_escore,
        acao_descricao: recomendacao.descricao,
        acao_prazo: recomendacao.prazo,
        acao_responsavel: 'A definir',
        fase: recomendacao.fase,
        status: StatusPDI.PLANEJADO
      });
    }
  });

  // Ordenar por fase (imediata primeiro)
  pdi.sort((a, b) => a.fase - b.fase);

  return pdi;
}

/**
 * Banco de recomendações (regras de negócio)
 */
interface Recomendacao {
  area: Area;
  min_escore: number;
  max_escore: number;
  descricao: string;
  prazo: string;
  meta_escore: number;
  fase: FasePDI;
}

function obterRecomendacoes(): Recomendacao[] {
  return [
    // FINANCEIRO
    {
      area: Area.FINANCEIRO,
      min_escore: 0,
      max_escore: 2,
      descricao: 'Implementar sistema de fluxo de caixa e DRE mensal',
      prazo: '30-45 dias',
      meta_escore: 5,
      fase: FasePDI.IMEDIATA
    },
    {
      area: Area.FINANCEIRO,
      min_escore: 2.1,
      max_escore: 4,
      descricao: 'Estruturar análise de custos e margens por produto/serviço',
      prazo: '45-60 dias',
      meta_escore: 6,
      fase: FasePDI.IMEDIATA
    },
    {
      area: Area.FINANCEIRO,
      min_escore: 4.1,
      max_escore: 6,
      descricao: 'Integrar sistemas contábeis e melhorar KPIs financeiros',
      prazo: '60-90 dias',
      meta_escore: 7.5,
      fase: FasePDI.CURTO_PRAZO
    },
    {
      area: Area.FINANCEIRO,
      min_escore: 6.1,
      max_escore: 8,
      descricao: 'Otimizar gestão de capital de giro e investimentos',
      prazo: '90+ dias',
      meta_escore: 8.5,
      fase: FasePDI.LONGO_PRAZO
    },
    {
      area: Area.FINANCEIRO,
      min_escore: 8.1,
      max_escore: 10,
      descricao: 'Manter excelência e usar como referência interna',
      prazo: 'Contínuo',
      meta_escore: 9.5,
      fase: FasePDI.LONGO_PRAZO
    },

    // PLANEJAMENTO E ESTRATÉGIA
    {
      area: Area.PLANEJAMENTO,
      min_escore: 0,
      max_escore: 2,
      descricao: 'Definir visão, missão e valores da empresa claramente',
      prazo: '15-30 dias',
      meta_escore: 5,
      fase: FasePDI.IMEDIATA
    },
    {
      area: Area.PLANEJAMENTO,
      min_escore: 2.1,
      max_escore: 4,
      descricao: 'Elaborar plano estratégico escrito para 3-5 anos',
      prazo: '30-60 dias',
      meta_escore: 6,
      fase: FasePDI.IMEDIATA
    },
    {
      area: Area.PLANEJAMENTO,
      min_escore: 4.1,
      max_escore: 6,
      descricao: 'Implementar análise SWOT regular e monitoramento de mercado',
      prazo: '60-90 dias',
      meta_escore: 7.5,
      fase: FasePDI.CURTO_PRAZO
    },
    {
      area: Area.PLANEJAMENTO,
      min_escore: 6.1,
      max_escore: 8,
      descricao: 'Implementar BSC e indicadores estratégicos',
      prazo: '90+ dias',
      meta_escore: 8.5,
      fase: FasePDI.LONGO_PRAZO
    },
    {
      area: Area.PLANEJAMENTO,
      min_escore: 8.1,
      max_escore: 10,
      descricao: 'Consolidar como empresa de alto desempenho estratégico',
      prazo: 'Contínuo',
      meta_escore: 9.5,
      fase: FasePDI.LONGO_PRAZO
    },

    // RECURSOS HUMANOS
    {
      area: Area.RH,
      min_escore: 0,
      max_escore: 2,
      descricao: 'Implementar gestão básica de pessoal e processos de RH',
      prazo: '30-45 dias',
      meta_escore: 5,
      fase: FasePDI.IMEDIATA
    },
    {
      area: Area.RH,
      min_escore: 2.1,
      max_escore: 4,
      descricao: 'Estruturar recrutamento, seleção e integração de colaboradores',
      prazo: '45-60 dias',
      meta_escore: 6,
      fase: FasePDI.IMEDIATA
    },
    {
      area: Area.RH,
      min_escore: 4.1,
      max_escore: 6,
      descricao: 'Implementar programa de desenvolvimento e avaliação de desempenho',
      prazo: '60-90 dias',
      meta_escore: 7.5,
      fase: FasePDI.CURTO_PRAZO
    },
    {
      area: Area.RH,
      min_escore: 6.1,
      max_escore: 8,
      descricao: 'Desenvolver cultura organizacional forte e plano de carreira',
      prazo: '90+ dias',
      meta_escore: 8.5,
      fase: FasePDI.LONGO_PRAZO
    },
    {
      area: Area.RH,
      min_escore: 8.1,
      max_escore: 10,
      descricao: 'Ser referência em gestão de pessoas e retenção de talentos',
      prazo: 'Contínuo',
      meta_escore: 9.5,
      fase: FasePDI.LONGO_PRAZO
    },

    // TECNOLOGIA
    {
      area: Area.TECNOLOGIA,
      min_escore: 0,
      max_escore: 2,
      descricao: 'Implementar infraestrutura básica e segurança de dados',
      prazo: '30-45 dias',
      meta_escore: 5,
      fase: FasePDI.IMEDIATA
    },
    {
      area: Area.TECNOLOGIA,
      min_escore: 2.1,
      max_escore: 4,
      descricao: 'Estruturar sistemas de gestão integrados (ERP básico)',
      prazo: '60-90 dias',
      meta_escore: 6,
      fase: FasePDI.IMEDIATA
    },
    {
      area: Area.TECNOLOGIA,
      min_escore: 4.1,
      max_escore: 6,
      descricao: 'Implementar automação de processos e análise de dados',
      prazo: '90-180 dias',
      meta_escore: 7.5,
      fase: FasePDI.CURTO_PRAZO
    },
    {
      area: Area.TECNOLOGIA,
      min_escore: 6.1,
      max_escore: 8,
      descricao: 'Otimizar infraestrutura cloud e inteligência de negócios',
      prazo: '180+ dias',
      meta_escore: 8.5,
      fase: FasePDI.LONGO_PRAZO
    },
    {
      area: Area.TECNOLOGIA,
      min_escore: 8.1,
      max_escore: 10,
      descricao: 'Usar tecnologia como diferencial competitivo',
      prazo: 'Contínuo',
      meta_escore: 9.5,
      fase: FasePDI.LONGO_PRAZO
    },

    // ESTOQUE (Comércio)
    {
      area: Area.ESTOQUE,
      min_escore: 0,
      max_escore: 2,
      descricao: 'Implementar controle básico de estoque (sistema manual ou simples)',
      prazo: '15-30 dias',
      meta_escore: 5,
      fase: FasePDI.IMEDIATA
    },
    {
      area: Area.ESTOQUE,
      min_escore: 2.1,
      max_escore: 4,
      descricao: 'Estruturar sistema eletrônico de gestão de estoque',
      prazo: '30-45 dias',
      meta_escore: 6,
      fase: FasePDI.IMEDIATA
    },
    {
      area: Area.ESTOQUE,
      min_escore: 4.1,
      max_escore: 6,
      descricao: 'Otimizar curvas ABC e pontos de reposição',
      prazo: '45-60 dias',
      meta_escore: 7.5,
      fase: FasePDI.CURTO_PRAZO
    },
    {
      area: Area.ESTOQUE,
      min_escore: 6.1,
      max_escore: 8,
      descricao: 'Implementar rotatividade e previsão de demanda avançada',
      prazo: '60-90 dias',
      meta_escore: 8.5,
      fase: FasePDI.LONGO_PRAZO
    },
    {
      area: Area.ESTOQUE,
      min_escore: 8.1,
      max_escore: 10,
      descricao: 'Manter estoque otimizado com mínimo de desperdício',
      prazo: 'Contínuo',
      meta_escore: 9.5,
      fase: FasePDI.LONGO_PRAZO
    },

    // RELAÇÕES INSTITUCIONAIS
    {
      area: Area.RELACOES,
      min_escore: 0,
      max_escore: 2,
      descricao: 'Regularizar obrigações legais e fiscais pendentes',
      prazo: '15-30 dias',
      meta_escore: 5,
      fase: FasePDI.IMEDIATA
    },
    {
      area: Area.RELACOES,
      min_escore: 2.1,
      max_escore: 4,
      descricao: 'Formalizar contratos com clientes, fornecedores e parceiros',
      prazo: '30-60 dias',
      meta_escore: 6,
      fase: FasePDI.IMEDIATA
    },
    {
      area: Area.RELACOES,
      min_escore: 4.1,
      max_escore: 6,
      descricao: 'Implementar pesquisa de satisfação e canais de comunicação',
      prazo: '60-90 dias',
      meta_escore: 7.5,
      fase: FasePDI.CURTO_PRAZO
    },
    {
      area: Area.RELACOES,
      min_escore: 6.1,
      max_escore: 8,
      descricao: 'Desenvolver programa de responsabilidade social e parcerias estratégicas',
      prazo: '90+ dias',
      meta_escore: 8.5,
      fase: FasePDI.LONGO_PRAZO
    },
    {
      area: Area.RELACOES,
      min_escore: 8.1,
      max_escore: 10,
      descricao: 'Consolidar como empresa referência em governança e relações institucionais',
      prazo: 'Contínuo',
      meta_escore: 9.5,
      fase: FasePDI.LONGO_PRAZO
    },

    // LOGÍSTICA
    {
      area: Area.LOGISTICA,
      min_escore: 0,
      max_escore: 2,
      descricao: 'Estruturar processos básicos de recebimento, armazenagem e expedição',
      prazo: '15-30 dias',
      meta_escore: 5,
      fase: FasePDI.IMEDIATA
    },
    {
      area: Area.LOGISTICA,
      min_escore: 2.1,
      max_escore: 4,
      descricao: 'Implementar controle de entregas e rastreamento básico',
      prazo: '30-60 dias',
      meta_escore: 6,
      fase: FasePDI.IMEDIATA
    },
    {
      area: Area.LOGISTICA,
      min_escore: 4.1,
      max_escore: 6,
      descricao: 'Otimizar rotas de entrega e monitorar OTIF',
      prazo: '60-90 dias',
      meta_escore: 7.5,
      fase: FasePDI.CURTO_PRAZO
    },
    {
      area: Area.LOGISTICA,
      min_escore: 6.1,
      max_escore: 8,
      descricao: 'Implementar logística reversa e roteirização automatizada',
      prazo: '90+ dias',
      meta_escore: 8.5,
      fase: FasePDI.LONGO_PRAZO
    },
    {
      area: Area.LOGISTICA,
      min_escore: 8.1,
      max_escore: 10,
      descricao: 'Manter excelência logística com indicadores de classe mundial',
      prazo: 'Contínuo',
      meta_escore: 9.5,
      fase: FasePDI.LONGO_PRAZO
    },

    // MARKETING E VENDAS
    {
      area: Area.MARKETING,
      min_escore: 0,
      max_escore: 2,
      descricao: 'Definir estratégia de marketing e presença digital mínima',
      prazo: '15-30 dias',
      meta_escore: 5,
      fase: FasePDI.IMEDIATA
    },
    {
      area: Area.MARKETING,
      min_escore: 2.1,
      max_escore: 4,
      descricao: 'Estruturar funil de vendas e diversificar canais',
      prazo: '30-60 dias',
      meta_escore: 6,
      fase: FasePDI.IMEDIATA
    },
    {
      area: Area.MARKETING,
      min_escore: 4.1,
      max_escore: 6,
      descricao: 'Implementar CRM e programa de pós-venda para fidelização',
      prazo: '60-90 dias',
      meta_escore: 7.5,
      fase: FasePDI.CURTO_PRAZO
    },
    {
      area: Area.MARKETING,
      min_escore: 6.1,
      max_escore: 8,
      descricao: 'Otimizar ROI de marketing e expandir presença digital estratégica',
      prazo: '90+ dias',
      meta_escore: 8.5,
      fase: FasePDI.LONGO_PRAZO
    },
    {
      area: Area.MARKETING,
      min_escore: 8.1,
      max_escore: 10,
      descricao: 'Consolidar marca como referência e escalar vendas com automação',
      prazo: 'Contínuo',
      meta_escore: 9.5,
      fase: FasePDI.LONGO_PRAZO
    },

    // PROJEÇÕES E TENDÊNCIAS
    {
      area: Area.TENDENCIAS,
      min_escore: 0,
      max_escore: 2,
      descricao: 'Iniciar acompanhamento de tendências do setor e concorrência',
      prazo: '15-30 dias',
      meta_escore: 5,
      fase: FasePDI.IMEDIATA
    },
    {
      area: Area.TENDENCIAS,
      min_escore: 2.1,
      max_escore: 4,
      descricao: 'Elaborar plano de contingência e cenários futuros básicos',
      prazo: '30-60 dias',
      meta_escore: 6,
      fase: FasePDI.IMEDIATA
    },
    {
      area: Area.TENDENCIAS,
      min_escore: 4.1,
      max_escore: 6,
      descricao: 'Implementar inovação estruturada e plano de diversificação',
      prazo: '60-90 dias',
      meta_escore: 7.5,
      fase: FasePDI.CURTO_PRAZO
    },
    {
      area: Area.TENDENCIAS,
      min_escore: 6.1,
      max_escore: 8,
      descricao: 'Investir em transformação digital e planejamento sucessório',
      prazo: '90+ dias',
      meta_escore: 8.5,
      fase: FasePDI.LONGO_PRAZO
    },
    {
      area: Area.TENDENCIAS,
      min_escore: 8.1,
      max_escore: 10,
      descricao: 'Liderar inovação no setor com inteligência competitiva avançada',
      prazo: 'Contínuo',
      meta_escore: 9.5,
      fase: FasePDI.LONGO_PRAZO
    },
  ];
}

/**
 * Gera dados para gráfico radar
 */
export function gerarDadosRadar(escores: Escore[]): Array<{ area: string; escore: number }> {
  return escores.map(escore => ({
    area: escore.area,
    escore: escore.escore
  }));
}

/**
 * Compara com benchmark (simplificado - integra com banco depois)
 */
export function compararComBenchmark(
  escores: Escore[],
  setor: Setor,
  porte: Porte
): BenchmarkItem[] {
  // Valores do template original DIAGNÓSTICO_360_TEMPLATE.xlsx (aba BENCHMARK)
  const benchmarkData: Record<string, number> = {
    [Area.PLANEJAMENTO]: 6.1,
    [Area.RH]: setor === Setor.SERVICOS ? 7.2 : 5.8,
    [Area.ESTOQUE]: 5.8,
    [Area.FINANCEIRO]: 5.5,
    [Area.TECNOLOGIA]: 5.0,
    [Area.RELACOES]: 6.0,
    [Area.LOGISTICA]: 5.5,
    [Area.MARKETING]: 6.3,
    [Area.TENDENCIAS]: 4.8
  };

  return escores.map(escore => {
    const mediaSetor = benchmarkData[escore.area] || 5.5;
    const diferenca = escore.escore - mediaSetor;
    const posicao = diferenca > 0.1 ? 'ACIMA' : diferenca < -0.1 ? 'ABAIXO' : 'IGUAL';

    return {
      area: escore.area,
      seu_escore: escore.escore,
      media_setor: mediaSetor,
      diferenca: Math.round(diferenca * 10) / 10,
      posicao
    };
  });
}

/**
 * Gera narrativa textual baseada em escores
 */
export function gerarNarrativa(
  escores: Escore[],
  escore_geral: number,
  maturidade: NivelMaturidade,
  setor: Setor,
  porte: Porte,
  matriz: MatrizRiscoItem[]
): string {
  let narrativa = '';

  // Abertura
  narrativa += `Diagnóstico realizado em ${new Date().toLocaleDateString('pt-BR')}.\n\n`;

  // Escore geral
  narrativa += `A empresa apresenta escore geral de ${escore_geral}/10, `;
  narrativa += `classificada como ${maturidade}.\n\n`;

  // Contexto de maturidade
  switch (maturidade) {
    case NivelMaturidade.AVANCADA:
      narrativa += `A maturidade operacional é avançada, posicionando a empresa como referência no setor. `;
      narrativa += `Recomenda-se manter os padrões e continuar evoluindo.`;
      break;
    case NivelMaturidade.PLENA:
      narrativa += `A maturidade operacional está bem estruturada. `;
      narrativa += `Há oportunidades de otimização em algumas áreas específicas.`;
      break;
    case NivelMaturidade.INICIAL:
      narrativa += `A maturidade operacional está em desenvolvimento. `;
      narrativa += `Há oportunidades claras de evolução e estruturação.`;
      break;
    case NivelMaturidade.BASICA:
      narrativa += `A maturidade operacional é básica. `;
      narrativa += `Há necessidade de estruturação em várias áreas.`;
      break;
    case NivelMaturidade.NULA:
      narrativa += `A maturidade operacional é nula em algumas áreas. `;
      narrativa += `Há necessidade urgente de ações corretivas.`;
      break;
  }

  narrativa += `\n\n`;

  // Áreas críticas
  const criticas = matriz.filter(m => m.classificacao === ClassificacaoRisco.CRITICO);
  if (criticas.length > 0) {
    narrativa += `ÁREAS CRÍTICAS (${criticas.length}):\n`;
    criticas.forEach((item, i) => {
      narrativa += `${i + 1}. ${item.area} (Escore: ${item.escore}/10, Risco: ${item.risco_score}) - `;
      narrativa += `Ação imediata recomendada.\n`;
    });
    narrativa += `\n`;
  }

  // Áreas fortes
  const fortes = escores.filter(e => e.escore >= 8);
  if (fortes.length > 0) {
    narrativa += `ÁREAS FORTES:\n`;
    fortes.forEach(escore => {
      narrativa += `- ${escore.area}: ${escore.escore}/10 (${escore.nivel})\n`;
    });
    narrativa += `\n`;
  }

  // Recomendação final
  if (criticas.length >= 3) {
    narrativa += `RECOMENDAÇÃO: Priorizar ações nas áreas críticas nos próximos 30 dias. `;
  } else if (criticas.length > 0) {
    narrativa += `RECOMENDAÇÃO: Revisar plano de ação para áreas críticas. `;
  } else {
    narrativa += `RECOMENDAÇÃO: Continuar evoluindo com foco em otimização contínua. `;
  }

  narrativa += `Um plano detalhado (PDI) foi gerado para sua ação.`;

  return narrativa;
}
