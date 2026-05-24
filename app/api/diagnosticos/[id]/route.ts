// ============================================================================
// API - GET /api/diagnosticos/[id]
// ============================================================================
// Recupera diagnóstico completo com todos os dados

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DiagnosticoCompleto } from '@/types/diagnostico';

export async function GET(
  request: NextRequest,
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

    // 5. Recuperar benchmark do banco
    const { data: benchmarkData } = await supabase
      .from('diagnosticos_360_benchmark')
      .select('area, escore_media')
      .eq('setor', diagnostico.setor)
      .eq('porte', diagnostico.porte);

    const benchmark = (benchmarkData || []).map(b => ({
      area: b.area,
      media_setor: b.escore_media,
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
    const narrativa = construirNarrativa({
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
