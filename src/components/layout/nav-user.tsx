'use client'

import Link from 'next/link'
import { ChevronsUpDown, LogOut, User, ShieldCheck } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

export function NavUser() {
  const { isMobile } = useSidebar()
  const { data: session } = useSession()

  const nombre = session?.user?.nombre ?? 'Usuario'
  const rolRaw = session?.user?.roles?.[0] ?? 'SIN ROL'
  const correo = session?.user?.correo ?? ''

  // Formatear el rol para que se vea bonito: "SUPER_ADMIN" -> "Super admin"
  const rolFormateado = rolRaw
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())

  const iniciales = nombre
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // Suponiendo que en tu sesión guardas el avatarUrl, 
  // si no lo tienes, puedes dejar solo las iniciales.
  const avatarUrl = (session?.user as any)?.avatarUrl 

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg border border-border">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={nombre} className="object-cover" />}
                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground font-semibold">
                  {iniciales}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{nombre}</span>
                <span className="truncate text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="h-3 w-3" />
                  {rolFormateado}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg border border-border">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={nombre} className="object-cover" />}
                  <AvatarFallback className="rounded-lg bg-primary text-primary-foreground font-semibold">
                    {iniciales}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{nombre}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {correo}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/perfil" className="cursor-pointer w-full">
                  <User className="mr-2 h-4 w-4" />
                  Mi perfil
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })} className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}