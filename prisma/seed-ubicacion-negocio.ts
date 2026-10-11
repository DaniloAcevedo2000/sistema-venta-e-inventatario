import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Configurando ubicación del negocio...\n')

  // AJUSTA ESTAS COORDENADAS a la ubicación real de Momoto Café  12.136757466741638, -86.30555341602305
  const configuraciones = [
    {
      clave: 'negocio.latitud',
      valor: '12.136757466741638', 
      tipo: 'number',
      descripcion: 'Latitud de la ubicación principal del negocio',
    },
    {
      clave: 'negocio.longitud',
      valor: '-86.30555341602305', 
      tipo: 'number',
      descripcion: 'Longitud de la ubicación principal del negocio',
    },
  ]

  for (const c of configuraciones) {
    await prisma.configuracion.upsert({
      where: { clave: c.clave },
      update: { valor: c.valor },
      create: c,
    })
    console.log(`   ${c.clave} = ${c.valor}`)
  }

  console.log('\nIMPORTANTE: Actualiza las coordenadas reales del negocio')
  console.log('    Puedes obtenerlas de Google Maps (click derecho → copiar coordenadas)\n')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })