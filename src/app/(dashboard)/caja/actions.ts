'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs' 
import { crearNotificacion } from '@/lib/notificaciones'

type ActionState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
  sesionId?: string
}

async function verificarPermiso(permiso: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autenticado')
  if (!session.user.permisos.includes(permiso)) throw new Error('Sin permisos')
  return session.user
}

// ============================================
// ABRIR CAJA
// ============================================
export async function abrirCajaAction(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await verificarPermiso('caja:abrir')

    if (!user.sucursalId) {
      return { error: 'Usuario sin sucursal asignada' }
    }

    const cajaId = formData.get('cajaId') as string
    const montoInicial = parseFloat(formData.get('montoInicial') as string) || 0
    const observaciones = (formData.get('observaciones') as string) || null

    if (!cajaId) return { fieldErrors: { cajaId: ['Selecciona una caja'] } }

    // Verificar que no haya otra sesión abierta en esa caja
    const sesionAbierta = await prisma.sesionCaja.findFirst({
      where: {
        cajaId,
        estado: 'ABIERTA',
      },
    })

    if (sesionAbierta) {
      return {
        error: 'Esta caja ya tiene una sesión abierta. Debes cerrarla primero.',
      }
    }

    // Verificar si el usuario ya tiene otra caja abierta
    const miSesionAbierta = await prisma.sesionCaja.findFirst({
      where: {
        usuarioAperturaId: user.id,
        estado: 'ABIERTA',
      },
    })

    if (miSesionAbierta) {
      return {
        error:
          'Ya tienes una sesión de caja abierta. Debes cerrarla antes de abrir otra.',
      }
    }

    const sesion = await prisma.sesionCaja.create({
      data: {
        caja: { connect: { id: cajaId } },
        sucursal: { connect: { id: user.sucursalId } },
        usuarioApertura: { connect: { id: user.id } },
        montoInicial,
        observaciones,
        estado: 'ABIERTA',
      },
    })

    await prisma.auditoria.create({
      data: {
        usuario: { connect: { id: user.id } },
        accion: 'caja.abrir',
        entidadTipo: 'SesionCaja',
        entidadId: sesion.id,
        datosDespues: { cajaId, montoInicial } as any,
      },
    })

    revalidatePath('/caja')
    return { success: true, sesionId: sesion.id }
  } catch (error) {
    console.error('Error abriendo caja:', error)
    return {
      error: error instanceof Error ? error.message : 'Error al abrir la caja',
    }
  }
}

// ============================================
// CERRAR CAJA
// ============================================
export async function cerrarCajaAction(
  sesionId: string,
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await verificarPermiso('caja:cerrar')

    const montoContado = parseFloat(formData.get('montoContado') as string) || 0
    const motivoDiferencia = (formData.get('motivoDiferencia') as string) || null
    const comentarioCajero = (formData.get('comentarioCajero') as string) || null

    if (comentarioCajero && comentarioCajero.length > 500) {
      return { error: 'El comentario no puede exceder los 500 caracteres.' }
    }

    const sesion = await prisma.sesionCaja.findUnique({
      where: { id: sesionId },
      include: { ventas: { where: { estado: 'COMPLETADA' } }, movimientos: true, caja: true },
    })

    if (!sesion) return { error: 'Sesión no encontrada' }
    if (sesion.estado !== 'ABIERTA') return { error: 'La caja no está abierta' }

    const totalEfectivoVentas = sesion.ventas.reduce((sum, v) => sum + Number(v.totalEfectivoNio), 0)
    const totalTarjeta = sesion.ventas.reduce((sum, v) => sum + Number(v.totalTarjeta), 0)
    const totalTransferencia = sesion.ventas.reduce((sum, v) => sum + Number(v.totalTransferencia), 0)
    const totalVentas = sesion.ventas.reduce((sum, v) => sum + Number(v.total), 0)
    const ingresos = sesion.movimientos.filter((m) => m.tipo === 'INGRESO').reduce((sum, m) => sum + Number(m.monto), 0)
    const egresos = sesion.movimientos.filter((m) => m.tipo === 'EGRESO' || m.tipo === 'RETIRO').reduce((sum, m) => sum + Number(m.monto), 0)

    const montoEsperado = Number(sesion.montoInicial) + totalEfectivoVentas + ingresos - egresos
    const diferencia = montoContado - montoEsperado

    if (Math.abs(diferencia) > 0.01) {
      if (!motivoDiferencia) return { error: 'Debes seleccionar un motivo.' }

      await prisma.sesionCaja.update({
        where: { id: sesionId },
        data: {
          estado: 'POR_AUTORIZAR',
          fechaSolicitudAutorizacion: new Date(),
          montoFinal: montoContado,
          montoEsperado,
          diferencia,
          totalVentas,
          totalEfectivo: totalEfectivoVentas,
          totalTarjeta,
          totalTransferencia,
          motivoDiferencia,
          comentarioCajero,
        },
      })

      // NOTIFICACIÓN PÚBLICA (Para Admins)
      await crearNotificacion({
        titulo: 'Cierre de caja pendiente',
        descripcion: `${user.nombre} solicita autorización en ${sesion.caja.nombre}. Diferencia: C$ ${diferencia.toFixed(2)}`,
        tipo: 'warning',
        href: '/caja/autorizaciones',
        modulo: 'caja',
        sucursalId: user.sucursalId,
        permisoRequerido: 'caja:autorizar_diferencia', 
      })

      revalidatePath('/caja')
      return { 
        success: true, 
        error: 'SOLICITUD_ENVIADA: Se ha enviado una solicitud al administrador. La caja espera autorización.' 
      }
    }

    await prisma.sesionCaja.update({
      where: { id: sesionId },
      data: {
        fechaCierre: new Date(),
        montoFinal: montoContado,
        montoEsperado,
        diferencia,
        totalVentas,
        totalEfectivo: totalEfectivoVentas,
        totalTarjeta,
        totalTransferencia,
        estado: 'CERRADA',
      },
    })

    revalidatePath('/caja')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: 'Error al procesar el cierre de caja.' }
  }
}

// ============================================
// REGISTRAR MOVIMIENTO MANUAL
// ============================================
export async function registrarMovimientoAction(
  sesionId: string,
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await verificarPermiso('caja:abrir')

    const tipo = formData.get('tipo') as string
    const monto = parseFloat(formData.get('monto') as string) || 0
    const motivo = (formData.get('motivo') as string) || ''
    const referencia = (formData.get('referencia') as string) || null

    if (!tipo || !['INGRESO', 'EGRESO', 'RETIRO'].includes(tipo)) {
      return { error: 'Tipo de movimiento no válido' }
    }

    if (monto <= 0) return { fieldErrors: { monto: ['El monto debe ser mayor a 0'] } }
    if (!motivo || motivo.trim().length < 3) {
      return { fieldErrors: { motivo: ['El motivo es requerido (mín. 3 caracteres)'] } }
    }

    const sesion = await prisma.sesionCaja.findUnique({ where: { id: sesionId } })
    if (!sesion) return { error: 'Sesión no encontrada' }
    if (sesion.estado !== 'ABIERTA') {
      return { error: 'No se pueden registrar movimientos en una caja cerrada' }
    }

    await prisma.movimientoCaja.create({
      data: {
        sesionCaja: { connect: { id: sesionId } },
        tipo,
        monto,
        motivo,
        referencia,
        usuario: { connect: { id: user.id } },
      },
    })

    await prisma.auditoria.create({
      data: {
        usuario: { connect: { id: user.id } },
        accion: 'caja.movimiento',
        entidadTipo: 'SesionCaja',
        entidadId: sesionId,
        datosDespues: { tipo, monto, motivo, referencia } as any,
      },
    })

    revalidatePath('/caja')
    revalidatePath(`/caja/${sesionId}`)
    return { success: true }
  } catch (error) {
    console.error('Error registrando movimiento:', error)
    return {
      error: error instanceof Error ? error.message : 'Error al registrar movimiento',
    }
  }
}


// ============================================
// AUTORIZAR O RECHAZAR CIERRE DE CAJA
// ============================================
export async function resolverAutorizacionCajaAction(
  sesionId: string,
  aprobado: boolean,
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await verificarPermiso('caja:autorizar_diferencia')

    const comentarioAutorizador = (formData.get('comentarioAutorizador') as string) || null

    if (comentarioAutorizador && comentarioAutorizador.length > 500) {
      return { error: 'El comentario no puede exceder los 500 caracteres.' }
    }

    const sesion = await prisma.sesionCaja.findUnique({ 
      where: { id: sesionId },
      include: { caja: true }
    })
    if (!sesion) return { error: 'Sesión no encontrada' }
    if (sesion.estado !== 'POR_AUTORIZAR') return { error: 'Esta caja no está pendiente de autorización.' }

    await prisma.sesionCaja.update({
      where: { id: sesionId },
      data: {
        estado: aprobado ? 'CERRADA' : 'RECHAZADA',
        fechaCierre: aprobado ? new Date() : null,
        autorizadoPorId: user.id,
        comentarioAutorizador,
      },
    })

    // NOTIFICACIÓN PRIVADA (Para el cajero que la abrió)
    await crearNotificacion({
      titulo: aprobado ? 'Cierre de caja aprobado' : 'Cierre de caja rechazado',
      descripcion: `Tu solicitud de cierre en ${sesion.caja.nombre} fue ${aprobado ? 'APROBADA' : 'RECHAZADA'}.`,
      tipo: aprobado ? 'success' : 'error',
      href: '/caja',
      modulo: 'caja',
      usuariosDestino: [sesion.usuarioAperturaId], 
    })

    revalidatePath('/caja')
    revalidatePath('/autorizaciones')

    return { success: true }
  } catch (error) {
    console.error('Error resolviendo autorización:', error)
    return { error: error instanceof Error ? error.message : 'Error al resolver autorización' }
  }
}

