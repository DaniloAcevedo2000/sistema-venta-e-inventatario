'use client'

import { motion } from 'framer-motion'
import {
  Boxes,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type FiltroEstado = 'todos' | 'ok' | 'bajo' | 'agotado'

type Props = {
  totalInsumos: number
  totalProductos: number
  alertas: number
  agotados: number
  ok: number
  valorTotal: number
  filtroActivo: FiltroEstado
  onFiltroChange: (filtro: FiltroEstado) => void
}

export function StatsCards({
  totalInsumos,
  totalProductos,
  alertas,
  agotados,
  ok,
  valorTotal,
  filtroActivo,
  onFiltroChange,
}: Props) {
  const cards = [
    {
      id: 'todos' as FiltroEstado,
      label: 'Total',
      value: totalInsumos + totalProductos,
      subtitle: `${totalInsumos} insumos · ${totalProductos} productos`,
      icon: Boxes,
      gradient: 'from-blue-500/10 to-blue-600/5',
      border: 'hover:border-blue-500/50',
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      ring: 'ring-blue-500/40',
    },
    {
      id: 'ok' as FiltroEstado,
      label: 'En stock',
      value: ok,
      subtitle: 'Con stock suficiente',
      icon: CheckCircle2,
      gradient: 'from-green-500/10 to-green-600/5',
      border: 'hover:border-green-500/50',
      iconBg: 'bg-green-500/10 text-green-600 dark:text-green-400',
      ring: 'ring-green-500/40',
    },
    {
      id: 'bajo' as FiltroEstado,
      label: 'Stock bajo',
      value: alertas,
      subtitle: 'Bajo el mínimo',
      icon: AlertTriangle,
      gradient: 'from-amber-500/10 to-amber-600/5',
      border: 'hover:border-amber-500/50',
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      ring: 'ring-amber-500/40',
    },
    {
      id: 'agotado' as FiltroEstado,
      label: 'Agotados',
      value: agotados,
      subtitle: 'Sin stock disponible',
      icon: XCircle,
      gradient: 'from-red-500/10 to-red-600/5',
      border: 'hover:border-red-500/50',
      iconBg: 'bg-red-500/10 text-red-600 dark:text-red-400',
      ring: 'ring-red-500/40',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card, index) => {
        const Icon = card.icon
        const isActive = filtroActivo === card.id

        return (
          <motion.button
            key={card.id}
            type="button"
            onClick={() => onFiltroChange(isActive ? 'todos' : card.id)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'relative text-left rounded-xl border bg-gradient-to-br p-3 transition-all',
              card.gradient,
              card.border,
              isActive && `ring-2 ${card.ring} border-transparent shadow-md`
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className={cn('rounded-lg p-1.5', card.iconBg)}>
                <Icon className="h-4 w-4" />
              </div>
              {isActive && (
                <span className="text-[10px] font-medium text-muted-foreground uppercase">
                  Filtrando
                </span>
              )}
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold leading-none">{card.value}</p>
              <p className="text-xs font-medium mt-1">{card.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                {card.subtitle}
              </p>
            </div>
          </motion.button>
        )
      })}

      {/* Card de Valor Total */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="col-span-2 rounded-xl border bg-gradient-to-br from-primary/10 to-primary/5 p-3"
      >
        <div className="flex items-start justify-between">
          <div className="rounded-lg p-1.5 bg-primary/10 text-primary">
            <DollarSign className="h-4 w-4" />
          </div>
          <TrendingUp className="h-4 w-4 text-primary/50" />
        </div>
        <div className="mt-2">
          <p className="text-2xl font-bold leading-none text-primary">
            C${' '}
            {valorTotal.toLocaleString('es-NI', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-xs font-medium mt-1">Valor del inventario</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Total en todas las sucursales
          </p>
        </div>
      </motion.div>
    </div>
  )
}