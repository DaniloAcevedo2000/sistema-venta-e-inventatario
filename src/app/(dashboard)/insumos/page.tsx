import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { InsumosTable } from './insumos-table'

export const metadata = {
  title: 'Insumos | Momoto Café',
}

export default async function InsumosPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('inventario:leer')) redirect('/dashboard')

  const insumos = await prisma.insumo.findMany({
    include: {
      unidadMedida: {
        select: { id: true, abreviatura: true, nombre: true },
      },
      stocks: true,
    },
    orderBy: [{ categoriaInsumo: 'asc' }, { nombre: 'asc' }],
  })

  const insumosSerializados = insumos.map((i) => {
    // Stock total (sumando todas las sucursales)
    const stockTotal = i.stocks.reduce(
      (sum, s) => sum + Number(s.cantidad),
      0
    )
    const stockMinimo = Number(i.stockMinimo)

    return {
      id: i.id,
      codigo: i.codigo,
      nombre: i.nombre,
      descripcion: i.descripcion,
      categoriaInsumo: i.categoriaInsumo,
      costoUnitario: i.costoUnitario.toString(),
      stockMinimo: i.stockMinimo.toString(),
      imagenUrl: i.imagenUrl,
      activo: i.activo,
      unidadMedida: i.unidadMedida,
      stockActual: stockTotal.toFixed(2),
      tieneAlerta: stockMinimo > 0 && stockTotal < stockMinimo,
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Insumos</h1>
        <p className="text-muted-foreground">
          Gestiona las materias primas y materiales del negocio
        </p>
      </div>

      <InsumosTable
        insumos={insumosSerializados}
        permisos={session.user.permisos}
      />
    </div>
  )
}