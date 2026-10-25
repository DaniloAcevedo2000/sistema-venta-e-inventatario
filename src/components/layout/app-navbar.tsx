'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'

import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { ThemeToggle } from '@/components/theme-toggle'
import { NotificationsDropdown } from '@/components/layout/notifications-dropdown'

export function AppNavbar() {
  const pathname = usePathname()

  // Lógica para crear el Breadcrumb automáticamente
  const segments = pathname.split('/').filter(Boolean)
  
  const breadcrumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`
    const isLast = index === segments.length - 1
    // Formatear el texto: "configuracion" -> "Configuración"
    const label = segment
      .replace(/-/g, ' ')
      .replace(/^\w/, (c) => c.toUpperCase())

    return { href, label, isLast }
  })

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      
      <div className="flex flex-1 items-center justify-between">
        {/* BREADCRUMB DINÁMICO */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Inicio</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            
            {breadcrumbs.map((crumb, index) => {
              // Ocultar el primer "dashboard" porque ya lo pusimos como Inicio
              if (index === 0 && crumb.href === '/dashboard') return null

              return (
                <React.Fragment key={crumb.href}>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    {crumb.isLast ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={crumb.href}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>

        {/* ACCIONES (Campanita y Tema) */}
        <div className="flex items-center gap-1 sm:gap-2">
          
           <NotificationsDropdown />

          {/* Botón de Tema */}
          <ThemeToggle />
          
        </div>
      </div>
    </header>
  )
}