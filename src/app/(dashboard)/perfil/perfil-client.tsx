'use client'

import * as React from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { 
  Loader2, Camera, ShieldCheck, Mail, Phone, 
  Building2, User, KeyRound, Save, AlignLeft
} from 'lucide-react'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { useSession } from 'next-auth/react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { actualizarPerfilAction, cambiarContrasenaAction } from './actions'
// 🔴 IMPORTAMOS EL HOOK DE UPLOADTHING
import { useUploadThing } from '@/components/uploadthing' 

type Props = {
  usuario: {
    id: string
    nombre: string
    correo: string
    telefono: string
    biografia: string
    avatarUrl: string | null
    sucursalNombre: string
    roles: string[]
  }
}

function SubmitButton({ text }: { text: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : <><Save className="mr-2 h-4 w-4" /> {text}</>}
    </Button>
  )
}

export function PerfilClient({ usuario }: Props) {
  const [statePerfil, formPerfil] = useActionState(actualizarPerfilAction, undefined)
  const [statePass, formPass] = useActionState(cambiarContrasenaAction, undefined)
  
  const [avatar, setAvatar] = React.useState(usuario.avatarUrl)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const { update } = useSession()

  const [telefono, setTelefono] = React.useState<string | undefined>(
    usuario.telefono || '+505'
  )
  const [biografia, setBiografia] = React.useState(usuario.biografia || '')

  React.useEffect(() => {
    if (statePerfil?.success) toast.success('Perfil actualizado correctamente')
    if (statePerfil?.error) toast.error(statePerfil.error)
  }, [statePerfil])

  React.useEffect(() => {
    if (statePass?.success) {
      toast.success('Contraseña cambiada con éxito')
      ;(document.getElementById('form-pass') as HTMLFormElement)?.reset()
    }
    if (statePass?.error) toast.error(statePass.error)
  }, [statePass])

  // 🔴 CONFIGURACIÓN DE UPLOADTHING
  const { startUpload, isUploading } = useUploadThing("avatarUploader", {
    onClientUploadComplete: async (res) => {
      if (res && res[0]) {
        setAvatar(res[0].url)
        toast.success('Foto actualizada correctamente')
        // Actualizamos la sesión para que la foto cambie en el NavUser
        await update({ avatarUrl: res[0].url })
      }
    },
    onUploadError: (error: Error) => {
      toast.error(`Error al subir la foto: ${error.message}`)
    },
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Iniciamos la subida
    await startUpload([file])
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      
      {/* COLUMNA IZQUIERDA: Tarjeta de Perfil */}
      <div className="md:col-span-4 space-y-6">
        <Card className="border-border bg-card shadow-sm overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary/20 to-accent/20" />
          <CardContent className="px-6 pb-6 relative">
            
            <div className="absolute -top-12 left-6">
              <div 
                className="h-24 w-24 rounded-full border-4 border-card bg-muted flex items-center justify-center overflow-hidden relative group cursor-pointer shadow-lg"
                onClick={() => fileInputRef.current?.click()}
              >
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-muted-foreground">
                    {usuario.nombre.charAt(0)}
                  </span>
                )}
                
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px]">
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <><Camera className="h-5 w-5 mb-1" /> Cambiar</>
                  )}
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
            </div>

            <div className="mt-14">
              <h2 className="text-xl font-bold text-foreground">{usuario.nombre}</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                <Mail className="h-3.5 w-3.5" /> {usuario.correo}
              </p>
              
              <div className="flex flex-wrap gap-2 mt-4">
                {usuario.roles.map(rol => (
                  <Badge key={rol} className="bg-primary/10 text-primary hover:bg-primary/20 capitalize border-primary/20 shadow-none">
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    {rol.toLowerCase().replace('_', ' ')}
                  </Badge>
                ))}
              </div>

              <Separator className="my-5" />

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="p-1.5 bg-muted rounded-md"><Building2 className="h-4 w-4" /></div>
                  <span>{usuario.sucursalNombre}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="p-1.5 bg-muted rounded-md"><Phone className="h-4 w-4" /></div>
                  <span>{telefono || 'Sin teléfono'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* COLUMNA DERECHA: Formularios */}
      <div className="md:col-span-8 space-y-6">
        
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Información Personal</CardTitle>
            <CardDescription>Actualiza tus datos básicos.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formPerfil} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre completo</Label>
                  <Input name="nombre" defaultValue={usuario.nombre} required minLength={3} />
                  {statePerfil?.fieldErrors?.nombre && <span className="text-xs text-destructive">{statePerfil.fieldErrors.nombre[0]}</span>}
                </div>
                
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <PhoneInput
                    international
                    defaultCountry="NI"
                    value={telefono}
                    onChange={setTelefono}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <input type="hidden" name="telefono" value={telefono || ''} />
                  {statePerfil?.fieldErrors?.telefono && <span className="text-xs text-destructive">{statePerfil.fieldErrors.telefono[0]}</span>}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2"><AlignLeft className="h-4 w-4 text-muted-foreground" /> Biografía corta</Label>
                  <span className={`text-xs ${biografia.length > 200 ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                    {biografia.length}/200
                  </span>
                </div>
                <Textarea 
                  name="biografia" 
                  value={biografia}
                  onChange={(e) => setBiografia(e.target.value)}
                  placeholder="Cuéntanos un poco sobre ti o tu rol en la empresa..." 
                  rows={3} 
                  maxLength={200} 
                />
                {statePerfil?.fieldErrors?.biografia && <span className="text-xs text-destructive">{statePerfil.fieldErrors.biografia[0]}</span>}
              </div>

              <div className="flex justify-end pt-2">
                <SubmitButton text="Guardar Cambios" />
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><KeyRound className="h-5 w-5 text-destructive" /> Seguridad</CardTitle>
            <CardDescription>Cambia tu contraseña de acceso al sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="form-pass" action={formPass} className="space-y-4">
              <div className="space-y-2">
                <Label>Contraseña Actual</Label>
                <Input name="actual" type="password" required />
                {statePass?.fieldErrors?.actual && <span className="text-xs text-destructive">{statePass.fieldErrors.actual[0]}</span>}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nueva Contraseña</Label>
                  <Input name="nueva" type="password" required minLength={8} />
                  {statePass?.fieldErrors?.nueva && <span className="text-xs text-destructive">{statePass.fieldErrors.nueva[0]}</span>}
                </div>
                <div className="space-y-2">
                  <Label>Confirmar Contraseña</Label>
                  <Input name="confirmar" type="password" required />
                  {statePass?.fieldErrors?.confirmar && <span className="text-xs text-destructive">{statePass.fieldErrors.confirmar[0]}</span>}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="destructive">
                  Actualizar Contraseña
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}