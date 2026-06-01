// ============================================================================
// NEUROCORP 360° — API ANÁLISE SWOT
// ============================================================================
// GET  /api/swot/[diagnosticoId]  -> carrega (ou inicializa) a SWOT do diagnóstico
// PUT  /api/swot/[diagnosticoId]  -> salva análise + itens (upsert)
//
// A SWOT é uma extensão do diagnóstico: herda a matriz de risco (gaps já
// ordenados do mais crítico ao menos crítico) e persiste o aprofundamento.
// ============================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { derivarItensSwot, mesclarItens, SwotItem } from '@/lib/swot/calcular';

// ----------------------------------------------------------------------------
// Helper: cliente service-role + controle de acesso (dono do tenant OU admin)
// ----------------------------------------------------------------------------
async function autorizar(diagnosticoId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: diagnostico, error } = await supabase
    .from('diagnosticos_360')
    .select('*')
    .eq('id', diagnosticoId)
    .single();

  if (error || !diagnostico) {
    return { erro: NextResponse.json({ success: false, message: 'Diagnóstico não encontrado' }, { status: 404 }) };
  }

  const supabaseAuth = createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) {
    return { erro: NextResponse.json({ success: false, message: 'Não autenticado' }, { status: 401 }) };
  }

  const { data: tenantDiag } = await supabase
    .from('tenants')
    .select('owner_id')
    .eq('id', diagnostico.tenant_id)
    .single();

  const { data: userTenant } = await supabase
    .from('tenants')
    .select('is_admin')
    .eq('owner_id', user.id)
    .single();

  const ehAdmin = !!userTenant?.is_admin;
  const ehDono = tenantDiag?.owner_id === user.id;

  if (!ehDono && !ehAdmin) {
    return { erro: NextResponse.json({ success: false, message: 'Acesso negado' }, { status: 403 }) };
  }

  return { supabase, diagnostico };
}

// ----------------------------------------------------------------------------
// GET — carrega ou inicializa a SWOT
// ----------------------------------------------------------------------------
export async function GET(
  _request: Request,
  { params }: { params: { diagnosticoId: string } }
) {
  try {
    const auth = await autorizar(params.diagnosticoId);
    if (auth.erro) return auth.erro;
    const { supabase, diagnostico } = auth;

    // Matriz de risco do diagnóstico = gaps ordenados (mais crítico primeiro)
    const { data: matriz } = await supabase
      .from('diagnosticos_360_matriz_risco')
      .select('area, escore, risco_score, classificacao, prioridade')
      .eq('diagnostico_id', params.diagnosticoId)
      .order('prioridade', { ascending: true });

    const derivados = derivarItensSwot(matriz || []);

    // SWOT já existente?
    const { data: analise } = await supabase
      .from('swot_analises')
      .select('*')
      .eq('diagnostico_id', params.diagnosticoId)
      .single();

    let itensSalvos: Partial<SwotItem>[] = [];
    if (analise) {
      const { data: itens } = await supabase
        .from('swot_itens')
        .select('*')
        .eq('swot_id', analise.id);
      itensSalvos = itens || [];
    }

    const itens = mesclarItens(derivados, itensSalvos);

    return NextResponse.json({
      success: true,
      diagnostico: {
        id: diagnostico.id,
        empresa_nome: diagnostico.empresa_nome,
        setor: diagnostico.setor,
        porte: diagnostico.porte,
        respondente_nome: diagnostico.respondente_nome,
        escore_geral: diagnostico.escore_geral,
        maturidade: diagnostico.maturidade,
        criado_em: diagnostico.criado_em,
      },
      analise: analise || null,
      itens,
    }, { status: 200 });
  } catch (error) {
    console.error('Erro GET SWOT:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao carregar SWOT', error: error instanceof Error ? error.message : 'Desconhecido' },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------------------------------
// PUT — salva análise + itens (upsert)
// ----------------------------------------------------------------------------
export async function PUT(
  request: Request,
  { params }: { params: { diagnosticoId: string } }
) {
  try {
    const auth = await autorizar(params.diagnosticoId);
    if (auth.erro) return auth.erro;
    const { supabase, diagnostico } = auth;

    const body = await request.json();
    const {
      responsavel_nome = null,
      responsavel_papel = null,
      sintese_estrategica = null,
      status = 'EM_ANDAMENTO',
      itens = [],
    } = body as {
      responsavel_nome?: string | null;
      responsavel_papel?: string | null;
      sintese_estrategica?: string | null;
      status?: string;
      itens: SwotItem[];
    };

    // 1. Upsert da análise (1 por diagnóstico)
    const { data: analise, error: errAnalise } = await supabase
      .from('swot_analises')
      .upsert(
        {
          diagnostico_id: params.diagnosticoId,
          tenant_id: diagnostico.tenant_id,
          responsavel_nome,
          responsavel_papel,
          sintese_estrategica,
          status,
        },
        { onConflict: 'diagnostico_id' }
      )
      .select()
      .single();

    if (errAnalise || !analise) {
      throw new Error(errAnalise?.message || 'Falha ao salvar análise');
    }

    // 2. Upsert dos itens (1 por área)
    if (Array.isArray(itens) && itens.length > 0) {
      const linhas = itens.map((i) => ({
        swot_id: analise.id,
        area: i.area,
        escore: i.escore,
        risco_score: i.risco_score,
        classificacao: i.classificacao,
        prioridade: i.prioridade,
        forcas: i.forcas || null,
        fraquezas: i.fraquezas || null,
        oportunidades: i.oportunidades || null,
        ameacas: i.ameacas || null,
        causa_raiz: i.causa_raiz || null,
        estrategia: i.estrategia || null,
        acao_responsavel: i.acao_responsavel || null,
        acao_prazo: i.acao_prazo || null,
        concluido: !!i.concluido,
      }));

      const { error: errItens } = await supabase
        .from('swot_itens')
        .upsert(linhas, { onConflict: 'swot_id,area' });

      if (errItens) throw new Error(errItens.message);
    }

    return NextResponse.json({ success: true, analise }, { status: 200 });
  } catch (error) {
    console.error('Erro PUT SWOT:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao salvar SWOT', error: error instanceof Error ? error.message : 'Desconhecido' },
      { status: 500 }
    );
  }
}
