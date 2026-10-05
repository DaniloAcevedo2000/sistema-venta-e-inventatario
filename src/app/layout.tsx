import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cookies } from 'next/headers'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { SessionProvider } from 'next-auth/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Momoto Café | Sistema',
  description: 'Sistema de ventas e inventario',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Leer tema desde cookie en el servidor (evita flash)
  const cookieStore = await cookies()
  const savedTheme = cookieStore.get('momoto-theme')?.value as
    | 'light'
    | 'dark'
    | 'system'
    | undefined

  const initialTheme = savedTheme || 'system'
  const resolvedClass = initialTheme === 'dark' ? 'dark' : 'light'

  return (
    <html lang="es" className={resolvedClass} suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          <ThemeProvider initialTheme={initialTheme}>
            <TooltipProvider delayDuration={0}>
              {children}
              <Toaster richColors position="top-right" />
            </TooltipProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}