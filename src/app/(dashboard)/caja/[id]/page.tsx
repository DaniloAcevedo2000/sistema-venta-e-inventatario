// src/app/(dashboard)/caja/[id]/page.tsx
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function CajaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  // Redirigir al listado — el detalle se muestra en dialog
  redirect('/caja')
}