-- AlterTable
ALTER TABLE "items_compra" ADD COLUMN     "insumo_id" TEXT;

-- AddForeignKey
ALTER TABLE "items_compra" ADD CONSTRAINT "items_compra_insumo_id_fkey" FOREIGN KEY ("insumo_id") REFERENCES "insumos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
