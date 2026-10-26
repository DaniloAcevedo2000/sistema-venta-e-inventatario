import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AsistenteChat } from './asistente-chat'

export const metadata = { title: 'Asistente IA | Momoto Café' }

export default async function AsistentePage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <div className="space-y-6 max-w-4xl mx-auto h-[calc(100vh-8rem)]">
      <div className="shrink-0">
        <h1 className="text-3xl font-bold tracking-tight">Asistente Inteligente</h1>
        <p className="text-muted-foreground">
          Pregúntale a la IA sobre tus ventas, inventario o cualquier dato de tu negocio.
        </p>
      </div>
      <div className="h-full border border-border rounded-xl shadow-md overflow-hidden bg-card">
        <AsistenteChat />
      </div>
    </div>
  )
}