import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderTree,
  ChefHat,
  Warehouse,
  ShoppingBag,
  Truck,
  Receipt,
  Users,
  CreditCard,
  BarChart3,
  UserCog,
  ShieldCheck,
  Building2,
  Settings,
  Boxes,
  Wallet,
  MapPin,
  PackageCheck,
  FileText,
  Navigation,
  ShieldAlert,
} from 'lucide-react'

export type NavItem = {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  permission: string
}

export type NavGroup = {
  title: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    title: 'Principal',
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard:ver' },
      { title: 'POS', href: '/pos', icon: ShoppingCart, permission: 'ventas:crear' },
      { title: 'Caja', href: '/caja', icon: Wallet, permission: 'caja:ver' },
      { title: 'Autorizaciones Caja', href: '/caja/autorizaciones', icon: ShieldAlert, permission: 'caja:autorizar_diferencia' },
      { title: 'Mis Entregas', href: '/mis-entregas', icon: Navigation, permission: 'delivery:ver' },
    ],
  },
  {
    title: 'Catálogo',
    items: [
      { title: 'Productos', href: '/productos', icon: Package, permission: 'productos:leer' },
      { title: 'Categorías', href: '/categorias', icon: FolderTree, permission: 'categorias:gestionar' },
      { title: 'Insumos', href: '/insumos', icon: Boxes, permission: 'inventario:leer' },
      { title: 'Recetas', href: '/recetas', icon: ChefHat, permission: 'productos:leer' },
    ],
  },
  {
    title: 'Operación',
    items: [
      { title: 'Inventario', href: '/inventario', icon: Warehouse, permission: 'inventario:leer' },
      { title: 'Compras', href: '/compras', icon: ShoppingBag, permission: 'compras:leer' },
      { title: 'Proveedores', href: '/proveedores', icon: Truck, permission: 'proveedores:gestionar' },
    ],
  },
  {
    title: 'Ventas',
    items: [
      { title: 'Pedidos', href: '/pedidos', icon: PackageCheck, permission: 'pedidos:leer' },
      { title: 'Ventas', href: '/ventas', icon: Receipt, permission: 'ventas:leer' },
      { title: 'Facturas', href: '/facturas', icon: FileText, permission: 'facturas:leer' },
      { title: 'Clientes', href: '/clientes', icon: Users, permission: 'clientes:leer' },
      { title: 'Créditos', href: '/creditos', icon: CreditCard, permission: 'creditos:leer' },
    ],
  },
  {
    title: 'Análisis',
    items: [
      { title: 'Reportes', href: '/reportes', icon: BarChart3, permission: 'reportes:ver' },
    ],
  },
  {
    title: 'Administración',
    items: [
      { title: 'Usuarios', href: '/usuarios', icon: UserCog, permission: 'usuarios:leer' },
      { title: 'Repartidores', href: '/repartidores', icon: Truck, permission: 'usuarios:leer' },
      { title: 'Roles', href: '/roles', icon: ShieldCheck, permission: 'roles:gestionar' },
      { title: 'Sucursales', href: '/sucursales', icon: Building2, permission: 'sucursales:gestionar' },
      { title: 'Configuración', href: '/configuracion', icon: Settings, permission: 'configuracion:gestionar' },
      { title: 'Zonas de Entrega', href: '/configuracion/zonas-entrega', icon: MapPin, permission: 'zonas_entrega:gestionar' },
      { title: 'Pagos', href: '/configuracion/pagos', icon: CreditCard, permission: 'configuracion:gestionar' },
    ],
  },
]