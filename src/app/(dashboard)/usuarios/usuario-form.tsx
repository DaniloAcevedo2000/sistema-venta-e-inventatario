'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Save, User, Mail, Phone, Key, Building2, Shield } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { crearUsuarioAction, actualizarUsuarioAction } from './actions'

type Rol = { id: string; nombre: string }
type Sucursal = { id: string; nombre: string }

type UsuarioData = {
  id?: string
  nombre: string
  correo: string
  telefono: string | null
  sucursalId: string | null
  rolId: string | null
  activo: boolean
}

type Props = {
  roles: Rol[]
  sucursales: Sucursal[]
  initialData?: UsuarioData | null
}

export function UsuarioForm({ roles, sucursales, initialData }: Props) {
  const router = useRouter()
  const [isPending, setIsPending] = React.useState(false)
  
  // Estados controlados
  const [activo, setActivo] = React.useState(initialData?.activo ?? true)
  const [sucursalId, setSucursalId] = React.useState(initialData?.sucursalId || 'todas')
  const [rolId, setRolId] = React.useState(initialData?.rolId || '')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    
    const formData = new FormData(e.currentTarget)
    formData.append('activo', activo ? 'on' : 'off')
    formData.append('sucursalId', sucursalId === 'todas' ? '' : sucursalId)
    formData.append('rolId', rolId)

    const res = initialData?.id
      ? await actualizarUsuarioAction(initialData.id, formData)
      : await crearUsuarioAction(formData)

    if (res.success) {
      toast.success(initialData ? 'Usuario actualizado' : 'Usuario creado')
      router.push('/usuarios')
    } else {
      toast.error(res.error)
    }
    setIsPending(false)
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-5xl mx-auto">
      
      {/* Columna Izquierda: Datos Personales */}
      <div className="md:col-span-7 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Datos Personales</CardTitle>
            <CardDescription>Información básica para identificar al usuario.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre Completo <span className="text-destructive">*</span></Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input name="nombre" defaultValue={initialData?.nombre} required placeholder="Ej: Juan Pérez" className="pl-9" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Correo Electrónico <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input name="correo" type="email" defaultValue={initialData?.correo} required placeholder="juan@momoto.cafe" className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input name="telefono" defaultValue={initialData?.telefono || ''} placeholder="8888-8888" className="pl-9" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Contraseña {initialData ? '(dejar en blanco para no cambiar)' : <span className="text-destructive">*</span>}</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input name="contrasena" type="password" required={!initialData} placeholder="••••••••" className="pl-9" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Columna Derecha: Acceso y Configuración */}
      <div className="md:col-span-5 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Acceso al Sistema</CardTitle>
            <CardDescription>Define los permisos y la ubicación del usuario.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="space-y-2">
              <Label>Rol Asignado <span className="text-destructive">*</span></Label>
              <Select value={rolId} onValueChange={setRolId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sucursal Base</Label>
              <Select value={sucursalId} onValueChange={setSucursalId}>
                <SelectTrigger>
                  <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Sucursal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Acceso Global (Todas)</SelectItem>
                  {sucursales.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30 mt-4">
              <div>
                <Label className="text-base">Estado</Label>
                <p className="text-xs text-muted-foreground">¿El usuario puede iniciar sesión?</p>
              </div>
              <Switch checked={activo} onCheckedChange={setActivo} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.push('/usuarios')} className="flex-1">
            <ArrowLeft className="mr-2 h-4 w-4" /> Cancelar
          </Button>
          <Button type="submit" disabled={isPending} className="flex-1">
            <Save className="mr-2 h-4 w-4" /> Guardar
          </Button>
        </div>
      </div>
    </form>
  )
}