import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma' 
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppNavbar } from '@/components/layout/app-navbar'
import { FloatingAssistant } from '@/components/layout/floating-assistant' 
import { TooltipProvider } from '@/components/ui/tooltip'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  // Consultamos las sucursales activas en la base de datos
  const sucursalesDB = await prisma.sucursal.findMany({
    where: { activa: true },
    select: { id: true, nombre: true, codigo: true },
    orderBy: { nombre: 'asc' }
  })

  return (

    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <AppSidebar sucursales={sucursalesDB} />
        
        <SidebarInset className="flex flex-col w-full min-w-0 bg-muted/30">
          <AppNavbar />
          <main className="flex-1 w-full p-4 md:p-6 lg:p-8 overflow-x-hidden">
            {children}
          </main>
        </SidebarInset>

        <FloatingAssistant />
      </SidebarProvider>
    </TooltipProvider>
  )
}