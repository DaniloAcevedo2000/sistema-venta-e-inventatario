'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { clienteSchema, abonoSchema } from './schema'

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
// CREAR CLIENTE
// ============================================
export async function crearClienteAction(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await verificarPermiso('clientes:crear')

    const raw = {
      codigo: (formData.get('codigo') as string) || '',
      nombre: (formData.get('nombre') as string) || '',
      apellido: (formData.get('apellido') as string) || null,
      nombreComercial: (formData.get('nombreComercial') as string) || null,
      tipoDocumento: (formData.get('tipoDocumento') as string) || null,
      numeroDocumento: (formData.get('numeroDocumento') as string) || null,
      telefono: (formData.get('telefono') as string) || null,
      correo: (formData.get('correo') as string) || null,
      direccion: (formData.get('direccion') as string) || null,
      permiteCredito: formData.get('permiteCredito') === 'on',
      limiteCredito: formData.get('limiteCredito') || '0',
      notas: (formData.get('notas') as string) || null,
      activo: formData.get('activo') !== 'off',
    }

    const parsed = clienteSchema.safeParse(raw)
    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors }
    }

    const data = parsed.data

    const existente = await prisma.cliente.findUnique({
      where: { codigo: data.codigo },
    })
    if (existente) {
      return { fieldErrors: { codigo: ['Este código ya existe'] } }
    }

    const cliente = await prisma.cliente.create({
      data: {
        codigo: data.codigo.toUpperCase(),
        nombre: data.nombre,
        apellido: data.apellido || null,
        nombreComercial: data.nombreComercial || null,
        tipoDocumento: data.tipoDocumento || null,
        numeroDocumento: data.numeroDocumento || null,
        telefono: data.telefono || null,
        correo: data.correo || null,
        direccion: data.direccion || null,
        permiteCredito: data.permiteCredito,
        limiteCredito: data.limiteCredito,
        notas: data.notas || null,
        activo: data.activo,
      },
    })

    await prisma.auditoria.create({
      data: {
        usuario: { connect: { id: user.id } },
        accion: 'cliente.crear',
        entidadTipo: 'Cliente',
        entidadId: cliente.id,
        datosDespues: data as any,
      },
    })

    revalidatePath('/clientes')
  } catch (error) {
    console.error(error)
    return { error: 'Error al crear el cliente' }
  }

  redirect('/clientes')
}

// ============================================
// ACTUALIZAR CLIENTE
// ============================================
export async function actualizarClienteAction(
  id: string,
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await verificarPermiso('clientes:editar')

    const raw = {
      codigo: (formData.get('codigo') as string) || '',
      nombre: (formData.get('nombre') as string) || '',
      apellido: (formData.get('apellido') as string) || null,
      nombreComercial: (formData.get('nombreComercial') as string) || null,
      tipoDocumento: (formData.get('tipoDocumento') as string) || null,
      numeroDocumento: (formData.get('numeroDocumento') as string) || null,
      telefono: (formData.get('telefono') as string) || null,
      correo: (formData.get('correo') as string) || null,
      direccion: (formData.get('direccion') as string) || null,
      permiteCredito: formData.get('permiteCredito') === 'on',
      limiteCredito: formData.get('limiteCredito') || '0',
      notas: (formData.get('notas') as string) || null,
      activo: formData.get('activo') !== 'off',
    }

    const parsed = clienteSchema.safeParse(raw)
    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors }
    }

    const data = parsed.data

    const existente = await prisma.cliente.findFirst({
      where: { codigo: data.codigo, NOT: { id } },
    })
    if (existente) {
      return { fieldErrors: { codigo: ['Este código ya existe'] } }
    }

    const anterior = await prisma.cliente.findUnique({ where: { id } })

    await prisma.$transaction([
      prisma.cliente.update({
        where: { id },
        data: {
          codigo: data.codigo.toUpperCase(),
          nombre: data.nombre,
          apellido: data.apellido || null,
          nombreComercial: data.nombreComercial || null,
          tipoDocumento: data.tipoDocumento || null,
          numeroDocumento: data.numeroDocumento || null,
          telefono: data.telefono || null,
          correo: data.correo || null,
          direccion: data.direccion || null,
          permiteCredito: data.permiteCredito,
          limiteCredito: data.limiteCredito,
          notas: data.notas || null,
          activo: data.activo,
        },
      }),
      prisma.auditoria.create({
        data: {
          usuario: { connect: { id: user.id } },
          accion: 'cliente.actualizar',
          entidadTipo: 'Cliente',
          entidadId: id,
          datosAntes: anterior as any,
          datosDespues: data as any,
        },
      }),
    ])

    revalidatePath('/clientes')
  } catch (error) {
    console.error(error)
    return { error: 'Error al actualizar el cliente' }
  }

  redirect('/clientes')
}

// ============================================
// TOGGLE ACTIVO
// ============================================
export async function toggleActivoClienteAction(id: string, motivo: string) {
  try {
    const user = await verificarPermiso('clientes:editar')

    if (!motivo || motivo.trim().length < 3) {
      return { error: 'Debes indicar un motivo' }
    }

    const cliente = await prisma.cliente.findUnique({ where: { id } })
    if (!cliente) return { error: 'Cliente no encontrado' }

    // No desactivar si tiene saldo pendiente
    if (Number(cliente.saldoActual) > 0.01 && cliente.activo) {
      return {
        error: `No se puede desactivar: el cliente tiene un saldo pendiente de C$ ${Number(cliente.saldoActual).toFixed(2)}. Cóbrale primero.`,
      }
    }

    const nuevoEstado = !cliente.activo

    await prisma.$transaction([
      prisma.cliente.update({
        where: { id },
        data: {
          activo: nuevoEstado,
          motivoCambio: motivo,
          desactivadoEn: nuevoEstado ? null : new Date(),
          desactivadoPorId: nuevoEstado ? null : user.id,
        },
      }),
      prisma.auditoria.create({
        data: {
          usuario: { connect: { id: user.id } },
          accion: nuevoEstado ? 'cliente.activar' : 'cliente.desactivar',
          entidadTipo: 'Cliente',
          entidadId: id,
          datosDespues: { motivo } as any,
        },
      }),
    ])

    revalidatePath('/clientes')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: 'Error al cambiar estado' }
  }
}

// ============================================
// REGISTRAR ABONO
// ============================================
export async function registrarAbonoAction(
  clienteId: string,
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await verificarPermiso('creditos:gestionar')

    const raw = {
      monto: formData.get('monto'),
      metodo: formData.get('metodo'),
      referencia: (formData.get('referencia') as string) || null,
      notas: (formData.get('notas') as string) || null,
    }

    const parsed = abonoSchema.safeParse(raw)
    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors }
    }

    const data = parsed.data

    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
    })

    if (!cliente) return { error: 'Cliente no encontrado' }

    const saldoActual = Number(cliente.saldoActual)

    if (saldoActual <= 0) {
      return { error: 'Este cliente no tiene saldo pendiente' }
    }

    if (data.monto > saldoActual) {
      return {
        error: `El abono (C$ ${data.monto.toFixed(2)}) supera el saldo actual (C$ ${saldoActual.toFixed(2)})`,
      }
    }

    const saldoNuevo = saldoActual - data.monto

    await prisma.$transaction([
      prisma.pagoCredito.create({
        data: {
          cliente: { connect: { id: clienteId } },
          monto: data.monto,
          metodo: data.metodo,
          referencia: data.referencia || null,
          notas: data.notas || null,
          saldoAnterior: saldoActual,
          saldoNuevo,
        },
      }),
      prisma.cliente.update({
        where: { id: clienteId },
        data: { saldoActual: saldoNuevo },
      }),
      prisma.auditoria.create({
        data: {
          usuario: { connect: { id: user.id } },
          accion: 'credito.abono',
          entidadTipo: 'Cliente',
          entidadId: clienteId,
          datosAntes: { saldoActual } as any,
          datosDespues: {
            monto: data.monto,
            metodo: data.metodo,
            saldoNuevo,
          } as any,
        },
      }),
    ])

    revalidatePath('/clientes')
    revalidatePath('/creditos')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: 'Error al registrar el abono' }
  }
}