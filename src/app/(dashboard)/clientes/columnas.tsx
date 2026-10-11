'use client'

import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Power, Eye, Ban } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type ClienteRow = {
  id: string
  codigo: string
  nombre: string
  apellido: string | null
  nombreComercial: string | null
  tipoDocumento: string | null
  numeroDocumento: string | null
  telefono: string | null
  correo: string | null
  direccion: string | null
  permiteCredito: boolean
  limiteCredito: number
  saldoActual: number
  activo: boolean
  cantidadVentas: number
  ultimaCompra: string | null
  motivoCambio: string | null
  desactivadoEn: string | null
}

function formatearMoneda(valor: number) {
  return `C$ ${valor.toFixed(2)}`
}

const TIPO_DOC_LABEL: Record<string, string> = {
  CEDULA: 'Cédula',
  RUC: 'RUC',
  PASAPORTE: 'Pasaporte',
  NINGUNO: '—',
}

export const columnas: ColumnDef<ClienteRow, any>[] = [
  {
    accessorKey: 'codigo',
    header: 'Código',
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.codigo}</span>
    ),
  },
  {
    accessorKey: 'nombre',
    header: 'Cliente',
    cell: ({ row }) => {
      const c = row.original
      const nombreCompleto = c.nombreComercial
        ? c.nombreComercial
        : `${c.nombre} ${c.apellido ?? ''}`.trim()

      return (
        <div>
          <p className="font-medium text-sm">{nombreCompleto}</p>
          {c.numeroDocumento && (
            <p className="text-xs text-muted-foreground">
              {TIPO_DOC_LABEL[c.tipoDocumento ?? '']}: {c.numeroDocumento}
            </p>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'telefono',
    header: 'Contacto',
    cell: ({ row }) => (
      <div className="text-sm">
        {row.original.telefono && <p>{row.original.telefono}</p>}
        {row.original.correo && (
          <p className="text-xs text-muted-foreground">{row.original.correo}</p>
        )}
        {!row.original.telefono && !row.original.correo && (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>
    ),
  },
  {
    id: 'credito',
    header: 'Crédito',
    cell: ({ row }) => {
      const c = row.original
      if (!c.permiteCredito) {
        return (
          <Badge variant="outline" className="text-xs">
            Sin crédito
          </Badge>
        )
      }
      return (
        <div className="space-y-1">
          <Badge variant="secondary" className="text-xs">
            Límite: {formatearMoneda(c.limiteCredito)}
          </Badge>
        </div>
      )
    },
  },
  {
    id: 'saldo',
    header: 'Saldo',
    cell: ({ row }) => {
      const saldo = row.original.saldoActual
      if (saldo <= 0.01) {
        return <span className="text-xs text-muted-foreground">Al día ✓</span>
      }
      return (
        <Badge variant="destructive" className="font-mono">
          {formatearMoneda(saldo)}
        </Badge>
      )
    },
  },
  {
    id: 'ventas',
    accessorFn: (row) => row.cantidadVentas,
    header: 'Compras',
    cell: ({ row }) => (
      <div className="text-sm">
        <p className="font-medium">{row.original.cantidadVentas}</p>
        {row.original.ultimaCompra && (
          <p className="text-xs text-muted-foreground">
            {row.original.ultimaCompra}
          </p>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'activo',
    header: 'Estado',
    cell: ({ row }) => (
      <Badge variant={row.original.activo ? 'default' : 'secondary'}>
        {row.original.activo ? 'Activo' : 'Inactivo'}
      </Badge>
    ),
    filterFn: (row, id, value) => row.original.activo === value,
  },
  {
    id: 'acciones',
    cell: ({ row, table }) => {
      const cliente = row.original
      const meta = table.options.meta as {
        onVerDetalle?: (c: ClienteRow) => void
        onToggleActivo?: (id: string, nombre: string, activoActual: boolean) => void
        onAbono?: (c: ClienteRow) => void
        permisos?: string[]
      }
      const permisos = meta.permisos ?? []
      const puedeEditar = permisos.includes('clientes:editar')
      const puedeGestionarCreditos = permisos.includes('creditos:gestionar')
      const tieneSaldo = cliente.saldoActual > 0.01

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => meta.onVerDetalle?.(cliente)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalle
            </DropdownMenuItem>

            {puedeEditar && (
              <DropdownMenuItem asChild>
                <Link href={`/clientes/${cliente.id}`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
            )}

            {puedeGestionarCreditos &&
              cliente.permiteCredito &&
              tieneSaldo && (
                <DropdownMenuItem onClick={() => meta.onAbono?.(cliente)}>
                  <Ban className="mr-2 h-4 w-4 text-green-600" />
                  <span className="text-green-600">Registrar abono</span>
                </DropdownMenuItem>
              )}

            {puedeEditar && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    meta.onToggleActivo?.(
                      cliente.id,
                      cliente.nombreComercial || cliente.nombre,
                      cliente.activo
                    )
                  }
                >
                  <Power className="mr-2 h-4 w-4" />
                  {cliente.activo ? 'Desactivar' : 'Activar'}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]