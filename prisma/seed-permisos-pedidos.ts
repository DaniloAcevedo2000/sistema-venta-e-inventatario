import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Configurando permisos de pedidos y delivery...\n')

  // ============================================
  // 1. CREAR PERMISOS
  // ============================================
  const permisosRequeridos = [
    // Pedidos
    { codigo: 'pedidos:leer', nombre: 'Ver pedidos', grupo: 'Pedidos' },
    { codigo: 'pedidos:crear', nombre: 'Crear pedidos', grupo: 'Pedidos' },
    { codigo: 'pedidos:editar', nombre: 'Editar pedidos', grupo: 'Pedidos' },
    { codigo: 'pedidos:cancelar', nombre: 'Cancelar pedidos', grupo: 'Pedidos' },
    { codigo: 'pedidos:asignar_repartidor', nombre: 'Asignar repartidor', grupo: 'Pedidos' },
    { codigo: 'pedidos:cobrar', nombre: 'Cobrar pedidos', grupo: 'Pedidos' },

    // KDS (Cocina)
    { codigo: 'kds:ver', nombre: 'Ver pantalla de cocina', grupo: 'KDS' },
    { codigo: 'kds:actualizar', nombre: 'Actualizar estado de pedidos en cocina', grupo: 'KDS' },

    // Repartidor
    { codigo: 'delivery:ver', nombre: 'Ver mis pedidos de delivery', grupo: 'Delivery' },
    { codigo: 'delivery:actualizar', nombre: 'Actualizar estado de entrega', grupo: 'Delivery' },

    // Zonas de entrega (config)
    { codigo: 'zonas_entrega:gestionar', nombre: 'Gestionar zonas de entrega', grupo: 'Configuración' },
  ]

  for (const p of permisosRequeridos) {
    await prisma.permiso.upsert({
      where: { codigo: p.codigo },
      update: {},
      create: p,
    })
  }

  console.log(`  ${permisosRequeridos.length} permisos creados`)

  // ============================================
  // 2. ASIGNAR A ROLES
  // ============================================
  const asignaciones: Record<string, string[]> = {
    SUPER_ADMIN: [
      'pedidos:leer', 'pedidos:crear', 'pedidos:editar', 'pedidos:cancelar',
      'pedidos:asignar_repartidor', 'pedidos:cobrar',
      'kds:ver', 'kds:actualizar',
      'delivery:ver', 'delivery:actualizar',
      'zonas_entrega:gestionar',
    ],
    ADMIN: [
      'pedidos:leer', 'pedidos:crear', 'pedidos:editar', 'pedidos:cancelar',
      'pedidos:asignar_repartidor', 'pedidos:cobrar',
      'kds:ver', 'kds:actualizar',
      'zonas_entrega:gestionar',
    ],
    GERENTE: [
      'pedidos:leer', 'pedidos:crear', 'pedidos:editar', 'pedidos:cancelar',
      'pedidos:asignar_repartidor', 'pedidos:cobrar',
      'kds:ver', 'kds:actualizar',
      'zonas_entrega:gestionar',
    ],
    CAJERO: [
      'pedidos:leer', 'pedidos:crear', 'pedidos:cobrar',
    ],
    BARISTA: [
      'kds:ver', 'kds:actualizar',
    ],
    REPARTIDOR: [
      'delivery:ver', 'delivery:actualizar',
    ],
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
    console.log(`   ✓ ${rolCodigo}: ${permisos.length} permisos`)
  }

  console.log('\n═══════════════════════════════════════')
  console.log('PERMISOS CONFIGURADOS')
  console.log('═══════════════════════════════════════\n')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })