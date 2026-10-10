'use client'

import * as React from 'react'
import * as Icons from 'lucide-react'
import { Search, X, Wallet, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { usePosStore } from '@/lib/stores/pos-store'
import { OrdenPanel } from './orden-panel'
import { VarianteSelector } from './variante-selector'

type Categoria = {
  id: string
  nombre: string
  icono: string | null
  color: string | null
  padreId: string | null
}

type Variante = {
  id: string
  codigo: string
  nombre: string
  precio: string
  orden: number
}

type Producto = {
  id: string
  codigo: string
  nombre: string
  precioBase: string
  tipo: string
  tipoImpuesto: string
  imagenUrl: string | null
  color: string | null
  destacado: boolean
  permiteDescuento: boolean
  categoriaId: string
  categoriaNombre: string
  variantes: Variante[]
}

type Usuario = {
  id: string
  nombre: string
  sucursalId: string | null
  sucursalNombre: string | null
  permisos: string[]
}

export type MetodoPagoConfig = {
  id: string
  codigo: string
  nombre: string
  tipo: string
  requiereBanco: boolean
  requiereRed: boolean
  requiereReferencia: boolean
  esCredito: boolean
  icono: string | null
  monedaCodigo: string
  monedaSimbolo: string
}

export type BancoConfig = {
  id: string
  codigo: string
  nombre: string
  nombreCorto: string | null
}

export type RedTarjetaConfig = {
  id: string
  codigo: string
  nombre: string
}

export type SesionCajaInfo = {
  id: string
  cajaNombre: string
  cajaCodigo: string
  fechaApertura: string
  montoInicial: number
}

type Props = {
  categorias: Categoria[]
  productos: Producto[]
  usuario: Usuario
  tasaCambio: number
  metodosPago: MetodoPagoConfig[]
  bancos: BancoConfig[]
  redesTarjeta: RedTarjetaConfig[]
  sesionCajaAbierta: SesionCajaInfo | null
}

export function PosInterface({
  categorias,
  productos,
  usuario,
  tasaCambio,
  metodosPago,
  bancos,
  redesTarjeta,
  sesionCajaAbierta,
}: Props) {
  const [categoriaActiva, setCategoriaActiva] = React.useState<string | null>(null)
  const [busqueda, setBusqueda] = React.useState('')
  const [varianteProducto, setVarianteProducto] = React.useState<Producto | null>(null)

  const agregarItem = usePosStore((s) => s.agregarItem)

  // ============================================
  // BLOQUEAR SI NO HAY CAJA ABIERTA
  // ============================================
  if (!sesionCajaAbierta) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30 p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center mb-3">
              <Wallet className="h-8 w-8 text-amber-600" />
            </div>
            <CardTitle>No tienes una caja abierta</CardTitle>
            <CardDescription>
              Para empezar a vender, primero debes abrir una caja en el módulo
              de Caja.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full" size="lg">
              <Link href="/caja">
                <Wallet className="mr-2 h-4 w-4" />
                Ir a Caja
              </Link>
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Sin una caja abierta no es posible registrar ventas.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ============================================
  // Filtrado
  // ============================================
  const categoriasPrincipales = categorias.filter((c) => !c.padreId)
  const subcategorias = categoriaActiva
    ? categorias.filter((c) => c.padreId === categoriaActiva)
    : []

  const productosFiltrados = React.useMemo(() => {
    let filtrados = productos

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      filtrados = filtrados.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.codigo.toLowerCase().includes(q)
      )
    } else if (categoriaActiva) {
      const idsCategoria = [categoriaActiva]
      const subcats = categorias.filter((c) => c.padreId === categoriaActiva)
      subcats.forEach((s) => idsCategoria.push(s.id))
      filtrados = filtrados.filter((p) => idsCategoria.includes(p.categoriaId))
    }

    return filtrados
  }, [productos, categoriaActiva, categorias, busqueda])

  // ============================================
  // Click en producto
  // ============================================
  const handleClickProducto = (producto: Producto) => {
    if (producto.tipo === 'variantes' && producto.variantes.length > 0) {
      setVarianteProducto(producto)
    } else {
      agregarItem({
        productoId: producto.id,
        varianteId: null,
        codigo: producto.codigo,
        nombre: producto.nombre,
        nombreVariante: null,
        precioUnitario: parseFloat(producto.precioBase),
        cantidad: 1,
        descuento: 0,
        tipoImpuesto: producto.tipoImpuesto,
        notas: '',
        imagenUrl: producto.imagenUrl,
        color: producto.color,
      })
    }
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* ============================================
          Columna izquierda
          ============================================ */}
      <div className="flex-1 flex flex-col overflow-hidden border-r">
        {/* Barra de búsqueda */}
        <div className="p-4 border-b bg-background">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar producto por nombre o código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9 h-11"
            />
            {busqueda && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setBusqueda('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Grid de categorías */}
        {!busqueda && (
          <div className="p-4 border-b bg-background">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Button
                variant={categoriaActiva === null ? 'default' : 'outline'}
                size="sm"
                className="shrink-0"
                onClick={() => setCategoriaActiva(null)}
              >
                Todas
              </Button>
              {categoriasPrincipales.map((cat) => {
                const Icon = cat.icono
                  ? (Icons[cat.icono as keyof typeof Icons] as React.ComponentType<{ className?: string }>)
                  : null
                const isActive = categoriaActiva === cat.id

                return (
                  <Button
                    key={cat.id}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    className="shrink-0 gap-2"
                    onClick={() => setCategoriaActiva(isActive ? null : cat.id)}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {cat.nombre}
                  </Button>
                )
              })}
            </div>

            {subcategorias.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 mt-2">
                {subcategorias.map((sub) => (
                  <Button
                    key={sub.id}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'shrink-0 text-xs h-7',
                      categoriaActiva === sub.id && 'bg-primary/10'
                    )}
                    onClick={() => setCategoriaActiva(sub.id)}
                  >
                    {sub.nombre}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Grid de productos */}
        <div className="flex-1 overflow-y-auto p-4">
          {productosFiltrados.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <p className="text-lg font-medium">No hay productos</p>
                <p className="text-sm">
                  {busqueda
                    ? 'No se encontraron productos con esa búsqueda'
                    : 'Selecciona otra categoría'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {productosFiltrados.map((producto) => (
                <ProductoCard
                  key={producto.id}
                  producto={producto}
                  onClick={() => handleClickProducto(producto)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============================================
          Columna derecha
          ============================================ */}
      <div className="w-[380px] flex flex-col bg-background">
        <OrdenPanel
          usuario={usuario}
          tasaCambio={tasaCambio}
          metodosPago={metodosPago}
          bancos={bancos}
          redesTarjeta={redesTarjeta}
          sesionCajaAbierta={sesionCajaAbierta}
        />
      </div>

      <VarianteSelector
        producto={varianteProducto}
        open={!!varianteProducto}
        onOpenChange={(open) => !open && setVarianteProducto(null)}
      />
    </div>
  )
}

// ============================================
// Card de producto
// ============================================
function ProductoCard({
  producto,
  onClick,
}: {
  producto: Producto
  onClick: () => void
}) {
  const precio = parseFloat(producto.precioBase)
  const tieneVariantes = producto.tipo === 'variantes' && producto.variantes.length > 0

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex flex-col items-start gap-2 rounded-xl border-2 bg-card p-3 text-left transition-all',
        'hover:border-primary hover:shadow-md active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-primary'
      )}
    >
      <div
        className="h-20 w-full rounded-lg flex items-center justify-center overflow-hidden"
        style={{
          backgroundColor: producto.imagenUrl ? undefined : producto.color || '#6B4226',
        }}
      >
        {producto.imagenUrl ? (
          <img
            src={producto.imagenUrl}
            alt={producto.nombre}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-2xl font-bold text-white">
            {producto.nombre.charAt(0)}
          </span>
        )}
      </div>

      <div className="w-full">
        <p className="font-medium text-sm line-clamp-2 leading-tight">
          {producto.nombre}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="font-bold text-primary">C$ {precio.toFixed(2)}</span>
          {tieneVariantes && (
            <Badge variant="secondary" className="text-xs">
              {producto.variantes.length} var.
            </Badge>
          )}
        </div>
      </div>

      {producto.destacado && (
        <div className="absolute top-1 right-1">
          <Icons.Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
        </div>
      )}
    </button>
  )
}