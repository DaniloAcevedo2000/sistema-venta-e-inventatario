'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
// TASA DE CAMBIO
// ============================================
export async function actualizarTasaCambioAction(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await verificarPermiso('configuracion:gestionar')

    const nuevaTasa = parseFloat(formData.get('tasa') as string)
    const notas = (formData.get('notas') as string) || null

    if (isNaN(nuevaTasa) || nuevaTasa <= 0) {
      return { error: 'La tasa debe ser mayor a 0' }
    }

    // Obtener tasa actual
    const tasaActual = await prisma.tasaCambio.findFirst({
      where: {
        monedaOrigen: 'USD',
        monedaDestino: 'NIO',
        activa: true,
      },
    })

    // Desactivar la anterior y marcar cuándo dejó de estar vigente
    if (tasaActual) {
      await prisma.tasaCambio.update({
        where: { id: tasaActual.id },
        data: {
          activa: false,
          vigenteHasta: new Date(),
        },
      })
    }

    // Crear la nueva
    await prisma.tasaCambio.create({
      data: {
        monedaOrigen: 'USD',
        monedaDestino: 'NIO',
        tasa: nuevaTasa,
        fuente: 'MANUAL',
        vigenteDesde: new Date(),
        activa: true,
        notas,
        usuarioId: user.id,
      },
    })

    // Actualizar config también
    await prisma.configuracion.upsert({
      where: { clave: 'moneda.tasa_cambio' },
      update: { valor: String(nuevaTasa) },
      create: {
        clave: 'moneda.tasa_cambio',
        valor: String(nuevaTasa),
        tipo: 'number',
        descripcion: 'Tasa de cambio oficial USD → NIO',
      },
    })

    await prisma.auditoria.create({
      data: {
        usuario: { connect: { id: user.id } },
        accion: 'tasa_cambio.actualizar',
        entidadTipo: 'TasaCambio',
        datosAntes: { tasa: tasaActual ? Number(tasaActual.tasa) : null } as any,
        datosDespues: { tasa: nuevaTasa, notas } as any,
      },
    })

    revalidatePath('/configuracion/pagos')
    revalidatePath('/pos')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: 'Error al actualizar la tasa' }
  }
}

// ============================================
// BANCOS
// ============================================
export async function crearBancoAction(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await verificarPermiso('configuracion:gestionar')

    const codigo = (formData.get('codigo') as string)?.toUpperCase().trim()
    const nombre = (formData.get('nombre') as string)?.trim()
    const nombreCorto = (formData.get('nombreCorto') as string)?.trim() || null
    const permiteTarjeta = formData.get('permiteTarjeta') === 'on'
    const permiteTransferencia = formData.get('permiteTransferencia') === 'on'
    const orden = parseInt(formData.get('orden') as string) || 0

    if (!codigo) return { fieldErrors: { codigo: ['Requerido'] } }
    if (!nombre) return { fieldErrors: { nombre: ['Requerido'] } }

    const existente = await prisma.banco.findUnique({ where: { codigo } })
    if (existente) {
      return { fieldErrors: { codigo: ['Este código ya existe'] } }
    }

    const banco = await prisma.banco.create({
      data: {
        codigo,
        nombre,
        nombreCorto,
        permiteTarjeta,
        permiteTransferencia,
        orden,
        activo: true,
      },
    })

    await prisma.auditoria.create({
      data: {
        usuario: { connect: { id: user.id } },
        accion: 'banco.crear',
        entidadTipo: 'Banco',
        entidadId: banco.id,
        datosDespues: { codigo, nombre } as any,
      },
    })

    revalidatePath('/configuracion/pagos')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: 'Error al crear banco' }
  }
}

export async function actualizarBancoAction(
  bancoId: string,
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await verificarPermiso('configuracion:gestionar')

    const codigo = (formData.get('codigo') as string)?.toUpperCase().trim()
    const nombre = (formData.get('nombre') as string)?.trim()
    const nombreCorto = (formData.get('nombreCorto') as string)?.trim() || null
    const permiteTarjeta = formData.get('permiteTarjeta') === 'on'
    const permiteTransferencia = formData.get('permiteTransferencia') === 'on'
    const orden = parseInt(formData.get('orden') as string) || 0
    const activo = formData.get('activo') === 'on'

    if (!codigo) return { fieldErrors: { codigo: ['Requerido'] } }
    if (!nombre) return { fieldErrors: { nombre: ['Requerido'] } }

    const existente = await prisma.banco.findFirst({
      where: { codigo, NOT: { id: bancoId } },
    })
    if (existente) {
      return { fieldErrors: { codigo: ['Este código ya existe'] } }
    }

    await prisma.banco.update({
      where: { id: bancoId },
      data: {
        codigo,
        nombre,
        nombreCorto,
        permiteTarjeta,
        permiteTransferencia,
        orden,
        activo,
      },
    })

    await prisma.auditoria.create({
      data: {
        usuario: { connect: { id: user.id } },
        accion: 'banco.actualizar',
        entidadTipo: 'Banco',
        entidadId: bancoId,
        datosDespues: { codigo, nombre, activo } as any,
      },
    })

    revalidatePath('/configuracion/pagos')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: 'Error al actualizar banco' }
  }
}

export async function toggleBancoAction(bancoId: string) {
  try {
    const user = await verificarPermiso('configuracion:gestionar')
    const banco = await prisma.banco.findUnique({ where: { id: bancoId } })
    if (!banco) return { error: 'Banco no encontrado' }

    await prisma.banco.update({
      where: { id: bancoId },
      data: { activo: !banco.activo },
    })

    await prisma.auditoria.create({
      data: {
        usuario: { connect: { id: user.id } },
        accion: banco.activo ? 'banco.desactivar' : 'banco.activar',
        entidadTipo: 'Banco',
        entidadId: bancoId,
      },
    })

    revalidatePath('/configuracion/pagos')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: 'Error al cambiar estado' }
  }
}

// ============================================
// MÉTODOS DE PAGO
// ============================================
export async function crearMetodoPagoAction(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await verificarPermiso('configuracion:gestionar')

    const codigo = (formData.get('codigo') as string)?.toUpperCase().trim()
    const nombre = (formData.get('nombre') as string)?.trim()
    const descripcion = (formData.get('descripcion') as string) || null
    const tipo = formData.get('tipo') as string
    const requiereBanco = formData.get('requiereBanco') === 'on'
    const requiereRed = formData.get('requiereRed') === 'on'
    const requiereReferencia = formData.get('requiereReferencia') === 'on'
    const esCredito = formData.get('esCredito') === 'on'
    const icono = (formData.get('icono') as string) || null
    const orden = parseInt(formData.get('orden') as string) || 0

    if (!codigo) return { fieldErrors: { codigo: ['Requerido'] } }
    if (!nombre) return { fieldErrors: { nombre: ['Requerido'] } }
    if (!tipo) return { fieldErrors: { tipo: ['Requerido'] } }

    const existente = await prisma.metodoPago.findUnique({ where: { codigo } })
    if (existente) {
      return { fieldErrors: { codigo: ['Este código ya existe'] } }
    }

    const metodo = await prisma.metodoPago.create({
      data: {
        codigo,
        nombre,
        descripcion,
        tipo,
        requiereBanco,
        requiereRed,
        requiereReferencia,
        esCredito,
        icono,
        orden,
        activo: true,
      },
    })

    await prisma.auditoria.create({
      data: {
        usuario: { connect: { id: user.id } },
        accion: 'metodo_pago.crear',
        entidadTipo: 'MetodoPago',
        entidadId: metodo.id,
        datosDespues: { codigo, nombre, tipo } as any,
      },
    })

    revalidatePath('/configuracion/pagos')
    revalidatePath('/pos')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: 'Error al crear método' }
  }
}

export async function actualizarMetodoPagoAction(
  metodoId: string,
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await verificarPermiso('configuracion:gestionar')

    const codigo = (formData.get('codigo') as string)?.toUpperCase().trim()
    const nombre = (formData.get('nombre') as string)?.trim()
    const descripcion = (formData.get('descripcion') as string) || null
    const tipo = formData.get('tipo') as string
    const requiereBanco = formData.get('requiereBanco') === 'on'
    const requiereRed = formData.get('requiereRed') === 'on'
    const requiereReferencia = formData.get('requiereReferencia') === 'on'
    const esCredito = formData.get('esCredito') === 'on'
    const icono = (formData.get('icono') as string) || null
    const orden = parseInt(formData.get('orden') as string) || 0
    const activo = formData.get('activo') === 'on'

    if (!codigo) return { fieldErrors: { codigo: ['Requerido'] } }
    if (!nombre) return { fieldErrors: { nombre: ['Requerido'] } }

    const existente = await prisma.metodoPago.findFirst({
      where: { codigo, NOT: { id: metodoId } },
    })
    if (existente) {
      return { fieldErrors: { codigo: ['Este código ya existe'] } }
    }

    await prisma.metodoPago.update({
      where: { id: metodoId },
      data: {
        codigo,
        nombre,
        descripcion,
        tipo,
        requiereBanco,
        requiereRed,
        requiereReferencia,
        esCredito,
        icono,
        orden,
        activo,
      },
    })

    await prisma.auditoria.create({
      data: {
        usuario: { connect: { id: user.id } },
        accion: 'metodo_pago.actualizar',
        entidadTipo: 'MetodoPago',
        entidadId: metodoId,
        datosDespues: { codigo, nombre, activo } as any,
      },
    })

    revalidatePath('/configuracion/pagos')
    revalidatePath('/pos')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: 'Error al actualizar método' }
  }
}

export async function toggleMetodoPagoAction(metodoId: string) {
  try {
    const user = await verificarPermiso('configuracion:gestionar')
    const metodo = await prisma.metodoPago.findUnique({
      where: { id: metodoId },
    })
    if (!metodo) return { error: 'Método no encontrado' }

    // Si tiene pagos asociados, no permitir desactivar
    if (metodo.activo) {
      const pagos = await prisma.pagoVenta.count({
        where: { metodoPagoId: metodoId },
      })
      if (pagos > 0) {
        // Se permite desactivar pero se mantienen los pagos históricos
      }
    }

    await prisma.metodoPago.update({
      where: { id: metodoId },
      data: { activo: !metodo.activo },
    })

    await prisma.auditoria.create({
      data: {
        usuario: { connect: { id: user.id } },
        accion: metodo.activo
          ? 'metodo_pago.desactivar'
          : 'metodo_pago.activar',
        entidadTipo: 'MetodoPago',
        entidadId: metodoId,
      },
    })

    revalidatePath('/configuracion/pagos')
    revalidatePath('/pos')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: 'Error al cambiar estado' }
  }
}

// ============================================
// REDES DE TARJETA
// ============================================
export async function crearRedTarjetaAction(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await verificarPermiso('configuracion:gestionar')

    const codigo = (formData.get('codigo') as string)?.toUpperCase().trim()
    const nombre = (formData.get('nombre') as string)?.trim()
    const orden = parseInt(formData.get('orden') as string) || 0

    if (!codigo) return { fieldErrors: { codigo: ['Requerido'] } }
    if (!nombre) return { fieldErrors: { nombre: ['Requerido'] } }

    const existente = await prisma.redTarjeta.findUnique({
      where: { codigo },
    })
    if (existente) {
      return { fieldErrors: { codigo: ['Este código ya existe'] } }
    }

    const red = await prisma.redTarjeta.create({
      data: { codigo, nombre, orden, activo: true },
    })

    await prisma.auditoria.create({
      data: {
        usuario: { connect: { id: user.id } },
        accion: 'red_tarjeta.crear',
        entidadTipo: 'RedTarjeta',
        entidadId: red.id,
        datosDespues: { codigo, nombre } as any,
      },
    })

    revalidatePath('/configuracion/pagos')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: 'Error al crear red' }
  }
}

export async function actualizarRedTarjetaAction(
  redId: string,
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await verificarPermiso('configuracion:gestionar')

    const codigo = (formData.get('codigo') as string)?.toUpperCase().trim()
    const nombre = (formData.get('nombre') as string)?.trim()
    const orden = parseInt(formData.get('orden') as string) || 0
    const activo = formData.get('activo') === 'on'

    if (!codigo) return { fieldErrors: { codigo: ['Requerido'] } }
    if (!nombre) return { fieldErrors: { nombre: ['Requerido'] } }

    const existente = await prisma.redTarjeta.findFirst({
      where: { codigo, NOT: { id: redId } },
    })
    if (existente) {
      return { fieldErrors: { codigo: ['Este código ya existe'] } }
    }

    await prisma.redTarjeta.update({
      where: { id: redId },
      data: { codigo, nombre, orden, activo },
    })

    await prisma.auditoria.create({
      data: {
        usuario: { connect: { id: user.id } },
        accion: 'red_tarjeta.actualizar',
        entidadTipo: 'RedTarjeta',
        entidadId: redId,
        datosDespues: { codigo, nombre, activo } as any,
      },
    })

    revalidatePath('/configuracion/pagos')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: 'Error al actualizar red' }
  }
}

export async function toggleRedTarjetaAction(redId: string) {
  try {
    const user = await verificarPermiso('configuracion:gestionar')
    const red = await prisma.redTarjeta.findUnique({ where: { id: redId } })
    if (!red) return { error: 'Red no encontrada' }

    await prisma.redTarjeta.update({
      where: { id: redId },
      data: { activo: !red.activo },
    })

    await prisma.auditoria.create({
      data: {
        usuario: { connect: { id: user.id } },
        accion: red.activo ? 'red_tarjeta.desactivar' : 'red_tarjeta.activar',
        entidadTipo: 'RedTarjeta',
        entidadId: redId,
      },
    })

    revalidatePath('/configuracion/pagos')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: 'Error al cambiar estado' }
  }
}