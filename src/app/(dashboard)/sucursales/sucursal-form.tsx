'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Save, Building2, MapPin, Phone, Mail } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { crearSucursalAction, actualizarSucursalAction } from './actions'

type SucursalData = {
  id?: string
  nombre: string
  direccion: string | null
  telefono: string | null
  correo: string | null
  activa: boolean
}

export function SucursalForm({ initialData }: { initialData?: SucursalData | null }) {
  const router = useRouter()
  const [isPending, setIsPending] = React.useState(false)
  const [activa, setActiva] = React.useState(initialData?.activa ?? true)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    
    const formData = new FormData(e.currentTarget)
    formData.append('activa', activa ? 'on' : 'off')

    const res = initialData?.id
      ? await actualizarSucursalAction(initialData.id, formData)
      : await crearSucursalAction(formData)

    if (res.success) {
      toast.success(initialData ? 'Sucursal actualizada' : 'Sucursal creada')
      router.push('/sucursales')
    } else {
      toast.error(res.error)
    }
    setIsPending(false)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Información de la Sucursal</CardTitle>
          <CardDescription>Datos generales del local.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="space-y-2">
            <Label>Nombre de la Sucursal <span className="text-destructive">*</span></Label>
            <Input name="nombre" defaultValue={initialData?.nombre} required placeholder="Ej: Momoto Café Las Aldeas" />
          </div>

          <div className="space-y-2">
            <Label>Dirección</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input name="direccion" defaultValue={initialData?.direccion || ''} placeholder="Dirección exacta" className="pl-9" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input name="telefono" defaultValue={initialData?.telefono || ''} placeholder="8888-8888" className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input name="correo" type="email" defaultValue={initialData?.correo || ''} placeholder="local@momoto.cafe" className="pl-9" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30 mt-4">
            <div>
              <Label className="text-base">Estado de la Sucursal</Label>
              <p className="text-xs text-muted-foreground">Las sucursales inactivas no aparecerán en el sistema.</p>
            </div>
            <Switch checked={activa} onCheckedChange={setActiva} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push('/sucursales')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          <Save className="mr-2 h-4 w-4" /> {initialData ? 'Guardar Cambios' : 'Crear Sucursal'}
        </Button>
      </div>
    </form>
  )
}