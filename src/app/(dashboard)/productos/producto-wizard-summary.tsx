'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Star, Package, DollarSign, Tag, Palette } from 'lucide-react'

type Variante = {
  id?: string
  codigo: string
  nombre: string
  precio: string
  costo: string
  orden: number
  activo: boolean
}

type ResumenData = {
  codigo: string
  nombre: string
  descripcion: string
  categoriaNombre: string
  tipo: string
  precioBase: string
  costo: string
  tipoImpuesto: string
  imagenUrl: string
  color: string
  codigoBarras: string
  activo: boolean
  destacado: boolean
  permiteDescuento: boolean
  orden: number
  variantes: Variante[]
}

export function ProductoWizardSummary({ data }: { data: ResumenData }) {
  const margen =
    parseFloat(data.precioBase) > 0
      ? ((parseFloat(data.precioBase) - parseFloat(data.costo)) /
          parseFloat(data.precioBase)) *
        100
      : 0

  return (
    <div className="space-y-4">
      <div className="rounded-lg border-2 border-dashed p-6 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="flex items-start gap-4">
          <div
            className="h-20 w-20 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
            style={{ backgroundColor: data.color || '#6B4226' }}
          >
            {data.imagenUrl ? (
              <img
                src={data.imagenUrl}
                alt={data.nombre}
                className="h-full w-full object-cover rounded-xl"
              />
            ) : (
              <Package className="h-10 w-10 text-white" />
            )}
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs text-muted-foreground">
                {data.codigo}
              </span>
              {data.destacado && (
                <Badge variant="secondary" className="gap-1">
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  Destacado
                </Badge>
              )}
              <Badge variant={data.activo ? 'default' : 'outline'}>
                {data.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            <h3 className="text-xl font-bold">{data.nombre}</h3>
            {data.descripcion && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {data.descripcion}
              </p>
            )}
            <div className="flex items-center gap-2 text-sm pt-2">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{data.categoriaNombre}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Precios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Precio base</span>
              <span className="font-semibold">
                C$ {parseFloat(data.precioBase).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Costo</span>
              <span>C$ {parseFloat(data.costo).toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Margen</span>
              <Badge variant={margen > 40 ? 'default' : margen > 20 ? 'secondary' : 'destructive'}>
                {margen.toFixed(1)}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="h-4 w-4" />
              Tipo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tipo</span>
              <Badge variant="outline">
                {data.tipo === 'variantes'
                  ? `${data.variantes.length} variantes`
                  : data.tipo === 'combo'
                    ? 'Combo'
                    : 'Simple'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IVA</span>
              <Badge variant={data.tipoImpuesto === 'GRAVADO_15' ? 'default' : 'outline'}>
                {data.tipoImpuesto === 'GRAVADO_15'
                  ? '15%'
                  : data.tipoImpuesto === 'EXENTO'
                    ? 'Exento'
                    : 'N/A'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Orden</span>
              <span>{data.orden}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Presentación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Color</span>
              <div
                className="h-5 w-5 rounded border"
                style={{ backgroundColor: data.color }}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Descuentos</span>
              <Badge variant={data.permiteDescuento ? 'default' : 'outline'}>
                {data.permiteDescuento ? 'Permitidos' : 'Bloqueados'}
              </Badge>
            </div>
            {data.codigoBarras && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cód. barras</span>
                <span className="font-mono text-xs">{data.codigoBarras}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {data.tipo === 'variantes' && data.variantes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Variantes ({data.variantes.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.variantes.map((v, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md border p-2"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-6 w-6 rounded"
                    style={{ backgroundColor: data.color || '#6B4226' }}
                  />
                  <div>
                    <p className="text-sm font-medium">{v.nombre}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {v.codigo}
                    </p>
                  </div>
                </div>
                <Badge>C$ {parseFloat(v.precio).toFixed(2)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}