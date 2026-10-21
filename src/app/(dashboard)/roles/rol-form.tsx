'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Save, Shield, CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { crearRolAction, actualizarRolAction } from './actions'

type Permiso = { id: string; codigo: string; nombre: string; grupo: string }

type Rol = {
  id: string
  nombre: string
  descripcion: string | null
  activo: boolean
  permisos: { permisoId: string }[]
}

type Props = {
  permisosAgrupados: Record<string, Permiso[]>
  initialData?: Rol | null
}

export function RolForm({ permisosAgrupados, initialData }: Props) {
  const router = useRouter()
  const [isPending, setIsPending] = React.useState(false)
  
  // Inicializamos los estados con los datos del rol (si existen)
  const [permisosSeleccionados, setPermisosSeleccionados] = React.useState<string[]>(
    initialData?.permisos.map(p => p.permisoId) || []
  )
  const [activo, setActivo] = React.useState(initialData?.activo ?? true)

  const togglePermiso = (id: string) => {
    setPermisosSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const toggleGrupo = (grupoPermisos: Permiso[]) => {
    const ids = grupoPermisos.map(p => p.id)
    const todosSeleccionados = ids.every(id => permisosSeleccionados.includes(id))
    
    if (todosSeleccionados) {
      setPermisosSeleccionados(prev => prev.filter(id => !ids.includes(id)))
    } else {
      setPermisosSeleccionados(prev => [...new Set([...prev, ...ids])])
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    
    const formData = new FormData(e.currentTarget)
    formData.append('activo', activo ? 'on' : 'off')
    permisosSeleccionados.forEach(id => formData.append('permisos', id))

    let res
    if (initialData) {
      res = await actualizarRolAction(initialData.id, formData)
    } else {
      res = await crearRolAction(formData)
    }
    
    if (res.success) {
      toast.success(initialData ? 'Rol actualizado' : 'Rol creado')
      router.push('/roles')
    } else {
      toast.error(res.error)
    }
    setIsPending(false)
  }

  const totalPermisos = Object.values(permisosAgrupados).flat().length

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-6xl mx-auto">
      
      {/* Columna Izquierda */}
      <div className="md:col-span-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Detalles del Rol</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre del Rol <span className="text-destructive">*</span></Label>
              <Input name="nombre" defaultValue={initialData?.nombre} required placeholder="Ej: Cajero" />
            </div>
            
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea name="descripcion" defaultValue={initialData?.descripcion || ''} placeholder="Funciones de este rol..." rows={4} />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
              <div>
                <Label className="text-base">Estado</Label>
                <p className="text-xs text-muted-foreground">¿Rol activo?</p>
              </div>
              <Switch checked={activo} onCheckedChange={setActivo} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.push('/roles')} className="flex-1">
            <ArrowLeft className="mr-2 h-4 w-4" /> Cancelar
          </Button>
          <Button type="submit" disabled={isPending} className="flex-1">
            <Save className="mr-2 h-4 w-4" /> Guardar
          </Button>
        </div>
      </div>

      {/* Columna Derecha (Acordeón) */}
      <div className="md:col-span-8">
        <Card className="h-full flex flex-col">
          <CardHeader className="border-b bg-muted/20 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">Asignación de Permisos</CardTitle>
              <CardDescription>Expande los módulos para seleccionar las acciones.</CardDescription>
            </div>
            <Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary border-primary/20">
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              {permisosSeleccionados.length} de {totalPermisos}
            </Badge>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4">
            <Accordion type="multiple" className="w-full space-y-2">
              {Object.entries(permisosAgrupados).map(([grupo, permisos]) => {
                const seleccionadosDelGrupo = permisos.filter(p => permisosSeleccionados.includes(p.id)).length
                
                return (
                  <AccordionItem key={grupo} value={grupo} className="border rounded-lg bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center justify-between w-full pr-4">
                        <span className="font-semibold text-sm">{grupo}</span>
                        <Badge variant={seleccionadosDelGrupo > 0 ? "default" : "secondary"} className="text-xs">
                          {seleccionadosDelGrupo} / {permisos.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4">
                      <div className="flex items-center justify-end mb-2">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => toggleGrupo(permisos)}
                          className="h-7 text-xs"
                        >
                          {seleccionadosDelGrupo === permisos.length ? 'Desmarcar todo' : 'Marcar todo'}
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {permisos.map((permiso) => (
                          <div key={permiso.id} className="flex items-start space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                            <Checkbox
                              id={permiso.id}
                              checked={permisosSeleccionados.includes(permiso.id)}
                              onCheckedChange={() => togglePermiso(permiso.id)}
                              className="mt-0.5"
                            />
                            <Label htmlFor={permiso.id} className="text-sm font-normal leading-tight cursor-pointer flex-1">
                              {permiso.nombre}
                              <span className="block text-[10px] text-muted-foreground font-mono mt-0.5">{permiso.codigo}</span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}