import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  CreditCard,
  MapPin,
  Building2,
  FileText,
  ShieldCheck,
  Settings,
  ChevronRight,
  Users,
  Wallet,
} from 'lucide-react'

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Palette } from 'lucide-react' 

export const metadata = {
  title: 'Configuración | Momoto Café',
}

export default async function ConfiguracionPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('configuracion:gestionar')) {
    redirect('/dashboard')
  }

  const opciones = [
    {
      title: 'Identidad Visual (Branding)',
      description: 'Nombre de la empresa, colores y logotipo',
      href: '/configuracion/branding', 
      icon: Palette,
      color: 'from-primary/10 to-primary/5 border-primary/20',
      iconColor: 'text-primary',
    },
    {
      title: 'Configuración de Pagos',
      description: 'Bancos, métodos de pago, redes de tarjeta y tasa de cambio',
      href: '/configuracion/pagos',
      icon: CreditCard,
      color: 'from-blue-500/10 to-blue-600/5 border-blue-500/20',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Zonas de Entrega',
      description: 'Zonas y tarifas para pedidos a domicilio',
      href: '/configuracion/zonas-entrega',
      icon: MapPin,
      color: 'from-green-500/10 to-green-600/5 border-green-500/20',
      iconColor: 'text-green-600',
    },
    {
      title: 'Usuarios',
      description: 'Gestión de usuarios del sistema',
      href: '/usuarios',
      icon: Users,
      color: 'from-indigo-500/10 to-indigo-600/5 border-indigo-500/20',
      iconColor: 'text-indigo-600',
    },
    {
      title: 'Roles y Permisos',
      description: 'Configuración de roles y permisos',
      href: '/roles',
      icon: ShieldCheck,
      color: 'from-red-500/10 to-red-600/5 border-red-500/20',
      iconColor: 'text-red-600',
    },
    {
      title: 'Sucursales',
      description: 'Administra las sucursales del negocio',
      href: '/sucursales',
      icon: Building2,
      color: 'from-purple-500/10 to-purple-600/5 border-purple-500/20',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Cajas',
      description: 'Configuración de cajas por sucursal',
      href: '/configuracion/cajas',
      icon: Wallet,
      color: 'from-amber-500/10 to-amber-600/5 border-amber-500/20',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Roles y Permisos',
      description: 'Configuración de roles y permisos de acceso',
      href: '/roles',
      icon: ShieldCheck,
      color: 'from-red-500/10 to-red-600/5 border-red-500/20',
      iconColor: 'text-red-600',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Administra la configuración general del sistema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {opciones.map((op) => {
          const Icon = op.icon
          return (
            <Link key={op.href} href={op.href} className="group">
              <Card
                className={`h-full bg-gradient-to-br ${op.color} hover:shadow-md transition-all group-hover:-translate-y-0.5 cursor-pointer`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div
                      className={`rounded-lg bg-background/50 p-2 ${op.iconColor}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <CardTitle className="text-base mt-3">{op.title}</CardTitle>
                  <CardDescription className="text-xs">
                    {op.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}