import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seed de configuración de pagos\n')

  // ============================================
  // 1. MONEDAS
  // ============================================
  console.log('Creando monedas...')

  const monedas = [
    { codigo: 'NIO', nombre: 'Córdoba Nicaragüense', simbolo: 'C$', esBase: true },
    { codigo: 'USD', nombre: 'Dólar Estadounidense', simbolo: '$', esBase: false },
  ]

  for (const m of monedas) {
    await prisma.moneda.upsert({
      where: { codigo: m.codigo },
      update: {},
      create: m,
    })
  }

  const monedaNio = await prisma.moneda.findUnique({ where: { codigo: 'NIO' } })
  const monedaUsd = await prisma.moneda.findUnique({ where: { codigo: 'USD' } })

  if (!monedaNio || !monedaUsd) throw new Error('Faltan monedas')

  console.log(`  ${monedas.length} monedas\n`)

  // ============================================
  // 2. MÉTODOS DE PAGO
  // ============================================
  console.log('Creando métodos de pago...')

  const metodos = [
    {
      codigo: 'EFECTIVO_NIO',
      nombre: 'Efectivo C$',
      tipo: 'efectivo',
      monedaId: monedaNio.id,
      requiereBanco: false,
      requiereRed: false,
      requiereReferencia: false,
      esCredito: false,
      icono: 'Banknote',
      orden: 1,
    },
    {
      codigo: 'EFECTIVO_USD',
      nombre: 'Efectivo USD',
      tipo: 'efectivo',
      monedaId: monedaUsd.id,
      requiereBanco: false,
      requiereRed: false,
      requiereReferencia: false,
      esCredito: false,
      icono: 'Banknote',
      orden: 2,
    },
    {
      codigo: 'TARJETA',
      nombre: 'Tarjeta',
      tipo: 'tarjeta',
      monedaId: monedaNio.id,
      requiereBanco: true,
      requiereRed: true,
      requiereReferencia: true,
      esCredito: false,
      icono: 'CreditCard',
      orden: 3,
    },
    {
      codigo: 'TRANSFERENCIA',
      nombre: 'Transferencia',
      tipo: 'transferencia',
      monedaId: monedaNio.id,
      requiereBanco: true,
      requiereRed: false,
      requiereReferencia: true,
      esCredito: false,
      icono: 'Building2',
      orden: 4,
    },
    {
      codigo: 'CREDITO',
      nombre: 'Crédito',
      tipo: 'credito',
      monedaId: monedaNio.id,
      requiereBanco: false,
      requiereRed: false,
      requiereReferencia: false,
      esCredito: true,
      icono: 'FileText',
      orden: 5,
    },
  ]

  for (const m of metodos) {
    await prisma.metodoPago.upsert({
      where: { codigo: m.codigo },
      update: {},
      create: m,
    })
  }

  console.log(`  ${metodos.length} métodos de pago\n`)

  // ============================================
  // 3. BANCOS
  // ============================================
  console.log('Creando bancos...')

  const bancos = [
    { codigo: 'BAC', nombre: 'BAC Credomatic', nombreCorto: 'BAC', orden: 1 },
    { codigo: 'BANPRO', nombre: 'Banco de la Producción', nombreCorto: 'Banpro', orden: 2 },
    { codigo: 'LAFISE', nombre: 'Banco Lafise Bancentro', nombreCorto: 'Lafise', orden: 3 },
    { codigo: 'AVANZ', nombre: 'Banco Avanz', nombreCorto: 'Avanz', orden: 4 },
    { codigo: 'FICOHSA', nombre: 'Banco Ficohsa', nombreCorto: 'Ficohsa', orden: 5 },
    { codigo: 'ATLANTIDA', nombre: 'Banco Atlántida', nombreCorto: 'Atlántida', orden: 6 },
    { codigo: 'BDF', nombre: 'Banco de Finanzas', nombreCorto: 'BDF', orden: 7 },
    { codigo: 'PROCREDIT', nombre: 'ProCredit', nombreCorto: 'ProCredit', orden: 8 },
    { codigo: 'BANCO_FOMENTO', nombre: 'Banco de Fomento a la Producción', nombreCorto: 'Fomento', orden: 9 },
    { codigo: 'OTRO', nombre: 'Otro banco', nombreCorto: 'Otro', orden: 99 },
  ]

  for (const b of bancos) {
    await prisma.banco.upsert({
      where: { codigo: b.codigo },
      update: {},
      create: b,
    })
  }

  console.log(`  ${bancos.length} bancos\n`)

  // ============================================
  // 4. REDES DE TARJETA
  // ============================================
  console.log('Creando redes de tarjeta...')

  const redes = [
    { codigo: 'VISA', nombre: 'Visa', orden: 1 },
    { codigo: 'MASTERCARD', nombre: 'Mastercard', orden: 2 },
    { codigo: 'AMEX', nombre: 'American Express', orden: 3 },
    { codigo: 'DINERS', nombre: 'Diners Club', orden: 4 },
    { codigo: 'OTRA', nombre: 'Otra', orden: 99 },
  ]

  for (const r of redes) {
    await prisma.redTarjeta.upsert({
      where: { codigo: r.codigo },
      update: {},
      create: r,
    })
  }

  console.log(`   ✓ ${redes.length} redes\n`)

  // ============================================
  // 5. TASA DE CAMBIO INICIAL
  // ============================================
  console.log('Creando tasa de cambio inicial...')

  const tasaExistente = await prisma.tasaCambio.findFirst({
    where: {
      monedaOrigen: 'USD',
      monedaDestino: 'NIO',
      activa: true,
    },
  })

  if (!tasaExistente) {
    await prisma.tasaCambio.create({
      data: {
        monedaOrigen: 'USD',
        monedaDestino: 'NIO',
        tasa: 36.6243,
        fuente: 'MANUAL',
        activa: true,
        notas: 'Tasa inicial - valor oficial BCN',
      },
    })
    console.log('Tasa inicial: 36.6243\n')
  } else {
    console.log(' Tasa ya existe, no se sobreescribió\n')
  }

  console.log('═══════════════════════════════════════')
  console.log('SEED DE PAGOS COMPLETADO')
  console.log('═══════════════════════════════════════\n')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })