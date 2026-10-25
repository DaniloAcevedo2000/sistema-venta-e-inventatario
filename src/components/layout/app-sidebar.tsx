'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Coffee, ChevronRight } from 'lucide-react'
import { useSession } from 'next-auth/react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { navGroups } from '@/config/nav'
import { NavUser } from './nav-user'
import { BranchSwitcher, SucursalItem } from './branch-switcher' // Importamos SucursalItem

// 👇 1. Agregamos la prop 'sucursales' a la firma del componente
export function AppSidebar({ sucursales, ...props }: { sucursales: SucursalItem[] } & React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const permisos = session?.user?.permisos ?? []

  // Filtrar grupos y items según permisos
  const gruposFiltrados = navGroups
    .map((grupo) => ({
      ...grupo,
      items: grupo.items.filter((item) => permisos.includes(item.permission)),
    }))
    .filter((grupo) => grupo.items.length > 0)

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Coffee className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Momoto Café</span>
                  <span className="truncate text-xs text-muted-foreground">Sistema de Ventas</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        {/* 👇 2. Le pasamos las sucursales al BranchSwitcher */}
        <BranchSwitcher sucursales={sucursales} />
      </SidebarHeader>

      <SidebarContent>
        {gruposFiltrados.map((grupo) => (
          <SidebarGroup key={grupo.title}>
            <SidebarGroupLabel>{grupo.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {grupo.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}