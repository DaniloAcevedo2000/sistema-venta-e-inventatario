import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ItemCarrito = {
  id: string           // ID único del item en el carrito (para poder eliminarlo)
  productoId: string
  varianteId: string | null
  codigo: string
  nombre: string
  nombreVariante: string | null
  precioUnitario: number
  cantidad: number
  descuento: number    // Porcentaje o monto fijo (por ahora %)
  tipoImpuesto: string
  notas: string
  imagenUrl: string | null
  color: string | null
}

type PosState = {
  items: ItemCarrito[]
  sucursalId: string | null
  sesionCajaId: string | null

  // Acciones
  setSucursal: (id: string) => void
  setSesionCaja: (id: string) => void
  agregarItem: (item: Omit<ItemCarrito, 'id'>) => void
  eliminarItem: (id: string) => void
  actualizarCantidad: (id: string, cantidad: number) => void
  actualizarDescuento: (id: string, descuento: number) => void
  actualizarNotas: (id: string, notas: string) => void
  limpiar: () => void

  // Cálculos
  subtotal: () => number
  descuentoTotal: () => number
  ivaTotal: () => number
  total: () => number
  cantidadItems: () => number
}

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      items: [],
      sucursalId: null,
      sesionCajaId: null,

      setSucursal: (id) => set({ sucursalId: id }),
      setSesionCaja: (id) => set({ sesionCajaId: id }),

      agregarItem: (item) => {
        const items = get().items
        // Si ya existe el mismo producto+variante sin notas, sumar cantidad
        const existente = items.find(
          (i) =>
            i.productoId === item.productoId &&
            i.varianteId === item.varianteId &&
            i.notas === item.notas &&
            i.descuento === item.descuento
        )

        if (existente) {
          set({
            items: items.map((i) =>
              i.id === existente.id
                ? { ...i, cantidad: i.cantidad + item.cantidad }
                : i
            ),
          })
        } else {
          set({
            items: [
              ...items,
              {
                ...item,
                id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
              },
            ],
          })
        }
      },

      eliminarItem: (id) =>
        set({ items: get().items.filter((i) => i.id !== id) }),

      actualizarCantidad: (id, cantidad) =>
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, cantidad: Math.max(0, cantidad) } : i
          ),
        }),

      actualizarDescuento: (id, descuento) =>
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, descuento: Math.max(0, Math.min(100, descuento)) } : i
          ),
        }),

      actualizarNotas: (id, notas) =>
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, notas } : i
          ),
        }),

      limpiar: () => set({ items: [] }),

      // ============================================
      // CÁLCULOS
      // ============================================
      subtotal: () => {
        return get().items.reduce((sum, item) => {
          return sum + item.precioUnitario * item.cantidad
        }, 0)
      },

      descuentoTotal: () => {
        return get().items.reduce((sum, item) => {
          const bruto = item.precioUnitario * item.cantidad
          return sum + (bruto * item.descuento) / 100
        }, 0)
      },

      ivaTotal: () => {
        return get().items.reduce((sum, item) => {
          const bruto = item.precioUnitario * item.cantidad
          const descuento = (bruto * item.descuento) / 100
          const neto = bruto - descuento
          if (item.tipoImpuesto === 'GRAVADO_15') {
            // El precio ya incluye IVA, entonces IVA = neto - (neto / 1.15)
            return sum + (neto - neto / 1.15)
          }
          return sum
        }, 0)
      },

      total: () => {
        const sub = get().subtotal()
        const desc = get().descuentoTotal()
        return sub - desc
      },

      cantidadItems: () => {
        return get().items.reduce((sum, item) => sum + item.cantidad, 0)
      },
    }),
    {
      name: 'pos-carrito',
    }
  )
)