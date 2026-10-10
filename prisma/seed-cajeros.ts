import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Creando usuarios cajeros...\n')

  // Obtener rol CAJERO
  const rolCajero = await prisma.rol.findUnique({
    where: { codigo: 'CAJERO' },
  })

  if (!rolCajero) {
    throw new Error('Rol CAJERO no encontrado')
  }

  // Obtener sucursales
  const sucursalCentral = await prisma.sucursal.findUnique({
    where: { codigo: 'CENTRAL' },
  })
  const sucursalNatura = await prisma.sucursal.findUnique({
    where: { codigo: 'NATURA' },
  })

  if (!sucursalCentral || !sucursalNatura) {
    throw new Error('Faltan sucursales')
  }

  // ============================================
  // CAJEROS DE EJEMPLO
  // ============================================
  const cajeros = [
    {
      nombre: 'María González',
      correo: 'maria@momotocafe.com',
      contrasena: 'Momoto2026!',
      sucursalId: sucursalCentral.id,
    },
    {
      nombre: 'Pedro Ramírez',
      correo: 'pedro@momotocafe.com',
      contrasena: 'Momoto2026!',
      sucursalId: sucursalCentral.id,
    },
    {
      nombre: 'Ana López',
      correo: 'ana@momotocafe.com',
      contrasena: 'Momoto2026!',
      sucursalId: sucursalNatura.id,
    },
    {
      nombre: 'Carlos Mejía',
      correo: 'carlos@momotocafe.com',
      contrasena: 'Momoto2026!',
      sucursalId: sucursalNatura.id,
    },
  ]

  for (const c of cajeros) {
    const hash = await bcrypt.hash(c.contrasena, 10)

    const usuario = await prisma.usuario.upsert({
      where: { correo: c.correo },
      update: {
        nombre: c.nombre,
        sucursalId: c.sucursalId,
      },
      create: {
        nombre: c.nombre,
        correo: c.correo,
        contrasenaHash: hash,
        sucursalId: c.sucursalId,
        activo: true,
      },
    })

    // Asignar rol CAJERO
    await prisma.usuarioRol.upsert({
      where: {
        usuarioId_rolId: {
          usuarioId: usuario.id,
          rolId: rolCajero.id,
        },
      },
      update: {},
      create: {
        usuarioId: usuario.id,
        rolId: rolCajero.id,
      },
    })

    console.log(`   ✓ ${c.nombre} (${c.correo})`)
  }

  console.log('\n═══════════════════════════════════════')
  console.log('CAJEROS CREADOS')
  console.log('═══════════════════════════════════════')
  console.log('\nCredenciales (todos usan la misma contraseña):')
  console.log('   Contraseña: Momoto2026!\n')
  cajeros.forEach((c) => {
    console.log(`   ${c.correo}  →  ${c.nombre}`)
  })
  console.log()
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })