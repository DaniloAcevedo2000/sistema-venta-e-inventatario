import 'dotenv/config'
import { execSync } from 'child_process'

async function runSeeds() {
  console.log('🌱 Iniciando seeding maestro...')

  const archivos = [
    './seed', // 1. Roles, sucursales, permisos base
    './seed-permisos-proveedor-compra',
    './seed-permisos-anulacion',
    './seed-permisos-caja',
    './seed-permisos-pedidos',
    './seed-catalogo',
    './seed-cajeros', // 4. Ahora sí, los roles ya existen
    './seed-pagos',
    './seed-ubicacion-negocio',
    './seed-zonas-entrega',
  ]

  try {
    for (const archivo of archivos) {
      console.log(`⏳ Ejecutando ${archivo}.ts...`)
      // Ejecutamos cada archivo en un proceso separado y esperamos a que termine
      execSync(`npx tsx prisma/${archivo}.ts`, { stdio: 'inherit', env: process.env })
    }
    
    console.log('✅ Seeding completado con éxito.')
  } catch (error) {
    console.error('❌ Error en el seeding:', error)
    process.exit(1)
  }
}

runSeeds()