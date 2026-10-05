import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Iniciando seed...\n')

  // ============================================
  // 1. PERMISOS
  // ============================================
  const permisosData = [
    // Dashboard
    { codigo: 'dashboard:ver', nombre: 'Ver dashboard', grupo: 'Dashboard' },

    // Usuarios
    { codigo: 'usuarios:leer', nombre: 'Ver usuarios', grupo: 'Usuarios' },
    { codigo: 'usuarios:crear', nombre: 'Crear usuarios', grupo: 'Usuarios' },
    { codigo: 'usuarios:editar', nombre: 'Editar usuarios', grupo: 'Usuarios' },
    { codigo: 'usuarios:eliminar', nombre: 'Eliminar usuarios', grupo: 'Usuarios' },

    // Roles y permisos
    { codigo: 'roles:gestionar', nombre: 'Gestionar roles y permisos', grupo: 'Seguridad' },
    { codigo: 'auditoria:ver', nombre: 'Ver auditoría', grupo: 'Seguridad' },

    // Sucursales
    { codigo: 'sucursales:leer', nombre: 'Ver sucursales', grupo: 'Sucursales' },
    { codigo: 'sucursales:gestionar', nombre: 'Gestionar sucursales', grupo: 'Sucursales' },

    // Productos
    { codigo: 'productos:leer', nombre: 'Ver productos', grupo: 'Productos' },
    { codigo: 'productos:crear', nombre: 'Crear productos', grupo: 'Productos' },
    { codigo: 'productos:editar', nombre: 'Editar productos', grupo: 'Productos' },
    { codigo: 'productos:eliminar', nombre: 'Eliminar productos', grupo: 'Productos' },

    // Categorías
    { codigo: 'categorias:gestionar', nombre: 'Gestionar categorías', grupo: 'Productos' },

    // Inventario
    { codigo: 'inventario:leer', nombre: 'Ver inventario', grupo: 'Inventario' },
    { codigo: 'inventario:ajustar', nombre: 'Ajustar inventario', grupo: 'Inventario' },
    { codigo: 'inventario:transferir', nombre: 'Transferir entre sucursales', grupo: 'Inventario' },

    // Compras
    { codigo: 'compras:leer', nombre: 'Ver compras', grupo: 'Compras' },
    { codigo: 'compras:crear', nombre: 'Crear órdenes de compra', grupo: 'Compras' },
    { codigo: 'compras:aprobar', nombre: 'Aprobar compras', grupo: 'Compras' },

    // Proveedores
    { codigo: 'proveedores:gestionar', nombre: 'Gestionar proveedores', grupo: 'Compras' },

    // Ventas
    { codigo: 'ventas:crear', nombre: 'Registrar ventas', grupo: 'Ventas' },
    { codigo: 'ventas:leer', nombre: 'Ver ventas', grupo: 'Ventas' },
    { codigo: 'ventas:anular', nombre: 'Anular ventas', grupo: 'Ventas' },
    { codigo: 'ventas:descuento', nombre: 'Aplicar descuentos', grupo: 'Ventas' },

    // Caja
    { codigo: 'caja:abrir', nombre: 'Abrir caja', grupo: 'Caja' },
    { codigo: 'caja:cerrar', nombre: 'Cerrar caja', grupo: 'Caja' },
    { codigo: 'caja:ver', nombre: 'Ver movimientos de caja', grupo: 'Caja' },

    // Clientes
    { codigo: 'clientes:leer', nombre: 'Ver clientes', grupo: 'Clientes' },
    { codigo: 'clientes:crear', nombre: 'Crear clientes', grupo: 'Clientes' },
    { codigo: 'clientes:editar', nombre: 'Editar clientes', grupo: 'Clientes' },

    // Facturación
    { codigo: 'facturas:crear', nombre: 'Crear facturas', grupo: 'Facturación' },
    { codigo: 'facturas:leer', nombre: 'Ver facturas', grupo: 'Facturación' },
    { codigo: 'facturas:anular', nombre: 'Anular facturas', grupo: 'Facturación' },

    // Créditos
    { codigo: 'creditos:leer', nombre: 'Ver créditos', grupo: 'Créditos' },
    { codigo: 'creditos:gestionar', nombre: 'Gestionar créditos', grupo: 'Créditos' },

    // Reportes
    { codigo: 'reportes:ver', nombre: 'Ver reportes', grupo: 'Reportes' },
    { codigo: 'reportes:exportar', nombre: 'Exportar reportes', grupo: 'Reportes' },

    // Configuración
    { codigo: 'configuracion:gestionar', nombre: 'Gestionar configuración', grupo: 'Configuración' },

    // KDS (Cocina)
    { codigo: 'kds:ver', nombre: 'Ver pantalla de cocina', grupo: 'KDS' },
    { codigo: 'kds:actualizar', nombre: 'Actualizar estado de pedidos', grupo: 'KDS' },

    // Delivery
    { codigo: 'delivery:ver', nombre: 'Ver pedidos de delivery', grupo: 'Delivery' },
    { codigo: 'delivery:actualizar', nombre: 'Actualizar estado de delivery', grupo: 'Delivery' },
  ]

  console.log(`Creando ${permisosData.length} permisos...`)
  for (const p of permisosData) {
    await prisma.permiso.upsert({
      where: { codigo: p.codigo },
      update: {},
      create: p,
    })
  }
  console.log('Permisos creados\n')

  // ============================================
  // 2. ROLES
  // ============================================
  const rolesData = [
    { codigo: 'SUPER_ADMIN', nombre: 'Super Administrador', descripcion: 'Acceso total al sistema' },
    { codigo: 'ADMIN', nombre: 'Administrador', descripcion: 'Administrador general del negocio' },
    { codigo: 'GERENTE', nombre: 'Gerente de Sucursal', descripcion: 'Encargado de una sucursal' },
    { codigo: 'CAJERO', nombre: 'Cajero', descripcion: 'Atiende el punto de venta' },
    { codigo: 'BARISTA', nombre: 'Barista', descripcion: 'Prepara los pedidos (KDS)' },
    { codigo: 'BODEGUERO', nombre: 'Bodeguero', descripcion: 'Maneja inventario y compras' },
    { codigo: 'CONTADOR', nombre: 'Contador', descripcion: 'Revisa finanzas y facturación' },
    { codigo: 'REPARTIDOR', nombre: 'Repartidor', descripcion: 'Entrega pedidos a domicilio' },
  ]

  console.log(`Creando ${rolesData.length} roles...`)
  for (const r of rolesData) {
    await prisma.rol.upsert({
      where: { codigo: r.codigo },
      update: {},
      create: { ...r, esSistema: true },
    })
  }
  console.log('✅ Roles creados\n')

  // ============================================
  // 3. ASIGNAR PERMISOS A ROLES
  // ============================================
  const todosPermisos = await prisma.permiso.findMany()
  const permisosPorCodigo = new Map<string, string>(
    todosPermisos.map((p) => [p.codigo, p.id])
  )

  const asignaciones: Record<string, string[]> = {
    SUPER_ADMIN: todosPermisos.map((p) => p.codigo),
    ADMIN: todosPermisos
      .map((p) => p.codigo)
      .filter((c) => c !== 'roles:gestionar' && c !== 'auditoria:ver'),
    GERENTE: [
      'dashboard:ver',
      'usuarios:leer',
      'productos:leer', 'productos:crear', 'productos:editar',
      'inventario:leer', 'inventario:ajustar',
      'ventas:crear', 'ventas:leer', 'ventas:anular', 'ventas:descuento',
      'caja:abrir', 'caja:cerrar', 'caja:ver',
      'clientes:leer', 'clientes:crear', 'clientes:editar',
      'facturas:crear', 'facturas:leer',
      'creditos:leer', 'creditos:gestionar',
      'reportes:ver', 'reportes:exportar',
      'kds:ver', 'kds:actualizar',
    ],
    CAJERO: [
      'dashboard:ver',
      'productos:leer',
      'ventas:crear', 'ventas:leer',
      'caja:abrir', 'caja:cerrar',
      'clientes:leer', 'clientes:crear',
      'facturas:crear', 'facturas:leer',
    ],
    BARISTA: [
      'dashboard:ver',
      'kds:ver', 'kds:actualizar',
    ],
    BODEGUERO: [
      'dashboard:ver',
      'productos:leer', 'productos:crear', 'productos:editar',
      'categorias:gestionar',
      'inventario:leer', 'inventario:ajustar', 'inventario:transferir',
      'compras:leer', 'compras:crear',
      'proveedores:gestionar',
      'reportes:ver',
    ],
    CONTADOR: [
      'dashboard:ver',
      'ventas:leer',
      'facturas:leer',
      'creditos:leer',
      'reportes:ver', 'reportes:exportar',
      'auditoria:ver',
    ],
    REPARTIDOR: [
      'delivery:ver', 'delivery:actualizar',
    ],
  }

  console.log('Asignando permisos a roles...')
  for (const [rolCodigo, permisosCodigos] of Object.entries(asignaciones)) {
    const rol = await prisma.rol.findUnique({ where: { codigo: rolCodigo } })
    if (!rol) continue

    // Limpiar permisos anteriores
    await prisma.rolPermiso.deleteMany({ where: { rolId: rol.id } })

    // Asignar nuevos
    for (const permisoCodigo of permisosCodigos) {
      const permisoId = permisosPorCodigo.get(permisoCodigo)
      if (!permisoId) continue
      await prisma.rolPermiso.create({
        data: { rolId: rol.id, permisoId },
      })
    }
    console.log(`   ✓ ${rolCodigo}: ${permisosCodigos.length} permisos`)
  }
  console.log('Permisos asignados\n')

  // ============================================
  // 4. SUCURSALES
  // ============================================
  const sucursalesData = [
    {
      codigo: 'CENTRAL',
      nombre: 'Momoto Cafe Las Aldeas',
      direccion: 'Las Aldeas, Managua, Nicaragua',
      telefono: '22658978',
      correo: 'momotocafe_nic@gmail.com',
    },
    {
      codigo: 'NATURA',
      nombre: 'Momoto Cafe Plaza Natura',
      direccion: 'Plaza Natura, Managua, Nicaragua',
      telefono: '22658978',
      correo: 'momotocafe_nic@gmail.com',
    },
  ]

  console.log(`Creando ${sucursalesData.length} sucursales...`)
  for (const s of sucursalesData) {
    await prisma.sucursal.upsert({
      where: { codigo: s.codigo },
      update: {},
      create: s,
    })
  }
  console.log('Sucursales creadas\n')

  // ============================================
  // 5. CONFIGURACIÓN
  // ============================================
  const configData = [
    { clave: 'negocio.nombre_comercial', valor: 'Momoto Cafe', tipo: 'string', descripcion: 'Nombre comercial' },
    { clave: 'negocio.nombre_legal', valor: 'Momoto Cafe', tipo: 'string', descripcion: 'Razón social' },
    { clave: 'negocio.ruc', valor: 'J0310000007669', tipo: 'string', descripcion: 'RUC del negocio' },
    { clave: 'negocio.telefono', valor: '22658978', tipo: 'string', descripcion: 'Teléfono principal' },
    { clave: 'negocio.correo', valor: 'momotocafe_nic@gmail.com', tipo: 'string', descripcion: 'Correo del negocio' },
    { clave: 'negocio.direccion', valor: 'Las Aldeas, Managua, Nicaragua', tipo: 'string', descripcion: 'Dirección principal' },
    { clave: 'moneda.base', valor: 'NIO', tipo: 'string', descripcion: 'Moneda base (Córdoba)' },
    { clave: 'moneda.secundaria', valor: 'USD', tipo: 'string', descripcion: 'Moneda secundaria (Dólar)' },
    { clave: 'moneda.tasa_cambio', valor: '36.6243', tipo: 'number', descripcion: 'Tasa de cambio oficial BCN' },
    { clave: 'impuesto.iva', valor: '15', tipo: 'number', descripcion: 'IVA general (%)' },
    { clave: 'factura.serie', valor: 'A', tipo: 'string', descripcion: 'Serie de facturación' },
    { clave: 'factura.correlativo_actual', valor: '1', tipo: 'number', descripcion: 'Próximo número de factura' },
  ]

  console.log('Creando configuración...')
  for (const c of configData) {
    await prisma.configuracion.upsert({
      where: { clave: c.clave },
      update: { valor: c.valor },
      create: c,
    })
  }
  console.log('Configuración creada\n')

  // ============================================
  // 6. USUARIO SUPER_ADMIN
  // ============================================
  const contrasenaTemp = 'Momoto2026!'
  const contrasenaHash = await bcrypt.hash(contrasenaTemp, 10)

  const sucursalCentral = await prisma.sucursal.findUnique({ where: { codigo: 'CENTRAL' } })
  const rolSuperAdmin = await prisma.rol.findUnique({ where: { codigo: 'SUPER_ADMIN' } })

  if (!sucursalCentral || !rolSuperAdmin) {
    throw new Error('Faltan sucursal CENTRAL o rol SUPER_ADMIN')
  }

  console.log('Creando usuario SUPER_ADMIN...')
  const superAdmin = await prisma.usuario.upsert({
    where: { correo: 'danilo@gmail.com' },
    update: {},
    create: {
      nombre: 'Danilo Acevedo',
      correo: 'danilo@gmail.com',
      contrasenaHash,
      sucursalId: sucursalCentral.id,
      activo: true,
    },
  })

  // Asignar rol SUPER_ADMIN
  await prisma.usuarioRol.upsert({
    where: {
      usuarioId_rolId: {
        usuarioId: superAdmin.id,
        rolId: rolSuperAdmin.id,
      },
    },
    update: {},
    create: {
      usuarioId: superAdmin.id,
      rolId: rolSuperAdmin.id,
    },
  })
  console.log('Usuario SUPER_ADMIN creado\n')

  console.log('═══════════════════════════════════════')
  console.log('SEED COMPLETADO CON ÉXITO')
  console.log('═══════════════════════════════════════')
  console.log('\nCredenciales de acceso:')
  console.log(`   Correo:     danilo@gmail.com`)
  console.log(`   Contraseña: ${contrasenaTemp}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Error en seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })