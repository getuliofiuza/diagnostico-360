// ============================================================================
// API - GET /api/diagnosticos (listar)
// ============================================================================
// Lista diagnósticos do tenant com paginação e filtros

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Recuperar query params
    const searchParams = request.nextUrl.searchParams;
    const tenant_id = searchParams.get('tenant_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const busca = searchParams.get('busca');
    const setor = searchParams.get('setor');
    const maturidade = searchParams.get('maturidade');

    // Construir query
    let query = supabase
      .from('diagnosticos_360')
      .select('id, empresa_nome, setor, porte, respondente_nome, data_aplicacao, escore_geral, maturidade, criado_em', {
        count: 'exact'
      })
      .order('criado_em', { ascending: false });

    if (tenant_id) {
      query = query.eq('tenant_id', tenant_id);
    }

    // Aplicar filtros
    if (busca) {
      query = query.ilike('empresa_nome', `%${busca}%`);
    }

    if (setor) {
      query = query.eq('setor', setor);
    }

    if (maturidade) {
      query = query.eq('maturidade', maturidade);
    }

    // Paginação
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Executar query
    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        data: data || [],
        total: count || 0,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit)
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro ao listar diagnósticos:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao listar diagnósticos',
        error: error instanceof Error ? error.message : 'Desconhecido'
      },
      { status: 500 }
    );
  }
}
