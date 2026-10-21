'use client'

import * as React from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Save, Palette, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { actualizarBrandingAction } from './actions'

type ActionState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
      Guardar Cambios
    </Button>
  )
}

export function BrandingCard({ initialData }: { initialData: any }) {
  const [state, formAction] = useActionState<ActionState | undefined, FormData>(
    actualizarBrandingAction,
    undefined
  )

  React.useEffect(() => {
    if (state?.success) {
      toast.success('Identidad visual actualizada')
      // Forzamos recarga para que el layout lea los nuevos colores
      window.location.reload()
    }
    if (state?.error) toast.error(state.error)
  }, [state])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" /> Identidad Visual (Branding)
        </CardTitle>
        <CardDescription>
          Cambia el nombre de la empresa y los colores base del sistema. Los cambios se aplicarán a toda la aplicación.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <div className="space-y-2">
            <Label>Nombre de la Empresa</Label>
            <Input 
              name="nombreEmpresa" 
              defaultValue={initialData.nombreEmpresa} 
              placeholder="Ej: Momoto Café"
              required 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>Color Primario (Café)</Label>
              <div className="flex gap-2">
                <Input type="color" name="primary" className="w-14 h-10 p-1 cursor-pointer" defaultValue={initialData.primary} />
                <Input defaultValue={initialData.primary} disabled />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Texto sobre Primario (Crema)</Label>
              <div className="flex gap-2">
                <Input type="color" name="primaryForeground" className="w-14 h-10 p-1 cursor-pointer" defaultValue={initialData.primaryForeground} />
                <Input defaultValue={initialData.primaryForeground} disabled />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Color de Acento (Caramelo)</Label>
              <div className="flex gap-2">
                <Input type="color" name="accent" className="w-14 h-10 p-1 cursor-pointer" defaultValue={initialData.accent} />
                <Input defaultValue={initialData.accent} disabled />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Color de Fondo</Label>
              <div className="flex gap-2">
                <Input type="color" name="background" className="w-14 h-10 p-1 cursor-pointer" defaultValue={initialData.background} />
                <Input defaultValue={initialData.background} disabled />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <SubmitButton />
          </div>
        </form>
      </CardContent>
    </Card>
  )
}