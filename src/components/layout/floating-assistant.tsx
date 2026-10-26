'use client'

import * as React from 'react'
import { Sparkles } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { AsistenteChat } from '@/app/(dashboard)/asistente/asistente-chat'

export function FloatingAssistant() {
  return (
    <Sheet>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger asChild>
            <button 
              className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-all duration-200 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Abrir Asistente IA"
            >
              {/* Icono ligeramente más pequeño (h-5 w-5) */}
              <Sparkles className="h-5 w-5" />
            </button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent side="left" className="font-medium mr-2">
          <p>Pregúntale a la IA</p>
        </TooltipContent>
      </Tooltip>

      {/* PANEL DESLIZANTE */}
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col border-l shadow-2xl">
        <div className="sr-only">
          <SheetTitle>Asistente IA</SheetTitle>
          <SheetDescription>Chat interactivo con la IA del sistema</SheetDescription>
        </div>
        <AsistenteChat />
      </SheetContent>
    </Sheet>
  )
}