-- DropForeignKey
ALTER TABLE "ventas" DROP CONSTRAINT "ventas_sesion_caja_id_fkey";

-- AlterTable
ALTER TABLE "ventas" ALTER COLUMN "sesion_caja_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_sesion_caja_id_fkey" FOREIGN KEY ("sesion_caja_id") REFERENCES "sesiones_caja"("id") ON DELETE SET NULL ON UPDATE CASCADE;
