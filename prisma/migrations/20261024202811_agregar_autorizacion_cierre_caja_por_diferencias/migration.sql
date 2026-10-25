-- AlterTable
ALTER TABLE "sesiones_caja" ADD COLUMN     "autorizado_por_id" TEXT,
ADD COLUMN     "motivo_diferencia" TEXT;

-- AddForeignKey
ALTER TABLE "sesiones_caja" ADD CONSTRAINT "sesiones_caja_autorizado_por_id_fkey" FOREIGN KEY ("autorizado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
