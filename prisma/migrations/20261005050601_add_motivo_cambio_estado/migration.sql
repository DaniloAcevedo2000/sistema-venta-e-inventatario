-- AlterTable
ALTER TABLE "productos" ADD COLUMN     "desactivado_en" TIMESTAMP(3),
ADD COLUMN     "desactivado_por_id" TEXT,
ADD COLUMN     "motivo_cambio" TEXT;
