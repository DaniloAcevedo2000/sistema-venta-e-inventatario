'use client'

import * as React from 'react'
import { Send, Loader2, Sparkles, User, RotateCcw } from 'lucide-react' 
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

type Mensaje = {
  role: 'user' | 'assistant'
  content: string
  graficaData?: { fecha: string, total: number }[] 
}

const MENSAJE_INICIAL: Mensaje = { 
  role: 'assistant', 
  content: `¡Hola! Soy el **Asistente Momoto IA**. Estoy conectado a tu base de datos y puedo ayudarte a analizar la información de tu negocio.

Aquí tienes algunos ejemplos de lo que puedes preguntarme:

*   **Ventas:** *"¿Cuánto vendimos esta semana?"* o *"Dame el resumen de ventas de ayer"*.
*   **Productos:** *"¿Cuáles fueron los 5 productos más vendidos hoy?"*.
*   **Inventario:** *"¿Qué insumos se están agotando?"* o *"Dame los insumos registrados"*.
*   **Clientes:** *"¿Qué clientes tienen deuda pendiente?"*.
*   **Compras:** *"¿Qué órdenes de compra hemos hecho este mes?"*.
*   **Cajas:** *"¿Hubo diferencias en los cierres de caja de ayer?"*.

¿Qué te gustaría consultar hoy?` 
}

export function AsistenteChat() {
  const [mensajes, setMensajes] = React.useState<Mensaje[]>([MENSAJE_INICIAL])
  const [input, setInput] = React.useState('')
  const [cargando, setCargando] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [mensajes])

  const limpiarChat = () => {
    if (cargando) {
      toast.info('Espera a que termine la respuesta actual.')
      return
    }
    setMensajes([MENSAJE_INICIAL])
    setInput('')
  }

  const enviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || cargando) return

    const nuevoMensaje: Mensaje = { role: 'user', content: input.trim() }
    const historialLocal = [...mensajes, nuevoMensaje]
    
    setMensajes(historialLocal)
    setInput('')
    setCargando(true)

    setMensajes((prev) => [...prev, { role: 'assistant', content: '' }])

    try {
      // Limpiamos el historial para Groq (Solo role y content)
      const historialParaIA = historialLocal.map(m => ({
        role: m.role,
        content: m.content
      }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: historialParaIA }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al conectar con la IA')
      }

      const data = await res.json()
      
      let textoLimpio = data.content || ''
      if (textoLimpio.includes('[GRAFICA_VENTAS]')) {
        textoLimpio = textoLimpio.replace('[GRAFICA_VENTAS]', '')
      }

      setMensajes((prev) => {
        const nuevos = [...prev]
        nuevos[nuevos.length - 1] = { 
          role: 'assistant', 
          content: textoLimpio,
          graficaData: data.graficaData 
        }
        return nuevos
      })

    } catch (error: any) {
      toast.error(error.message)
      setMensajes((prev) => prev.slice(0, -1))
    } finally {
      setCargando(false)
    }
  }

  return (
    // 🔴 CAMBIAMOS CARD POR UN DIV FLEXIBLE
    <div className="flex flex-col h-full w-full bg-background overflow-hidden">
      <div className="border-b bg-muted/20 flex flex-row items-center justify-between py-4 px-6 shrink-0">
        <h2 className="text-lg flex items-center gap-2 font-semibold text-foreground">
          <Sparkles className="h-5 w-5 text-primary" />
          Asistente Momoto IA
        </h2>
        <Button variant="ghost" size="sm" onClick={limpiarChat} disabled={cargando || mensajes.length <= 1} className="text-muted-foreground hover:text-destructive">
          <RotateCcw className="h-4 w-4 mr-2" /> Nuevo Chat
        </Button>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {mensajes.map((msg, index) => (
              <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`rounded-lg px-4 py-2 max-w-[85%] text-sm ${
                  msg.role === 'user' ? 'bg-primary text-primary-foreground whitespace-pre-wrap' : 'bg-muted text-foreground'
                }`}>
                  {msg.content === '' && cargando ? (
                    <span className="flex items-center gap-1 h-5">
                      <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </span>
                  ) : msg.role === 'assistant' ? (
                    <div className="space-y-4">
                      <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                      
                      {msg.graficaData && (
                        <div className="h-[200px] w-full mt-4 bg-background rounded-md p-2 border border-border">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={msg.graficaData}>
                              <XAxis dataKey="fecha" fontSize={10} tickLine={false} axisLine={false} />
                              <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `C$${v}`} width={60} />
                              <Tooltip 
                                formatter={(value: any) => [`C$ ${Number(value || 0).toFixed(2)}`, 'Ventas']}
                                labelStyle={{ color: 'black' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                              />
                              <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </div>

      <div className="border-t p-4 bg-muted/10 shrink-0">
        <form onSubmit={enviarMensaje} className="flex w-full gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregúntame algo sobre el negocio..."
            disabled={cargando}
            className="flex-1 bg-background"
          />
          <Button type="submit" disabled={!input.trim() || cargando} size="icon">
            {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  )
}