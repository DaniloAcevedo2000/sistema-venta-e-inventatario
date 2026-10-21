import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Agregando permisos de Compras y Proveedores...\n')

  const nuevosPermisos = [
    { codigo: 'compras:leer', nombre: 'Ver compras y proveedores', grupo: 'Compras' },
    { codigo: 'compras:crear', nombre: 'Crear compras y proveedores', grupo: 'Compras' },
    { codigo: 'compras:editar', nombre: 'Editar compras y proveedores', grupo: 'Compras' },
  ]

  for (const p of nuevosPermisos) {
    await prisma.permiso.upsert({
      where: { codigo: p.codigo },
      update: {},
      create: p,
    })
  }

  console.log(`${nuevosPermisos.length} permisos creados\n`)

  // Asignar a roles
  const rolesConPermisos = {
    SUPER_ADMIN: [
      'compras:leer',
      'compras:crear',
      'compras:editar',
    ],
    ADMIN: [
      'compras:leer',
      'compras:crear',
      'compras:editar',
    ],
    GERENTE: [
      'compras:leer',
      'compras:crear',
    ],
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
    console.log(`   - ${rolCodigo}: ${permisos.length} permisos asignados`)
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