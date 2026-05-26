// ============================================================================
// API - GET /api/diagnosticos/[id]
// ============================================================================
// Recupera diagnóstico completo com todos os dados

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DiagnosticoCompleto } from '@/types/diagnostico';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Recuperar diagnóstico principal
    const { data: diagnostico, error: diagError } = await supabase
      .from('diagnosticos_360')
      .select('*')
      .eq('id', params.id)
      .single();

    if (diagError || !diagnostico) {
      return NextResponse.json(
        { success: false, message: 'Diagnóstico não encontrado' },
        { status: 404 }
      );
    }

    // 2. Recuperar respostas
    const { data: respostas } = await supabase
      .from('diagnosticos_360_respostas')
      .select('*')
      .eq('diagnostico_id', params.id);

    // 3. Recuperar matriz de risco
    const { data: matriz_risco } = await supabase
      .from('diagnosticos_360_matriz_risco')
      .select('*')
      .eq('diagnostico_id', params.id)
      .order('prioridade', { ascending: true });

    // 4. Recuperar PDI
    const { data: pdi } = await supabase
      .from('diagnosticos_360_pdi')
      .select('*')
      .eq('diagnostico_id', params.id)
      .order('fase', { ascending: true });

    // 5. Benchmarks: 2 referências por área
    //   (a) Média Nacional SEBRAE — onde as MPEs brasileiras estão em média
    //   (b) Meta B&G — nível de excelência operacional (referencial aspiracional)
    //
    // FONTE da média nacional:
    //   - SEBRAE/Sondagem de Pequenos Negócios
    //   - SEBRAE/Sobrevivência das Empresas no Brasil
    //   - GEM Brasil (Global Entrepreneurship Monitor)
    // Valores em escala 0-10 derivados das pesquisas mais recentes (2022-2024)
    const META_BG_EXCELENCIA = 7.5;

    const mediaNacionalSEBRAE: Record<string, number> = {
      'Planejamento e Estratégia': 5.5,    // ~45% das MPEs têm planejamento formal
      'Recursos Humanos': diagnostico.setor === 'Serviços' ? 5.8 : 5.0,
      'Estoque': 6.0,                      // Comércio é mais maduro nesta área
      'Financeiro': 4.5,                   // ~30% têm fluxo de caixa estruturado
      'Tecnologia da Informação': 4.0,     // Digitalização ainda incipiente
      'Relações Institucionais': 5.5,
      'Logística': 5.0,
      'Marketing e Vendas': 5.5,           // Presença digital crescente
      'Projeções e Tendências': 4.0,
      'Gestão de Processos e Governança': 3.5,  // Área menos madura nas MPEs
    };

    const benchmark = Object.entries(mediaNacionalSEBRAE).map(([area, media_setor]) => ({
      area,
      media_setor,
      meta_bg: META_BG_EXCELENCIA,
      fonte: 'SEBRAE / MPE Indicadores',
    }));

    // 6. Gerar dados para radar
    const radar_data = matriz_risco?.map(item => ({
      area: item.area,
      escore: item.escore
    })) || [];

    // Calcular escores por área (somente áreas com dados)
    const todasAreas = [
      { area: 'Planejamento e Estratégia', escore: diagnostico.escore_planejamento },
      { area: 'Recursos Humanos', escore: diagnostico.escore_rh },
      { area: 'Estoque', escore: diagnostico.escore_estoque },
      { area: 'Financeiro', escore: diagnostico.escore_financeiro },
      { area: 'Tecnologia da Informação', escore: diagnostico.escore_tecnologia },
      { area: 'Relações Institucionais', escore: diagnostico.escore_relacoes },
      { area: 'Logística', escore: diagnostico.escore_logistica },
      { area: 'Marketing e Vendas', escore: diagnostico.escore_marketing },
      { area: 'Projeções e Tendências', escore: diagnostico.escore_tendencias },
      { area: 'Gestão de Processos e Governança', escore: diagnostico.escore_governanca },
    ];

    const escores = todasAreas
      .filter(a => a.escore != null)
      .map(a => ({
        area: a.area,
        pontos: 0,
        maximo: 0,
        escore: a.escore as number,
        nivel: 'INICIAL'
      }));

    // 7. Gerar narrativa interpretativa
    const narrativa = gerarNarrativa({
      escore_geral: diagnostico.escore_geral,
      maturidade: diagnostico.maturidade,
      empresa_nome: diagnostico.empresa_nome,
      setor: diagnostico.setor,
      porte: diagnostico.porte,
      escores,
      matriz_risco: matriz_risco || []
    });

    // Coletar respostas "Outras" (F) com textos personalizados
    const observacoes = (respostas || [])
      .filter((r: any) => r.resposta === 'F' && r.resposta_texto && r.resposta_texto.trim())
      .map((r: any) => ({
        questao_id: r.questao_id,
        tema: r.tema,
        texto: r.resposta_texto
      }));

    // 8. Montar resposta completa
    const response: DiagnosticoCompleto & { observacoes?: any[] } = {
      ...diagnostico,
      escores,
      matriz_risco: matriz_risco || [],
      pdi: pdi?.map(item => ({
        ...item,
        area: item.area as any,
        fase: item.fase as any,
        status: item.status as any
      })) || [],
      benchmark,
      narrativa,
      radar_data,
      observacoes
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Erro ao recuperar diagnóstico:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao recuperar diagnóstico',
        error: error instanceof Error ? error.message : 'Desconhecido'
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER: Gerar Narrativa Interpretativa
// ============================================================================

interface NarrativaInput {
  escore_geral: number;
  maturidade: string;
  empresa_nome: string;
  setor: string;
  porte: string;
  escores: Array<{ area: string; escore: number }>;
  matriz_risco: Array<{ area: string; classificacao: string; escore: number; risco_score: number }>;
}

function gerarNarrativa(input: NarrativaInput): string {
  const { escore_geral, maturidade, empresa_nome, setor, porte, escores, matriz_risco } = input;

  const partes: string[] = [];

  // Abertura contextual
  partes.push(
    `A empresa ${empresa_nome} (${setor}, porte ${porte}) atingiu um Índice de Maturidade Empresarial de ${escore_geral}/10, classificada no nível ${maturidade}.`
  );

  // Interpretação do nível
  const interpretacoes: Record<string, string> = {
    'NULA': 'Este resultado indica baixíssima maturidade operacional, com processos majoritariamente informais ou inexistentes. Há necessidade urgente de estruturação básica em quase todas as áreas para garantir a sustentabilidade do negócio.',
    'BASICA': 'A empresa apresenta processos rudimentares, em maioria informais. Existe oportunidade significativa de estruturação para profissionalizar a gestão e reduzir riscos operacionais.',
    'BÁSICA': 'A empresa apresenta processos rudimentares, em maioria informais. Existe oportunidade significativa de estruturação para profissionalizar a gestão e reduzir riscos operacionais.',
    'INICIAL': 'A empresa está em estágio inicial de maturidade. Já possui alguns processos estruturados, mas ainda há lacunas relevantes que limitam o crescimento sustentável e a competitividade.',
    'PLENA': 'A empresa demonstra maturidade operacional sólida, com processos bem estruturados na maioria das áreas. O foco agora deve ser refinar pontos específicos e buscar excelência nas áreas-chave.',
    'AVANCADA': 'A empresa apresenta maturidade avançada, posicionando-se como referência operacional. Recomenda-se manter os padrões e focar em inovação e diferenciação competitiva.',
    'AVANÇADA': 'A empresa apresenta maturidade avançada, posicionando-se como referência operacional. Recomenda-se manter os padrões e focar em inovação e diferenciação competitiva.',
  };
  partes.push(interpretacoes[maturidade] || interpretacoes['INICIAL']);

  // Pontos fortes (top 3)
  const fortes = [...escores].sort((a, b) => b.escore - a.escore).slice(0, 3).filter(e => e.escore >= 7);
  if (fortes.length > 0) {
    partes.push(
      `\nPONTOS FORTES: As áreas com melhor desempenho são ${fortes.map(f => `${f.area} (${f.escore}/10)`).join(', ')}. Essas competências devem ser preservadas e usadas como alavanca para o desenvolvimento das demais áreas.`
    );
  }

  // Áreas críticas (matriz)
  const criticas = matriz_risco.filter(m => m.classificacao === 'CRÍTICO' || m.classificacao === 'CRITICO');
  if (criticas.length > 0) {
    partes.push(
      `\nÁREAS CRÍTICAS: ${criticas.length} área(s) requer(em) atenção imediata — ${criticas.map(c => `${c.area} (escore ${c.escore}/10, risco ${c.risco_score})`).join('; ')}. Ações corretivas nessas frentes devem ser priorizadas nos próximos 30-60 dias para evitar comprometimento dos resultados.`
    );
  }

  // Recomendação estratégica
  if (escore_geral < 4) {
    partes.push(
      `\nRECOMENDAÇÃO ESTRATÉGICA: Foque primeiro em construir bases sólidas — controles financeiros, processos de RH e planejamento estratégico básico. Sem essas fundações, melhorias em outras áreas não se sustentarão.`
    );
  } else if (escore_geral < 6) {
    partes.push(
      `\nRECOMENDAÇÃO ESTRATÉGICA: Priorize a resolução das áreas críticas e invista em integração de processos. A empresa tem fundamentos básicos, mas precisa consolidar a operação antes de buscar crescimento acelerado.`
    );
  } else if (escore_geral < 8) {
    partes.push(
      `\nRECOMENDAÇÃO ESTRATÉGICA: Refine os pontos pendentes e busque eficiência operacional. A empresa já tem maturidade para investir em diferenciação competitiva, inovação e expansão controlada.`
    );
  } else {
    partes.push(
      `\nRECOMENDAÇÃO ESTRATÉGICA: Mantenha os padrões e foque em consolidar a posição competitiva através de inovação contínua, transformação digital avançada e excelência em todas as frentes.`
    );
  }

  return partes.join(' ');
}
