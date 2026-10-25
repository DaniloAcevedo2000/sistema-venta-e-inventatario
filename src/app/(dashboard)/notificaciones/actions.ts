'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getMisNotificacionesAction() {
  try {
    const session = await auth()
    if (!session?.user) return []

    const { id: usuarioId, permisos, sucursalId } = session.user

    // Buscamos:
    // 1. Notificaciones Privadas asignadas directamente a este usuario y no leídas.
    // 2. Notificaciones Públicas para su sucursal o globales, que requieran un permiso que él tenga, y que no haya leído.
    const notificaciones = await prisma.notificacion.findMany({
      where: {
        AND: [
          {
            OR: [
              // Privadas: Tienen que estar en mi tabla de lectura y tener leidaEn en null
              {
                esPrivada: true,
                usuarios: {
                  some: { usuarioId, leidaEn: null },
                },
              },
              // Públicas: No privadas, que requieran un permiso que yo tenga (o que no requieran permiso), 
              // y que NO tenga un registro de lectura mío
              {
                esPrivada: false,
                OR: [
                  { permisoRequerido: null },
                  { permisoRequerido: { in: permisos } },
                ],
                AND: [
                  { OR: [{ sucursalId: sucursalId }, { sucursalId: null }] },
                  {
                    usuarios: {
                      none: { usuarioId }, // No he interactuado con ella (ni leído)
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      orderBy: { creadoEn: 'desc' },
      take: 15,
    })

    return notificaciones.map((n) => ({
      id: n.id,
      titulo: n.titulo,
      descripcion: n.descripcion,
      tipo: n.tipo,
      href: n.href,
      creadoEn: n.creadoEn.toISOString(),
    }))
  } catch (error) {
    console.error('Error cargando notificaciones:', error)
    return []
  }
}

export async function marcarComoLeidaAction(notificacionId: string) {
  try {
    const session = await auth()
    if (!session?.user) return { error: 'No autenticado' }

    const usuarioId = session.user.id

    // Hacemos un upsert: si ya existe el registro (porque era privada), actualizamos leidaEn.
    // Si no existe (porque era pública y el usuario nunca la tocó), lo creamos con la fecha actual.
    await prisma.notificacionUsuario.upsert({
      where: {
        notificacionId_usuarioId: {
          notificacionId,
          usuarioId,
        },
      },
      update: {
        leidaEn: new Date(),
      },
      create: {
        notificacionId,
        usuarioId,
        leidaEn: new Date(),
      },
    })

    return { success: true }
  } catch (error) {
    return { error: 'Error al marcar notificación' }
  }
}