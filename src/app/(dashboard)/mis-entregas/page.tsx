import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { MisEntregasClient } from './mis-entregas-client'

export const metadata = {
  title: 'Mis Entregas | Momoto Café',
}

export default async function MisEntregasPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  if (!session.user.permisos.includes('delivery:ver')) {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mis Entregas</h1>
        <p className="text-muted-foreground">
          Pedidos asignados a ti para entregar
        </p>
      </div>

      <MisEntregasClient permisos={session.user.permisos} />
    </div>
  )
}