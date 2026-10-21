'use client'

import * as React from 'react'
import { Building2, Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation' 
import { toast } from 'sonner'

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
import { cambiarSucursalAction } from '@/app/(dashboard)/sucursales/actions'

export type SucursalItem = {
  id: string
  nombre: string
  codigo: string
}

export function BranchSwitcher({ sucursales = [] }: { sucursales?: SucursalItem[] }) {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  const roles = session?.user?.roles ?? []
  const puedeVerTodas = roles.includes('SUPER_ADMIN') || roles.includes('ADMIN')

  if (!puedeVerTodas || !sucursales || sucursales.length <= 1) return null

  const sucursalActivaId = session?.user?.sucursalId
  const actual = sucursales.find((s) => s.id === sucursalActivaId)

  const handleSelect = (id: string) => {
    if (id === sucursalActivaId) return

    startTransition(async () => {
      const res = await cambiarSucursalAction(id)
      if (res.success) {
        // 1. Actualizamos el token de NextAuth
        await update({ sucursalId: res.sucursalId })
        
        toast.success(`Sucursal cambiada a ${sucursales.find(s => s.id === id)?.nombre}`)
        
        // 2. Refrescamos la ruta actual para que el servidor vuelva a consultar con el nuevo ID
        router.refresh()
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              disabled={isPending}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Building2 className="size-4" />}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{actual?.nombre || 'Seleccionar...'}</span>
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
              Sucursales disponibles
            </DropdownMenuLabel>
            {sucursales.map((sucursal) => (
              <DropdownMenuItem
                key={sucursal.id}
                onClick={() => handleSelect(sucursal.id)}
                className="gap-2 p-2 cursor-pointer"
                disabled={isPending}
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <Building2 className="size-3.5 shrink-0" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">{sucursal.nombre}</span>
                  <span className="text-xs text-muted-foreground">{sucursal.codigo}</span>
                </div>
                {sucursalActivaId === sucursal.id && <Check className="ml-auto h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}