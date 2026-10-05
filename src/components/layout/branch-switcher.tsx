'use client'

import { Building2, Check, ChevronsUpDown } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useState } from 'react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

// Temporal: en el futuro esto vendrá de la BD
const sucursales = [
  { id: '1', nombre: 'Las Aldeas', codigo: 'CENTRAL' },
  { id: '2', nombre: 'Plaza Natura', codigo: 'NATURA' },
]

export function BranchSwitcher() {
  const { data: session } = useSession()
  const [sucursalActiva, setSucursalActiva] = useState(session?.user?.sucursalId ?? '1')

  // Solo mostrar si el usuario tiene acceso a múltiples sucursales
  const roles = session?.user?.roles ?? []
  const puedeVerTodas = roles.includes('SUPER_ADMIN') || roles.includes('ADMIN')

  if (!puedeVerTodas) return null

  const actual = sucursales.find((s) => s.id === sucursalActiva)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Building2 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{actual?.nombre}</span>
                <span className="truncate text-xs text-muted-foreground">Sucursal activa</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Sucursales
            </DropdownMenuLabel>
            {sucursales.map((sucursal) => (
              <DropdownMenuItem
                key={sucursal.id}
                onClick={() => setSucursalActiva(sucursal.id)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <Building2 className="size-3.5 shrink-0" />
                </div>
                {sucursal.nombre}
                {sucursalActiva === sucursal.id && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}