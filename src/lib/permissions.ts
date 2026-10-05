import { auth } from '@/lib/auth'

export async function tienePermiso(permiso: string): Promise<boolean> {
  const session = await auth()
  if (!session?.user) return false
  return session.user.permisos.includes(permiso)
}

export async function tieneAlgunPermiso(permisos: string[]): Promise<boolean> {
  const session = await auth()
  if (!session?.user) return false
  return permisos.some((p) => session.user.permisos.includes(p))
}