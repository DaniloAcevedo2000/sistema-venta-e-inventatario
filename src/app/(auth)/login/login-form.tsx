'use client'

import * as React from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Loader2, Lock, Mail, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

export function LoginForm() {
  const router = useRouter()
  const [correo, setCorreo] = React.useState('')
  const [contrasena, setContrasena] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [rememberMe, setRememberMe] = React.useState(false)
  
  const [isPending, setIsPending] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [step, setStep] = React.useState<'idle' | 'validating' | 'success'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!correo || !contrasena) return toast.error('Por favor, llena todos los campos')

    setIsPending(true)
    setStep('validating')
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + 15
      })
    }, 150)

    try {
      const res = await signIn('credentials', {
        correo: correo.toLowerCase(),
        contrasena,
        redirect: false,
      })

      clearInterval(interval)
      setProgress(100)

      if (res?.error) {
        setStep('idle')
        setProgress(0)
        toast.error('Credenciales incorrectas. Verifica tu correo y contraseña.')
        setIsPending(false)
      } else {
        setStep('success')
        toast.success('¡Bienvenido a Momoto Café!')
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 1000)
      }
    } catch (error) {
      clearInterval(interval)
      setStep('idle')
      setProgress(0)
      setIsPending(false)
      toast.error('Ocurrió un error inesperado')
    }
  }

  // Animaciones de entrada
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      <motion.div variants={itemVariants} className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Bienvenido de nuevo</h1>
        <p className="text-muted-foreground mt-2">Inicia sesión para continuar con tu sistema.</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <motion.div variants={itemVariants} className="space-y-2">
          <Label htmlFor="correo">Correo Electrónico</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="correo"
              type="email"
              placeholder="tu@correo.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="pl-10 h-11 bg-background"
              disabled={isPending}
              autoComplete="email"
            />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="contrasena">Contraseña</Label>
            <button 
              type="button" 
              onClick={() => toast.info('Contacta al administrador para restablecer tu contraseña.')} 
              className="text-xs text-primary hover:underline font-medium"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="contrasena"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              className="pl-10 pr-10 h-11 bg-background"
              disabled={isPending}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="flex items-center space-x-2">
          <Checkbox 
            id="remember" 
            checked={rememberMe} 
            onCheckedChange={(c) => setRememberMe(c as boolean)} 
          />
          <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground cursor-pointer">
            Recordarme en este dispositivo
          </Label>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Button 
            type="submit" 
            className="w-full h-11 text-base font-medium relative overflow-hidden" 
            disabled={isPending}
          >
            <AnimatePresence mode="wait">
              {step === 'idle' ? (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center">
                  Iniciar sesión <ArrowRight className="ml-2 h-4 w-4" />
                </motion.div>
              ) : step === 'validating' ? (
                <motion.div key="validating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Validando...
                </motion.div>
              ) : (
                <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center text-green-500">
                  ¡Acceso concedido!
                </motion.div>
              )}
            </AnimatePresence>
          </Button>

          <AnimatePresence>
            {step !== 'idle' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-2"
              >
                <motion.div 
                  className="h-full bg-green-500"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.2 }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </form>
    </motion.div>
  )
}