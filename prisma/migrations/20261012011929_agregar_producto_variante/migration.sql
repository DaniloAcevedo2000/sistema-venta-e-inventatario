-- AddForeignKey
ALTER TABLE "recetas" ADD CONSTRAINT "recetas_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "productos_variantes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
