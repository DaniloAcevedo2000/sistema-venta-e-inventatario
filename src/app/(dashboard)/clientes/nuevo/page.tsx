import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ClienteForm } from '../cliente-form'

export const metadata = {
  title: 'Nuevo Cliente | Momoto Café',
}

export default async function NuevoClientePage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('clientes:crear')) redirect('/clientes')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/clientes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Cliente</h1>
          <p className="text-muted-foreground">
            Registra un nuevo cliente en el sistema
          </p>
        </div>
      </div>

      <ClienteForm />
    </div>
  )
}