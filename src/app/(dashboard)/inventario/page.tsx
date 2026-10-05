import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { InventarioTabs } from './inventario-tabs'

export const metadata = {
  title: 'Inventario | Momoto Café',
}

export default async function InventarioPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('inventario:leer')) redirect('/dashboard')

  const [sucursales, stocks, insumos, productos, recetas] = await Promise.all([
    prisma.sucursal.findMany({
      where: { activa: true },
      orderBy: { nombre: 'asc' },
    }),
    prisma.stock.findMany({
      include: {
        sucursal: { select: { id: true, nombre: true } },
        insumo: {
          include: { unidadMedida: { select: { abreviatura: true } } },
        },
        producto: true,
      },
    }),
    prisma.insumo.findMany({
      where: { activo: true },
      include: { unidadMedida: { select: { abreviatura: true } } },
    }),
    prisma.producto.findMany({
      where: { activo: true, tipo: { not: 'combo' } },
      include: { categoria: { select: { nombre: true } } },
    }),
    prisma.receta.findMany({ select: { productoId: true } }),
  ])

  const productosConReceta = new Set(recetas.map((r) => r.productoId))

  // ============================================
  // Insumos (incluir todos los activos, con o sin stock)
  // ============================================
  const insumosStock = []
  for (const insumo of insumos) {
    for (const sucursal of sucursales) {
      const stock = stocks.find(
        (s) => s.insumoId === insumo.id && s.sucursalId === sucursal.id
      )
      const cantidad = stock ? Number(stock.cantidad) : 0
      const stockMinimo = Number(insumo.stockMinimo)
      const costoUnitario = Number(insumo.costoUnitario)

      let estado: 'ok' | 'bajo' | 'agotado' = 'ok'
      if (cantidad === 0) estado = 'agotado'
      else if (stockMinimo > 0 && cantidad < stockMinimo) estado = 'bajo'

      insumosStock.push({
        id: stock?.id ?? `${insumo.id}-${sucursal.id}`,
        insumoId: insumo.id,
        codigo: insumo.codigo,
        nombre: insumo.nombre,
        categoria: insumo.categoriaInsumo,
        sucursalId: sucursal.id,
        sucursalNombre: sucursal.nombre,
        cantidad,
        stockMinimo,
        unidadAbreviatura: insumo.unidadMedida.abreviatura,
        costoUnitario,
        valorTotal: cantidad * costoUnitario,
        estado,
      })
    }
  }

  // ============================================
  // Productos sin receta (los que manejan stock propio)
  // ============================================
  const productosStock = []
  for (const producto of productos) {
    if (productosConReceta.has(producto.id)) continue

    for (const sucursal of sucursales) {
      const stock = stocks.find(
        (s) => s.productoId === producto.id && s.sucursalId === sucursal.id
      )
      const cantidad = stock ? Number(stock.cantidad) : 0
      const costoUnitario = Number(producto.costo)

      let estado: 'ok' | 'bajo' | 'agotado' = 'ok'
      if (cantidad === 0) estado = 'agotado'

      productosStock.push({
        id: stock?.id ?? `${producto.id}-${sucursal.id}`,
        productoId: producto.id,
        codigo: producto.codigo,
        nombre: producto.nombre,
        categoria: producto.categoria.nombre,
        sucursalId: sucursal.id,
        sucursalNombre: sucursal.nombre,
        cantidad,
        stockMinimo: 0,
        unidadAbreviatura: 'u',
        costoUnitario,
        valorTotal: cantidad * costoUnitario,
        estado,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
        <p className="text-muted-foreground">
          Consulta y ajusta el stock actual de insumos y productos
        </p>
      </div>

      <InventarioTabs
        insumosStock={insumosStock}
        productosStock={productosStock}
        sucursales={sucursales}
        permisos={session.user.permisos}
      />
    </div>
  )
}