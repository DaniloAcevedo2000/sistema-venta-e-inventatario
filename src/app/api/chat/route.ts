import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { auth } from '@/lib/auth'
import { 
  getResumenVentas, 
  getTopProductos, 
  getInventarioCritico,
  consultarBaseDeDatos 
} from '@/lib/ai-tools'

const groq = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
})

async function llamarGroqConReintento(
  params: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
  maxReintentos = 3
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  let intento = 0
  while (intento < maxReintentos) {
    try {
      return await groq.chat.completions.create(params)
    } catch (error: any) {
      if (error?.status !== 429 && error?.status !== 503) throw error
      intento++
      if (intento >= maxReintentos) throw error
      const espera = Math.pow(2, intento) * 1000 + Math.random() * 1000
      await new Promise(resolve => setTimeout(resolve, espera))
    }
  }
  throw new Error('Fallo inesperado al contactar a Groq')
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { messages } = await req.json()
    const sucursalId = session.user.sucursalId
    const fechaHoy = new Date().toISOString().split('T')[0]

    const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
      {
        type: 'function',
        function: {
          name: 'getResumenVentas',
          description: 'Obtiene el resumen financiero y la gráfica de ventas en un rango de fechas.',
          parameters: {
            type: 'object',
            properties: {
              fechaInicio: { type: 'string', description: 'Fecha de inicio en formato YYYY-MM-DD' },
              fechaFin: { type: 'string', description: 'Fecha de fin en formato YYYY-MM-DD' },
            },
            required: ['fechaInicio', 'fechaFin'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getTopProductos',
          description: 'Obtiene los productos más vendidos en un rango de fechas.',
          parameters: {
            type: 'object',
            properties: {
              fechaInicio: { type: 'string', description: 'Fecha de inicio en formato YYYY-MM-DD' },
              fechaFin: { type: 'string', description: 'Fecha de fin en formato YYYY-MM-DD' },
              limite: { type: 'number', description: 'Cantidad de productos (por defecto 5)' },
            },
            required: ['fechaInicio', 'fechaFin'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getInventarioCritico',
          description: 'Obtiene los productos o insumos que están por agotarse.',
          parameters: { type: 'object', properties: {} },
        },
      },
            {
        type: 'function',
        function: {
          name: 'consultarBaseDeDatos',
          description: 'Herramienta general para consultar cualquier tabla del sistema: ventas, productos, insumos, clientes, proveedores, ordenes_compra, pedidos, cajas o notas_credito.',
          parameters: {
            type: 'object',
            properties: {
              modelo: {
                type: 'string',
                enum: ['ventas', 'productos', 'insumos', 'clientes', 'proveedores', 'ordenes_compra', 'pedidos', 'cajas', 'notas_credito'],
                description: 'La tabla o modelo que se desea consultar.'
              },
              // Permitir null o string
              fechaInicio: { 
                type: ['string', 'null'], 
                description: 'Fecha de inicio opcional (YYYY-MM-DD). Enviar null si no aplica.' 
              },
              fechaFin: { 
                type: ['string', 'null'], 
                description: 'Fecha de fin opcional (YYYY-MM-DD). Enviar null si no aplica.' 
              },
              limite: { 
                type: 'number', 
                description: 'Cantidad máxima de resultados (por defecto 20)' 
              }
            },
            required: ['modelo'],
          },
        },
      },
    ]

        const response = await llamarGroqConReintento({
      model: 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'system',
          content: `Eres el "Asistente Momoto IA", un analista de datos experto para el sistema de ventas e inventario Momoto Café. Hoy es ${fechaHoy}. Tu objetivo es ayudar al usuario a entender su negocio respondiendo con datos exactos de la base de datos.

          TIENES ACCESO A LOS SIGUIENTES MÓDULOS (usando la herramienta consultarBaseDeDatos):
          1. 'ventas': Ventas realizadas (facturas, totales, clientes, cajeros).
          2. 'productos': Catálogo de productos (precios, categorías).
          3. 'insumos': Materias primas (costos, stock mínimo).
          4. 'clientes': Clientes (teléfonos, saldos de crédito).
          5. 'proveedores': Proveedores (contactos, órdenes).
          6. 'ordenes_compra': Compras a proveedores (estados, totales).
          7. 'pedidos': Pedidos de delivery o pickup (estados, clientes).
          8. 'cajas': Sesiones de caja (aperturas, cierres, diferencias).
          9. 'notas_credito': Devoluciones o anulaciones (motivos, montos).

          HERRAMIENTAS ESPECIALES (Úsalas para consultas analíticas o gráficas):
          - getResumenVentas: Úsala si piden "resumen de ventas", "cuánto vendimos", "ticket promedio" o "gráfica de ventas".
          - getTopProductos: Úsala si piden "productos más vendidos" o "top de ventas".
          - getInventarioCritico: Úsala si piden "qué se está agotando" o "alertas de stock".

          REGLAS ESTRICTAS DE FORMATO:
          1. NUNCA uses tablas de Markdown (no uses el símbolo |).
          2. Usa listas con viñetas (-) o números para presentar los datos.
          3. Usa negritas (**) para resaltar montos (ej. **C$ 1500.00**), fechas o nombres importantes.
          4. Si usas la herramienta 'getResumenVentas', NO escribas los datos numéricos de la gráfica. Solo escribe la palabra "[GRAFICA_VENTAS]" al final de tu respuesta.
          5. Si el usuario no especifica fechas, asume que quiere saber sobre "hoy".
          6. Responde siempre en español, de forma profesional, clara y concisa. No inventes datos que no estén en el resultado de las herramientas.`
        },
        ...messages
      ],
      tools,
      tool_choice: 'auto',
      reasoning_effort: 'low', 
    } as any)

    const responseMessage = response.choices[0].message

    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0]

      if (toolCall.type !== 'function') {
        return NextResponse.json({ error: 'Herramienta no soportada' }, { status: 400 })
      }

      const functionName = toolCall.function.name
      const args = JSON.parse(toolCall.function.arguments)
      let functionResult: any = {}

      if (functionName === 'getResumenVentas') {
        functionResult = await getResumenVentas(args.fechaInicio, args.fechaFin, sucursalId || undefined)
      } else if (functionName === 'getTopProductos') {
        functionResult = await getTopProductos(args.fechaInicio, args.fechaFin, args.limite)
      } else if (functionName === 'getInventarioCritico') {
        functionResult = await getInventarioCritico(sucursalId || undefined)
      } else if (functionName === 'consultarBaseDeDatos') {
        functionResult = await consultarBaseDeDatos({
          modelo: args.modelo,
          fechaInicio: args.fechaInicio,
          fechaFin: args.fechaFin,
          sucursalId: sucursalId || undefined,
          limite: args.limite || 20
        })
      }

      const finalResponse = await llamarGroqConReintento({
        model: 'openai/gpt-oss-120b', 
        messages: [
          { role: 'system', content: 'Responde de forma clara basándote en los datos proporcionados.' },
          ...messages,
          responseMessage,
          { role: 'tool', tool_call_id: toolCall.id, content: JSON.stringify(functionResult) },
        ],
      })

      let textoFinal = finalResponse.choices[0].message.content || ''
      let graficaData = undefined

      if (functionName === 'getResumenVentas' && functionResult.graficaVentas) {
        if (!textoFinal.includes('[GRAFICA_VENTAS]')) {
          textoFinal += '\n\n[GRAFICA_VENTAS]'
        }
        graficaData = functionResult.graficaVentas 
      }

      return NextResponse.json({ content: textoFinal, graficaData })
    }

    return NextResponse.json({ content: responseMessage.content || '' })

  } catch (error: any) {
    console.error('Error en Chat API:', error)
    const mensajeError = error?.status === 429 
      ? 'El asistente está muy ocupado. Intenta de nuevo en unos segundos.' 
      : error.message || 'Error al procesar la solicitud'
    return NextResponse.json({ error: mensajeError }, { status: error?.status === 429 ? 429 : 500 })
  }
}