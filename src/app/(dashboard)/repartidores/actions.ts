'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

type ActionState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

async function verificarPermiso(permiso: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autenticado')
  if (!session.user.permisos.includes(permiso)) throw new Error('Sin permisos')
  return session.user
}

// ============================================
// CREAR REPARTIDOR
// ============================================
export async function crearRepartidorAction(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await verificarPermiso('usuarios:crear')

    const nombre = (formData.get('nombre') as string)?.trim()
    const correo = (formData.get('correo') as string)?.toLowerCase().trim()
    const telefono = (formData.get('telefono') as string)?.trim() || null
    const contrasena = formData.get('contrasena') as string
    const sucursalId = (formData.get('sucursalId') as string) || null

    if (!nombre) return { fieldErrors: { nombre: ['Requerido'] } }
    if (!correo) return { fieldErrors: { correo: ['Requerido'] } }
    if (!contrasena || contrasena.length < 8) {
      return { fieldErrors: { contrasena: ['Mínimo 8 caracteres'] } }
    }

    const existente = await prisma.usuario.findUnique({ where: { correo } })
    if (existente) {
      return { fieldErrors: { correo: ['Este correo ya existe'] } }
    }

    const hash = await bcrypt.hash(contrasena, 10)

    const repartidor = await prisma.usuario.create({
      data: {
        nombre,
        correo,
        telefono,
        contrasenaHash: hash,
        sucursalId,
        activo: true,
      },
    })

    // Asignar rol REPARTIDOR
    const rol = await prisma.rol.findUnique({
      where: { codigo: 'REPARTIDOR' },
    })
    if (!rol) {
      return { error: 'Rol REPARTIDOR no encontrado en el sistema' }
    }

    await prisma.usuarioRol.create({
      data: { usuarioId: repartidor.id, rolId: rol.id },
    })

    await prisma.auditoria.create({
      data: {
        usuario: { connect: { id: user.id } },
        accion: 'repartidor.crear',
        entidadTipo: 'Usuario',
        entidadId: repartidor.id,
        datosDespues: { nombre, correo, telefono } as any,
      },
    })

    revalidatePath('/repartidores')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: 'Error al crear repartidor' }
  }
}

// ============================================
// ACTUALIZAR REPARTIDOR
// ============================================
export async function actualizarRepartidorAction(
  usuarioId: string,
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await verificarPermiso('usuarios:editar')

    const nombre = (formData.get('nombre') as string)?.trim()
    const telefono = (formData.get('telefono') as string)?.trim() || null
    const contrasena = formData.get('contrasena') as string
    const activo = formData.get('activo') !== 'off'

    if (!nombre) return { fieldErrors: { nombre: ['Requerido'] } }

    const updateData: any = {
      nombre,
      telefono,
      activo,
    }

    // Solo actualizar contraseña si se proporciona
    if (contrasena && contrasena.length >= 8) {
      updateData.contrasenaHash = await bcrypt.hash(contrasena, 10)
    } else if (contrasena && contrasena.length > 0) {
      return { fieldErrors: { contrasena: ['Mínimo 8 caracteres'] } }
    }

    await prisma.$transaction([
      prisma.usuario.update({
        where: { id: usuarioId },
        data: updateData,
      }),
      prisma.auditoria.create({
        data: {
          usuario: { connect: { id: user.id } },
          accion: 'repartidor.actualizar',
          entidadTipo: 'Usuario',
          entidadId: usuarioId,
          datosDespues: { nombre, telefono, activo } as any,
        },
      }),
    ])

    revalidatePath('/repartidores')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: 'Error al actualizar repartidor' }
  }
}

// ============================================
// TOGGLE ACTIVO
// ============================================
export async function toggleRepartidorAction(usuarioId: string) {
  try {
    const user = await verificarPermiso('usuarios:editar')
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
    })
    if (!usuario) return { error: 'Usuario no encontrado' }

    // Verificar que no tenga pedidos activos si se va a desactivar
    if (usuario.activo) {
      const pedidosActivos = await prisma.pedido.count({
        where: {
          repartidorId: usuarioId,
          estado: { in: ['EN_CAMINO', 'LISTO', 'EN_PREPARACION'] },
        },
      })
      if (pedidosActivos > 0) {
        return {
          error: `No se puede desactivar: tiene ${pedidosActivos} pedido(s) en curso`,
        }
      }
    }

    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { activo: !usuario.activo },
    })

    await prisma.auditoria.create({
      data: {
        usuario: { connect: { id: user.id } },
        accion: usuario.activo ? 'repartidor.desactivar' : 'repartidor.activar',
        entidadTipo: 'Usuario',
        entidadId: usuarioId,
      },
    })

    revalidatePath('/repartidores')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: 'Error al cambiar estado' }
  }
}