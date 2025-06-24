// app/auth/callback/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function CallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const exchangeSession = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.hash)

      if (error) {
        console.error('Error intercambiando sesión:', error)
        toast.error('El enlace ha expirado o no es válido')
        router.push('/auth')
      } else {
        toast.success('¡Sesión iniciada exitosamente!')
        router.push('/dashboard')
      }
    }

    exchangeSession()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      Validando tu sesión...
    </div>
  )
}
