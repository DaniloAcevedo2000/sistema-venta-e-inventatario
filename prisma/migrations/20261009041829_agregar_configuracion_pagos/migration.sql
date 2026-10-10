/*
  Warnings:

  - You are about to drop the column `metodo` on the `pagos_venta` table. All the data in the column will be lost.
  - Added the required column `metodo_codigo` to the `pagos_venta` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "pagos_venta_metodo_creado_en_idx";

-- AlterTable
ALTER TABLE "pagos_venta" DROP COLUMN "metodo",
ADD COLUMN     "banco_codigo" TEXT,
ADD COLUMN     "banco_id" TEXT,
ADD COLUMN     "metodo_codigo" TEXT NOT NULL,
ADD COLUMN     "metodo_pago_id" TEXT,
ADD COLUMN     "red_tarjeta_codigo" TEXT,
ADD COLUMN     "red_tarjeta_id" TEXT;

-- CreateTable
CREATE TABLE "metodos_pago" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" TEXT NOT NULL,
    "moneda_id" TEXT,
    "requiere_banco" BOOLEAN NOT NULL DEFAULT false,
    "requiere_red" BOOLEAN NOT NULL DEFAULT false,
    "requiere_referencia" BOOLEAN NOT NULL DEFAULT false,
    "es_credito" BOOLEAN NOT NULL DEFAULT false,
    "icono" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metodos_pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bancos" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombre_corto" TEXT,
    "permite_tarjeta" BOOLEAN NOT NULL DEFAULT true,
    "permite_transferencia" BOOLEAN NOT NULL DEFAULT true,
    "icono" TEXT,
    "color" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bancos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redes_tarjeta" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "icono" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "redes_tarjeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monedas" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "simbolo" TEXT NOT NULL,
    "es_base" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monedas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasas_cambio" (
    "id" TEXT NOT NULL,
    "moneda_origen" TEXT NOT NULL,
    "moneda_destino" TEXT NOT NULL,
    "tasa" DECIMAL(12,6) NOT NULL,
    "fuente" TEXT NOT NULL DEFAULT 'MANUAL',
    "vigente_desde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vigente_hasta" TIMESTAMP(3),
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "usuario_id" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasas_cambio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "metodos_pago_codigo_key" ON "metodos_pago"("codigo");

-- CreateIndex
CREATE INDEX "metodos_pago_activo_orden_idx" ON "metodos_pago"("activo", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "bancos_codigo_key" ON "bancos"("codigo");

-- CreateIndex
CREATE INDEX "bancos_activo_orden_idx" ON "bancos"("activo", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "redes_tarjeta_codigo_key" ON "redes_tarjeta"("codigo");

-- CreateIndex
CREATE INDEX "redes_tarjeta_activo_orden_idx" ON "redes_tarjeta"("activo", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "monedas_codigo_key" ON "monedas"("codigo");

-- CreateIndex
CREATE INDEX "tasas_cambio_moneda_origen_moneda_destino_activa_idx" ON "tasas_cambio"("moneda_origen", "moneda_destino", "activa");

-- CreateIndex
CREATE INDEX "tasas_cambio_vigente_desde_idx" ON "tasas_cambio"("vigente_desde");

-- CreateIndex
CREATE INDEX "pagos_venta_metodo_pago_id_idx" ON "pagos_venta"("metodo_pago_id");

-- CreateIndex
CREATE INDEX "pagos_venta_creado_en_idx" ON "pagos_venta"("creado_en");

-- AddForeignKey
ALTER TABLE "pagos_venta" ADD CONSTRAINT "pagos_venta_metodo_pago_id_fkey" FOREIGN KEY ("metodo_pago_id") REFERENCES "metodos_pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metodos_pago" ADD CONSTRAINT "metodos_pago_moneda_id_fkey" FOREIGN KEY ("moneda_id") REFERENCES "monedas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
