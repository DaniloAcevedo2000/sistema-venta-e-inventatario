-- CreateTable
CREATE TABLE "zonas_entrega" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tarifa" DECIMAL(12,2) NOT NULL,
    "tiempo_estimado_min" INTEGER,
    "color" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "sucursalId" TEXT,

    CONSTRAINT "zonas_entrega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "numero_sucursal" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "sucursal_id" TEXT NOT NULL,
    "cliente_id" TEXT,
    "cliente_nombre" TEXT NOT NULL,
    "cliente_telefono" TEXT NOT NULL,
    "cliente_direccion" TEXT,
    "zona_entrega_id" TEXT,
    "usuario_creacion_id" TEXT NOT NULL,
    "repartidor_id" TEXT,
    "fecha_programada" TIMESTAMP(3),
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "descuento" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "impuesto" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "costo_envio" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "estado_pago" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "metodo_pago_id" TEXT,
    "venta_id" TEXT,
    "notas" TEXT,
    "notas_internas" TEXT,
    "confirmado_en" TIMESTAMP(3),
    "preparacion_en" TIMESTAMP(3),
    "listo_en" TIMESTAMP(3),
    "en_camino_en" TIMESTAMP(3),
    "entregado_en" TIMESTAMP(3),
    "cancelado_en" TIMESTAMP(3),
    "motivo_cancelacion" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_pedido" (
    "id" TEXT NOT NULL,
    "pedido_id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "variante_id" TEXT,
    "nombre_producto" TEXT NOT NULL,
    "nombre_variante" TEXT,
    "cantidad" DECIMAL(12,4) NOT NULL,
    "precio_unitario" DECIMAL(12,4) NOT NULL,
    "descuento" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "impuesto" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "tipo_impuesto" TEXT NOT NULL DEFAULT 'GRAVADO_15',
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "items_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "zonas_entrega_codigo_key" ON "zonas_entrega"("codigo");

-- CreateIndex
CREATE INDEX "zonas_entrega_activa_orden_idx" ON "zonas_entrega"("activa", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_numero_key" ON "pedidos"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_venta_id_key" ON "pedidos"("venta_id");

-- CreateIndex
CREATE INDEX "pedidos_estado_creado_en_idx" ON "pedidos"("estado", "creado_en");

-- CreateIndex
CREATE INDEX "pedidos_tipo_estado_idx" ON "pedidos"("tipo", "estado");

-- CreateIndex
CREATE INDEX "pedidos_sucursal_id_estado_idx" ON "pedidos"("sucursal_id", "estado");

-- CreateIndex
CREATE INDEX "pedidos_repartidor_id_estado_idx" ON "pedidos"("repartidor_id", "estado");

-- CreateIndex
CREATE INDEX "pedidos_cliente_id_idx" ON "pedidos"("cliente_id");

-- CreateIndex
CREATE INDEX "pedidos_creado_en_idx" ON "pedidos"("creado_en");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_sucursal_id_numero_sucursal_key" ON "pedidos"("sucursal_id", "numero_sucursal");

-- CreateIndex
CREATE INDEX "items_pedido_pedido_id_idx" ON "items_pedido"("pedido_id");

-- CreateIndex
CREATE INDEX "items_pedido_producto_id_idx" ON "items_pedido"("producto_id");

-- AddForeignKey
ALTER TABLE "zonas_entrega" ADD CONSTRAINT "zonas_entrega_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_zona_entrega_id_fkey" FOREIGN KEY ("zona_entrega_id") REFERENCES "zonas_entrega"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_usuario_creacion_id_fkey" FOREIGN KEY ("usuario_creacion_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_repartidor_id_fkey" FOREIGN KEY ("repartidor_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_metodo_pago_id_fkey" FOREIGN KEY ("metodo_pago_id") REFERENCES "metodos_pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_pedido" ADD CONSTRAINT "items_pedido_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_pedido" ADD CONSTRAINT "items_pedido_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_pedido" ADD CONSTRAINT "items_pedido_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "productos_variantes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
