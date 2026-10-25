import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 })

    // Validar que sea imagen y que no pese más de 2MB
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'El archivo debe ser una imagen' }, { status: 400 })
    }
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'La imagen no debe superar 2MB' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Crear un nombre único para el archivo
    const ext = file.name.split('.').pop()
    const fileName = `avatar-${session.user.id}-${Date.now()}.${ext}`
    
    // Guardar en la carpeta public/uploads
    const dirPath = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(dirPath, { recursive: true }) // Crea la carpeta si no existe
    
    const filePath = path.join(dirPath, fileName)
    await writeFile(filePath, buffer)

    const avatarUrl = `/uploads/${fileName}`

    // Actualizar el usuario en la base de datos
    await prisma.usuario.update({
      where: { id: session.user.id },
      data: { avatarUrl },
    })

    return NextResponse.json({ success: true, avatarUrl })
  } catch (error) {
    console.error('Error subiendo avatar:', error)
    return NextResponse.json({ error: 'Error al subir la imagen' }, { status: 500 })
  }
}