import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Si tienes problemas con SSL en la nube (como en Neon o Supabase), 
// puedes agregar { ssl: { rejectUnauthorized: false } } dentro del new Pool()
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

async function main() {
  try {
    const result = await prisma.$queryRaw`SELECT NOW()`
    console.log('✅ Conexión exitosa a la base de datos:', result)
  } catch (error) {
    console.error('❌ Error de conexión:', error)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main()