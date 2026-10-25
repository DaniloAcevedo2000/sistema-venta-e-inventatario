import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { PerfilClient } from './perfil-client'

export const metadata = { title: 'Mi Perfil | Momoto Café' }

export default async function PerfilPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    include: {
      sucursal: { select: { nombre: true } },
      roles: { include: { rol: true } }
    }
  })

  if (!usuario) redirect('/login')

  // Pasamos los datos al componente cliente
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground">Administra tu información personal y seguridad.</p>
      </div>

      <PerfilClient usuario={{
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        telefono: usuario.telefono || '',
        biografia: usuario.biografia || '',
        avatarUrl: usuario.avatarUrl,
        sucursalNombre: usuario.sucursal?.nombre || 'Sin sucursal',
        roles: usuario.roles.map(r => r.rol.nombre),
      }} />
    </div>
  )
}