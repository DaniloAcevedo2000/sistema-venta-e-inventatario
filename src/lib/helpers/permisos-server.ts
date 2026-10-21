import 'server-only'
import { auth } from '@/lib/auth'

/**
 * Verifica que el usuario tenga el permiso indicado y devuelve su sesión.
 * Lanza error si no está autenticado o no tiene permiso.
 *
 * Reemplaza la función duplicada `verificarPermiso` en cada actions.ts
 */
export async function requirePermiso(permiso: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autenticado')
  if (!session.user.permisos.includes(permiso)) {
    throw new Error('Sin permisos')
  }
  return session.user
}

/**
 * Igual que requirePermiso pero devuelve null en lugar de lanzar.
 * Útil para render condicional.
 */
export async function checkPermiso(permiso: string) {
  const session = await auth()
  if (!session?.user) return null
  if (!session.user.permisos.includes(permiso)) return null
  return session.user
}