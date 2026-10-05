import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seed de catálogo\n')

  // ============================================
  // 1. UNIDADES DE MEDIDA
  // ============================================
  console.log('Creando unidades de medida...')

  const unidades = [
    { codigo: 'kg', nombre: 'Kilogramo', abreviatura: 'kg', tipo: 'peso' },
    { codigo: 'g', nombre: 'Gramo', abreviatura: 'g', tipo: 'peso' },
    { codigo: 'lt', nombre: 'Litro', abreviatura: 'L', tipo: 'volumen' },
    { codigo: 'ml', nombre: 'Mililitro', abreviatura: 'ml', tipo: 'volumen' },
    { codigo: 'oz', nombre: 'Onza', abreviatura: 'oz', tipo: 'peso' },
    { codigo: 'un', nombre: 'Unidad', abreviatura: 'u', tipo: 'unidad' },
    { codigo: 'lb', nombre: 'Libra', abreviatura: 'lb', tipo: 'peso' },
    { codigo: 'docena', nombre: 'Docena', abreviatura: 'doc', tipo: 'unidad' },
  ]

  for (const u of unidades) {
    await prisma.unidadMedida.upsert({
      where: { codigo: u.codigo },
      update: {},
      create: u,
    })
  }
  console.log(` ${unidades.length} unidades\n`)

  // Obtener unidades para referencias
  const unidadKg = await prisma.unidadMedida.findUnique({ where: { codigo: 'kg' } })
  const unidadG = await prisma.unidadMedida.findUnique({ where: { codigo: 'g' } })
  const unidadLt = await prisma.unidadMedida.findUnique({ where: { codigo: 'lt' } })
  const unidadMl = await prisma.unidadMedida.findUnique({ where: { codigo: 'ml' } })
  const unidadUn = await prisma.unidadMedida.findUnique({ where: { codigo: 'un' } })

  if (!unidadKg || !unidadG || !unidadLt || !unidadMl || !unidadUn) {
    throw new Error('Faltan unidades de medida')
  }

  // ============================================
  // 2. CATEGORÍAS
  // ============================================
  console.log('Creando categorías...')

  const categorias = [
    // Categorías principales
    { codigo: 'BEB-CAL', nombre: 'Bebidas Calientes', icono: 'Coffee', color: '#6B4226', orden: 1 },
    { codigo: 'BEB-FRI', nombre: 'Bebidas Frías', icono: 'CupSoda', color: '#4A7C59', orden: 2 },
    { codigo: 'REP', nombre: 'Repostería', icono: 'Cake', color: '#C17A3F', orden: 3 },
    { codigo: 'GRA', nombre: 'Café en Grano', icono: 'Package', color: '#8B5A2B', orden: 4 },
    { codigo: 'SNK', nombre: 'Snacks', icono: 'Cookie', color: '#D99E30', orden: 5 },
    { codigo: 'COM', nombre: 'Combos', icono: 'Gift', color: '#B84A3A', orden: 6 },
  ]

  for (const c of categorias) {
    await prisma.categoria.upsert({
      where: { codigo: c.codigo },
      update: {},
      create: c,
    })
  }

  // Subcategorías
  const catBebCal = await prisma.categoria.findUnique({ where: { codigo: 'BEB-CAL' } })
  const catBebFri = await prisma.categoria.findUnique({ where: { codigo: 'BEB-FRI' } })
  const catRep = await prisma.categoria.findUnique({ where: { codigo: 'REP' } })

  if (!catBebCal || !catBebFri || !catRep) {
    throw new Error('Faltan categorías principales')
  }

  const subcategorias = [
    { codigo: 'BEB-CAL-CAF', nombre: 'Cafés Calientes', padreId: catBebCal.id, orden: 1 },
    { codigo: 'BEB-CAL-TE', nombre: 'Tés e Infusiones', padreId: catBebCal.id, orden: 2 },
    { codigo: 'BEB-CAL-CHO', nombre: 'Chocolates', padreId: catBebCal.id, orden: 3 },
    { codigo: 'BEB-FRI-FRP', nombre: 'Frappés', padreId: catBebFri.id, orden: 1 },
    { codigo: 'BEB-FRI-SMO', nombre: 'Smoothies', padreId: catBebFri.id, orden: 2 },
    { codigo: 'REP-PAN', nombre: 'Panadería', padreId: catRep.id, orden: 1 },
    { codigo: 'REP-POS', nombre: 'Postres', padreId: catRep.id, orden: 2 },
  ]

  for (const s of subcategorias) {
    await prisma.categoria.upsert({
      where: { codigo: s.codigo },
      update: {},
      create: s,
    })
  }
  console.log(`   ✓ ${categorias.length} categorías + ${subcategorias.length} subcategorías\n`)

  // ============================================
  // 3. INSUMOS
  // ============================================
  console.log('🧂 Creando insumos...')

  const insumos = [
    // Café
    { codigo: 'INS-CAF-001', nombre: 'Café en grano - Tueste Medio', unidadMedidaId: unidadKg.id, costoUnitario: 320, categoriaInsumo: 'cafe', stockMinimo: 5 },
    { codigo: 'INS-CAF-002', nombre: 'Café en grano - Tueste Oscuro', unidadMedidaId: unidadKg.id, costoUnitario: 340, categoriaInsumo: 'cafe', stockMinimo: 5 },
    { codigo: 'INS-CAF-003', nombre: 'Café descafeinado', unidadMedidaId: unidadKg.id, costoUnitario: 380, categoriaInsumo: 'cafe', stockMinimo: 2 },

    // Lácteos
    { codigo: 'INS-LAC-001', nombre: 'Leche entera', unidadMedidaId: unidadLt.id, costoUnitario: 38, categoriaInsumo: 'lacteos', stockMinimo: 20 },
    { codigo: 'INS-LAC-002', nombre: 'Leche deslactosada', unidadMedidaId: unidadLt.id, costoUnitario: 45, categoriaInsumo: 'lacteos', stockMinimo: 10 },
    { codigo: 'INS-LAC-003', nombre: 'Leche de almendra', unidadMedidaId: unidadLt.id, costoUnitario: 120, categoriaInsumo: 'lacteos', stockMinimo: 5 },
    { codigo: 'INS-LAC-004', nombre: 'Crema para batir', unidadMedidaId: unidadLt.id, costoUnitario: 180, categoriaInsumo: 'lacteos', stockMinimo: 3 },

    // Endulzantes y sabores
    { codigo: 'INS-END-001', nombre: 'Azúcar blanca', unidadMedidaId: unidadKg.id, costoUnitario: 28, categoriaInsumo: 'endulzantes', stockMinimo: 5 },
    { codigo: 'INS-END-002', nombre: 'Azúcar morena', unidadMedidaId: unidadKg.id, costoUnitario: 45, categoriaInsumo: 'endulzantes', stockMinimo: 3 },
    { codigo: 'INS-END-003', nombre: 'Jarabe de vainilla', unidadMedidaId: unidadLt.id, costoUnitario: 320, categoriaInsumo: 'endulzantes', stockMinimo: 2 },
    { codigo: 'INS-END-004', nombre: 'Jarabe de caramelo', unidadMedidaId: unidadLt.id, costoUnitario: 340, categoriaInsumo: 'endulzantes', stockMinimo: 2 },
    { codigo: 'INS-END-005', nombre: 'Chocolate en polvo', unidadMedidaId: unidadKg.id, costoUnitario: 280, categoriaInsumo: 'endulzantes', stockMinimo: 3 },

    // Desechables
    { codigo: 'INS-DES-001', nombre: 'Vaso 12oz con tapa', unidadMedidaId: unidadUn.id, costoUnitario: 4.5, categoriaInsumo: 'desechables', stockMinimo: 200 },
    { codigo: 'INS-DES-002', nombre: 'Vaso 16oz con tapa', unidadMedidaId: unidadUn.id, costoUnitario: 5.5, categoriaInsumo: 'desechables', stockMinimo: 200 },
    { codigo: 'INS-DES-003', nombre: 'Vaso 20oz con tapa', unidadMedidaId: unidadUn.id, costoUnitario: 6.5, categoriaInsumo: 'desechables', stockMinimo: 150 },
    { codigo: 'INS-DES-004', nombre: 'Vaso frío 16oz + domo', unidadMedidaId: unidadUn.id, costoUnitario: 6, categoriaInsumo: 'desechables', stockMinimo: 150 },
    { codigo: 'INS-DES-005', nombre: 'Servilleta', unidadMedidaId: unidadUn.id, costoUnitario: 0.5, categoriaInsumo: 'desechables', stockMinimo: 500 },
    { codigo: 'INS-DES-006', nombre: 'Pajilla', unidadMedidaId: unidadUn.id, costoUnitario: 0.8, categoriaInsumo: 'desechables', stockMinimo: 300 },
    { codigo: 'INS-DES-007', nombre: 'Bolsa para llevar', unidadMedidaId: unidadUn.id, costoUnitario: 2, categoriaInsumo: 'desechables', stockMinimo: 200 },

    // Insumos para repostería
    { codigo: 'INS-REP-001', nombre: 'Harina de trigo', unidadMedidaId: unidadKg.id, costoUnitario: 45, categoriaInsumo: 'reposteria', stockMinimo: 10 },
    { codigo: 'INS-REP-002', nombre: 'Mantequilla', unidadMedidaId: unidadKg.id, costoUnitario: 280, categoriaInsumo: 'reposteria', stockMinimo: 5 },
    { codigo: 'INS-REP-003', nombre: 'Huevos', unidadMedidaId: unidadUn.id, costoUnitario: 6, categoriaInsumo: 'reposteria', stockMinimo: 60 },
    { codigo: 'INS-REP-004', nombre: 'Chocolate semi-amargo', unidadMedidaId: unidadKg.id, costoUnitario: 380, categoriaInsumo: 'reposteria', stockMinimo: 3 },
    { codigo: 'INS-REP-005', nombre: 'Queso crema', unidadMedidaId: unidadKg.id, costoUnitario: 220, categoriaInsumo: 'reposteria', stockMinimo: 3 },
  ]

  for (const i of insumos) {
    await prisma.insumo.upsert({
      where: { codigo: i.codigo },
      update: {},
      create: i,
    })
  }
  console.log(`   ✓ ${insumos.length} insumos\n`)

  // ============================================
  // 4. PRODUCTOS
  // ============================================
  console.log('Creando productos...')

  const catCafCalientes = await prisma.categoria.findUnique({ where: { codigo: 'BEB-CAL-CAF' } })
  const catTes = await prisma.categoria.findUnique({ where: { codigo: 'BEB-CAL-TE' } })
  const catChocolates = await prisma.categoria.findUnique({ where: { codigo: 'BEB-CAL-CHO' } })
  const catFrappes = await prisma.categoria.findUnique({ where: { codigo: 'BEB-FRI-FRP' } })
  const catSmoothies = await prisma.categoria.findUnique({ where: { codigo: 'BEB-FRI-SMO' } })
  const catPanaderia = await prisma.categoria.findUnique({ where: { codigo: 'REP-PAN' } })
  const catPostres = await prisma.categoria.findUnique({ where: { codigo: 'REP-POS' } })
  const catGranos = await prisma.categoria.findUnique({ where: { codigo: 'GRA' } })

  if (!catCafCalientes || !catGranos) throw new Error('Faltan categorías para productos')

  const productos = [
    // Café Caliente
    {
      codigo: 'CAF-001',
      nombre: 'Espresso',
      descripcion: 'Shot de café espresso 30ml',
      categoriaId: catCafCalientes.id,
      tipo: 'variantes',
      precioBase: 35,
      costo: 8,
      destacado: true,
      variantes: [
        { codigo: 'S', nombre: 'Sencillo (30ml)', precio: 35, orden: 1 },
        { codigo: 'D', nombre: 'Doble (60ml)', precio: 50, orden: 2 },
      ],
    },
    {
      codigo: 'CAF-002',
      nombre: 'Americano',
      descripcion: 'Espresso con agua caliente',
      categoriaId: catCafCalientes.id,
      tipo: 'variantes',
      precioBase: 45,
      costo: 10,
      destacado: true,
      variantes: [
        { codigo: '12oz', nombre: 'Mediano (12oz)', precio: 45, orden: 1 },
        { codigo: '16oz', nombre: 'Grande (16oz)', precio: 55, orden: 2 },
      ],
    },
    {
      codigo: 'CAF-003',
      nombre: 'Capuchino',
      descripcion: 'Espresso con leche vaporizada y espuma',
      categoriaId: catCafCalientes.id,
      tipo: 'variantes',
      precioBase: 65,
      costo: 18,
      destacado: true,
      variantes: [
        { codigo: '12oz', nombre: 'Mediano (12oz)', precio: 65, orden: 1 },
        { codigo: '16oz', nombre: 'Grande (16oz)', precio: 75, orden: 2 },
      ],
    },
    {
      codigo: 'CAF-004',
      nombre: 'Latte',
      descripcion: 'Espresso con leche vaporizada',
      categoriaId: catCafCalientes.id,
      tipo: 'variantes',
      precioBase: 70,
      costo: 20,
      destacado: true,
      variantes: [
        { codigo: '12oz', nombre: 'Mediano (12oz)', precio: 70, orden: 1 },
        { codigo: '16oz', nombre: 'Grande (16oz)', precio: 80, orden: 2 },
        { codigo: '20oz', nombre: 'Extra Grande (20oz)', precio: 90, orden: 3 },
      ],
    },
    {
      codigo: 'CAF-005',
      nombre: 'Latte Vainilla',
      descripcion: 'Latte con jarabe de vainilla',
      categoriaId: catCafCalientes.id,
      tipo: 'variantes',
      precioBase: 80,
      costo: 25,
      variantes: [
        { codigo: '12oz', nombre: 'Mediano (12oz)', precio: 80, orden: 1 },
        { codigo: '16oz', nombre: 'Grande (16oz)', precio: 90, orden: 2 },
      ],
    },
    {
      codigo: 'CAF-006',
      nombre: 'Latte Caramelo',
      descripcion: 'Latte con jarabe de caramelo',
      categoriaId: catCafCalientes.id,
      tipo: 'variantes',
      precioBase: 85,
      costo: 28,
      variantes: [
        { codigo: '12oz', nombre: 'Mediano (12oz)', precio: 85, orden: 1 },
        { codigo: '16oz', nombre: 'Grande (16oz)', precio: 95, orden: 2 },
      ],
    },
    {
      codigo: 'CAF-007',
      nombre: 'Moka',
      descripcion: 'Latte con chocolate y crema',
      categoriaId: catCafCalientes.id,
      tipo: 'variantes',
      precioBase: 85,
      costo: 28,
      variantes: [
        { codigo: '12oz', nombre: 'Mediano (12oz)', precio: 85, orden: 1 },
        { codigo: '16oz', nombre: 'Grande (16oz)', precio: 95, orden: 2 },
      ],
    },

    // Café en Grano
    {
      codigo: 'GRA-001',
      nombre: 'Café en grano - Tueste Medio',
      descripcion: 'Café de altura nicaragüense, tueste medio',
      categoriaId: catGranos.id,
      tipo: 'variantes',
      precioBase: 350,
      costo: 180,
      tipoImpuesto: 'EXENTO',
      variantes: [
        { codigo: '250g', nombre: '250 gramos', precio: 350, orden: 1 },
        { codigo: '500g', nombre: '500 gramos', precio: 650, orden: 2 },
        { codigo: '1kg', nombre: '1 kilogramo', precio: 1200, orden: 3 },
      ],
    },
    {
      codigo: 'GRA-002',
      nombre: 'Café en grano - Tueste Oscuro',
      descripcion: 'Café de altura nicaragüense, tueste oscuro',
      categoriaId: catGranos.id,
      tipo: 'variantes',
      precioBase: 370,
      costo: 200,
      tipoImpuesto: 'EXENTO',
      variantes: [
        { codigo: '250g', nombre: '250 gramos', precio: 370, orden: 1 },
        { codigo: '500g', nombre: '500 gramos', precio: 700, orden: 2 },
        { codigo: '1kg', nombre: '1 kilogramo', precio: 1300, orden: 3 },
      ],
    },
  ]

  for (const p of productos) {
    const { variantes, ...productoData } = p

    const producto = await prisma.producto.upsert({
      where: { codigo: productoData.codigo },
      update: {},
      create: {
        ...productoData,
        tipoImpuesto: productoData.tipoImpuesto ?? 'GRAVADO_15',
      },
    })

    // Crear variantes
    if (variantes) {
      for (const v of variantes) {
        await prisma.productoVariante.upsert({
          where: {
            productoId_codigo: {
              productoId: producto.id,
              codigo: v.codigo,
            },
          },
          update: {},
          create: {
            productoId: producto.id,
            codigo: v.codigo,
            nombre: v.nombre,
            precio: v.precio,
            orden: v.orden,
          },
        })
      }
    }
  }
  console.log(` ${productos.length} productos con variantes\n`)

  // ============================================
  // 5. CAJAS POR SUCURSAL
  // ============================================
  console.log('Creando cajas por sucursal...')

  const sucursales = await prisma.sucursal.findMany()

  for (const sucursal of sucursales) {
    for (let i = 1; i <= 2; i++) {
      await prisma.caja.upsert({
        where: {
          sucursalId_codigo: {
            sucursalId: sucursal.id,
            codigo: `C${i}`,
          },
        },
        update: {},
        create: {
          sucursalId: sucursal.id,
          codigo: `C${i}`,
          nombre: `Caja ${i}`,
          orden: i,
        },
      })
    }
  }
  console.log('4 cajas (2 por sucursal)\n')

  // ============================================
  // 6. PROVEEDORES DE EJEMPLO
  // ============================================
  console.log('Creando proveedores...')

  const proveedores = [
    {
      codigo: 'PROV-001',
      nombre: 'Distribuidora Café de Nicaragua',
      nombreComercial: 'CaféNic',
      telefono: '2255-1234',
      correo: 'ventas@cafenic.com.ni',
      direccion: 'Managua, Nicaragua',
    },
    {
      codigo: 'PROV-002',
      nombre: 'Lácteos Centroamericanos S.A.',
      nombreComercial: 'LACSA',
      telefono: '2266-5678',
      correo: 'pedidos@lacsa.com.ni',
      direccion: 'Managua, Nicaragua',
    },
    {
      codigo: 'PROV-003',
      nombre: 'Desechables y Más',
      nombreComercial: 'Desechables Ya',
      telefono: '2277-9012',
      correo: 'info@desechablesya.com.ni',
      direccion: 'Managua, Nicaragua',
    },
  ]

  for (const prov of proveedores) {
    await prisma.proveedor.upsert({
      where: { codigo: prov.codigo },
      update: {},
      create: prov,
    })
  }
  console.log(`   ✓ ${proveedores.length} proveedores\n`)

  // ============================================
  // 7. CLIENTES DE EJEMPLO
  // ============================================
  console.log('Creando clientes de ejemplo...')

  const clientes = [
    {
      codigo: 'CLI-001',
      nombre: 'Consumidor',
      apellido: 'Final',
      tipoDocumento: 'CEDULA',
      numeroDocumento: '001-000000-0000A',
    },
    {
      codigo: 'CLI-002',
      nombre: 'María',
      apellido: 'González',
      tipoDocumento: 'CEDULA',
      numeroDocumento: '001-123456-0001A',
      telefono: '8888-1111',
      correo: 'maria@ejemplo.com',
      permiteCredito: true,
      limiteCredito: 2000,
    },
    {
      codigo: 'CLI-003',
      nombre: 'Empresa XYZ S.A.',
      nombreComercial: 'XYZ',
      tipoDocumento: 'RUC',
      numeroDocumento: 'J0310000001234',
      telefono: '2233-4455',
      correo: 'pagos@xyz.com.ni',
      permiteCredito: true,
      limiteCredito: 10000,
    },
  ]

  for (const cli of clientes) {
    await prisma.cliente.upsert({
      where: { codigo: cli.codigo },
      update: {},
      create: cli,
    })
  }
  console.log(`   ✓ ${clientes.length} clientes\n`)

  console.log('═══════════════════════════════════════')
  console.log('SEED DE CATÁLOGO COMPLETADO')
  console.log('═══════════════════════════════════════\n')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Error en seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })