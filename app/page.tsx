'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Diagnóstico Empresarial <span className="text-primary-600">360</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Avalie a maturidade operacional da sua empresa em 9 áreas estratégicas.
          Receba um plano de ação personalizado em minutos.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/diagnostico/novo"
            className="bg-primary-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200"
          >
            Iniciar Diagnóstico
          </Link>
          <Link
            href="/diagnosticos"
            className="bg-white text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transition-colors border border-gray-300"
          >
            Ver Diagnósticos
          </Link>
        </div>
      </div>

      {/* 9 Areas */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">9 Áreas de Análise</h2>
        <p className="text-gray-500 text-center mb-8">Cada área recebe um escore de 0 a 10 baseado nas respostas do diagnóstico</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              area: 'Planejamento e Estratégia',
              icon: '🎯',
              questoes: 10,
              peso: 'Alto',
              benchmark: 6.8,
              avalia: ['Definição de metas e objetivos', 'Análise de mercado (SWOT)', 'Plano estratégico documentado']
            },
            {
              area: 'Recursos Humanos',
              icon: '👥',
              questoes: 10,
              peso: 'Alto',
              benchmark: 6.5,
              avalia: ['Recrutamento e seleção', 'Treinamento e desenvolvimento', 'Clima organizacional']
            },
            {
              area: 'Estoque',
              icon: '📦',
              questoes: 10,
              peso: 'Normal',
              benchmark: 5.8,
              avalia: ['Controle de inventário', 'Giro de estoque', 'Previsão de demanda']
            },
            {
              area: 'Financeiro',
              icon: '💰',
              questoes: 10,
              peso: 'Crítico',
              benchmark: 6.2,
              avalia: ['Fluxo de caixa e DRE', 'Gestão de custos e margens', 'Indicadores financeiros (KPIs)']
            },
            {
              area: 'Tecnologia da Informação',
              icon: '💻',
              questoes: 10,
              peso: 'Alto',
              benchmark: 5.0,
              avalia: ['Sistemas de gestão (ERP)', 'Segurança de dados', 'Automação de processos']
            },
            {
              area: 'Relações Institucionais',
              icon: '🤝',
              questoes: 10,
              peso: 'Alto',
              benchmark: 6.5,
              avalia: ['Satisfação de clientes', 'Gestão de fornecedores', 'Parcerias estratégicas']
            },
            {
              area: 'Logística',
              icon: '🚛',
              questoes: 10,
              peso: 'Normal',
              benchmark: 6.0,
              avalia: ['Cadeia de suprimentos', 'Distribuição e entrega', 'Custos logísticos']
            },
            {
              area: 'Marketing e Vendas',
              icon: '📈',
              questoes: 10,
              peso: 'Alto',
              benchmark: 5.8,
              avalia: ['Estratégia comercial', 'Presença digital', 'Funil de vendas']
            },
            {
              area: 'Projeções e Tendências',
              icon: '🔮',
              questoes: 10,
              peso: 'Normal',
              benchmark: 5.5,
              avalia: ['Inovação e adaptação', 'Análise de tendências', 'Planejamento futuro']
            },
          ].map((item) => (
            <div key={item.area} className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{item.icon}</span>
                  <h3 className="font-semibold text-gray-900 text-sm">{item.area}</h3>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  item.peso === 'Crítico' ? 'bg-red-100 text-red-700' :
                  item.peso === 'Alto' ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  Peso {item.peso}
                </span>
              </div>
              <ul className="space-y-1 mb-3">
                {item.avalia.map(a => (
                  <li key={a} className="text-xs text-gray-500 flex items-start gap-1.5">
                    <span className="text-primary-400 mt-0.5">&#8226;</span>
                    {a}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">{item.questoes} questões</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-400">Média setor:</span>
                  <span className="text-sm font-semibold text-primary-600">{item.benchmark}</span>
                  <span className="text-xs text-gray-400">/10</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Como funciona */}
      <div className="bg-white rounded-2xl p-8 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Como Funciona</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { step: '1', title: 'Configure', desc: 'Informe dados da empresa, setor e porte' },
            { step: '2', title: 'Responda', desc: 'Responda as questões do diagnóstico' },
            { step: '3', title: 'Analise', desc: 'Veja escores, riscos e maturidade' },
            { step: '4', title: 'Ação', desc: 'Receba plano de desenvolvimento (PDI)' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                {item.step}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
