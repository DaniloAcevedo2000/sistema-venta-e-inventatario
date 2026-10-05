-- CreateTable
CREATE TABLE "cajas" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cajas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones_caja" (
    "id" TEXT NOT NULL,
    "caja_id" TEXT NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "usuario_apertura_id" TEXT NOT NULL,
    "fecha_apertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monto_inicial" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "fecha_cierre" TIMESTAMP(3),
    "monto_final" DECIMAL(12,2),
    "monto_esperado" DECIMAL(12,2),
    "diferencia" DECIMAL(12,2),
    "total_ventas" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_efectivo" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_tarjeta" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_transferencia" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'ABIERTA',
    "observaciones" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sesiones_caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidades_medida" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "abreviatura" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'unidad',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unidades_medida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insumos" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "unidad_medida_id" TEXT NOT NULL,
    "costo_unitario" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "stock_minimo" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "imagen_url" TEXT,
    "categoria_insumo" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insumos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "color" TEXT,
    "icono" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "padre_id" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'simple',
    "precio_base" DECIMAL(12,2) NOT NULL,
    "costo" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tipo_impuesto" TEXT NOT NULL DEFAULT 'GRAVADO_15',
    "imagen_url" TEXT,
    "color" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "permite_descuento" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "codigo_barras" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "creado_por_id" TEXT,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos_variantes" (
    "id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "precio" DECIMAL(12,2) NOT NULL,
    "costo" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "controla_stock" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_variantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recetas" (
    "id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "variante_id" TEXT,
    "notas" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recetas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recetas_items" (
    "id" TEXT NOT NULL,
    "receta_id" TEXT NOT NULL,
    "insumo_id" TEXT NOT NULL,
    "cantidad" DECIMAL(12,4) NOT NULL,
    "unidad_medida_id" TEXT NOT NULL,
    "merma_porcentaje" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recetas_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combos_items" (
    "id" TEXT NOT NULL,
    "combo_id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "variante_id" TEXT,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "precio_especial" DECIMAL(12,2),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "combos_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stocks" (
    "id" TEXT NOT NULL,
    "producto_id" TEXT,
    "insumo_id" TEXT,
    "sucursal_id" TEXT NOT NULL,
    "cantidad" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "cantidad_reservada" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id" TEXT NOT NULL,
    "producto_id" TEXT,
    "insumo_id" TEXT,
    "sucursal_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "cantidad" DECIMAL(12,4) NOT NULL,
    "cantidad_anterior" DECIMAL(12,4) NOT NULL,
    "cantidad_nueva" DECIMAL(12,4) NOT NULL,
    "costo_unitario" DECIMAL(12,4),
    "costo_total" DECIMAL(12,2),
    "referencia_tipo" TEXT,
    "referencia_id" TEXT,
    "motivo" TEXT,
    "notas" TEXT,
    "usuario_id" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transferencias_stock" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "sucursal_origen_id" TEXT NOT NULL,
    "sucursal_destino_id" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "notas" TEXT,
    "usuario_solicita_id" TEXT NOT NULL,
    "fecha_envio" TIMESTAMP(3),
    "fecha_recepcion" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transferencias_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombre_comercial" TEXT,
    "ruc" TEXT,
    "contacto" TEXT,
    "telefono" TEXT,
    "correo" TEXT,
    "direccion" TEXT,
    "notas" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes_compra" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "proveedor_id" TEXT NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "fecha_orden" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_esperada" TIMESTAMP(3),
    "fecha_recepcion" TIMESTAMP(3),
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "impuesto" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordenes_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_compra" (
    "id" TEXT NOT NULL,
    "orden_compra_id" TEXT NOT NULL,
    "producto_id" TEXT,
    "descripcion" TEXT NOT NULL,
    "cantidad" DECIMAL(12,4) NOT NULL,
    "cantidad_recibida" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "precio_unitario" DECIMAL(12,4) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "tipo_impuesto" TEXT NOT NULL DEFAULT 'GRAVADO_15',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "items_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "sesion_caja_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "cliente_id" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'CONTADO',
    "estado" TEXT NOT NULL DEFAULT 'COMPLETADA',
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "descuento" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "impuesto" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "total_efectivo_nio" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_efectivo_usd" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_tarjeta" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_transferencia" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_credito" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tasa_cambio" DECIMAL(10,4) NOT NULL DEFAULT 36.6243,
    "notas" TEXT,
    "anulada_en" TIMESTAMP(3),
    "anulada_por_id" TEXT,
    "motivo_anulacion" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_venta" (
    "id" TEXT NOT NULL,
    "venta_id" TEXT NOT NULL,
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

    CONSTRAINT "items_venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos_venta" (
    "id" TEXT NOT NULL,
    "venta_id" TEXT NOT NULL,
    "metodo" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "monto_nio" DECIMAL(12,2) NOT NULL,
    "tasa_cambio" DECIMAL(10,4),
    "referencia" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT,
    "nombre_comercial" TEXT,
    "tipo_documento" TEXT,
    "numero_documento" TEXT,
    "telefono" TEXT,
    "correo" TEXT,
    "direccion" TEXT,
    "permite_credito" BOOLEAN NOT NULL DEFAULT false,
    "limite_credito" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "saldo_actual" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notas" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos_credito" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "metodo" TEXT NOT NULL,
    "referencia" TEXT,
    "notas" TEXT,
    "saldo_anterior" DECIMAL(12,2) NOT NULL,
    "saldo_nuevo" DECIMAL(12,2) NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_credito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturas" (
    "id" TEXT NOT NULL,
    "serie" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "numero_completo" TEXT NOT NULL,
    "autorizacion_id" TEXT,
    "venta_id" TEXT NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "cliente_nombre" TEXT NOT NULL,
    "cliente_ruc" TEXT,
    "cliente_direccion" TEXT,
    "tipo_documento" TEXT NOT NULL DEFAULT 'FACTURA',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "subtotal_exento" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "subtotal_gravado" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "descuento" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "iva" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'EMITIDA',
    "anulada_en" TIMESTAMP(3),
    "motivo_anulacion" TEXT,
    "enviada_por_correo" BOOLEAN NOT NULL DEFAULT false,
    "correo_envio" TEXT,
    "pdf_url" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autorizaciones_factura" (
    "id" TEXT NOT NULL,
    "serie" TEXT NOT NULL,
    "numero_inicial" INTEGER NOT NULL,
    "numero_final" INTEGER NOT NULL,
    "numero_actual" INTEGER NOT NULL,
    "numero_autorizacion" TEXT NOT NULL,
    "fecha_autorizacion" TIMESTAMP(3) NOT NULL,
    "fecha_vencimiento" TIMESTAMP(3),
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "autorizaciones_factura_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cajas_sucursal_id_activa_idx" ON "cajas"("sucursal_id", "activa");

-- CreateIndex
CREATE UNIQUE INDEX "cajas_sucursal_id_codigo_key" ON "cajas"("sucursal_id", "codigo");

-- CreateIndex
CREATE INDEX "sesiones_caja_caja_id_estado_idx" ON "sesiones_caja"("caja_id", "estado");

-- CreateIndex
CREATE INDEX "sesiones_caja_sucursal_id_estado_idx" ON "sesiones_caja"("sucursal_id", "estado");

-- CreateIndex
CREATE INDEX "sesiones_caja_fecha_apertura_idx" ON "sesiones_caja"("fecha_apertura");

-- CreateIndex
CREATE UNIQUE INDEX "unidades_medida_codigo_key" ON "unidades_medida"("codigo");

-- CreateIndex
CREATE INDEX "unidades_medida_activo_idx" ON "unidades_medida"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "insumos_codigo_key" ON "insumos"("codigo");

-- CreateIndex
CREATE INDEX "insumos_activo_idx" ON "insumos"("activo");

-- CreateIndex
CREATE INDEX "insumos_categoria_insumo_idx" ON "insumos"("categoria_insumo");

-- CreateIndex
CREATE INDEX "insumos_unidad_medida_id_idx" ON "insumos"("unidad_medida_id");

-- CreateIndex
CREATE INDEX "insumos_nombre_idx" ON "insumos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_codigo_key" ON "categorias"("codigo");

-- CreateIndex
CREATE INDEX "categorias_activo_idx" ON "categorias"("activo");

-- CreateIndex
CREATE INDEX "categorias_orden_idx" ON "categorias"("orden");

-- CreateIndex
CREATE INDEX "categorias_padre_id_idx" ON "categorias"("padre_id");

-- CreateIndex
CREATE UNIQUE INDEX "productos_codigo_key" ON "productos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "productos_codigo_barras_key" ON "productos"("codigo_barras");

-- CreateIndex
CREATE INDEX "productos_activo_categoria_id_idx" ON "productos"("activo", "categoria_id");

-- CreateIndex
CREATE INDEX "productos_activo_destacado_idx" ON "productos"("activo", "destacado");

-- CreateIndex
CREATE INDEX "productos_categoria_id_activo_orden_idx" ON "productos"("categoria_id", "activo", "orden");

-- CreateIndex
CREATE INDEX "productos_nombre_idx" ON "productos"("nombre");

-- CreateIndex
CREATE INDEX "productos_tipo_idx" ON "productos"("tipo");

-- CreateIndex
CREATE INDEX "productos_activo_tipo_impuesto_idx" ON "productos"("activo", "tipo_impuesto");

-- CreateIndex
CREATE INDEX "productos_variantes_producto_id_activo_idx" ON "productos_variantes"("producto_id", "activo");

-- CreateIndex
CREATE INDEX "productos_variantes_producto_id_orden_idx" ON "productos_variantes"("producto_id", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "productos_variantes_producto_id_codigo_key" ON "productos_variantes"("producto_id", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "recetas_producto_id_key" ON "recetas"("producto_id");

-- CreateIndex
CREATE INDEX "recetas_activa_idx" ON "recetas"("activa");

-- CreateIndex
CREATE INDEX "recetas_items_receta_id_idx" ON "recetas_items"("receta_id");

-- CreateIndex
CREATE INDEX "recetas_items_insumo_id_idx" ON "recetas_items"("insumo_id");

-- CreateIndex
CREATE INDEX "combos_items_combo_id_idx" ON "combos_items"("combo_id");

-- CreateIndex
CREATE INDEX "combos_items_producto_id_idx" ON "combos_items"("producto_id");

-- CreateIndex
CREATE INDEX "stocks_sucursal_id_idx" ON "stocks"("sucursal_id");

-- CreateIndex
CREATE INDEX "stocks_producto_id_idx" ON "stocks"("producto_id");

-- CreateIndex
CREATE INDEX "stocks_insumo_id_idx" ON "stocks"("insumo_id");

-- CreateIndex
CREATE UNIQUE INDEX "stocks_producto_id_insumo_id_sucursal_id_key" ON "stocks"("producto_id", "insumo_id", "sucursal_id");

-- CreateIndex
CREATE INDEX "movimientos_inventario_sucursal_id_creado_en_idx" ON "movimientos_inventario"("sucursal_id", "creado_en");

-- CreateIndex
CREATE INDEX "movimientos_inventario_producto_id_creado_en_idx" ON "movimientos_inventario"("producto_id", "creado_en");

-- CreateIndex
CREATE INDEX "movimientos_inventario_insumo_id_creado_en_idx" ON "movimientos_inventario"("insumo_id", "creado_en");

-- CreateIndex
CREATE INDEX "movimientos_inventario_tipo_creado_en_idx" ON "movimientos_inventario"("tipo", "creado_en");

-- CreateIndex
CREATE INDEX "movimientos_inventario_referencia_tipo_referencia_id_idx" ON "movimientos_inventario"("referencia_tipo", "referencia_id");

-- CreateIndex
CREATE UNIQUE INDEX "transferencias_stock_codigo_key" ON "transferencias_stock"("codigo");

-- CreateIndex
CREATE INDEX "transferencias_stock_sucursal_origen_id_estado_idx" ON "transferencias_stock"("sucursal_origen_id", "estado");

-- CreateIndex
CREATE INDEX "transferencias_stock_sucursal_destino_id_estado_idx" ON "transferencias_stock"("sucursal_destino_id", "estado");

-- CreateIndex
CREATE INDEX "transferencias_stock_estado_creado_en_idx" ON "transferencias_stock"("estado", "creado_en");

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_codigo_key" ON "proveedores"("codigo");

-- CreateIndex
CREATE INDEX "proveedores_activo_idx" ON "proveedores"("activo");

-- CreateIndex
CREATE INDEX "proveedores_nombre_idx" ON "proveedores"("nombre");

-- CreateIndex
CREATE INDEX "proveedores_ruc_idx" ON "proveedores"("ruc");

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_compra_codigo_key" ON "ordenes_compra"("codigo");

-- CreateIndex
CREATE INDEX "ordenes_compra_proveedor_id_estado_idx" ON "ordenes_compra"("proveedor_id", "estado");

-- CreateIndex
CREATE INDEX "ordenes_compra_sucursal_id_estado_idx" ON "ordenes_compra"("sucursal_id", "estado");

-- CreateIndex
CREATE INDEX "ordenes_compra_estado_fecha_orden_idx" ON "ordenes_compra"("estado", "fecha_orden");

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_compra_sucursal_id_numero_key" ON "ordenes_compra"("sucursal_id", "numero");

-- CreateIndex
CREATE INDEX "items_compra_orden_compra_id_idx" ON "items_compra"("orden_compra_id");

-- CreateIndex
CREATE INDEX "items_compra_producto_id_idx" ON "items_compra"("producto_id");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_numero_key" ON "ventas"("numero");

-- CreateIndex
CREATE INDEX "ventas_sucursal_id_creado_en_idx" ON "ventas"("sucursal_id", "creado_en");

-- CreateIndex
CREATE INDEX "ventas_sucursal_id_estado_creado_en_idx" ON "ventas"("sucursal_id", "estado", "creado_en");

-- CreateIndex
CREATE INDEX "ventas_usuario_id_creado_en_idx" ON "ventas"("usuario_id", "creado_en");

-- CreateIndex
CREATE INDEX "ventas_cliente_id_creado_en_idx" ON "ventas"("cliente_id", "creado_en");

-- CreateIndex
CREATE INDEX "ventas_sesion_caja_id_idx" ON "ventas"("sesion_caja_id");

-- CreateIndex
CREATE INDEX "ventas_estado_creado_en_idx" ON "ventas"("estado", "creado_en");

-- CreateIndex
CREATE INDEX "ventas_tipo_creado_en_idx" ON "ventas"("tipo", "creado_en");

-- CreateIndex
CREATE INDEX "items_venta_venta_id_idx" ON "items_venta"("venta_id");

-- CreateIndex
CREATE INDEX "items_venta_producto_id_creado_en_idx" ON "items_venta"("producto_id", "creado_en");

-- CreateIndex
CREATE INDEX "pagos_venta_venta_id_idx" ON "pagos_venta"("venta_id");

-- CreateIndex
CREATE INDEX "pagos_venta_metodo_creado_en_idx" ON "pagos_venta"("metodo", "creado_en");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_codigo_key" ON "clientes"("codigo");

-- CreateIndex
CREATE INDEX "clientes_activo_idx" ON "clientes"("activo");

-- CreateIndex
CREATE INDEX "clientes_nombre_idx" ON "clientes"("nombre");

-- CreateIndex
CREATE INDEX "clientes_numero_documento_idx" ON "clientes"("numero_documento");

-- CreateIndex
CREATE INDEX "clientes_telefono_idx" ON "clientes"("telefono");

-- CreateIndex
CREATE INDEX "pagos_credito_cliente_id_creado_en_idx" ON "pagos_credito"("cliente_id", "creado_en");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_numero_completo_key" ON "facturas"("numero_completo");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_venta_id_key" ON "facturas"("venta_id");

-- CreateIndex
CREATE INDEX "facturas_sucursal_id_creado_en_idx" ON "facturas"("sucursal_id", "creado_en");

-- CreateIndex
CREATE INDEX "facturas_estado_creado_en_idx" ON "facturas"("estado", "creado_en");

-- CreateIndex
CREATE INDEX "facturas_serie_numero_idx" ON "facturas"("serie", "numero");

-- CreateIndex
CREATE INDEX "autorizaciones_factura_activa_idx" ON "autorizaciones_factura"("activa");

-- CreateIndex
CREATE INDEX "autorizaciones_factura_serie_numero_actual_idx" ON "autorizaciones_factura"("serie", "numero_actual");

-- CreateIndex
CREATE INDEX "roles_activo_idx" ON "roles"("activo");

-- CreateIndex
CREATE INDEX "roles_permisos_permiso_id_idx" ON "roles_permisos"("permiso_id");

-- CreateIndex
CREATE INDEX "sucursales_activa_idx" ON "sucursales"("activa");

-- CreateIndex
CREATE INDEX "usuarios_activo_idx" ON "usuarios"("activo");

-- CreateIndex
CREATE INDEX "usuarios_roles_rol_id_idx" ON "usuarios_roles"("rol_id");

-- AddForeignKey
ALTER TABLE "cajas" ADD CONSTRAINT "cajas_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_caja" ADD CONSTRAINT "sesiones_caja_caja_id_fkey" FOREIGN KEY ("caja_id") REFERENCES "cajas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_caja" ADD CONSTRAINT "sesiones_caja_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_caja" ADD CONSTRAINT "sesiones_caja_usuario_apertura_id_fkey" FOREIGN KEY ("usuario_apertura_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insumos" ADD CONSTRAINT "insumos_unidad_medida_id_fkey" FOREIGN KEY ("unidad_medida_id") REFERENCES "unidades_medida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_padre_id_fkey" FOREIGN KEY ("padre_id") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_variantes" ADD CONSTRAINT "productos_variantes_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recetas" ADD CONSTRAINT "recetas_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recetas_items" ADD CONSTRAINT "recetas_items_receta_id_fkey" FOREIGN KEY ("receta_id") REFERENCES "recetas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recetas_items" ADD CONSTRAINT "recetas_items_insumo_id_fkey" FOREIGN KEY ("insumo_id") REFERENCES "insumos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combos_items" ADD CONSTRAINT "combos_items_combo_id_fkey" FOREIGN KEY ("combo_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combos_items" ADD CONSTRAINT "combos_items_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_insumo_id_fkey" FOREIGN KEY ("insumo_id") REFERENCES "insumos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_insumo_id_fkey" FOREIGN KEY ("insumo_id") REFERENCES "insumos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencias_stock" ADD CONSTRAINT "transferencias_stock_sucursal_origen_id_fkey" FOREIGN KEY ("sucursal_origen_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencias_stock" ADD CONSTRAINT "transferencias_stock_sucursal_destino_id_fkey" FOREIGN KEY ("sucursal_destino_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "ordenes_compra_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "ordenes_compra_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "ordenes_compra_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_compra" ADD CONSTRAINT "items_compra_orden_compra_id_fkey" FOREIGN KEY ("orden_compra_id") REFERENCES "ordenes_compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_compra" ADD CONSTRAINT "items_compra_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_sesion_caja_id_fkey" FOREIGN KEY ("sesion_caja_id") REFERENCES "sesiones_caja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_venta" ADD CONSTRAINT "items_venta_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_venta" ADD CONSTRAINT "items_venta_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_venta" ADD CONSTRAINT "items_venta_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "productos_variantes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_venta" ADD CONSTRAINT "pagos_venta_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_credito" ADD CONSTRAINT "pagos_credito_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
