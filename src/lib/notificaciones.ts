import { prisma } from '@/lib/prisma'

type CreateNotifParams = {
  titulo: string
  descripcion: string
  tipo: 'error' | 'warning' | 'info' | 'success'
  href?: string
  modulo: string
  sucursalId?: string | null
  // Si es privada, pasamos los IDs de los usuarios exactos
  usuariosDestino?: string[] 
  // Si es pública, pasamos el permiso que deben tener
  permisoRequerido?: string
}

export async function crearNotificacion({
  titulo,
  descripcion,
  tipo,
  href,
  modulo,
  sucursalId,
  usuariosDestino,
  permisoRequerido,
}: CreateNotifParams) {
  try {
    const esPrivada = usuariosDestino && usuariosDestino.length > 0

    // 1. Creamos la notificación principal
    const notificacion = await prisma.notificacion.create({
      data: {
        titulo,
        descripcion,
        tipo,
        href,
        modulo,
        esPrivada: !!esPrivada,
        sucursalId,
        permisoRequerido: esPrivada ? null : permisoRequerido,
      },
    })

    // 2. Si es privada, la asignamos a los usuarios específicos
    if (esPrivada && usuariosDestino) {
      await prisma.notificacionUsuario.createMany({
        data: usuariosDestino.map((usuarioId) => ({
          notificacionId: notificacion.id,
          usuarioId,
        })),
      })
    }

    return notificacion
  } catch (error) {
    console.error('Error creando notificación:', error)
  }
}