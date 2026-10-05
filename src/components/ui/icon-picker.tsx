'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import * as Icons from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

// Iconos recomendados para categorías de cafetería
const ICONOS_RECOMENDADOS = [
  'Coffee', 'CupSoda', 'Cake', 'Cookie', 'IceCream', 'Croissant',
  'Package', 'Box', 'ShoppingBag', 'Gift', 'Tag',
  'UtensilsCrossed', 'ChefHat', 'Pizza', 'Sandwich',
  'Wine', 'Beer', 'Milk', 'GlassWater',
  'Leaf', 'Apple', 'Carrot', 'Cherry', 'Grape',
  'Star', 'Heart', 'Flame', 'Snowflake', 'Sparkles',
  'CircleDollarSign', 'BadgePercent', 'Receipt', 'Store',
]

type Props = {
  value?: string | null
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function IconPicker({
  value,
  onValueChange,
  placeholder = 'Seleccionar icono',
  className,
}: Props) {
  const [open, setOpen] = React.useState(false)

  const SelectedIcon = value
    ? (Icons[value as keyof typeof Icons] as React.ComponentType<{ className?: string }>)
    : null

  const todosLosIconos = Object.keys(Icons).filter(
    (name) =>
      typeof Icons[name as keyof typeof Icons] === 'function' ||
      typeof Icons[name as keyof typeof Icons] === 'object'
  )

  const IconosRecomendados = ICONOS_RECOMENDADOS.map((name) => ({
    name,
    Icon: Icons[name as keyof typeof Icons] as React.ComponentType<{ className?: string }>,
    grupo: 'Recomendados',
  })).filter((i) => i.Icon)

  const IconosOtros = todosLosIconos
    .filter((name) => !ICONOS_RECOMENDADOS.includes(name))
    .slice(0, 200) // Limitar para no sobrecargar
    .map((name) => ({
      name,
      Icon: Icons[name as keyof typeof Icons] as React.ComponentType<{ className?: string }>,
      grupo: 'Todos',
    }))
    .filter((i) => i.Icon)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between font-normal', className)}
        >
          <span className="flex items-center gap-2 truncate">
            {SelectedIcon ? (
              <>
                <SelectedIcon className="h-4 w-4 shrink-0" />
                <span className="truncate">{value}</span>
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar icono..." />
          <CommandList>
            <CommandEmpty>No se encontraron iconos</CommandEmpty>
            <CommandGroup heading="Recomendados">
              {IconosRecomendados.map(({ name, Icon }) => (
                <CommandItem
                  key={name}
                  value={name}
                  onSelect={() => {
                    onValueChange(name)
                    setOpen(false)
                  }}
                  className="flex items-center gap-2"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === name ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <Icon className="h-4 w-4 mr-2" />
                  <span className="text-xs">{name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Todos">
              {IconosOtros.map(({ name, Icon }) => (
                <CommandItem
                  key={name}
                  value={name}
                  onSelect={() => {
                    onValueChange(name)
                    setOpen(false)
                  }}
                  className="flex items-center gap-2"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === name ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <Icon className="h-4 w-4 mr-2" />
                  <span className="text-xs">{name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}