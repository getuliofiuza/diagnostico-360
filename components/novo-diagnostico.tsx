// ============================================================================
// COMPONENTE: NOVO DIAGNÓSTICO
// ============================================================================
// Formulário completo para criar diagnóstico (3 steps)

'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Resposta, Setor, Porte, Area } from '@/types/diagnostico';
import questoes from '@/data/questoes.json';

// ============================================================================
// CONSTANTES
// ============================================================================

const ORDEM_AREAS = [
  'Planejamento e Estratégia',
  'Recursos Humanos',
  'Estoque',
  'Financeiro',
  'Tecnologia da Informação',
  'Relações Institucionais',
  'Logística',
  'Marketing e Vendas',
  'Projeções e Tendências',
  'Gestão de Processos e Governança'
] as const;

const ICONES_AREA: Record<string, string> = {
  'Planejamento e Estratégia': '🎯',
  'Recursos Humanos': '👥',
  'Estoque': '📦',
  'Financeiro': '💰',
  'Tecnologia da Informação': '💻',
  'Relações Institucionais': '🤝',
  'Logística': '🚛',
  'Marketing e Vendas': '📈',
  'Projeções e Tendências': '🔮',
  'Gestão de Processos e Governança': '⚖️'
};

// Lista CNAE simplificada (do Anexo XXVII)
const ATIVIDADES_CNAE = [
  'Construção de edifícios',
  'Obras de infraestrutura',
  'Serviços especializados para construção',
  'Transporte terrestre',
  'Transporte aquaviário',
  'Transporte aéreo',
  'Armazenamento e atividades auxiliares dos transportes',
  'Correio e outras atividades de entrega',
  'Alojamento',
  'Alimentação',
  'Edição e impressão',
  'Atividades cinematográficas, vídeo e TV',
  'Atividades de rádio e televisão',
  'Telecomunicações',
  'Serviços de tecnologia da informação',
  'Serviços financeiros',
  'Seguros, previdência e planos de saúde',
  'Atividades imobiliárias',
  'Atividades jurídicas, contábeis e auditoria',
  'Consultoria em gestão empresarial',
  'Arquitetura, engenharia e análises técnicas',
  'Pesquisa e desenvolvimento científico',
  'Publicidade e pesquisa de mercado',
  'Outras atividades profissionais, científicas e técnicas',
  'Atividades veterinárias',
  'Aluguéis e gestão de ativos intangíveis',
  'Agenciamento e locação de mão-de-obra',
  'Agências de viagens e turismo',
  'Vigilância, segurança e investigação',
  'Serviços para edifícios e paisagismo',
  'Serviços administrativos e apoio a empresas',
  'Educação',
  'Atenção à saúde humana',
  'Serviços de assistência social',
  'Atividades artísticas e de espetáculos',
  'Patrimônio cultural e ambiental',
  'Atividades esportivas e de recreação',
  'Organizações associativas',
  'Reparação e manutenção de equipamentos',
  'Outras atividades de serviços pessoais',
  'Serviços domésticos',
  'Outros'
];

// ============================================================================
// VALIDAÇÃO
// ============================================================================

const ConfigSchema = z.object({
  // Identificação
  empresa_nome: z.string().min(3, 'Nome obrigatório'),
  setor: z.enum(['Comércio', 'Serviços']),
  porte: z.enum(['Micro', 'Pequena', 'Média', 'Grande']),

  // Respondente
  respondente_nome: z.string().min(2, 'Nome obrigatório'),
  respondente_email: z.string().email('Email inválido'),
  respondente_telefone: z.string().optional(),

  // Localização (do Anexo XXVII)
  endereco: z.string().optional(),
  municipio: z.string().optional(),
  microrregiao: z.string().optional(),
  mesorregiao: z.string().optional(),

  // Dados do negócio
  faturamento_anual: z.coerce.number().min(0).optional(),
  num_funcionarios: z.coerce.number().int().min(0).optional(),
  tempo_mercado_anos: z.coerce.number().int().min(0).optional(),
  atividade_cnae: z.string().optional(),
  frequencia_clientes_dia: z.coerce.number().int().min(0).optional(),
  clientes_efetivos_dia: z.coerce.number().int().min(0).optional(),
  area_total_m2: z.coerce.number().min(0).optional(),
  area_construida_m2: z.coerce.number().min(0).optional(),
  possui_filiais: z.boolean().optional(),
  num_filiais: z.coerce.number().int().min(0).optional(),

  // Gestor principal
  tempo_gestor_anos: z.coerce.number().min(0).optional(),
  idade_gestor_faixa: z.string().optional(),
  origem_gestor: z.string().optional(),
  escolaridade_gestor: z.string().optional(),

  // Qualitativos (sugestões do usuário)
  narrativa_gestor: z.string().optional(),
  diferencial_competitivo: z.string().optional(),
  dores_principais: z.string().optional(),

  // ========================================================================
  // DADOS APROFUNDADOS POR ÁREA (Anexo XXVII + B&G)
  // ========================================================================

  // Planejamento Estratégico
  criterio_decisao_estrategica: z.string().optional(),
  deficiencias_gestao: z.array(z.string()).optional(),
  deficiencias_gestao_outros: z.string().optional(),

  // Recursos Humanos
  num_colab_operacional: z.coerce.number().int().min(0).optional(),
  num_colab_comercial: z.coerce.number().int().min(0).optional(),
  num_colab_administrativo: z.coerce.number().int().min(0).optional(),
  media_salarial_operacional: z.coerce.number().min(0).optional(),
  media_salarial_comercial: z.coerce.number().min(0).optional(),
  media_salarial_administrativo: z.coerce.number().min(0).optional(),
  admissoes_trimestre: z.coerce.number().int().min(0).optional(),
  demissoes_trimestre: z.coerce.number().int().min(0).optional(),
  vagas_abertas: z.coerce.number().int().min(0).optional(),
  folha_pagamento_mensal: z.coerce.number().min(0).optional(),
  gargalos_rh: z.array(z.string()).optional(),

  // Estoque
  estoque_medio_mensal: z.coerce.number().min(0).optional(),
  num_itens_portfolio: z.coerce.number().int().min(0).optional(),
  unidade_medida_estoque: z.string().optional(),
  deficiencias_estoque: z.array(z.string()).optional(),

  // Financeiro
  faturamento_mensal: z.coerce.number().min(0).optional(),
  custo_fixo_mensal: z.coerce.number().min(0).optional(),
  custo_variavel_mensal: z.coerce.number().min(0).optional(),
  possui_endividamento: z.boolean().optional(),
  endividamento_banco_pct: z.coerce.number().min(0).max(100).optional(),
  endividamento_fornecedor_pct: z.coerce.number().min(0).max(100).optional(),
  endividamento_factoring_pct: z.coerce.number().min(0).max(100).optional(),
  endividamento_fisco_pct: z.coerce.number().min(0).max(100).optional(),
  endividamento_sefaz_pct: z.coerce.number().min(0).max(100).optional(),
  endividamento_outros_pct: z.coerce.number().min(0).max(100).optional(),
  ticket_medio: z.coerce.number().min(0).optional(),
  margem_contribuicao_pct: z.coerce.number().min(0).max(100).optional(),
  ponto_equilibrio: z.coerce.number().min(0).optional(),
  melhores_meses_vendas: z.array(z.string()).optional(),
  piores_meses_vendas: z.array(z.string()).optional(),
  deficiencias_financeiro: z.array(z.string()).optional(),

  // Marketing/Vendas
  ociosidade_vendas: z.string().optional(),
  criterio_preco_vendas: z.string().optional(),
  busca_clientes: z.array(z.string()).optional(),
  cac_novos_clientes: z.coerce.number().min(0).optional(),
  posicao_preco_concorrencia: z.string().optional(),
  deficiencias_marketing: z.array(z.string()).optional()
});

type ConfigFormData = z.infer<typeof ConfigSchema>;

// ============================================================================
// OPÇÕES DE MÚLTIPLA ESCOLHA (do Anexo XXVII)
// ============================================================================

const DEFICIENCIAS_GESTAO = [
  'Influência familiar',
  'Baixo conhecimento gerencial',
  'Má qualidade de mão de obra',
  'Descapitalização',
  'Concorrência desleal',
  'Infraestrutura pública',
  'Infraestrutura da empresa',
  'Equipamentos obsoletos',
  'Alta carga tributária',
  'Distância dos consumidores',
  'Falta de informações para decisão',
  'Comodismo empresarial'
];

const GARGALOS_RH = [
  'Falta de mão de obra (quantidade)',
  'Baixa qualificação',
  'Despreparo técnico',
  'Falta de comprometimento',
  'Altas exigências salariais',
  'Falta de motivação',
  'Despreparo da empresa para contratar',
  'Influência familiar na estrutura',
  'A empresa não sofre estes problemas'
];

const UNIDADES_MEDIDA = ['KG', 'TON', '@', 'Litro', 'Unidade', 'Pacote', 'Saca', 'Caixa', 'Tonel', 'Barril', 'M²', 'M³', 'R$', 'Serviços', 'Outra'];

const DEFICIENCIAS_ESTOQUE = [
  'Mal gerenciamento produtivo',
  'Baixo conhecimento dos processos',
  'Má qualidade de mão de obra',
  'Maquinários obsoletos',
  'Desconhecimento de mercado',
  'Baixa qualidade da MP',
  'Baixa qualidade do PF',
  'Incapacidade de estoque'
];

const MESES_ANO = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

const DEFICIENCIAS_FINANCEIRO = [
  'Mal gerenciamento financeiro',
  'Envolvimento familiar na gestão',
  'Dificuldade para formar preço',
  'Desconhecimento técnico',
  'Falta de capital de giro',
  'Alto endividamento',
  'Alto peso tributário',
  'Concorrência desleal de preços',
  'Inadimplência'
];

const BUSCA_CLIENTES = [
  'Possui base de clientes formada',
  'Contatos telefônicos',
  'Feiras e eventos',
  'Missões comerciais',
  'Rodadas de negócios',
  'Marketing digital / redes sociais',
  'Indicações / boca a boca',
  'Outras ações'
];

const DEFICIENCIAS_MARKETING = [
  'Mal gerenciamento comercial',
  'Envolvimento familiar na gestão',
  'Dificuldade para identificar clientes',
  'Mercado saturado',
  'Falta de competitividade preço',
  'Falta de competitividade logística',
  'Falta de competitividade qualidade',
  'Falta de competitividade prazo'
];

// ============================================================================
// COMPONENTE: GRUPO DE CHECKBOXES
// ============================================================================

interface CheckboxGroupProps {
  options: string[];
  value: string[] | undefined;
  onChange: (newValue: string[]) => void;
  cols?: number;
}

function CheckboxGroup({ options, value, onChange, cols = 2 }: CheckboxGroupProps) {
  const selected = value || [];
  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(s => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };
  return (
    <div className={`grid grid-cols-1 md:grid-cols-${cols} gap-2`}>
      {options.map(opt => (
        <label key={opt} className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer text-sm transition ${
          selected.includes(opt) ? 'bg-blue-50 border-blue-300' : 'border-gray-200 hover:bg-gray-50'
        }`}>
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={() => toggle(opt)}
            className="w-4 h-4 text-blue-600 mt-0.5"
          />
          <span className="text-gray-700">{opt}</span>
        </label>
      ))}
    </div>
  );
}

// ============================================================================
// COMPONENTE
// ============================================================================

interface NovoDiagnosticoProps {
  tenant_id: string;
  onSuccess?: (diagnostico_id: string) => void;
}

export function NovoDiagnostico({ tenant_id, onSuccess }: NovoDiagnosticoProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [config, setConfig] = useState<ConfigFormData | null>(null);
  const [respostas, setRespostas] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [areaFocada, setAreaFocada] = useState<string | null>(null);
  const [respostasOutras, setRespostasOutras] = useState<Record<number, string>>({});

  const { control, handleSubmit, formState: { errors } } = useForm<ConfigFormData>({
    resolver: zodResolver(ConfigSchema),
    defaultValues: {
      setor: 'Comércio',
      porte: 'Pequena'
    }
  });

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handleConfigSubmit = async (data: ConfigFormData) => {
    setConfig(data);
    setStep(2);
  };

  const handleRespostaChange = (questao_id: number, resposta: string) => {
    setRespostas(prev => ({
      ...prev,
      [questao_id]: resposta
    }));
  };

  const handleRespostaOutraChange = (questao_id: number, texto: string) => {
    setRespostasOutras(prev => ({
      ...prev,
      [questao_id]: texto
    }));
  };

  const handleProximoPasso = () => {
    // Validar se respondeu todas as questões
    const questoesAtivas = filtrarQuestoes(config!);
    const respondidas = questoesAtivas.every(q => respostas[q.id]);

    if (!respondidas) {
      setError('Por favor, responda todas as questões');
      return;
    }

    setStep(3);
  };

  const handleSubmitFinal = async () => {
    if (!config) return;

    setLoading(true);
    setError(null);

    try {
      // Mapear respostas para formato esperado
      const questoesAtivas = filtrarQuestoes(config);
      const respostasFormatadas = questoesAtivas
        .map(q => ({
          questao_id: q.id,
          resposta: respostas[q.id],
          pontos: mapearPontos(respostas[q.id]),
          tema: q.tema as Area,
          resposta_texto: respostas[q.id] === 'F' ? (respostasOutras[q.id] || '') : undefined
        }))
        .filter(r => r.resposta);

      // Enviar para API — envia tudo do config + respostas
      const response = await fetch('/api/diagnosticos/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id,
          ...config,
          respostas: respostasFormatadas
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao criar diagnóstico');
      }

      const result = await response.json();

      // Callback de sucesso
      if (onSuccess) {
        onSuccess(result.id);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // HELPERS
  // ========================================================================

  function filtrarQuestoes(cfg: ConfigFormData) {
    return questoes.questoes.filter(q =>
      q.setor === cfg.setor || q.setor === 'Ambos'
    );
  }

  function mapearPontos(resposta: string): number {
    const pesos: Record<string, number> = {
      'A': 10, 'B': 8, 'C': 6, 'D': 4, 'E': 2, 'F': 0
    };
    return pesos[resposta] || 0;
  }

  function formatarProgresso(): string {
    if (step === 1) return '0%';
    if (step === 2) {
      const total = filtrarQuestoes(config!).length;
      const respondidas = Object.keys(respostas).length;
      return `${Math.round((respondidas / total) * 100)}%`;
    }
    return '100%';
  }

  // ========================================================================
  // RENDERS
  // ========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Diagnóstico Empresarial 360°
          </h1>
          <p className="text-gray-600">Analise a maturidade da sua empresa em 9 áreas</p>
        </div>

        {/* PROGRESS BAR */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between mb-4">
            <span className={`text-sm font-semibold ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              1. Configuração
            </span>
            <span className={`text-sm font-semibold ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              2. Questões ({formatarProgresso()})
            </span>
            <span className={`text-sm font-semibold ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              3. Revisão
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* ERRO */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* STEP 1: CONFIGURAÇÃO */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Informações da Empresa</h2>

            <form onSubmit={handleSubmit(handleConfigSubmit)} className="space-y-6">
              {/* Nome da Empresa */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nome da Empresa *
                </label>
                <Controller
                  name="empresa_nome"
                  control={control}
                  render={({ field }) => (
                    <>
                      <input
                        {...field}
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: XYZ Consultoria Ltda"
                      />
                      {errors.empresa_nome && (
                        <p className="text-red-500 text-sm mt-1">{errors.empresa_nome.message}</p>
                      )}
                    </>
                  )}
                />
              </div>

              {/* Setor e Porte (lado a lado) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Setor *
                  </label>
                  <Controller
                    name="setor"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Comércio">Comércio</option>
                        <option value="Serviços">Serviços</option>
                      </select>
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Porte *
                  </label>
                  <Controller
                    name="porte"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Micro">Micro (até 9 func)</option>
                        <option value="Pequena">Pequena (10-49 func)</option>
                        <option value="Média">Média (50-249 func)</option>
                        <option value="Grande">Grande (250+ func)</option>
                      </select>
                    )}
                  />
                </div>
              </div>

              {/* Respondente */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Seu Nome *
                </label>
                <Controller
                  name="respondente_nome"
                  control={control}
                  render={({ field }) => (
                    <>
                      <input
                        {...field}
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: João Silva"
                      />
                      {errors.respondente_nome && (
                        <p className="text-red-500 text-sm mt-1">{errors.respondente_nome.message}</p>
                      )}
                    </>
                  )}
                />
              </div>

              {/* Email + Telefone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Seu Email *
                  </label>
                  <Controller
                    name="respondente_email"
                    control={control}
                    render={({ field }) => (
                      <>
                        <input
                          {...field}
                          type="email"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="seu@email.com.br"
                        />
                        {errors.respondente_email && (
                          <p className="text-red-500 text-sm mt-1">{errors.respondente_email.message}</p>
                        )}
                      </>
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Telefone
                  </label>
                  <Controller
                    name="respondente_telefone"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="tel"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="(11) 99999-9999"
                      />
                    )}
                  />
                </div>
              </div>

              {/* Endereço */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Endereço
                </label>
                <Controller
                  name="endereco"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Rua, número, cidade - UF"
                    />
                  )}
                />
              </div>

              {/* Localização */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">📍 Localização</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Município</label>
                    <Controller name="municipio" control={control} render={({ field }) => (
                      <input {...field} type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Porto Velho" />
                    )} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Microrregião</label>
                    <Controller name="microrregiao" control={control} render={({ field }) => (
                      <input {...field} type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Ex: Porto Velho" />
                    )} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Mesorregião</label>
                    <Controller name="mesorregiao" control={control} render={({ field }) => (
                      <input {...field} type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Ex: Madeira-Guaporé" />
                    )} />
                  </div>
                </div>
              </div>

              {/* Dados do Negócio */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">🏢 Dados do Negócio</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Atividade Econômica (CNAE)</label>
                    <Controller name="atividade_cnae" control={control} render={({ field }) => (
                      <select {...field} value={field.value || ''} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">Selecione...</option>
                        {ATIVIDADES_CNAE.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    )} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Faturamento Anual (R$)</label>
                      <Controller name="faturamento_anual" control={control} render={({ field: { value, onChange, ...rest } }) => (
                        <input {...rest} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} type="number" min="0" step="1000" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="500000" />
                      )} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Nº Funcionários</label>
                      <Controller name="num_funcionarios" control={control} render={({ field: { value, onChange, ...rest } }) => (
                        <input {...rest} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} type="number" min="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="15" />
                      )} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Tempo Mercado (anos)</label>
                      <Controller name="tempo_mercado_anos" control={control} render={({ field: { value, onChange, ...rest } }) => (
                        <input {...rest} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} type="number" min="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="5" />
                      )} />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Clientes/dia</label>
                      <Controller name="frequencia_clientes_dia" control={control} render={({ field: { value, onChange, ...rest } }) => (
                        <input {...rest} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} type="number" min="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="50" />
                      )} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Clientes efetivos/dia</label>
                      <Controller name="clientes_efetivos_dia" control={control} render={({ field: { value, onChange, ...rest } }) => (
                        <input {...rest} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} type="number" min="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="20" />
                      )} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Área Total (m²)</label>
                      <Controller name="area_total_m2" control={control} render={({ field: { value, onChange, ...rest } }) => (
                        <input {...rest} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} type="number" min="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="500" />
                      )} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Área Construída (m²)</label>
                      <Controller name="area_construida_m2" control={control} render={({ field: { value, onChange, ...rest } }) => (
                        <input {...rest} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} type="number" min="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="300" />
                      )} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Gestor Principal */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">👔 Sobre o Gestor Principal</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tempo na função (anos)</label>
                    <Controller name="tempo_gestor_anos" control={control} render={({ field: { value, onChange, ...rest } }) => (
                      <input {...rest} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} type="number" min="0" step="0.5" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="3" />
                    )} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Faixa Etária</label>
                    <Controller name="idade_gestor_faixa" control={control} render={({ field }) => (
                      <select {...field} value={field.value || ''} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">Selecione...</option>
                        <option value="18-25">Entre 18 e 25 anos</option>
                        <option value="26-35">Entre 26 e 35 anos</option>
                        <option value="36-45">Entre 36 e 45 anos</option>
                        <option value="46-55">Entre 46 e 55 anos</option>
                        <option value="56-65">Entre 56 e 65 anos</option>
                        <option value="65+">Acima de 65 anos</option>
                      </select>
                    )} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Origem</label>
                    <Controller name="origem_gestor" control={control} render={({ field }) => (
                      <select {...field} value={field.value || ''} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">Selecione...</option>
                        <option value="Rondônia">Rondônia</option>
                        <option value="Outros Região Norte">Outros Região Norte</option>
                        <option value="Região Sul">Região Sul</option>
                        <option value="Região Sudeste">Região Sudeste</option>
                        <option value="Região Nordeste">Região Nordeste</option>
                        <option value="Região Centro-Oeste">Região Centro-Oeste</option>
                        <option value="Exterior">Exterior</option>
                      </select>
                    )} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Escolaridade</label>
                    <Controller name="escolaridade_gestor" control={control} render={({ field }) => (
                      <select {...field} value={field.value || ''} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">Selecione...</option>
                        <option value="Analfabeto">Analfabeto</option>
                        <option value="EFI">Ensino Fundamental Incompleto</option>
                        <option value="EFC">Ensino Fundamental Completo</option>
                        <option value="EMI">Ensino Médio Incompleto</option>
                        <option value="EMC">Ensino Médio Completo</option>
                        <option value="ETP">Ensino Técnico Profissionalizante</option>
                        <option value="ESI">Ensino Superior Incompleto</option>
                        <option value="ESC">Ensino Superior Completo</option>
                        <option value="Pós-graduado">Pós-graduado</option>
                      </select>
                    )} />
                  </div>
                </div>
              </div>

              {/* Narrativa do Gestor */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">📖 Jornada e Contexto do Gestor</h3>
                <p className="text-sm text-gray-500 mb-4">Essas respostas qualitativas enriquecem a análise interpretativa do diagnóstico.</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Breve narrativa da jornada do gestor</label>
                    <Controller name="narrativa_gestor" control={control} render={({ field }) => (
                      <textarea {...field} value={field.value || ''} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Conte rapidamente a história da empresa: como começou, marcos importantes, momento atual..." />
                    )} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Diferencial competitivo da empresa</label>
                    <Controller name="diferencial_competitivo" control={control} render={({ field }) => (
                      <textarea {...field} value={field.value || ''} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="O que faz sua empresa ser escolhida em vez da concorrência?" />
                    )} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Dores que mais incomodam o gestor hoje</label>
                    <Controller name="dores_principais" control={control} render={({ field }) => (
                      <textarea {...field} value={field.value || ''} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Quais são os principais desafios e dores que tiram seu sono?" />
                    )} />
                  </div>
                </div>
              </div>

              {/* ================================================================ */}
              {/* DADOS APROFUNDADOS POR ÁREA (Anexo XXVII)                        */}
              {/* ================================================================ */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">📊 Dados Aprofundados por Área</h3>
                <p className="text-sm text-gray-500 mb-4">Dados quantitativos opcionais para enriquecer a análise. Quanto mais completo, mais preciso será o diagnóstico.</p>

                {/* PLANEJAMENTO ESTRATÉGICO */}
                <details className="mb-3 border border-gray-200 rounded-lg overflow-hidden" open>
                  <summary className="cursor-pointer px-4 py-3 bg-gray-50 font-semibold text-gray-800 hover:bg-gray-100">
                    🎯 Planejamento Estratégico
                  </summary>
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Qual o critério utilizado para tomada de decisões estratégicas?</label>
                      <Controller name="criterio_decisao_estrategica" control={control} render={({ field }) => (
                        <select {...field} value={field.value || ''} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                          <option value="">Selecione...</option>
                          <option value="Experiência do proprietário">Pela experiência do proprietário/intuição</option>
                          <option value="Dados técnicos do mercado">Com base em dados técnicos do mercado</option>
                          <option value="Consultoria externa">Com apoio de consultoria externa</option>
                          <option value="Conselho consultivo">Decisão colegiada/conselho consultivo</option>
                          <option value="Misto">Misto (experiência + dados)</option>
                          <option value="Não há critério definido">Não há critério definido</option>
                        </select>
                      )} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Principais deficiências/dificuldades em gestão e planejamento (marque todas que se aplicam)</label>
                      <Controller name="deficiencias_gestao" control={control} render={({ field }) => (
                        <CheckboxGroup options={DEFICIENCIAS_GESTAO} value={field.value} onChange={field.onChange} cols={3} />
                      )} />
                    </div>
                  </div>
                </details>

                {/* RECURSOS HUMANOS */}
                <details className="mb-3 border border-gray-200 rounded-lg overflow-hidden">
                  <summary className="cursor-pointer px-4 py-3 bg-gray-50 font-semibold text-gray-800 hover:bg-gray-100">
                    👥 Recursos Humanos
                  </summary>
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Número de colaboradores e média salarial por categoria</label>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="border border-gray-200 rounded p-3">
                          <p className="text-xs font-medium text-gray-600 mb-2">OPERACIONAL</p>
                          <Controller name="num_colab_operacional" control={control} render={({ field: { value, onChange, ...rest } }) => (
                            <input {...rest} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} type="number" min="0" className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm mb-2" placeholder="Qtd" />
                          )} />
                          <Controller name="media_salarial_operacional" control={control} render={({ field: { value, onChange, ...rest } }) => (
                            <input {...rest} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} type="number" min="0" step="100" className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm" placeholder="R$ médio" />
                          )} />
                        </div>
                        <div className="border border-gray-200 rounded p-3">
                          <p className="text-xs font-medium text-gray-600 mb-2">COMERCIAL</p>
                          <Controller name="num_colab_comercial" control={control} render={({ field: { value, onChange, ...rest } }) => (
                            <input {...rest} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} type="number" min="0" className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm mb-2" placeholder="Qtd" />
                          )} />
                          <Controller name="media_salarial_comercial" control={control} render={({ field: { value, onChange, ...rest } }) => (
                            <input {...rest} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} type="number" min="0" step="100" className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm" placeholder="R$ médio" />
                          )} />
                        </div>
                        <div className="border border-gray-200 rounded p-3">
                          <p className="text-xs font-medium text-gray-600 mb-2">ADMINISTRATIVO</p>
                          <Controller name="num_colab_administrativo" control={control} render={({ field: { value, onChange, ...rest } }) => (
                            <input {...rest} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} type="number" min="0" className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm mb-2" placeholder="Qtd" />
                          )} />
                          <Controller name="media_salarial_administrativo" control={control} render={({ field: { value, onChange, ...rest } }) => (
                            <input {...rest} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} type="number" min="0" step="100" className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm" placeholder="R$ médio" />
                          )} />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Admissões (último trimestre)</label>
                        <Controller name="admissoes_trimestre" control={control} render={({ field: { value, onChange, ...rest } }) => (
                          <input {...rest} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} type="number" min="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="0" />
                        )} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Demissões (último trimestre)</label>
                        <Controller name="demissoes_trimestre" control={control} render={({ field: { value, onChange, ...rest } }) => (
                          <input {...rest} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} type="number" min="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="0" />
                        )} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Vagas em aberto</label>
                        <Controller name="vagas_abertas" control={control} render={({ field: { value, onChange, ...rest } }) => (
                          <input {...rest} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} type="number" min="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="0" />
                        )} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Folha pagamento (R$/mês)</label>
                        <Controller name="folha_pagamento_mensal" control={control} render={({ field: { value, onChange, ...rest } }) => (
                          <input {...rest} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} type="number" min="0" step="100" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="0" />
                        )} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Principais gargalos/dificuldades em RH (marque todas que se aplicam)</label>
                      <Controller name="gargalos_rh" control={control} render={({ field }) => (
                        <CheckboxGroup options={GARGALOS_RH} value={field.value} onChange={field.onChange} cols={3} />
                      )} />
                    </div>
                  </div>
                </details>

                {/* ESTOQUE */}
                <details className="mb-3 border border-gray-200 rounded-lg overflow-hidden">
                  <summary className="cursor-pointer px-4 py-3 bg-gray-50 font-semibold text-gray-800 hover:bg-gray-100">
                    📦 Estoque
                  </summary>
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Itens no portfólio</label>
                        <Controller name="num_itens_portfolio" control={control} render={({ field: { value, onChange, ...rest } }) => (
                          <input {...rest} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} type="number" min="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="100" />
                        )} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Unidade de medida principal</label>
                        <Controller name="unidade_medida_estoque" control={control} render={({ field }) => (
                          <select {...field} value={field.value || ''} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">Selecione...</option>
                            {UNIDADES_MEDIDA.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        )} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Estoque médio mensal (R$)</label>
                        <Controller name="estoque_medio_mensal" control={control} render={({ field: { value, onChange, ...rest } }) => (
                          <input {...rest} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} type="number" min="0" step="100" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="50000" />
                        )} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Principais deficiências em estoque (marque todas)</label>
                      <Controller name="deficiencias_estoque" control={control} render={({ field }) => (
                        <CheckboxGroup options={DEFICIENCIAS_ESTOQUE} value={field.value} onChange={field.onChange} cols={2} />
                      )} />
                    </div>
                  </div>
                </details>

                {/* FINANCEIRO */}
                <details className="mb-3 border border-gray-200 rounded-lg overflow-hidden">
                  <summary className="cursor-pointer px-4 py-3 bg-gray-50 font-semibold text-gray-800 hover:bg-gray-100">
                    💰 Financeiro
                  </summary>
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Faturamento médio mensal (R$)</label>
                        <Controller name="faturamento_mensal" control={control} render={({ field: { value, onChange, ...rest } }) => (
                          <input {...rest} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} type="number" min="0" step="100" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="100000" />
                        )} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Custo fixo mensal (R$)</label>
                        <Controller name="custo_fixo_mensal" control={control} render={({ field: { value, onChange, ...rest } }) => (
                          <input {...rest} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} type="number" min="0" step="100" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="30000" />
                        )} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Custo variável mensal (R$)</label>
                        <Controller name="custo_variavel_mensal" control={control} render={({ field: { value, onChange, ...rest } }) => (
                          <input {...rest} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} type="number" min="0" step="100" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="40000" />
                        )} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Ticket médio (R$)</label>
                        <Controller name="ticket_medio" control={control} render={({ field: { value, onChange, ...rest } }) => (
                          <input {...rest} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} type="number" min="0" step="0.01" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="200" />
                        )} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Margem de contribuição (%)</label>
                        <Controller name="margem_contribuicao_pct" control={control} render={({ field: { value, onChange, ...rest } }) => (
                          <input {...rest} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} type="number" min="0" max="100" step="0.1" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="35" />
                        )} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Ponto de equilíbrio (R$/mês)</label>
                        <Controller name="ponto_equilibrio" control={control} render={({ field: { value, onChange, ...rest } }) => (
                          <input {...rest} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} type="number" min="0" step="100" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="60000" />
                        )} />
                      </div>
                    </div>

                    {/* Endividamento */}
                    <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
                      <Controller name="possui_endividamento" control={control} render={({ field }) => (
                        <label className="flex items-center gap-2 mb-3 cursor-pointer">
                          <input type="checkbox" checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} className="w-4 h-4 text-blue-600" />
                          <span className="font-semibold text-amber-900">A empresa possui endividamento?</span>
                        </label>
                      )} />
                      <Controller name="possui_endividamento" control={control} render={({ field: { value } }) => (
                        <>
                          {value ? (
                            <>
                              <p className="text-xs text-amber-800 mb-3">Indique o percentual do endividamento total em cada categoria (total não precisa fechar 100%):</p>
                              <div className="grid grid-cols-3 gap-3">
                                {[
                                  { name: 'endividamento_banco_pct', label: 'Banco' },
                                  { name: 'endividamento_fornecedor_pct', label: 'Fornecedor' },
                                  { name: 'endividamento_factoring_pct', label: 'Factoring' },
                                  { name: 'endividamento_fisco_pct', label: 'Receita Federal' },
                                  { name: 'endividamento_sefaz_pct', label: 'SEFAZ' },
                                  { name: 'endividamento_outros_pct', label: 'Outros' },
                                ].map(({ name, label }) => (
                                  <div key={name}>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">{label} (%)</label>
                                    <Controller name={name as any} control={control} render={({ field: f }) => (
                                      <input
                                        value={(f.value as any) ?? ''}
                                        onChange={(e) => f.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm bg-white"
                                        placeholder="0"
                                      />
                                    )} />
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : null}
                        </>
                      )} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Melhores meses para vendas</label>
                        <Controller name="melhores_meses_vendas" control={control} render={({ field }) => (
                          <CheckboxGroup options={MESES_ANO} value={field.value} onChange={field.onChange} cols={3} />
                        )} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Piores meses para vendas</label>
                        <Controller name="piores_meses_vendas" control={control} render={({ field }) => (
                          <CheckboxGroup options={MESES_ANO} value={field.value} onChange={field.onChange} cols={3} />
                        )} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Principais deficiências em Financeiro</label>
                      <Controller name="deficiencias_financeiro" control={control} render={({ field }) => (
                        <CheckboxGroup options={DEFICIENCIAS_FINANCEIRO} value={field.value} onChange={field.onChange} cols={2} />
                      )} />
                    </div>
                  </div>
                </details>

                {/* MARKETING / VENDAS */}
                <details className="mb-3 border border-gray-200 rounded-lg overflow-hidden">
                  <summary className="cursor-pointer px-4 py-3 bg-gray-50 font-semibold text-gray-800 hover:bg-gray-100">
                    📈 Marketing e Vendas
                  </summary>
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">A empresa possui ociosidade em vendas?</label>
                        <Controller name="ociosidade_vendas" control={control} render={({ field }) => (
                          <select {...field} value={field.value || ''} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">Selecione...</option>
                            <option value="Não">Não</option>
                            <option value="Sim, por falta de clientes">Sim, por falta de clientes</option>
                            <option value="Sim, por problemas logísticos">Sim, por problemas logísticos</option>
                            <option value="Sim, por outros fatores">Sim, por outros fatores</option>
                            <option value="Não sei">Não sei</option>
                          </select>
                        )} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Critério para definir preço de vendas</label>
                        <Controller name="criterio_preco_vendas" control={control} render={({ field }) => (
                          <select {...field} value={field.value || ''} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">Selecione...</option>
                            <option value="Base no custo">Com base no custo (markup)</option>
                            <option value="Base na concorrência">Com base na concorrência</option>
                            <option value="Base no valor">Com base no valor percebido</option>
                            <option value="Outra forma">Outra forma</option>
                          </select>
                        )} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Posição de preço em relação à concorrência</label>
                        <Controller name="posicao_preco_concorrencia" control={control} render={({ field }) => (
                          <select {...field} value={field.value || ''} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">Selecione...</option>
                            <option value="Igual">Igual à concorrência</option>
                            <option value="Mais barato">Mais barato que a concorrência</option>
                            <option value="Mais caro">Mais caro que a concorrência</option>
                            <option value="Não sei">Não sei</option>
                          </select>
                        )} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">CAC — Custo de Aquisição de Cliente (R$)</label>
                        <Controller name="cac_novos_clientes" control={control} render={({ field: { value, onChange, ...rest } }) => (
                          <input {...rest} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} type="number" min="0" step="0.01" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="150" />
                        )} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Como a empresa busca novos clientes?</label>
                      <Controller name="busca_clientes" control={control} render={({ field }) => (
                        <CheckboxGroup options={BUSCA_CLIENTES} value={field.value} onChange={field.onChange} cols={2} />
                      )} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Principais deficiências em Marketing/Vendas</label>
                      <Controller name="deficiencias_marketing" control={control} render={({ field }) => (
                        <CheckboxGroup options={DEFICIENCIAS_MARKETING} value={field.value} onChange={field.onChange} cols={2} />
                      )} />
                    </div>
                  </div>
                </details>
              </div>

              {/* Botão */}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
              >
                Próximo: Questões →
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: QUESTÕES */}
        {step === 2 && config && (() => {
          const todasQuestoes = filtrarQuestoes(config);
          const totalRespondidas = Object.keys(respostas).filter(id => todasQuestoes.some(q => q.id === Number(id))).length;

          // Agrupar por tema preservando a ordem das áreas
          const grupos = ORDEM_AREAS.map(area => ({
            area,
            icone: ICONES_AREA[area] || '📋',
            questoes: todasQuestoes.filter(q => q.tema === area)
          })).filter(g => g.questoes.length > 0);

          const grupoFocado = areaFocada ? grupos.find(g => g.area === areaFocada) : null;
          const idxFocada = grupoFocado ? grupos.indexOf(grupoFocado) : -1;
          const proximaArea = idxFocada >= 0 && idxFocada < grupos.length - 1 ? grupos[idxFocada + 1] : null;
          const areaAnterior = idxFocada > 0 ? grupos[idxFocada - 1] : null;

          return (
            <div className="bg-white rounded-lg shadow-lg p-8">
              {/* Header com contador e botão "Ver todas" quando focado */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {areaFocada && (
                    <button
                      type="button"
                      onClick={() => setAreaFocada(null)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    >
                      ← Ver todas as áreas
                    </button>
                  )}
                  <h2 className="text-2xl font-bold">
                    {areaFocada ? (
                      <span className="flex items-center gap-2">
                        <span className="text-3xl">{grupoFocado?.icone}</span>
                        {areaFocada}
                      </span>
                    ) : (
                      'Escolha uma Área para Responder'
                    )}
                  </h2>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">{totalRespondidas}/{todasQuestoes.length}</div>
                  <div className="text-xs text-gray-500">total respondidas</div>
                </div>
              </div>

              {/* MODO HUB: Cards de áreas */}
              {!areaFocada && (
                <>
                  <p className="text-gray-600 mb-6">
                    Clique em uma área para responder suas questões. Cada área é como uma planilha independente do diagnóstico.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {grupos.map(grupo => {
                      const respondidasArea = grupo.questoes.filter(q => respostas[q.id]).length;
                      const completa = respondidasArea === grupo.questoes.length;
                      const iniciada = respondidasArea > 0;
                      const pct = Math.round((respondidasArea / grupo.questoes.length) * 100);
                      return (
                        <button
                          key={grupo.area}
                          type="button"
                          onClick={() => {
                            setAreaFocada(grupo.area);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`text-left p-5 rounded-xl border-2 transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                            completa
                              ? 'bg-green-50 border-green-400 hover:border-green-500'
                              : iniciada
                                ? 'bg-blue-50 border-blue-300 hover:border-blue-500'
                                : 'bg-white border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <span className="text-4xl">{grupo.icone}</span>
                            {completa && (
                              <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                ✓ Completa
                              </span>
                            )}
                            {iniciada && !completa && (
                              <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                Em andamento
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-gray-800 mb-2">{grupo.area}</h3>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">{respondidasArea}/{grupo.questoes.length} questões</span>
                            <span className={`text-sm font-bold ${completa ? 'text-green-600' : iniciada ? 'text-blue-600' : 'text-gray-400'}`}>
                              {pct}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${completa ? 'bg-green-500' : 'bg-blue-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="mt-3 text-xs text-blue-600 font-medium">
                            {completa ? 'Revisar respostas →' : iniciada ? 'Continuar →' : 'Iniciar →'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* MODO FOCADO: Apenas as questões da área selecionada */}
              {areaFocada && grupoFocado && (() => {
                const respondidasArea = grupoFocado.questoes.filter(q => respostas[q.id]).length;
                const pctArea = Math.round((respondidasArea / grupoFocado.questoes.length) * 100);
                return (
                  <>
                    {/* Barra de progresso da área */}
                    <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-700">
                          Área {idxFocada + 1} de {grupos.length} · {grupoFocado.questoes.length} questões
                        </span>
                        <span className="text-sm font-bold text-blue-700">{respondidasArea}/{grupoFocado.questoes.length} respondidas</span>
                      </div>
                      <div className="w-full bg-white rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${pctArea}%` }}
                        />
                      </div>
                    </div>

                    {/* Questões */}
                    <div className="space-y-6">
                      {grupoFocado.questoes.map((questao, idx) => {
                        const selecionadaF = respostas[questao.id] === 'F';
                        return (
                          <div key={questao.id} className={idx > 0 ? 'pt-6 border-t border-gray-100' : ''}>
                            <p className="font-semibold text-gray-800 mb-3">
                              <span className="text-blue-600 mr-2">{idx + 1}.</span>
                              {questao.pergunta}
                            </p>
                            <div className="space-y-2">
                              {['A', 'B', 'C', 'D', 'E'].map(letra => {
                                const campo = `opcao_${letra.toLowerCase()}` as keyof typeof questao;
                                const opcao = questao[campo] as string | undefined;
                                if (!opcao) return null;
                                const selecionada = respostas[questao.id] === letra;
                                return (
                                  <label
                                    key={letra}
                                    className={`flex items-start cursor-pointer p-3 rounded-lg transition border ${
                                      selecionada ? 'bg-blue-50 border-blue-300' : 'border-transparent hover:bg-gray-50 hover:border-gray-200'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={`questao_${questao.id}`}
                                      value={letra}
                                      checked={selecionada}
                                      onChange={() => handleRespostaChange(questao.id, letra)}
                                      className="w-4 h-4 text-blue-600 mt-0.5"
                                    />
                                    <span className="ml-3 text-sm text-gray-700">
                                      <span className="font-semibold">{letra}.</span> {opcao}
                                    </span>
                                  </label>
                                );
                              })}

                              {/* Opção F: Outras (especifique) */}
                              <label
                                className={`flex items-start cursor-pointer p-3 rounded-lg transition border ${
                                  selecionadaF ? 'bg-amber-50 border-amber-300' : 'border-transparent hover:bg-gray-50 hover:border-gray-200'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`questao_${questao.id}`}
                                  value="F"
                                  checked={selecionadaF}
                                  onChange={() => handleRespostaChange(questao.id, 'F')}
                                  className="w-4 h-4 text-amber-600 mt-0.5"
                                />
                                <span className="ml-3 text-sm text-gray-700">
                                  <span className="font-semibold">F.</span> Outras — minha situação não se encaixa nas opções acima
                                </span>
                              </label>

                              {selecionadaF && (
                                <div className="ml-7 mt-2">
                                  <textarea
                                    value={respostasOutras[questao.id] || ''}
                                    onChange={(e) => handleRespostaOutraChange(questao.id, e.target.value)}
                                    placeholder="Descreva sua situação específica (essa informação será incluída no diagnóstico)..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm bg-white"
                                  />
                                  <p className="text-xs text-amber-700 mt-1">
                                    ⚠️ Esta resposta não contribui para a pontuação numérica, mas será destacada na análise final.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Navegação entre áreas */}
                    <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                      {areaAnterior ? (
                        <button
                          type="button"
                          onClick={() => {
                            setAreaFocada(areaAnterior.area);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                        >
                          ← {areaAnterior.icone} {areaAnterior.area}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAreaFocada(null)}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition"
                        >
                          ← Voltar ao hub
                        </button>
                      )}
                      {proximaArea && (
                        <button
                          type="button"
                          onClick={() => {
                            setAreaFocada(proximaArea.area);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                        >
                          {proximaArea.icone} {proximaArea.area} →
                        </button>
                      )}
                      {!proximaArea && (
                        <button
                          type="button"
                          onClick={() => setAreaFocada(null)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition"
                        >
                          ✓ Concluir e voltar ao hub
                        </button>
                      )}
                    </div>
                  </>
                );
              })()}

              {/* Botões de navegação global (Step 1 / Step 3) */}
              <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 rounded-lg transition"
                >
                  ← Configuração
                </button>
                <button
                  onClick={handleProximoPasso}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
                >
                  Próximo: Revisão →
                </button>
              </div>
            </div>
          );
        })()}

        {/* STEP 3: REVISÃO */}
        {step === 3 && config && (() => {
          const todasQuestoes = filtrarQuestoes(config);
          // Coletar respostas "Outras" agrupadas por área
          const outrasPorArea = ORDEM_AREAS.map(area => {
            const respostasArea = todasQuestoes
              .filter(q => q.tema === area && respostas[q.id] === 'F')
              .map(q => ({
                questao_id: q.id,
                pergunta: q.pergunta,
                texto: (respostasOutras[q.id] || '').trim()
              }))
              .filter(r => r.texto);
            return { area, icone: ICONES_AREA[area] || '📋', respostas: respostasArea };
          }).filter(g => g.respostas.length > 0);

          const totalOutras = outrasPorArea.reduce((sum, g) => sum + g.respostas.length, 0);
          const respondidasPontuadas = Object.values(respostas).filter(r => r && r !== 'F').length;

          return (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Revisar Respostas</h2>

              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p><strong>Empresa:</strong> {config.empresa_nome}</p>
                <p><strong>Setor:</strong> {config.setor} | <strong>Porte:</strong> {config.porte}</p>
                <p><strong>Respondente:</strong> {config.respondente_nome} ({config.respondente_email})</p>
                {config.respondente_telefone && <p><strong>Telefone:</strong> {config.respondente_telefone}</p>}
                {config.endereco && <p><strong>Endereço:</strong> {config.endereco}</p>}
                {(config.faturamento_anual || config.num_funcionarios || config.tempo_mercado_anos) && (
                  <p className="text-sm mt-2 text-gray-600">
                    {config.faturamento_anual && <>Faturamento: R$ {config.faturamento_anual.toLocaleString('pt-BR')} · </>}
                    {config.num_funcionarios && <>{config.num_funcionarios} funcionários · </>}
                    {config.tempo_mercado_anos && <>{config.tempo_mercado_anos} anos de mercado</>}
                  </p>
                )}
              </div>

              {/* Resumo da resposta */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">{respondidasPontuadas}</div>
                  <div className="text-sm text-green-800">Respostas que contam para a pontuação (A-E)</div>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-amber-700">{totalOutras}</div>
                  <div className="text-sm text-amber-800">Respostas "Outras" com observações personalizadas</div>
                </div>
              </div>

              {/* Observações personalizadas */}
              {outrasPorArea.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span>📝</span> Suas Observações Personalizadas
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Essas respostas únicas serão destacadas no diagnóstico final como contexto qualitativo.
                  </p>
                  <div className="space-y-4">
                    {outrasPorArea.map(grupo => (
                      <div key={grupo.area} className="border border-amber-200 bg-amber-50 rounded-lg p-4">
                        <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                          <span>{grupo.icone}</span> {grupo.area}
                          <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                            {grupo.respostas.length} {grupo.respostas.length === 1 ? 'observação' : 'observações'}
                          </span>
                        </h4>
                        <div className="space-y-3 mt-3">
                          {grupo.respostas.map(r => (
                            <div key={r.questao_id} className="bg-white rounded p-3 border border-amber-100">
                              <p className="text-xs font-semibold text-gray-600 mb-1">Q: {r.pergunta}</p>
                              <p className="text-sm text-gray-800 italic">"{r.texto}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-600 mb-8">
                Clique em "Enviar" para processar o diagnóstico. Isso pode levar alguns segundos.
              </p>

              {/* Botões */}
              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 rounded-lg transition"
                >
                  ← Voltar
                </button>
                <button
                  onClick={handleSubmitFinal}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Processando...' : '✓ Enviar Diagnóstico'}
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
