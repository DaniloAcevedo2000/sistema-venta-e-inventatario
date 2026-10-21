'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { actualizarBrandingAction } from '../actions'

export function BrandingForm({ initialNombre }: { initialNombre: string }) {
  const [isPending, setIsPending] = React.useState(false)
  const [nombre, setNombre] = React.useState(initialNombre)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)

    // Creamos un formData manual para llamar a la acción existente
    const formData = new FormData()
    formData.append('nombreEmpresa', nombre)

    const res = await actualizarBrandingAction(undefined, formData)

    if (res.success) {
      toast.success('Nombre actualizado')
      window.location.reload()
    } else {
      toast.error(res.error || 'Error al guardar')
    }
    setIsPending(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Nombre Comercial</CardTitle>
          <CardDescription>
            Este nombre aparecerá en el menú lateral y en los reportes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre de la Empresa</Label>
            <Input 
              value={nombre} 
              onChange={e => setNombre(e.target.value)} 
              placeholder="Ej: Cafetería Central" 
              required 
            />
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end mt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar Nombre
        </Button>
      </div>
    </form>
  )
}