// ============================================================================
// TIPOS TYPESCRIPT - DIAGNÓSTICO 360°
// ============================================================================

// ============================================================================
// ENUMS
// ============================================================================

export enum Setor {
  COMERCIO = 'Comércio',
  SERVICOS = 'Serviços',
  INDUSTRIA = 'Indústria',
  PRODUTOR_RURAL = 'Produtor Rural'
}

export enum Porte {
  MICRO = 'Micro',
  PEQUENA = 'Pequena',
  MEDIA = 'Média',
  GRANDE = 'Grande'
}

export enum Area {
  PLANEJAMENTO = 'Planejamento e Estratégia',
  RH = 'Recursos Humanos',
  ESTOQUE = 'Estoque',
  FINANCEIRO = 'Financeiro',
  TECNOLOGIA = 'Tecnologia da Informação',
  RELACOES = 'Relações Institucionais',
  LOGISTICA = 'Logística',
  MARKETING = 'Marketing e Vendas',
  TENDENCIAS = 'Projeções e Tendências',
  GOVERNANCA = 'Gestão de Processos e Governança'
}

export enum NivelMaturidade {
  NULA = 'NULA',
  BASICA = 'BÁSICA',
  INICIAL = 'INICIAL',
  PLENA = 'PLENA',
  AVANCADA = 'AVANÇADA'
}

export enum ClassificacaoRisco {
  CRITICO = 'CRÍTICO',
  ALTO = 'ALTO',
  MEDIO = 'MÉDIO',
  BAIXO = 'BAIXO',
  OK = 'OK'
}

export enum TipoResposta {
  LIKERT = 'LIKERT',
  BINARIA = 'BINARIA',
  MULTIPLA = 'MULTIPLA'
}

export enum FasePDI {
  IMEDIATA = 1,      // 0-30 dias
  CURTO_PRAZO = 2,   // 30-90 dias
  LONGO_PRAZO = 3    // 90+ dias
}

export enum StatusPDI {
  PLANEJADO = 'PLANEJADO',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDO = 'CONCLUÍDO'
}

// ============================================================================
// TIPOS PRINCIPAIS
// ============================================================================

export interface Questao {
  id: number;
  setor: Setor;
  porte: Porte;
  numero: number;
  pergunta: string;
  tema: Area;
  tipo_resposta: TipoResposta;
  opcao_a?: string;
  opcao_b?: string;
  opcao_c?: string;
  opcao_d?: string;
  opcao_e?: string;
}

export interface Resposta {
  questao_id: number;
  resposta: string;
  pontos: number;
  tema: Area;
  resposta_texto?: string; // Texto livre quando resposta = 'F' (Outras)
}

export interface Escore {
  area: Area;
  pontos: number;
  maximo: number;
  escore: number;
  nivel: NivelMaturidade;
}

export interface MatrizRiscoItem {
  area: Area;
  escore: number;
  criticidade_peso: number;
  risco_score: number;
  classificacao: ClassificacaoRisco;
  prioridade: number;
}

export interface AcaoPDI {
  id: string;
  area: Area;
  escore_atual: number;
  escore_meta?: number;
  acao_descricao: string;
  acao_prazo: string;
  acao_responsavel?: string;
  fase: FasePDI;
  status: StatusPDI;
}

export interface BenchmarkItem {
  area: Area;
  seu_escore: number;
  media_setor: number;
  diferenca: number;
  posicao: 'ACIMA' | 'IGUAL' | 'ABAIXO';
}

export interface Diagnostico {
  id: string;
  tenant_id: string;
  empresa_nome: string;
  data_aplicacao: string;
  respondente_nome: string;
  respondente_email: string;
  setor: Setor;
  porte: Porte;

  escore_planejamento?: number;
  escore_rh?: number;
  escore_estoque?: number;
  escore_financeiro?: number;
  escore_tecnologia?: number;
  escore_relacoes?: number;
  escore_logistica?: number;
  escore_marketing?: number;
  escore_tendencias?: number;

  escore_geral: number;
  maturidade: NivelMaturidade;
  risco_geral: number;

  respostas_json: Resposta[];

  criado_por?: string;
  criado_em?: string;
  atualizado_em?: string;
}

export interface DiagnosticoCompleto extends Diagnostico {
  escores: Escore[];
  matriz_risco: MatrizRiscoItem[];
  pdi: AcaoPDI[];
  benchmark: BenchmarkItem[];
  narrativa: string;
  radar_data: Array<{ area: Area; escore: number }>;
}

// ============================================================================
// REQUEST/RESPONSE DTOs
// ============================================================================

export interface CreateDiagnosticoRequest {
  tenant_id: string;
  empresa_nome: string;
  setor: Setor;
  porte: Porte;
  respondente_nome: string;
  respondente_email: string;
  respostas: Resposta[];
}

export interface CreateDiagnosticoResponse {
  id: string;
  escore_geral: number;
  maturidade: NivelMaturidade;
  status: 'criado';
  message?: string;
}

export interface GetDiagnosticoResponse extends DiagnosticoCompleto {}

export interface ListDiagnosticosResponse {
  items: Array<{
    id: string;
    empresa_nome: string;
    data_aplicacao: string;
    escore_geral: number;
    maturidade: NivelMaturidade;
  }>;
  total: number;
  page: number;
  limit: number;
}

// ============================================================================
// FILTROS E PAGINAÇÃO
// ============================================================================

export interface FiltrosListagem {
  setor?: Setor;
  porte?: Porte;
  maturidade?: NivelMaturidade;
  data_inicio?: string;
  data_fim?: string;
  busca?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// CONFIGURAÇÕES E CONSTANTES
// ============================================================================

export const AREAS_DIAGNOSTICO = [
  Area.PLANEJAMENTO,
  Area.RH,
  Area.ESTOQUE,
  Area.FINANCEIRO,
  Area.TECNOLOGIA,
  Area.RELACOES,
  Area.LOGISTICA,
  Area.MARKETING,
  Area.TENDENCIAS,
  Area.GOVERNANCA
];

export const CRITICIDADE_POR_AREA: Record<Area, number> = {
  [Area.FINANCEIRO]: 3.0,
  [Area.GOVERNANCA]: 2.5,
  [Area.TECNOLOGIA]: 2.0,
  [Area.RH]: 2.0,
  [Area.PLANEJAMENTO]: 1.5,
  [Area.RELACOES]: 1.5,
  [Area.MARKETING]: 1.5,
  [Area.ESTOQUE]: 1.0,
  [Area.LOGISTICA]: 1.0,
  [Area.TENDENCIAS]: 1.0
};

export const PESOS_RESPOSTA = {
  'A': 10,
  'B': 8,
  'C': 6,
  'D': 4,
  'E': 2,
  'F': 0
};

export const FAIXAS_MATURIDADE = {
  [NivelMaturidade.AVANCADA]: { min: 8.1, max: 10 },
  [NivelMaturidade.PLENA]: { min: 6.1, max: 8.0 },
  [NivelMaturidade.INICIAL]: { min: 4.1, max: 6.0 },
  [NivelMaturidade.BASICA]: { min: 2.1, max: 4.0 },
  [NivelMaturidade.NULA]: { min: 0, max: 2.0 }
};

export const FAIXAS_RISCO = {
  [ClassificacaoRisco.CRITICO]: { min: 7.0, max: 10 },
  [ClassificacaoRisco.ALTO]: { min: 5.0, max: 6.9 },
  [ClassificacaoRisco.MEDIO]: { min: 3.0, max: 4.9 },
  [ClassificacaoRisco.BAIXO]: { min: 1.0, max: 2.9 },
  [ClassificacaoRisco.OK]: { min: 0, max: 0.9 }
};

// ============================================================================
// UTILITIES
// ============================================================================

export function classificarMaturidade(escore: number): NivelMaturidade {
  if (escore >= 8.1) return NivelMaturidade.AVANCADA;
  if (escore >= 6.1) return NivelMaturidade.PLENA;
  if (escore >= 4.1) return NivelMaturidade.INICIAL;
  if (escore >= 2.1) return NivelMaturidade.BASICA;
  return NivelMaturidade.NULA;
}

export function classificarRisco(risco: number): ClassificacaoRisco {
  if (risco >= 7.0) return ClassificacaoRisco.CRITICO;
  if (risco >= 5.0) return ClassificacaoRisco.ALTO;
  if (risco >= 3.0) return ClassificacaoRisco.MEDIO;
  if (risco >= 1.0) return ClassificacaoRisco.BAIXO;
  return ClassificacaoRisco.OK;
}

export function obterPeso(resposta: string): number {
  return PESOS_RESPOSTA[resposta as keyof typeof PESOS_RESPOSTA] || 0;
}

export function obterCriticidade(area: Area): number {
  return CRITICIDADE_POR_AREA[area] || 1.0;
}
