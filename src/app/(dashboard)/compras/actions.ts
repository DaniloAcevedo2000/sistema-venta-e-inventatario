'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requirePermiso } from '@/lib/helpers/permisos-server'
import { siguienteCorrelativo } from '@/lib/helpers/correlativos'

export async function crearOrdenCompraAction(formData: FormData) {
  try {
    const user = await requirePermiso('compras:crear')
    if (!user.sucursalId) throw new Error('Usuario sin sucursal')

    const payloadRaw = formData.get('payload') as string
    const data = JSON.parse(payloadRaw)

    if (!data.proveedorId || !data.items || data.items.length === 0) {
      throw new Error('Faltan datos obligatorios (proveedor o items)')
    }

    // 1. Calcular totales
    let subtotal = 0
    let impuesto = 0
    
    const itemsCalculados = data.items.map((i: any) => {
      const bruto = i.cantidad * i.precioUnitario
      // Asumimos IVA 15% si el insumo es gravado (ajusta según tu lógica)
      const tasaIva = i.tipoImpuesto === 'GRAVADO_15' ? 0.15 : 0
      const ivaItem = bruto - (bruto / (1 + tasaIva))
      
      subtotal += bruto
      impuesto += ivaItem
      
      return {
        ...i,
        subtotal: bruto,
      }
    })

    // 2. Generar número de orden (Usamos el correlativo temporalmente o crea uno nuevo si lo deseas)
    const num = await siguienteCorrelativo('PEDIDO', user.sucursalId)
    const codigo = `OC-${new Date().getFullYear()}-${String(num).padStart(4, '0')}`

    // 3. Crear Orden
    const orden = await prisma.ordenCompra.create({
      data: {
        codigo,
        numero: num,
        proveedorId: data.proveedorId,
        sucursalId: user.sucursalId,
        usuarioId: user.id,
        estado: 'BORRADOR',
        fechaEsperada: data.fechaEsperada ? new Date(data.fechaEsperada) : null,
        notas: data.notas || null,
        subtotal,
        impuesto,
        total: subtotal + impuesto,
        items: {
          create: itemsCalculados.map((i: any) => ({
            insumoId: i.insumoId || null,
            productoId: i.productoId || null,
            descripcion: i.descripcion,
            cantidad: i.cantidad,
            precioUnitario: i.precioUnitario,
            subtotal: i.subtotal,
            tipoImpuesto: i.tipoImpuesto || 'GRAVADO_15',
          }))
        }
      }
    })

    revalidatePath('/compras')
    return { success: true, ordenId: orden.id }
  } catch (err: any) {
    console.error(err)
    return { error: err.message || 'Error al crear orden' }
  }
}

// ============================================
// RECIBIR MERCADERÍA (Afecta Inventario)
// ============================================
export async function recibirOrdenCompraAction(ordenId: string) {
  try {
    const user = await requirePermiso('compras:editar')
    
    const orden = await prisma.ordenCompra.findUnique({
      where: { id: ordenId },
      include: { items: true }
    })

    if (!orden) throw new Error('Orden no encontrada')
    if (orden.estado === 'RECIBIDA') throw new Error('Esta orden ya fue recibida')
    if (orden.estado === 'CANCELADA') throw new Error('No se puede recibir una orden cancelada')

    await prisma.$transaction(async (tx) => {
      // 1. Marcar orden como recibida
      await tx.ordenCompra.update({
        where: { id: ordenId },
        data: {
          estado: 'RECIBIDA',
          fechaRecepcion: new Date(),
        }
      })

      // 2. Sumar al inventario
      for (const item of orden.items) {
        const cantidad = Number(item.cantidad)
        
        if (item.insumoId) {
          // Actualizar Stock del Insumo
          let stock = await tx.stock.findFirst({
            where: { insumoId: item.insumoId, sucursalId: orden.sucursalId }
          })
          
          const cantAnterior = stock ? Number(stock.cantidad) : 0
          const cantNueva = cantAnterior + cantidad

          if (stock) {
            await tx.stock.update({ where: { id: stock.id }, data: { cantidad: cantNueva } })
          } else {
            stock = await tx.stock.create({
              data: { insumoId: item.insumoId, sucursalId: orden.sucursalId, cantidad: cantNueva }
            })
          }

          // Kardex
          await tx.movimientoInventario.create({
            data: {
              insumoId: item.insumoId,
              sucursalId: orden.sucursalId,
              usuarioId: user.id,
              tipo: 'ENTRADA_COMPRA',
              cantidad: cantidad,
              cantidadAnterior: cantAnterior,
              cantidadNueva: cantNueva,
              costoUnitario: item.precioUnitario,
              costoTotal: item.subtotal,
              referenciaTipo: 'orden_compra',
              referenciaId: orden.id,
              motivo: `Recepción OC ${orden.codigo}`,
            }
          })
        } 
      }
    })

    revalidatePath('/compras')
    revalidatePath('/inventario')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Error al recibir orden' }
  }
}

export async function cancelarOrdenCompraAction(ordenId: string) {
  try {
    await requirePermiso('compras:editar')
    await prisma.ordenCompra.update({
      where: { id: ordenId },
      data: { estado: 'CANCELADA' }
    })
    revalidatePath('/compras')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

// ============================================
// RECIBIR ORDEN PARCIAL O TOTALMENTE
// ============================================
export async function recibirOrdenParcialAction(
  ordenId: string,
  cantidadesRecibidas: Record<string, number>
) {
  try {
    const user = await requirePermiso('compras:editar')
    
    const orden = await prisma.ordenCompra.findUnique({
      where: { id: ordenId },
      include: { items: true }
    })

    if (!orden) throw new Error('Orden no encontrada')
    if (orden.estado === 'RECIBIDA' || orden.estado === 'CANCELADA') {
      throw new Error('La orden no está en un estado válido para recibir')
    }

    let todoRecibidoFinal = true // 👈 Variable declarada fuera del bucle

    await prisma.$transaction(async (tx) => {
      for (const item of orden.items) {
        const cantidadPedida = Number(item.cantidad)
        const yaRecibida = Number(item.cantidadRecibida)
        const cantNueva = cantidadesRecibidas[item.id] || 0
        
        const pendiente = cantidadPedida - yaRecibida
        const cantAplicar = Math.min(cantNueva, pendiente)

        if (cantAplicar > 0) {
          await tx.itemCompra.update({
            where: { id: item.id },
            data: { cantidadRecibida: yaRecibida + cantAplicar }
          })

          if (item.insumoId) {
            const stock = await tx.stock.findFirst({
              where: { insumoId: item.insumoId, sucursalId: orden.sucursalId }
            })
            
            const cantAnterior = stock ? Number(stock.cantidad) : 0
            const cantNuevaStock = cantAnterior + cantAplicar

            if (stock) {
              await tx.stock.update({ where: { id: stock.id }, data: { cantidad: cantNuevaStock } })
            } else {
              await tx.stock.create({
                data: { insumoId: item.insumoId, sucursalId: orden.sucursalId, cantidad: cantNuevaStock }
              })
            }

            await tx.movimientoInventario.create({
              data: {
                insumoId: item.insumoId,
                sucursalId: orden.sucursalId,
                usuarioId: user.id,
                tipo: 'ENTRADA_COMPRA',
                cantidad: cantAplicar,
                cantidadAnterior: cantAnterior,
                cantidadNueva: cantNuevaStock,
                costoUnitario: item.precioUnitario,
                costoTotal: Number(item.precioUnitario) * cantAplicar,
                referenciaTipo: 'orden_compra',
                referenciaId: orden.id,
                motivo: `Recepción OC ${orden.codigo} (Parcial)`,
              }
            })
          }
        }

        if ((yaRecibida + cantAplicar) < cantidadPedida) {
          todoRecibidoFinal = false
        }
      }

      await tx.ordenCompra.update({
        where: { id: ordenId },
        data: { 
          estado: todoRecibidoFinal ? 'RECIBIDA' : 'RECIBIDA_PARCIAL',
          fechaRecepcion: todoRecibidoFinal ? new Date() : undefined
        }
      })
    })

    revalidatePath('/compras')
    revalidatePath('/inventario')
    return { success: true, todoRecibido: todoRecibidoFinal }
  } catch (err: any) {
    return { error: err.message || 'Error al recibir orden' }
  }
}