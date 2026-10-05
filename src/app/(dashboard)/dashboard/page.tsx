import { auth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, ShoppingCart, Users, Package } from 'lucide-react'

export default async function DashboardPage() {
  const session = await auth()

  const kpis = [
    { title: 'Ventas Hoy', value: 'C$ 0.00', icon: DollarSign, trend: '+0%' },
    { title: 'Órdenes', value: '0', icon: ShoppingCart, trend: '+0%' },
    { title: 'Clientes', value: '0', icon: Users, trend: '+0%' },
    { title: 'Productos', value: '0', icon: Package, trend: '+0%' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Bienvenido, {session?.user?.nombre}
        </h1>
        <p className="text-muted-foreground">
          {session?.user?.sucursalNombre ?? 'Sin sucursal asignada'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">{kpi.trend} vs ayer</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actividad reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Las últimas ventas aparecerán aquí cuando el módulo POS esté implementado.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}