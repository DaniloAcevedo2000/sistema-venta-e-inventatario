import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Agregando permisos de anulación...\n')

  const nuevosPermisos = [
    { codigo: 'ventas:anular', nombre: 'Anular ventas', grupo: 'Ventas' },
    { codigo: 'ventas:anular_historico', nombre: 'Anular ventas de días anteriores', grupo: 'Ventas' },
    { codigo: 'notas_credito:crear', nombre: 'Crear notas de crédito', grupo: 'Facturación' },
    { codigo: 'notas_credito:leer', nombre: 'Ver notas de crédito', grupo: 'Facturación' },
  ]

  for (const p of nuevosPermisos) {
    await prisma.permiso.upsert({
      where: { codigo: p.codigo },
      update: {},
      create: p,
    })
  }

  console.log(`${nuevosPermisos.length} permisos\n`)

  // Asignar a roles
  const rolesConPermisos = {
    SUPER_ADMIN: [
      'ventas:anular',
      'ventas:anular_historico',
      'notas_credito:crear',
      'notas_credito:leer',
    ],
    ADMIN: ['ventas:anular', 'notas_credito:crear', 'notas_credito:leer'],
    GERENTE: ['ventas:anular', 'notas_credito:crear', 'notas_credito:leer'],
  }

  for (const [rolCodigo, permisos] of Object.entries(rolesConPermisos)) {
    const rol = await prisma.rol.findUnique({ where: { codigo: rolCodigo } })
    if (!rol) continue

    for (const permisoCodigo of permisos) {
      const permiso = await prisma.permiso.findUnique({
        where: { codigo: permisoCodigo },
      })
      if (!permiso) continue

      await prisma.rolPermiso.upsert({
        where: {
          rolId_permisoId: { rolId: rol.id, permisoId: permiso.id },
        },
        update: {},
        create: { rolId: rol.id, permisoId: permiso.id },
      })
    }
    console.log(`   ✓ ${rolCodigo}: ${permisos.length} permisos`)
  }

  console.log('\nListo')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })