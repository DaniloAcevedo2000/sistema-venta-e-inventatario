import { prisma } from '@/lib/prisma'
import { BrandingForm } from './branding-form'

export default async function BrandingPage() {
  const config = await prisma.configuracion.findUnique({
    where: { clave: 'app.nombre' }
  })

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Identidad Visual</h1>
        <p className="text-muted-foreground">Configura el nombre de tu empresa.</p>
      </div>
      <BrandingForm initialNombre={config?.valor || 'Momoto Café'} />
    </div>
  )
}