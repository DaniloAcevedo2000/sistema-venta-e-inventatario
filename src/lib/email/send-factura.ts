import nodemailer from 'nodemailer'
import { prisma } from '@/lib/prisma'
import { obtenerDatosFactura, generarFacturaA4PDF } from '@/lib/pdf/actions'

// Configuramos el transporte de Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function enviarFacturaPorEmail(
  facturaId: string,
  emailDestino: string
) {
  try {
    // 1. Obtener datos para el asunto y cuerpo
    const datos = await obtenerDatosFactura(facturaId)
    
    // 2. Generar el PDF en base64
    const pdfBase64 = await generarFacturaA4PDF(facturaId)
    const pdfBuffer = Buffer.from(pdfBase64, 'base64')

    // 3. Enviar el correo
    const info = await transporter.sendMail({
      from: `"Momoto Café" <${process.env.GMAIL_USER}>`, 
      to: emailDestino,
      subject: `Factura ${datos.factura.numero} - Momoto Café`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #6B4226;">¡Gracias por tu compra!</h2>
          <p>Hola <strong>${datos.cliente.nombre}</strong>,</p>
          <p>Adjuntamos la factura <strong>${datos.factura.numero}</strong> correspondiente a tu compra en Momoto Café.</p>
          
          <div style="background-color: #FAF7F2; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Resumen:</strong></p>
            <p style="margin: 5px 0 0 0;">Total: <strong>C$ ${datos.totales.total.toFixed(2)}</strong></p>
            <p style="margin: 5px 0 0 0;">Método de pago: ${datos.pago.metodo}</p>
          </div>

          <p>Puedes encontrar el documento adjunto a este correo en formato PDF.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #888;">
            Momoto Café<br>
            ${datos.negocio.direccion}<br>
            Tel: ${datos.negocio.telefono}
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `Factura-${datos.factura.numero}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    })

    // 4. Marcar como enviada en la BD
    await prisma.factura.update({
      where: { id: facturaId },
      data: {
        enviadaPorCorreo: true,
        correoEnvio: emailDestino,
      },
    })

    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error enviando factura por Gmail:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}