import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, TrendingDown, ArrowRightLeft, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const metadata = {
  title: 'Historial de Insumo | Momoto Café',
}

const LABELS_MOVIMIENTOS: Record<string, { label: string; color: string }> = {
  ENTRADA_COMPRA: { label: 'Compra', color: 'bg-green-100 text-green-800' },
  SALIDA_VENTA: { label: 'Venta', color: 'bg-blue-100 text-blue-800' },
  AJUSTE_MANUAL: { label: 'Ajuste manual', color: 'bg-amber-100 text-amber-800' },
  AJUSTE_POSITIVO: { label: 'Ajuste positivo', color: 'bg-green-100 text-green-800' },
  AJUSTE_NEGATIVO: { label: 'Ajuste negativo', color: 'bg-red-100 text-red-800' },
  MERMA: { label: 'Merma', color: 'bg-red-100 text-red-800' },
  TRANSFERENCIA_SALIDA: { label: 'Transferencia salida', color: 'bg-purple-100 text-purple-800' },
  TRANSFERENCIA_ENTRADA: { label: 'Transferencia entrada', color: 'bg-purple-100 text-purple-800' },
  INVENTARIO_INICIAL: { label: 'Inventario inicial', color: 'bg-gray-100 text-gray-800' },
}

function formatearFecha(fecha: Date) {
  return new Intl.DateTimeFormat('es-NI', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(fecha)
}

export default async function InsumoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('inventario:leer')) redirect('/dashboard')

  const insumo = await prisma.insumo.findUnique({
    where: { id },
    include: {
      unidadMedida: true,
      stocks: {
        include: {
          sucursal: { select: { id: true, nombre: true } },
        },
      },
      movimientos: {
        include: {
          sucursal: { select: { id: true, nombre: true } },
          usuario: { select: { id: true, nombre: true } },
        },
        orderBy: { creadoEn: 'desc' },
        take: 200,
      },
    },
  })

  if (!insumo) notFound()

  const stockTotal = insumo.stocks.reduce((sum, s) => sum + Number(s.cantidad), 0)
  const costoUnitario = Number(insumo.costoUnitario)
  const valorTotal = stockTotal * costoUnitario

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/inventario">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{insumo.nombre}</h1>
          <p className="text-muted-foreground font-mono text-sm">{insumo.codigo}</p>
        </div>
        <Badge variant={insumo.activo ? 'default' : 'secondary'}>
          {insumo.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      </div>

      {/* Cards de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Stock Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stockTotal.toFixed(2)} {insumo.unidadMedida.abreviatura}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Costo Unitario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">C$ {costoUnitario.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Valor Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">C$ {valorTotal.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Stock Mínimo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {Number(insumo.stockMinimo).toFixed(2)} {insumo.unidadMedida.abreviatura}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stock por sucursal */}
      <Card>
        <CardHeader>
          <CardTitle>Stock por Sucursal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insumo.stocks.map((stock) => {
              const cantidad = Number(stock.cantidad)
              const stockMinimo = Number(insumo.stockMinimo)
              const estado = cantidad === 0 ? 'agotado' : stockMinimo > 0 && cantidad < stockMinimo ? 'bajo' : 'ok'

              return (
                <div
                  key={stock.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{stock.sucursal.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      Actualizado: {formatearFecha(stock.actualizadoEn)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-medium">
                      {cantidad.toFixed(2)} {insumo.unidadMedida.abreviatura}
                    </span>
                    {estado === 'agotado' && (
                      <Badge variant="destructive">Agotado</Badge>
                    )}
                    {estado === 'bajo' && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Bajo
                      </Badge>
                    )}
                    {estado === 'ok' && (
                      <Badge variant="default" className="bg-green-600">OK</Badge>
                    )}
                  </div>
                </div>
              )
            })}
            {insumo.stocks.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No hay stock registrado en ninguna sucursal
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Historial de movimientos */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Anterior</TableHead>
                  <TableHead className="text-right">Nuevo</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Usuario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {insumo.movimientos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground h-24">
                      No hay movimientos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  insumo.movimientos.map((mov) => {
                    const meta = LABELS_MOVIMIENTOS[mov.tipo] ?? {
                      label: mov.tipo,
                      color: 'bg-gray-100 text-gray-800',
                    }
                    const cantidad = Number(mov.cantidad)
                    const esEntrada = cantidad > 0

                    return (
                      <TableRow key={mov.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {formatearFecha(mov.creadoEn)}
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded-full ${meta.color}`}>
                            {meta.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {mov.sucursal.nombre}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`font-medium flex items-center justify-end gap-1 ${
                              esEntrada ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {esEntrada ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {esEntrada ? '+' : ''}
                            {cantidad.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {Number(mov.cantidadAnterior).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-sm">
                          {Number(mov.cantidadNueva).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">
                          {mov.motivo ?? '—'}
                        </TableCell>
                        <TableCell className="text-xs">
                          {mov.usuario.nombre}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}