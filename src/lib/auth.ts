import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'

const credencialesSchema = z.object({
  correo: z.string().email('Correo inválido'),
  contrasena: z.string().min(1, 'La contraseña es requerida'),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma as any),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'Credenciales',
      credentials: {
        correo: { label: 'Correo', type: 'email' },
        contrasena: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = credencialesSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { correo, contrasena } = parsed.data

        const usuario = await prisma.usuario.findUnique({
          where: { correo: correo.toLowerCase() },
          include: {
            sucursal: true,
            roles: {
              include: {
                rol: {
                  include: {
                    permisos: { include: { permiso: true } },
                  },
                },
              },
            },
          },
        })

        if (!usuario || !usuario.activo) return null
        const passwordOk = await bcrypt.compare(contrasena, usuario.contrasenaHash)
        if (!passwordOk) return null

        const roles = usuario.roles.map((ur) => ur.rol.codigo)
        const permisos = Array.from(
          new Set(usuario.roles.flatMap((ur) => ur.rol.permisos.map((rp) => rp.permiso.codigo)))
        )

        await prisma.usuario.update({
          where: { id: usuario.id },
          data: { ultimoAcceso: new Date() },
        })

        return {
          id: usuario.id,
          name: usuario.nombre,
          email: usuario.correo,
          nombre: usuario.nombre,
          correo: usuario.correo,
          avatarUrl: usuario.avatarUrl, 
          sucursalId: usuario.sucursalId,
          sucursalNombre: usuario.sucursal?.nombre ?? null,
          roles,
          permisos,
        }
      },
    }),
  ],
  callbacks: {
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnLogin = nextUrl.pathname.startsWith('/login')
      const isOnApi = nextUrl.pathname.startsWith('/api')

      if (isOnApi) return true
      if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL('/dashboard', nextUrl))
        return true
      }
      return isLoggedIn
    },
    
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.nombre = user.nombre
        token.correo = user.correo
        token.avatarUrl = user.avatarUrl // <-- NUEVO
        token.sucursalId = user.sucursalId
        token.sucursalNombre = user.sucursalNombre
        token.roles = user.roles
        token.permisos = user.permisos
      }

      // Si el usuario actualiza su perfil (foto), actualizamos el token
      if (trigger === 'update' && session?.avatarUrl) {
        token.avatarUrl = session.avatarUrl
      }

      if (trigger === 'update' && session?.sucursalId) {
        token.sucursalId = session.sucursalId
        const sucursal = await prisma.sucursal.findUnique({
          where: { id: session.sucursalId }
        })
        if (sucursal) token.sucursalNombre = sucursal.nombre
      }

      return token
    },
    
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.nombre = token.nombre as string
        session.user.correo = token.correo as string
        session.user.avatarUrl = (token.avatarUrl as string | null) ?? null 
        session.user.sucursalId = (token.sucursalId as string | null) ?? null
        session.user.sucursalNombre = (token.sucursalNombre as string | null) ?? null
        session.user.roles = (token.roles as string[]) ?? []
        session.user.permisos = (token.permisos as string[]) ?? []
      }
      return session
    },
  },
  secret: process.env.AUTH_SECRET,
})