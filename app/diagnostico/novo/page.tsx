'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { NovoDiagnostico } from '@/components/novo-diagnostico'

export default function NovoDiagnosticoPage() {
  const router = useRouter()
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/setup', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.tenant_id) {
          setTenantId(data.tenant_id)
        } else {
          router.push('/login')
        }
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false))
  }, [router])

  if (loading || !tenantId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <NovoDiagnostico
        tenant_id={tenantId}
        onSuccess={(id) => router.push(`/diagnostico/${id}`)}
      />
    </div>
  )
}
