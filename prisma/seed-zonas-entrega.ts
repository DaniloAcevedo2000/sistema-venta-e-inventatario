import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Creando zonas de entrega...\n')

  const zonas = [
    {
      codigo: 'CENTRO',
      nombre: 'Centro / Cercano',
      descripcion: 'Dentro de 2km',
      tarifa: 80,
      tiempoEstimadoMin: 15,
      color: '#10b981',
      orden: 1,
    },
    {
      codigo: 'MEDIO',
      nombre: 'Zona Media',
      descripcion: 'De 2km a 5km',
      tarifa: 150,
      tiempoEstimadoMin: 25,
      color: '#f59e0b',
      orden: 2,
    },
    {
      codigo: 'LEJANO',
      nombre: 'Zona Lejana',
      descripcion: 'Más de 5km',
      tarifa: 180,
      tiempoEstimadoMin: 40,
      color: '#ef4444',
      orden: 3,
    },
  ]

  for (const zona of zonas) {
    await prisma.zonaEntrega.upsert({
      where: { codigo: zona.codigo },
      update: {},
      create: zona,
    })
    console.log(`   ${zona.nombre} — C$${zona.tarifa}`)
  }

  console.log('\n═══════════════════════════════════════')
  console.log('ZONAS CREADAS')
  console.log('═══════════════════════════════════════\n')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })