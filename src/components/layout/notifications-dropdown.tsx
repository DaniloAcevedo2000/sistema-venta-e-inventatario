'use client'

import * as React from 'react'
import Link from 'next/link'
import { Bell, AlertTriangle, Info, CheckCircle2, ShieldAlert, Check } from 'lucide-react'
import { 
  getMisNotificacionesAction, 
  marcarComoLeidaAction 
} from '@/app/(dashboard)/notificaciones/actions'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

const iconos = {
  error: <AlertTriangle className="h-4 w-4 text-destructive" />,
  warning: <ShieldAlert className="h-4 w-4 text-amber-500" />,
  info: <Info className="h-4 w-4 text-blue-500" />,
  success: <CheckCircle2 className="h-4 w-4 text-green-500" />,
}

type Notif = {
  id: string
  titulo: string
  descripcion: string
  tipo: 'error' | 'warning' | 'info' | 'success'
  href: string | null
  creadoEn: string
}

export function NotificationsDropdown() {
  const [notificaciones, setNotificaciones] = React.useState<Notif[]>([])
  const [cargando, setCargando] = React.useState(true)
  const [isOpen, setIsOpen] = React.useState(false)

  const cargar = React.useCallback(() => {
    setCargando(true)
    getMisNotificacionesAction()
      .then((data) => setNotificaciones(data as Notif[]))
      .finally(() => setCargando(false))
  }, [])

  // Cargar al montar y cada vez que se abre el menú
  React.useEffect(() => {
    cargar()
  }, [cargar, isOpen])

  const handleMarcarLeida = async (e: React.MouseEvent, id: string) => {
    e.preventDefault() // Evita que el Link navegue de inmediato si hacemos clic en el check
    e.stopPropagation()
    
    // Optimistic UI (actualizar rápido en pantalla)
    setNotificaciones((prev) => prev.filter((n) => n.id !== id))
    
    const res = await marcarComoLeidaAction(id)
    if (res?.error) toast.error(res.error)
    else toast.success('Notificación marcada como leída')
  }

  const hayNotificaciones = notificaciones.length > 0

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          {hayNotificaciones && (
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-[350px]">
        <div className="flex items-center justify-between px-4 py-2 font-semibold">
          <span>Notificaciones</span>
          {hayNotificaciones && (
            <Badge variant="secondary" className="text-xs">
              {notificaciones.length} nuevas
            </Badge>
          )}
        </div>
        <Separator />

        <div className="max-h-[350px] overflow-y-auto p-1">
          {cargando && notificaciones.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Cargando...</div>
          ) : !hayNotificaciones ? (
            <div className="p-6 text-center text-sm text-muted-foreground flex flex-col items-center">
              <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
              Estás al día
            </div>
          ) : (
            notificaciones.map((notif) => (
              <div key={notif.id} className="relative group flex items-start gap-3 p-3 hover:bg-muted/50 rounded-md transition-colors">
                {/* Contenido clickeable (Link) */}
                <Link 
                  href={notif.href || '#'} 
                  onClick={() => marcarComoLeidaAction(notif.id)} // Marca como leída al irse
                  className="flex items-start gap-3 flex-1"
                >
                  <div className="mt-0.5">{iconos[notif.tipo]}</div>
                  <div className="flex-1 space-y-1 pr-6">
                    <p className="text-sm font-medium leading-none">{notif.titulo}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notif.descripcion}
                    </p>
                  </div>
                </Link>

                {/* Botón de marcar leída (solo se ve en hover) */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleMarcarLeida(e, notif.id)}
                  title="Marcar como leída"
                >
                  <Check className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}