/*
  Warnings:

  - A unique constraint covering the columns `[sucursal_id,numero_sucursal]` on the table `facturas` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sucursal_id,numero_sucursal]` on the table `ventas` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `numero_sucursal` to the `facturas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `numero_sucursal` to the `ventas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "facturas" ADD COLUMN     "numero_sucursal" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ventas" ADD COLUMN     "numero_sucursal" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "facturas_sucursal_id_numero_sucursal_key" ON "facturas"("sucursal_id", "numero_sucursal");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_sucursal_id_numero_sucursal_key" ON "ventas"("sucursal_id", "numero_sucursal");
