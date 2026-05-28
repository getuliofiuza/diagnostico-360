'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
      if (data.user) {
        // Verifica se é admin
        fetch('/api/auth/setup', { method: 'POST' })
          .then(r => r.json())
          .then(d => setIsAdmin(!!d.is_admin))
          .catch(() => setIsAdmin(false))
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) setIsAdmin(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary-700">360</span>
            <span className="text-gray-600 font-medium">Diagnóstico Empresarial</span>
          </Link>

          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-20 h-8 bg-gray-100 rounded animate-pulse" />
            ) : user ? (
              <>
                <Link href="/diagnosticos" className="text-gray-600 hover:text-primary-700 font-medium transition-colors">
                  Diagnósticos
                </Link>
                {isAdmin && (
                  <div className="relative group">
                    <button className="text-amber-700 hover:text-amber-800 font-medium transition-colors flex items-center gap-1">
                      <span>👑</span> Admin
                      <svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 12 12"><path d="M3 4l3 3 3-3"/></svg>
                    </button>
                    <div className="absolute right-0 top-full pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      <div className="bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[200px]">
                        <Link href="/admin/diagnosticos" className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700">
                          📊 Todos os Diagnósticos
                        </Link>
                        <Link href="/admin/usuarios" className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700">
                          👥 Gerenciar Usuários
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
                <Link href="/diagnostico/novo" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium">
                  Novo
                </Link>
                <div className="flex items-center gap-3 ml-2 pl-4 border-l border-gray-200">
                  <span className="text-sm text-gray-500 hidden sm:block">
                    {user.user_metadata?.nome || user.email?.split('@')[0]}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-400 hover:text-red-600 transition-colors"
                  >
                    Sair
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-primary-700 font-medium transition-colors">
                  Entrar
                </Link>
                <Link href="/cadastro" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium">
                  Criar Conta
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
