import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      nombre: string
      correo: string
      avatarUrl: string | null 
      sucursalId: string | null
      sucursalNombre: string | null
      roles: string[]
      permisos: string[]
    } & DefaultSession['user']
  }

  interface User {
    id: string
    nombre: string
    correo: string
    avatarUrl: string | null 
    sucursalId: string | null
    sucursalNombre: string | null
    roles: string[]
    permisos: string[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    nombre: string
    correo: string
    avatarUrl: string | null 
    sucursalId: string | null
    sucursalNombre: string | null
    roles: string[]
    permisos: string[]
  }
}