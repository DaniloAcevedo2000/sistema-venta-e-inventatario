'use client'

import { Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export type Step = {
  id: number
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

type Props = {
  steps: Step[]
  currentStep: number
  onStepClick?: (step: number) => void
  maxCompletedStep: number
}

export function ProductoWizardSteps({
  steps,
  currentStep,
  onStepClick,
  maxCompletedStep,
}: Props) {
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100

  return (
    <div className="relative">
      {/* Línea de progreso de fondo */}
      <div className="absolute top-6 left-0 right-0 h-0.5 bg-muted" />
      
      {/* Línea de progreso animada */}
      <motion.div
        className="absolute top-6 left-0 h-0.5 bg-gradient-to-r from-primary to-accent"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      />

      {/* Steps */}
      <div className="relative flex justify-between">
        {steps.map((step) => {
          const stepNumber = step.id
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          const isClickable = onStepClick && stepNumber <= maxCompletedStep

          const Icon = step.icon

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => isClickable && onStepClick(stepNumber)}
              disabled={!isClickable}
              className={cn(
                'flex flex-col items-center gap-2 group',
                isClickable && 'cursor-pointer'
              )}
            >
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                  backgroundColor: isCompleted
                    ? 'rgb(107, 66, 38)'
                    : isCurrent
                      ? 'rgb(193, 122, 63)'
                      : 'rgb(232, 224, 216)',
                }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'relative flex h-12 w-12 items-center justify-center rounded-full border-2 shadow-sm',
                  isCompleted && 'border-primary text-primary-foreground',
                  isCurrent && 'border-accent text-accent-foreground',
                  !isCompleted && !isCurrent && 'border-border text-muted-foreground',
                  isClickable && 'group-hover:shadow-md'
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}

                {isCurrent && (
                  <motion.span
                    className="absolute inset-0 rounded-full border-2 border-accent"
                    animate={{ scale: [1, 1.15, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.div>

              <div className="text-center hidden md:block max-w-[100px]">
                <p
                  className={cn(
                    'text-xs font-medium transition-colors',
                    isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}