-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "href" TEXT,
    "modulo" TEXT NOT NULL,
    "esPrivada" BOOLEAN NOT NULL DEFAULT false,
    "permiso_requerido" TEXT,
    "sucursalId" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones_usuarios" (
    "notificacion_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "leida_en" TIMESTAMP(3),

    CONSTRAINT "notificaciones_usuarios_pkey" PRIMARY KEY ("notificacion_id","usuario_id")
);

-- CreateIndex
CREATE INDEX "notificaciones_creado_en_idx" ON "notificaciones"("creado_en");

-- AddForeignKey
ALTER TABLE "notificaciones_usuarios" ADD CONSTRAINT "notificaciones_usuarios_notificacion_id_fkey" FOREIGN KEY ("notificacion_id") REFERENCES "notificaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones_usuarios" ADD CONSTRAINT "notificaciones_usuarios_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
