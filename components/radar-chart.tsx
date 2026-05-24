'use client'

import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'

interface RadarChartProps {
  escores: Array<{
    area: string
    escore: number
  }>
  benchmark?: Array<{
    area: string
    media_setor: number
  }>
}

const LABEL_CURTO: Record<string, string> = {
  'Planejamento e Estratégia': 'Planejamento',
  'Recursos Humanos': 'RH',
  'Estoque': 'Estoque',
  'Financeiro': 'Financeiro',
  'Tecnologia da Informação': 'Tecnologia',
  'Relações Institucionais': 'Relações',
  'Logística': 'Logística',
  'Marketing e Vendas': 'Marketing',
  'Projeções e Tendências': 'Tendências',
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null

  const data = payload[0]?.payload
  if (!data) return null

  return (
    <div className="bg-white shadow-lg rounded-lg p-3 border border-gray-200">
      <p className="font-semibold text-gray-800 text-sm mb-1">{data.areaCompleta}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: <span className="font-bold">{entry.value}/10</span>
        </p>
      ))}
    </div>
  )
}

export function RadarChartDiagnostico({ escores, benchmark }: RadarChartProps) {
  const data = escores.map(e => {
    const benchItem = benchmark?.find(b => b.area === e.area)
    return {
      area: LABEL_CURTO[e.area] || e.area,
      areaCompleta: e.area,
      escore: e.escore,
      ...(benchItem ? { benchmark: benchItem.media_setor } : {}),
    }
  })

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={380}>
        <RechartsRadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="area"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 10]}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickCount={6}
            axisLine={false}
          />
          <Radar
            name="Sua Empresa"
            dataKey="escore"
            stroke="#2563eb"
            fill="#3b82f6"
            fillOpacity={0.25}
            strokeWidth={2}
            dot={{ r: 4, fill: '#2563eb' }}
          />
          {benchmark && benchmark.length > 0 && (
            <Radar
              name="Media do Setor"
              dataKey="benchmark"
              stroke="#f59e0b"
              fill="#fbbf24"
              fillOpacity={0.1}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3, fill: '#f59e0b' }}
            />
          )}
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  )
}
