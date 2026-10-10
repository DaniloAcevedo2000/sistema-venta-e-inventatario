-- AlterTable
ALTER TABLE "facturas" ADD COLUMN     "anulada_por_id" TEXT;

-- AlterTable
ALTER TABLE "ventas" ADD COLUMN     "devuelta_al_inventario" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metodo_devolucion" TEXT,
ADD COLUMN     "monto_devuelto" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "notas_credito" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "numero_sucursal" INTEGER NOT NULL,
    "factura_original_id" TEXT NOT NULL,
    "venta_id" TEXT NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "fecha_emision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivo" TEXT NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "subtotal_exento" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "subtotal_gravado" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "descuento" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "iva" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'EMITIDA',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notas_credito_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notas_credito_numero_key" ON "notas_credito"("numero");

-- CreateIndex
CREATE INDEX "notas_credito_factura_original_id_idx" ON "notas_credito"("factura_original_id");

-- CreateIndex
CREATE INDEX "notas_credito_venta_id_idx" ON "notas_credito"("venta_id");

-- CreateIndex
CREATE INDEX "notas_credito_creado_en_idx" ON "notas_credito"("creado_en");

-- CreateIndex
CREATE UNIQUE INDEX "notas_credito_sucursal_id_numero_sucursal_key" ON "notas_credito"("sucursal_id", "numero_sucursal");

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_anulada_por_id_fkey" FOREIGN KEY ("anulada_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_credito" ADD CONSTRAINT "notas_credito_factura_original_id_fkey" FOREIGN KEY ("factura_original_id") REFERENCES "facturas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_credito" ADD CONSTRAINT "notas_credito_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_credito" ADD CONSTRAINT "notas_credito_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_credito" ADD CONSTRAINT "notas_credito_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_anulada_por_id_fkey" FOREIGN KEY ("anulada_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
