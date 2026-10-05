import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Coffee } from 'lucide-react'
import { LoginForm } from './login-form'

export const metadata = {
  title: 'Iniciar sesión | Momoto Café',
  description: 'Accede al sistema de ventas e inventario',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 dark:from-zinc-900 dark:to-zinc-950 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Coffee className="h-8 w-8 text-amber-700 dark:text-amber-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Momoto Café</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para acceder al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  )
}