-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "facturado_en" TIMESTAMP(3),
ADD COLUMN     "usuario_facturacion_id" TEXT;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_usuario_facturacion_id_fkey" FOREIGN KEY ("usuario_facturacion_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
