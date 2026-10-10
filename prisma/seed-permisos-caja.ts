import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Configurando permisos de caja...\n')

  // ============================================
  // 1. ASEGURAR QUE LOS PERMISOS EXISTAN
  // ============================================
  const permisosRequeridos = [
    { codigo: 'caja:abrir', nombre: 'Abrir caja', grupo: 'Caja' },
    { codigo: 'caja:cerrar', nombre: 'Cerrar caja', grupo: 'Caja' },
    { codigo: 'caja:ver', nombre: 'Ver sesiones de caja', grupo: 'Caja' },
    { codigo: 'caja:ver_todas', nombre: 'Ver todas las sesiones de caja', grupo: 'Caja' },
  ]

  for (const p of permisosRequeridos) {
    await prisma.permiso.upsert({
      where: { codigo: p.codigo },
      update: {},
      create: p,
    })
  }

  console.log(`${permisosRequeridos.length} permisos de caja`)

  // ============================================
  // 2. ASIGNAR A ROLES
  // ============================================
  const asignaciones: Record<string, string[]> = {
    SUPER_ADMIN: ['caja:abrir', 'caja:cerrar', 'caja:ver', 'caja:ver_todas'],
    ADMIN: ['caja:abrir', 'caja:cerrar', 'caja:ver', 'caja:ver_todas'],
    GERENTE: ['caja:abrir', 'caja:cerrar', 'caja:ver', 'caja:ver_todas'],
    CAJERO: ['caja:abrir', 'caja:cerrar', 'caja:ver'], 
  }

  for (const [rolCodigo, permisos] of Object.entries(asignaciones)) {
    const rol = await prisma.rol.findUnique({ where: { codigo: rolCodigo } })
    if (!rol) {
      console.log(`   ⚠️  Rol ${rolCodigo} no encontrado`)
      continue
    }

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
    console.log(`   ✓ ${rolCodigo}: ${permisos.length} permisos de caja`)
  }

  // ============================================
  // 3. VERIFICAR PERMISOS DEL ROL CAJERO
  // ============================================
  const rolCajero = await prisma.rol.findUnique({
    where: { codigo: 'CAJERO' },
    include: {
      permisos: {
        include: { permiso: true },
      },
    },
  })

  if (rolCajero) {
    console.log('\nPermisos actuales del rol CAJERO:')
    const permisos = rolCajero.permisos
      .map((p) => p.permiso.codigo)
      .sort()
    permisos.forEach((p) => console.log(`   • ${p}`))
    console.log(`   Total: ${permisos.length} permisos`)
  }

  console.log('\n═══════════════════════════════════════')
  console.log('CONFIGURACIÓN COMPLETADA')
  console.log('═══════════════════════════════════════\n')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })