'use server'

import { requirePermiso } from '@/lib/helpers/permisos-server'
import { enviarFacturaPorEmail } from './send-factura'
import { revalidatePath } from 'next/cache'

export async function enviarFacturaManualAction(facturaId: string, email: string) {
  try {
    // Verificamos que el usuario tenga permisos para ver facturas
    await requirePermiso('facturas:leer')
    
    // Validación simple del correo
    if (!email || !email.includes('@')) {
      return { error: 'Ingresa un correo válido' }
    }

    const result = await enviarFacturaPorEmail(facturaId, email)
    
    if (result.success) {
      // Refrescamos la vista de facturas para que se actualice el estado
      revalidatePath('/facturas')
      return { success: true }
    }
    
    return { error: result.error }
  } catch (err: any) {
    return { error: err.message }
  }
}