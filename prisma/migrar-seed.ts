import 'dotenv/config'

async function runSeeds() {
  console.log('🌱 Iniciando seeding maestro...')

  try {
    // Importamos dinámicamente cada archivo uno por uno.
    // Al usar import() dinámico, esperamos a que uno termine antes de pasar al siguiente.
    await import('./seed-permisos-proveedor-compra')
    await import('./seed-permisos-anulacion')
    await import('./seed-permisos-caja')
    await import('./seed-permisos-pedidos')
    await import('./seed-catalogo')
    await import('./seed-cajeros')
    await import('./seed-pagos')
    await import('./seed-ubicacion-negocio')
    await import('./seed-zonas-entrega')
    await import('./seed')
    
    console.log('✅ Seeding completado con éxito.')
  } catch (error) {
    console.error('❌ Error en el seeding:', error)
    process.exit(1)
  }
}

runSeeds()