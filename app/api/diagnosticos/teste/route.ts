import { NextRequest, NextResponse } from 'next/server';
import {
  calcularEscorePorArea,
  calcularEscoreGeral,
  construirMatrizRisco,
  gerarPDI,
  gerarDadosRadar,
  compararComBenchmark,
  gerarNarrativa,
} from '@/lib/diagnosticos/calcular';
import { Resposta, Area, Escore, AREAS_DIAGNOSTICO, AcaoPDI, MatrizRiscoItem, BenchmarkItem, classificarMaturidade } from '@/types/diagnostico';

/**
 * Endpoint de teste que demonstra o fluxo completo SEM exigir Supabase
 * POST /api/diagnosticos/teste
 *
 * Recebe respostas e retorna diagnóstico completo com:
 * - Escores por área
 * - Matriz de risco
 * - PDI (plano de desenvolvimento)
 * - Dados para gráficos
 * - Narrativa interpretativa
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      tenant_id,
      empresa_nome,
      setor,
      porte,
      respondente_nome,
      respondente_email,
      respostas,
    } = body;

    // Validação básica
    if (!respostas || !Array.isArray(respostas) || respostas.length === 0) {
      return NextResponse.json(
        { erro: 'Respostas inválidas' },
        { status: 400 }
      );
    }

    // Calcula escores por área
    const escoresPorArea: Escore[] = [];

    for (const area of AREAS_DIAGNOSTICO) {
      try {
        const scoreObj = calcularEscorePorArea(respostas, area);
        escoresPorArea.push(scoreObj);
      } catch (e) {
        console.error(`Erro ao calcular escore para área ${area}:`, e);
        throw e;
      }
    }

    // Calcula escore geral
    const escoreGeral = calcularEscoreGeral(escoresPorArea);

    // Classifica maturidade
    const maturidade = classificarMaturidade(escoreGeral);

    // Constrói matriz de risco
    let matrizRisco: MatrizRiscoItem[] = [];
    try {
      matrizRisco = construirMatrizRisco(escoresPorArea);
    } catch (e) {
      console.error('Erro ao construir matriz de risco:', e);
      throw e;
    }

    // Gera PDI
    let pdi: AcaoPDI[] = [];
    try {
      pdi = gerarPDI(escoresPorArea);
    } catch (e) {
      console.error('Erro ao gerar PDI:', e);
      // Continua mesmo com erro no PDI
      pdi = [];
    }

    // Dados para gráficos
    let radarData = [];
    try {
      radarData = gerarDadosRadar(escoresPorArea);
    } catch (e) {
      console.error('Erro ao gerar dados radar:', e);
      radarData = [];
    }

    // Comparação com benchmark
    let benchmark: BenchmarkItem[] = [];
    try {
      benchmark = compararComBenchmark(escoresPorArea, setor, porte);
    } catch (e) {
      console.error('Erro ao comparar com benchmark:', e);
      benchmark = [];
    }

    // Gera narrativa
    let narrativa = '';
    try {
      narrativa = gerarNarrativa(
        escoresPorArea,
        escoreGeral,
        maturidade,
        setor,
        porte,
        matrizRisco
      );
    } catch (e) {
      console.error('Erro ao gerar narrativa:', e);
      narrativa = 'Diagnóstico realizado, narrativa não disponível.';
    }

    // Retorna resposta completa
    return NextResponse.json(
      {
        id: `test-${Date.now()}`,
        tenant_id,
        empresa_nome,
        setor,
        porte,
        respondente_nome,
        respondente_email,
        escore_geral: parseFloat(escoreGeral.toFixed(1)),
        maturidade,
        status: 'criado',

        // Dados detalhados
        escores_por_area: escoresPorArea,
        matriz_risco: matrizRisco,
        pdi: pdi,

        dados_graficos: {
          radar: radarData,
          benchmark: benchmark,
        },

        narrativa,

        criado_em: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erro no endpoint teste:', error);
    return NextResponse.json(
      { erro: 'Erro interno do servidor', detalhes: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/diagnosticos/teste
 * Retorna um exemplo de payload para POST
 */
export async function GET() {
  return NextResponse.json({
    info: 'Endpoint de teste - usa este payload no POST',
    metodo: 'POST',
    exemplo_payload: {
      tenant_id: '550e8400-e29b-41d4-a716-446655440000',
      empresa_nome: 'Consultoria XYZ',
      setor: 'Comércio',
      porte: 'Pequena',
      respondente_nome: 'João Silva',
      respondente_email: 'joao@xyz.com',
      respostas: [
        {
          questao_id: 1,
          resposta: 'A',
          pontos: 10,
          tema: 'Planejamento e Estratégia',
        },
        {
          questao_id: 2,
          resposta: 'B',
          pontos: 8,
          tema: 'Planejamento e Estratégia',
        },
        {
          questao_id: 3,
          resposta: 'C',
          pontos: 6,
          tema: 'RH e Gestão de Pessoas',
        },
        {
          questao_id: 4,
          resposta: 'D',
          pontos: 4,
          tema: 'Logística e Cadeia de Suprimentos',
        },
        {
          questao_id: 5,
          resposta: 'E',
          pontos: 2,
          tema: 'Gestão Financeira',
        },
        {
          questao_id: 6,
          resposta: 'A',
          pontos: 10,
          tema: 'Tecnologia da Informação',
        },
        {
          questao_id: 7,
          resposta: 'B',
          pontos: 8,
          tema: 'Relações com Clientes e Fornecedores',
        },
        {
          questao_id: 8,
          resposta: 'A',
          pontos: 10,
          tema: 'Estoque e Inventário',
        },
        {
          questao_id: 9,
          resposta: 'C',
          pontos: 6,
          tema: 'Marketing e Comunicação',
        },
        {
          questao_id: 10,
          resposta: 'A',
          pontos: 10,
          tema: 'Tendências e Inovação',
        },
      ],
    },
  });
}
