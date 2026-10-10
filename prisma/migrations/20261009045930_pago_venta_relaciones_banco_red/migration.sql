-- CreateIndex
CREATE INDEX "pagos_venta_banco_id_idx" ON "pagos_venta"("banco_id");

-- CreateIndex
CREATE INDEX "pagos_venta_red_tarjeta_id_idx" ON "pagos_venta"("red_tarjeta_id");

-- AddForeignKey
ALTER TABLE "pagos_venta" ADD CONSTRAINT "pagos_venta_banco_id_fkey" FOREIGN KEY ("banco_id") REFERENCES "bancos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_venta" ADD CONSTRAINT "pagos_venta_red_tarjeta_id_fkey" FOREIGN KEY ("red_tarjeta_id") REFERENCES "redes_tarjeta"("id") ON DELETE SET NULL ON UPDATE CASCADE;
