'use client'

import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, PackageCheck, XCircle, FileText, Eye } from 'lucide-react'
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

export type OrdenCompraRow = {
  id: string
  codigo: string
  proveedor: string
  sucursal: string
  estado: string
  fecha: string
  total: number
  itemsCount: number
}

function formatearMoneda(valor: number) {
  return `C$ ${valor.toFixed(2)}`
}

export const columnas: ColumnDef<OrdenCompraRow, any>[] = [
  {
    accessorKey: 'codigo',
    header: 'Código',
    cell: ({ row }) => <span className="font-mono font-medium text-xs">{row.original.codigo}</span>,
  },
  {
    accessorKey: 'proveedor',
    header: 'Proveedor',
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-sm">{row.original.proveedor}</p>
        <p className="text-xs text-muted-foreground">{row.original.sucursal}</p>
      </div>
    ),
  },
  {
    accessorKey: 'fecha',
    header: 'Fecha',
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.fecha}</span>,
  },
  {
    accessorKey: 'itemsCount',
    header: 'Ítems',
    cell: ({ row }) => <span className="text-sm">{row.original.itemsCount}</span>,
  },
  {
    accessorKey: 'total',
    header: 'Total',
    cell: ({ row }) => <span className="font-medium">{formatearMoneda(row.original.total)}</span>,
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => {
      const estado = row.original.estado
      if (estado === 'BORRADOR') return <Badge variant="secondary">Borrador</Badge>
      if (estado === 'RECIBIDA') return <Badge className="bg-green-600">Recibida</Badge>
      if (estado === 'CANCELADA') return <Badge variant="destructive">Cancelada</Badge>
      return <Badge>{estado}</Badge>
    },
    filterFn: (row, id, value) => row.original.estado === value,
  },
{
    id: 'acciones',
    cell: ({ row }) => { // Quitamos 'table' de aquí
      const router = useRouter()
      const o = row.original

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
            
            <DropdownMenuItem onClick={() => router.push(`/compras/${o.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalle
            </DropdownMenuItem>

            {/* Ya no hace falta poner botones aquí, porque la recepción ahora se hace 
                en la vista de detalle, pero puedes dejarlo si quieres un atajo */}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]