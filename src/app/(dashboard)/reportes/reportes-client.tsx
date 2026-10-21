'use client'

import * as React from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, ComposedChart, Line
} from 'recharts'
import { 
  Download, Filter, FileSpreadsheet, FileText, Presentation, 
  ChevronDown, X, FileJson, RefreshCw, BarChart2, Box, ShoppingBag, Receipt, Users, Coffee, AlertTriangle, DollarSign
} from 'lucide-react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Paleta de colores (la misma del Dashboard)
const C = {
  coffee: 'var(--chart-1)', caramel: 'var(--chart-2)', sage: 'var(--chart-3)',
  gold: 'var(--chart-4)', muted: 'var(--chart-5)', grid: 'var(--border)', 
  text: 'var(--muted-foreground)', bg: 'var(--popover)',
}
const palette = [C.coffee, C.caramel, C.sage, C.gold, C.muted, '#9D8069', '#D8BFA5']
const money = (v: number) => `C$ ${Number(v || 0).toLocaleString('es-NI', { minimumFractionDigits: 2 })}`
const num = (v: number) => Number(v || 0).toLocaleString('es-NI', { maximumFractionDigits: 2 })

const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return <div className="rounded-xl border border-border p-3 shadow-xl z-50 relative" style={{ backgroundColor: C.bg, color: 'var(--popover-foreground)' }}>
    {label && <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground max-w-[200px] leading-tight">{label}</p>}
    {payload.map((p: any, i: number) => <div key={i} className="flex items-center gap-2 text-xs py-0.5">
      <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
      <span className="text-muted-foreground">{p.name || p.dataKey}</span>
      <strong className="ml-auto pl-4">{typeof p.value === 'number' && /ventas|ingresos|margen|facturado|cobrado|costo|valor|perdida/i.test(p.dataKey || p.name || '') ? money(p.value) : num(p.value)}</strong>
    </div>)}
  </div>
}

function Panel({ title, subtitle, className = '', children }: { title: string; subtitle?: string; className?: string; children: React.ReactNode }) {
  return <Card className={`min-w-0 overflow-hidden bg-card shadow-sm transition-shadow hover:shadow-md ${className}`}>
    <CardHeader className="space-y-1 p-4 pb-1">
      <CardTitle className="text-sm font-semibold tracking-tight text-card-foreground">{title}</CardTitle>
      {subtitle && <CardDescription className="text-xs text-muted-foreground">{subtitle}</CardDescription>}
    </CardHeader>
    <CardContent className="p-3 pt-2 h-[270px]">
      {children}
    </CardContent>
  </Card>
}

function Donut({ data }: { data: any[] }) {
  return data?.length ? <ResponsiveContainer width="100%" height="100%"><PieChart>
    <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={3} stroke="none">
      {data.map((_: any, i: number) => <Cell key={i} fill={palette[i % palette.length]} />)}
    </Pie>
    <RechartsTooltip content={<ChartTip />} />
  </PieChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Sin datos</div>
}

function RankingTable({ data, valueKey, formatValue, colorBar = C.coffee }: any) {
  if (!data || data.length === 0) return <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Sin datos</div>
  const max = Math.max(...data.map((d: any) => Number(d[valueKey])), 1)

  return <div className="h-full overflow-y-auto pr-1 space-y-3">
    {data.map((item: any, i: number) => {
      const val = Number(item[valueKey])
      const pctWidth = (val / max) * 100
      return <div key={i} className="flex flex-col gap-1.5">
        <div className="flex justify-between items-end text-xs">
          <span className="font-medium text-foreground truncate pr-4" title={item.name}>{item.name}</span>
          <span className="font-semibold whitespace-nowrap">{formatValue(val)}</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pctWidth}%`, backgroundColor: colorBar }} />
        </div>
      </div>
    })}
  </div>
}

type Props = {
  ventas: any[]
  sucursales: any[]
  inventario: any[]
  pedidosPorEstado: any[]
  totalFacturas: number
  totalUsuarios: number
}

export function ReportesClient({ ventas, sucursales, inventario, pedidosPorEstado, totalFacturas, totalUsuarios }: Props) {
  const [isFiltersOpen, setIsFiltersOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState('ventas')
  
  // Filtros
  const [fechaInicio, setFechaInicio] = React.useState('')
  const [fechaFin, setFechaFin] = React.useState('')
  const [filtroSucursal, setFiltroSucursal] = React.useState('all')

  // Filtrar ventas
  const ventasFiltradas = React.useMemo(() => {
    return ventas.filter(v => {
      const date = new Date(v.fecha)
      const matchInicio = !fechaInicio || date >= new Date(fechaInicio)
      const matchFin = !fechaFin || date <= new Date(fechaFin + 'T23:59:59')
      const matchSucursal = filtroSucursal === 'all' || v.sucursal === filtroSucursal
      return matchInicio && matchFin && matchSucursal
    })
  }, [ventas, fechaInicio, fechaFin, filtroSucursal])

  // KPIs Globales
  const totalVentas = ventasFiltradas.reduce((sum, v) => sum + v.total, 0)
  const ticketPromedio = totalVentas / (ventasFiltradas.length || 1)

  // Datos para Gráficos
  const dataVentasDia = ventasFiltradas.reduce((acc, v) => {
    const dia = new Date(v.fecha).toLocaleDateString('es-NI', { day: '2-digit', month: 'short' })
    acc[dia] = (acc[dia] || 0) + v.total
    return acc
  }, {} as Record<string, number>)
  const graficoVentas = Object.keys(dataVentasDia).map(k => ({ name: k, total: dataVentasDia[k] })).reverse()

  const dataPagos = ventasFiltradas.reduce((acc, v) => {
    acc[v.metodoPago] = (acc[v.metodoPago] || 0) + v.total
    return acc
  }, {} as Record<string, number>)
  const graficoPagos = Object.keys(dataPagos).map(k => ({ name: k, value: dataPagos[k] }))

  // ============================================
  // EXPORTACIÓN
  // ============================================
  const getDatosExport = () => {
    if (activeTab === 'ventas') {
      return ventasFiltradas.map(v => ({
        'Factura': v.numero, 'Fecha': new Date(v.fecha).toLocaleDateString(), 
        'Cliente': v.cliente, 'Método': v.metodoPago, 'Total': v.total
      }))
    }
    if (activeTab === 'inventario') {
      return inventario.map(i => ({
        'Item': i.name, 'Stock Actual': i.actual, 'Mínimo': i.minimo
      }))
    }
    return []
  }

  const exportarExcel = () => {
    const ws = XLSX.utils.json_to_sheet(getDatosExport())
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte')
    XLSX.writeFile(wb, `Reporte_${activeTab}.xlsx`)
    toast.success('Excel generado')
  }

  const exportarPDF = () => {
    const doc = new jsPDF()
    autoTable(doc, {
      head: [Object.keys(getDatosExport()[0] || {})],
      body: getDatosExport().map(obj => Object.values(obj)),
      headStyles: { fillColor: [107, 66, 38] }
    })
    doc.save(`Reporte_${activeTab}.pdf`)
    toast.success('PDF generado')
  }

  return (
    <div className="space-y-6">
      {/* Barra de Herramientas Superior */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-2 rounded-xl border shadow-sm">
        
        {/* Filtros Colapsables */}
        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen} className="w-full sm:w-auto relative">
          <div className="flex items-center gap-2">
            <CollapsibleTrigger asChild>
              <Button variant={isFiltersOpen ? "secondary" : "outline"} className="w-full sm:w-auto gap-2 bg-background">
                <Filter className="h-4 w-4" /> 
                {isFiltersOpen ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                <ChevronDown className={`h-4 w-4 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            {(fechaInicio || fechaFin || filtroSucursal !== 'all') && (
              <Badge variant="secondary" className="bg-primary/10 text-primary">Filtros Activos</Badge>
            )}
          </div>
          
          <CollapsibleContent className="absolute z-50 mt-2 w-[320px] bg-card border rounded-xl shadow-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Filtros del Reporte</h4>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsFiltersOpen(false)}><X className="h-4 w-4"/></Button>
            </div>
            
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Desde</Label>
              <Input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
            </div>
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Hasta</Label>
              <Input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
            </div>
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Sucursal</Label>
              <Select value={filtroSucursal} onValueChange={setFiltroSucursal}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las sucursales</SelectItem>
                  {sucursales.map(s => <SelectItem key={s.id} value={s.nombre}>{s.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <Button variant="outline" className="w-full mt-2" onClick={() => { setFechaInicio(''); setFechaFin(''); setFiltroSucursal('all'); }}>
              <RefreshCw className="h-4 w-4 mr-2" /> Limpiar Filtros
            </Button>
          </CollapsibleContent>
        </Collapsible>

        {/* Exportar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="w-full sm:w-auto bg-primary text-primary-foreground shadow-md">
              <Download className="mr-2 h-4 w-4" /> Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Formatos disponibles</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={exportarExcel} className="cursor-pointer">
              <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" /> Excel (.xlsx)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportarPDF} className="cursor-pointer">
              <FileText className="mr-2 h-4 w-4 text-red-600" /> PDF (.pdf)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info('Exportación PPT en desarrollo')} className="cursor-pointer">
              <Presentation className="mr-2 h-4 w-4 text-orange-600" /> PowerPoint
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info('Exportación JSON en desarrollo')} className="cursor-pointer">
              <FileJson className="mr-2 h-4 w-4 text-blue-600" /> JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* TABS DE REPORTES (Estilo Dashboard) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-2 md:grid-cols-4 gap-1 rounded-xl border bg-card p-1">
          <TabsTrigger value="ventas" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary/10"><BarChart2 className="h-3.5 w-3.5" />Ventas</TabsTrigger>
          <TabsTrigger value="inventario" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary/10"><Box className="h-3.5 w-3.5" />Inventario</TabsTrigger>
          <TabsTrigger value="pedidos" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary/10"><ShoppingBag className="h-3.5 w-3.5" />Pedidos</TabsTrigger>
          <TabsTrigger value="facturacion" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary/10"><Receipt className="h-3.5 w-3.5" />Facturación</TabsTrigger>
        </TabsList>

        {/* --- REPORTE DE VENTAS --- */}
        <TabsContent value="ventas" className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="bg-card shadow-sm">
              <CardContent className="p-4 flex items-start justify-between gap-2">
                <div className="min-w-0"><p className="text-xs font-medium text-muted-foreground">Ventas netas</p><p className="mt-2 truncate text-xl font-bold text-card-foreground">{money(totalVentas)}</p><p className="mt-1 text-[11px] text-muted-foreground">En el período</p></div>
                <span className="rounded-xl p-2 bg-primary/10 text-primary"><DollarSign className="h-4 w-4" /></span>
              </CardContent>
            </Card>
            <Card className="bg-card shadow-sm">
              <CardContent className="p-4 flex items-start justify-between gap-2">
                <div className="min-w-0"><p className="text-xs font-medium text-muted-foreground">Transacciones</p><p className="mt-2 truncate text-xl font-bold text-card-foreground">{num(ventasFiltradas.length)}</p><p className="mt-1 text-[11px] text-muted-foreground">Ventas realizadas</p></div>
                <span className="rounded-xl p-2 bg-primary/10 text-primary"><BarChart2 className="h-4 w-4" /></span>
              </CardContent>
            </Card>
            <Card className="bg-card shadow-sm">
              <CardContent className="p-4 flex items-start justify-between gap-2">
                <div className="min-w-0"><p className="text-xs font-medium text-muted-foreground">Ticket promedio</p><p className="mt-2 truncate text-xl font-bold text-card-foreground">{money(ticketPromedio)}</p><p className="mt-1 text-[11px] text-muted-foreground">Por venta</p></div>
                <span className="rounded-xl p-2 bg-primary/10 text-primary"><Receipt className="h-4 w-4" /></span>
              </CardContent>
            </Card>
            <Card className="bg-card shadow-sm">
              <CardContent className="p-4 flex items-start justify-between gap-2">
                <div className="min-w-0"><p className="text-xs font-medium text-muted-foreground">Facturas emitidas</p><p className="mt-2 truncate text-xl font-bold text-card-foreground">{num(totalFacturas)}</p><p className="mt-1 text-[11px] text-muted-foreground">Totales</p></div>
                <span className="rounded-xl p-2 bg-primary/10 text-primary"><FileText className="h-4 w-4" /></span>
              </CardContent>
            </Card>
          </div>

          <Panel title="Ingresos por Día" subtitle="Evolución de ventas en el período" className="md:col-span-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={graficoVentas} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.coffee} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={C.coffee} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.grid} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.text }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: C.text }} tickLine={false} tickFormatter={(v) => `C$${v}`} />
                <RechartsTooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="total" stroke={C.coffee} strokeWidth={3} fill="url(#colorVentas)" />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Métodos de Pago" subtitle="Distribución del dinero" className="md:col-span-4">
            <Donut data={graficoPagos} />
          </Panel>

          <Card className="md:col-span-12 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Previsualización de Ventas</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[400px] overflow-auto rounded-b-xl border-t">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted/50 shadow-sm z-10">
                    <TableRow>
                      <TableHead className="text-xs">Factura</TableHead>
                      <TableHead className="text-xs">Fecha</TableHead>
                      <TableHead className="text-xs">Cliente</TableHead>
                      <TableHead className="text-xs">Método</TableHead>
                      <TableHead className="text-right text-xs">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ventasFiltradas.slice(0, 50).map(v => (
                      <TableRow key={v.id} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-xs">{v.numero}</TableCell>
                        <TableCell className="text-xs">{new Date(v.fecha).toLocaleDateString()}</TableCell>
                        <TableCell className="text-xs font-medium">{v.cliente}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px] bg-background">{v.metodoPago}</Badge></TableCell>
                        <TableCell className="text-right font-semibold">{money(v.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- REPORTE DE INVENTARIO --- */}
        <TabsContent value="inventario" className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <Panel title="Stock actual vs. mínimo" subtitle="Productos con menor existencia" className="md:col-span-12">
             {inventario.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={inventario} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={C.grid} />
              <XAxis type="number" tick={{ fontSize: 10, fill: C.text }} />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10, fill: C.text }} tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val} />
              <RechartsTooltip content={<ChartTip />} cursor={{ fill: 'var(--secondary)' }} />
              <Bar dataKey="actual" name="Stock Actual" fill={C.sage} radius={[0, 4, 4, 0]} barSize={15} />
              <Bar dataKey="minimo" name="Mínimo" fill={C.caramel} radius={[0, 4, 4, 0]} barSize={15} />
            </BarChart></ResponsiveContainer> : <div className="flex items-center justify-center h-full text-muted-foreground">Sin datos</div>}
          </Panel>
        </TabsContent>

        {/* --- REPORTE DE PEDIDOS --- */}
        <TabsContent value="pedidos" className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <Panel title="Distribución de Pedidos" subtitle="Por estado actual" className="md:col-span-12">
            <Donut data={pedidosPorEstado} />
          </Panel>
        </TabsContent>

        {/* --- REPORTE DE FACTURACIÓN --- */}
        <TabsContent value="facturacion" className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-4">
             <Card className="shadow-sm">
              <CardContent className="p-8 flex flex-col items-center justify-center text-center h-[300px]">
                <Receipt className="h-12 w-12 text-primary/40 mb-4" />
                <p className="text-5xl font-bold text-primary">{totalFacturas}</p>
                <p className="text-sm text-muted-foreground mt-2">Facturas Emitidas Históricamente</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-8 flex flex-col items-center justify-center text-center h-[300px]">
                <Users className="h-12 w-12 text-primary/40 mb-4" />
                <p className="text-5xl font-bold text-primary">{totalUsuarios}</p>
                <p className="text-sm text-muted-foreground mt-2">Usuarios Activos en el Sistema</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}