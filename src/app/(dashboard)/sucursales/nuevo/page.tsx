import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SucursalForm } from '../sucursal-form'

export default async function NuevaSucursalPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('sucursales:gestionar')) redirect('/sucursales')

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nueva Sucursal</h1>
        <p className="text-muted-foreground">Registra un nuevo local.</p>
      </div>
      <SucursalForm />
    </div>
  )
}