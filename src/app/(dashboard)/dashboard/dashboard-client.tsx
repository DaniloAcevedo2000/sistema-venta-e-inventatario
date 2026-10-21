'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart,
  Line, Pie, PieChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip,
  XAxis, YAxis, ZAxis, Legend, ReferenceLine
} from 'recharts'
import {
  Activity, AlertTriangle,
  Coffee, DollarSign, Package, ReceiptText, ShoppingBag, TrendingUp,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

type Datum = Record<string, any>
type Props = { rangoActual: string; fechas: { desde?: string; hasta?: string }; kpis: Datum; graficos: Datum }

const C = {
  coffee: 'var(--chart-1)', caramel: 'var(--chart-2)', sage: 'var(--chart-3)',
  gold: 'var(--chart-4)', muted: 'var(--chart-5)', grid: 'var(--border)', 
  text: 'var(--muted-foreground)', bg: 'var(--popover)',
}
const palette = [C.coffee, C.caramel, C.sage, C.gold, C.muted, '#9D8069', '#D8BFA5']

const money = (v: number) => `C$ ${Number(v || 0).toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const num = (v: number) => Number(v || 0).toLocaleString('es-NI', { maximumFractionDigits: 2 })
const pct = (v: number) => `${Number(v || 0).toFixed(1)}%`
const truncate = (str: string, len: number) => (!str ? '' : str.length > len ? str.substring(0, len) + '...' : str)

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

function Empty({ text = 'No hay datos disponibles' }: { text?: string }) {
  return <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground">{text}</div>
}

function ChartFrame({ data, children }: { data: Datum[]; children: React.ReactNode }) {
  return data?.length ? <ResponsiveContainer width="100%" height="100%">{children as any}</ResponsiveContainer> : <Empty />
}

function Axes({ moneyAxis = false }: { moneyAxis?: boolean }) {
  return <>
    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.grid} />
    <XAxis dataKey="fecha" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: C.text }} minTickGap={20} />
    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: C.text }} tickFormatter={v => moneyAxis ? `C$${num(v)}` : num(v)} width={moneyAxis ? 65 : 38} />
    <Tooltip content={<ChartTip />} cursor={{ fill: 'var(--secondary)' }} />
  </>
}

function HorizontalBars({ data, dataKey, nameKey = 'name', color = C.coffee, formatter }: any) {
  return <ResponsiveContainer width="100%" height="100%"><BarChart data={data || []} layout="vertical" margin={{ top: 4, right: 20, left: 8, bottom: 4 }}>
    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={C.grid} />
    <XAxis type="number" tick={{ fontSize: 10, fill: C.text }} tickLine={false} axisLine={false} tickFormatter={formatter} />
    <YAxis type="category" dataKey={nameKey} width={125} tick={{ fontSize: 10, fill: C.text }} tickLine={false} axisLine={false} tickFormatter={(val) => truncate(val, 18)} />
    <Tooltip content={<ChartTip />} cursor={{ fill: 'var(--secondary)' }} />
    <Bar dataKey={dataKey} fill={color} radius={[0, 5, 5, 0]} maxBarSize={22} />
  </BarChart></ResponsiveContainer>
}

// 🔥 NUEVO COMPONENTE: Tabla de Ranking en lugar de gráfico de barras
function RankingTable({ data, valueKey, formatValue, colorBar = C.coffee }: any) {
  if (!data || data.length === 0) return <Empty />
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

function Donut({ data }: { data: Datum[] }) {
  return data?.length ? <ResponsiveContainer width="100%" height="100%"><PieChart>
    <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={3} stroke="none">
      {data.map((_: any, i: number) => <Cell key={i} fill={palette[i % palette.length]} />)}
    </Pie>
    <Tooltip content={<ChartTip />} />
    <Legend verticalAlign="bottom" height={35} iconType="circle" wrapperStyle={{ fontSize: 10, color: C.text }} />
  </PieChart></ResponsiveContainer> : <Empty />
}

export function DashboardClient({ rangoActual, fechas, kpis, graficos }: Props) {
  const router = useRouter()
  const [desde, setDesde] = React.useState(fechas.desde || '')
  const [hasta, setHasta] = React.useState(fechas.hasta || '')
  const g = graficos || {}
  
  const ventasTiempo: Datum[] = g.ventasTiempo || []
  const productos: Datum[] = g.productos || g.topPorIngreso || []
  const inventario: Datum[] = g.inventario || []
  const pedidosEstado: Datum[] = g.pedidosEstado || []
  const facturacion: Datum[] = g.facturacion || []
  const recetas: Datum[] = g.recetas || []
  const movimientos: Datum[] = g.movimientos || []
  const payments: Datum[] = g.pagos || []

  const cancelar = () => { setDesde(''); setHasta(''); router.push('/dashboard?rango=30d') }
  const aplicar = () => { if (desde && hasta && desde <= hasta) router.push(`/dashboard?desde=${desde}&hasta=${hasta}`) }

  const kpiCards = [
    { label: 'Ventas netas', value: money(kpis.ventas), detail: 'Ventas completadas', icon: DollarSign, color: 'var(--chart-3)' },
    { label: 'Ticket promedio', value: money(kpis.ticket), detail: 'Por venta completada', icon: ReceiptText, color: 'var(--chart-1)' },
    { label: 'Pedidos', value: num(kpis.pedidos), detail: 'Pedidos del período', icon: ShoppingBag, color: 'var(--chart-2)' },
    { label: 'Alertas de stock', value: num(kpis.alertasStock), detail: 'En o bajo el mínimo', icon: AlertTriangle, color: 'var(--destructive)' },
  ]

  const topMargen = [...productos].sort((a: any, b: any) => Number(b.margen || 0) - Number(a.margen || 0)).slice(0, 8)
  const inventarioCritico = inventario.filter((x: any) => Number(x.actual) <= Number(x.minimo))
  const ventasHora: Datum[] = g.ventasPorHora || g.ventasHora || []
  const pedidosPorDia: Datum[] = g.pedidosPorDia || []
  const facturasEstado: Datum[] = g.facturasEstado || []
  const stockMovimientos: Datum[] = movimientos
  const recipeCost = recetas.filter((r: any) => Number(r.costo || 0) > 0)
  const recPopular = recetas.filter((r: any) => Number(r.cantidadVendida || 0) > 0)
  const revenueByCategory: Datum[] = g.ventasCategoria || []
  const discounts: Datum[] = g.descuentos || []
  const invoiceTrend: Datum[] = facturacion

  return <main className="min-h-screen flex-1 space-y-5 bg-muted/30 p-4 pt-4 md:p-6">
    <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div>
        <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-primary"><Activity className="h-3.5 w-3.5" /> Dashboard . Analytics</div>
      </div>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-2 shadow-sm">
        <Select value={rangoActual} onValueChange={v => router.push(`/dashboard?rango=${encodeURIComponent(v)}`)}>
          <SelectTrigger className="h-9 w-[125px] bg-background"><SelectValue placeholder="Período" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="hoy">Hoy</SelectItem><SelectItem value="7d">Últimos 7 días</SelectItem>
            <SelectItem value="30d">Últimos 30 días</SelectItem><SelectItem value="año">Este año</SelectItem>
          </SelectContent>
        </Select>
        <Input aria-label="Fecha desde" type="date" className="h-9 w-[135px] bg-background text-xs" value={desde} onChange={e => setDesde(e.target.value)} />
        <span className="text-muted-foreground">—</span>
        <Input aria-label="Fecha hasta" type="date" className="h-9 w-[135px] bg-background text-xs" value={hasta} onChange={e => setHasta(e.target.value)} />
        <Button size="sm" className="h-9" onClick={aplicar} disabled={!desde || !hasta || desde > hasta}>Aplicar</Button>
        <Button size="sm" variant="ghost" className="h-9" onClick={cancelar}>Restablecer</Button>
      </div>
    </header>

    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {kpiCards.map(({ label, value, detail, icon: Icon, color }) => <Card key={label} className="bg-card shadow-sm">
        <CardContent className="flex items-start justify-between gap-2 p-4">
          <div className="min-w-0"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-2 truncate text-xl font-bold tracking-tight sm:text-2xl text-card-foreground">{value}</p><p className="mt-1 text-[11px] text-muted-foreground">{detail}</p></div>
          <span className="rounded-xl p-2" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}><Icon className="h-4 w-4" /></span>
        </CardContent>
      </Card>)}
    </section>

    <Tabs defaultValue="ventas" className="space-y-4">
      <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-xl border bg-card p-1 sm:grid-cols-6">
        <TabsTrigger value="ventas" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary/10"><TrendingUp className="h-3.5 w-3.5" />Ventas</TabsTrigger>
        <TabsTrigger value="productos" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary/10"><Coffee className="h-3.5 w-3.5" />Productos</TabsTrigger>
        <TabsTrigger value="inventario" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary/10"><Package className="h-3.5 w-3.5" />Inventario</TabsTrigger>
        <TabsTrigger value="pedidos" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary/10"><ShoppingBag className="h-3.5 w-3.5" />Pedidos</TabsTrigger>
        <TabsTrigger value="recetas" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary/10"><Coffee className="h-3.5 w-3.5" />Recetas</TabsTrigger>
        <TabsTrigger value="facturacion" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary/10"><ReceiptText className="h-3.5 w-3.5" />Facturas</TabsTrigger>
      </TabsList>

      <TabsContent value="ventas" className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <Panel title="Evolución de ventas netas" subtitle="Ingresos por día y tendencia" className="md:col-span-8">
          <ChartFrame data={ventasTiempo}><ComposedChart data={ventasTiempo} margin={{ left: 4, right: 8, top: 8 }}>
            <Axes moneyAxis /><Bar dataKey="ventas" name="Ventas netas" fill={C.coffee} radius={[4,4,0,0]} maxBarSize={26} />
            <Line dataKey="ticketPromedio" name="Ticket promedio" stroke={C.caramel} strokeWidth={2.5} dot={false} />
          </ComposedChart></ChartFrame>
        </Panel>
        <Panel title="Métodos de pago" subtitle="Distribución del importe registrado" className="md:col-span-4"><Donut data={payments} /></Panel>
        <Panel title="Ventas por hora" subtitle="Detectá picos de demanda" className="md:col-span-6">
          <ChartFrame data={ventasHora}><AreaChart data={ventasHora}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.grid}/><XAxis dataKey="hora" tick={{fontSize:10,fill:C.text}} tickLine={false} axisLine={false} interval={3}/><YAxis tick={{fontSize:10,fill:C.text}} tickFormatter={v=>`C$${num(v)}`} width={60}/><Tooltip content={<ChartTip/>}/><Area type="monotone" dataKey="ventas" name="Ventas" stroke={C.sage} fill={C.sage} fillOpacity={0.22}/></AreaChart></ChartFrame>
        </Panel>
        <Panel title="Ventas por categoría" subtitle="Categorías que generan ingresos" className="md:col-span-6">
          {revenueByCategory.length ? <Donut data={revenueByCategory}/> : <Empty text="No hay categoría de ventas disponible"/>}
        </Panel>
        {/* 🔥 CAMBIO: Usamos RankingTable en lugar de HorizontalBars */}
        <Panel title="Productos con mayor ingreso" subtitle="Top 8 por importe vendido (Nombre completo)" className="md:col-span-6">
          <RankingTable data={productos.slice(0, 8)} valueKey="ingresos" formatValue={money} colorBar={C.caramel} />
        </Panel>
        <Panel title="Descuentos por período" subtitle="Importe de descuentos aplicados" className="md:col-span-6">
          {discounts.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={discounts}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.grid}/><XAxis dataKey="fecha" tick={{fontSize:10,fill:C.text}}/><YAxis tickFormatter={v=>`C$${num(v)}`} tick={{fontSize:10,fill:C.text}} width={60}/><Tooltip content={<ChartTip/>}/><Bar dataKey="descuento" name="Descuentos" fill={C.muted} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer> : <Empty text="No hay descuentos agrupados"/>}
        </Panel>
      </TabsContent>

      <TabsContent value="productos" className="grid grid-cols-1 gap-4 md:grid-cols-12">
        {/* 🔥 CAMBIO: Todos los gráficos de barras horizontales cambiados por RankingTable */}
        <Panel title="Top por ingresos" subtitle="Productos que más facturación generan" className="md:col-span-6">
          <RankingTable data={productos.slice(0, 10)} valueKey="ingresos" formatValue={money} colorBar={C.coffee} />
        </Panel>
        <Panel title="Top por unidades" subtitle="Productos con mayor volumen vendido" className="md:col-span-6">
          <RankingTable data={[...productos].sort((a: any, b: any) => b.cantidad - a.cantidad).slice(0, 10)} valueKey="cantidad" formatValue={num} colorBar={C.caramel} />
        </Panel>
        <Panel title="Mayor ganancia estimada" subtitle="Ingresos menos costo de receta estimado" className="md:col-span-6">
          <RankingTable data={topMargen} valueKey="margen" formatValue={money} colorBar={C.sage} />
        </Panel>
        <Panel title="Margen porcentual" subtitle="No equivale a utilidad neta contable" className="md:col-span-6">
          <RankingTable data={[...productos].sort((a: any, b: any) => b.margenPorcentaje - a.margenPorcentaje).slice(0, 8)} valueKey="margenPorcentaje" formatValue={pct} colorBar={C.muted} />
        </Panel>
        
        <Panel title="Volumen vs. margen" subtitle="Cada punto representa un producto" className="md:col-span-7">
          {productos.length ? <ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{top:10,right:12,bottom:8,left:8}}><CartesianGrid stroke={C.grid} strokeDasharray="3 3"/><XAxis type="number" dataKey="cantidad" name="Unidades" tick={{fontSize:10,fill:C.text}}/><YAxis type="number" dataKey="margen" name="Margen estimado (C$)" tickFormatter={num} tick={{fontSize:10,fill:C.text}} width={60}/><ZAxis dataKey="ingresos" range={[70,380]}/><Tooltip content={<ChartTip/>}/><Scatter data={productos} fill={C.caramel}/></ScatterChart></ResponsiveContainer> : <Empty/>}
        </Panel>
        <Panel title="Participación de ingresos" subtitle="Composición del top 8 de productos" className="md:col-span-5"><Donut data={productos.slice(0,8).map((p:any)=>({name:p.name,value:p.ingresos}))}/></Panel>
      </TabsContent>

      {/* ... (El resto de tabs se mantienen igual que antes, con Inventario, Pedidos, Recetas, Facturas) ... */}
      
      <TabsContent value="inventario" className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <Panel title="Stock actual vs. mínimo" subtitle="Primeros 12 productos o insumos por menor existencia" className="md:col-span-8">
          {inventario.length ? <ResponsiveContainer width="100%" height="100%"><ComposedChart data={inventario.slice(0,12)} margin={{left:0,right:8,bottom:35}}><CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} height={55} tick={{fontSize:9,fill:C.text}} tickFormatter={(val) => truncate(val, 15)}/><YAxis tick={{fontSize:10,fill:C.text}}/><Tooltip content={<ChartTip/>}/><Bar dataKey="actual" name="Stock actual" fill={C.sage} radius={[3,3,0,0]}/><Line dataKey="minimo" name="Stock mínimo" stroke={C.caramel} strokeWidth={2} dot={false}/></ComposedChart></ResponsiveContainer> : <Empty/>}
        </Panel>
        <Panel title="Estado del inventario" subtitle="Según el mínimo configurado" className="md:col-span-4"><Donut data={[{name:'En mínimo o bajo',value:inventarioCritico.length},{name:'Sobre mínimo',value:Math.max(0,inventario.length-inventarioCritico.length)}].filter(x=>x.value>0)}/></Panel>
        <Panel title="Alertas que requieren atención" subtitle={`${inventarioCritico.length} artículos en mínimo o bajo el mínimo`} className="md:col-span-6">
          <div className="h-full space-y-2 overflow-auto pr-1">{inventarioCritico.slice(0,8).map((item:any,i:number)=><div key={`${item.name}-${i}`} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-2.5"><div className="min-w-0"><p className="truncate text-xs font-medium text-foreground">{item.name}</p><p className="text-[10px] text-muted-foreground">{item.categoria || 'Inventario'}</p></div><div className="text-right"><p className="text-xs font-semibold text-destructive">{num(item.actual)} / {num(item.minimo)}</p><p className="text-[10px] text-muted-foreground">actual / mínimo</p></div></div>)}{!inventarioCritico.length && <Empty text="No hay artículos bajo el mínimo"/>}</div>
        </Panel>
        <Panel title="Inventario por categoría" subtitle="Distribución por cantidad, no por valor monetario" className="md:col-span-6"><Donut data={g.inventarioCat || []}/></Panel>
        <Panel title="Movimientos de inventario" subtitle="Entradas, salidas y mermas registrados" className="md:col-span-12">
          {stockMovimientos.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={stockMovimientos}><CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false}/><XAxis dataKey="tipo" tick={{fontSize:9,fill:C.text}} interval={0} angle={-15} height={40}/><YAxis tick={{fontSize:10,fill:C.text}}/><Tooltip content={<ChartTip/>}/><Bar dataKey="cantidad" name="Cantidad registrada" fill={C.coffee} radius={[4,4,0,0]}/><Bar dataKey="merma" name="Merma" fill={C.caramel} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer> : <Empty text="No hay movimientos agrupados disponibles"/>}
        </Panel>
      </TabsContent>

      <TabsContent value="pedidos" className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <Panel title="Pedidos por estado" subtitle="Carga de trabajo actual en el período" className="md:col-span-5"><Donut data={pedidosEstado}/></Panel>
        <Panel title="Pedidos por día de la semana" subtitle="Días con mayor volumen de pedidos" className="md:col-span-7">
          <ChartFrame data={pedidosPorDia}><BarChart data={pedidosPorDia}><CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false}/><XAxis dataKey="dia" tick={{fontSize:10,fill:C.text}}/><YAxis tick={{fontSize:10,fill:C.text}}/><Tooltip content={<ChartTip/>}/><Bar dataKey="cantidad" name="Pedidos" fill={C.caramel} radius={[4,4,0,0]}/></BarChart></ChartFrame>
        </Panel>
        <Panel title="Pedidos por fecha" subtitle="Evolución de la demanda" className="md:col-span-6">
          {g.pedidosTiempo?.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={g.pedidosTiempo}><CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false}/><XAxis dataKey="fecha" tick={{fontSize:10,fill:C.text}}/><YAxis tick={{fontSize:10,fill:C.text}}/><Tooltip content={<ChartTip/>}/><Area dataKey="cantidad" name="Pedidos" stroke={C.muted} fill={C.muted} fillOpacity={0.18}/></AreaChart></ResponsiveContainer> : <Empty/>}
        </Panel>
        <Panel title="Pedidos por hora" subtitle="Identificá las horas pico" className="md:col-span-6">
          {g.pedidosPorHora?.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={g.pedidosPorHora}><CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false}/><XAxis dataKey="hora" tick={{fontSize:10,fill:C.text}} interval={2}/><YAxis tick={{fontSize:10,fill:C.text}}/><Tooltip content={<ChartTip/>}/><Bar dataKey="cantidad" name="Pedidos" fill={C.sage} radius={[3,3,0,0]}/></BarChart></ResponsiveContainer> : <Empty/>}
        </Panel>
        <Panel title="Tiempo promedio por etapa" subtitle="Minutos desde creación hasta cada evento" className="md:col-span-6">
          {g.tiemposPedido?.length ? HorizontalBars({data:g.tiemposPedido,dataKey:'minutos',color:C.gold,formatter:(v:number)=>`${num(v)} min`}) : <Empty text="No hay tiempos de etapa disponibles"/>}
        </Panel>
        <Panel title="Cancelaciones por motivo" subtitle="Causas registradas al cancelar pedidos" className="md:col-span-6">
          {g.cancelaciones?.length ? HorizontalBars({data:g.cancelaciones,dataKey:'cantidad',color:C.caramel}) : <Empty text="No hay motivos de cancelación registrados"/>}
        </Panel>
      </TabsContent>

      <TabsContent value="recetas" className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <Panel title="Recetas con mayor costo estimado" subtitle="Costo calculado a partir de los ingredientes definidos" className="md:col-span-6">{HorizontalBars({data:recipeCost.slice(0,8),dataKey:'costo',color:C.caramel,formatter:(v:number)=>`C$${num(v)}`})}</Panel>
        <Panel title="Costo de ingredientes por receta" subtitle="Comparación entre preparaciones" className="md:col-span-6">{HorizontalBars({data:recipeCost.slice(0,8),dataKey:'costo',color:C.coffee,formatter:(v:number)=>`C$${num(v)}`})}</Panel>
        <Panel title="Costo como porcentaje del precio" subtitle="Solo disponible si se proporcionó precio de venta" className="md:col-span-6">
          {recetas.some((r:any)=>r.precio>0) ? HorizontalBars({data:recetas.filter((r:any)=>r.precio>0).map((r:any)=>({...r,costoPct:r.costo/r.precio*100})).sort((a:any,b:any)=>b.costoPct-a.costoPct).slice(0,8),dataKey:'costoPct',color:C.muted,formatter:(v:number)=>pct(v)}) : <Empty text="Falta precio de venta en los datos de recetas"/>}
        </Panel>
        <Panel title="Margen bruto estimado por receta" subtitle="Precio menos costo estimado de ingredientes" className="md:col-span-6">
          {recetas.some((r:any)=>r.precio>0) ? HorizontalBars({data:recetas.filter((r:any)=>r.precio>0).map((r:any)=>({...r,margenEstimado:r.precio-r.costo})).sort((a:any,b:any)=>b.margenEstimado-a.margenEstimado).slice(0,8),dataKey:'margenEstimado',color:C.sage,formatter:(v:number)=>`C$${num(v)}`}) : <Empty text="Falta precio de venta en los datos de recetas"/>}
        </Panel>
        <Panel title="Ingredientes de mayor costo agregado" subtitle="Costo estimado según las recetas activas" className="md:col-span-6">
          {g.ingredientesCosto?.length ? HorizontalBars({data:g.ingredientesCosto.slice(0,8),dataKey:'costo',color:C.gold,formatter:(v:number)=>`C$${num(v)}`}) : <Empty text="No hay desglose de costos por ingrediente"/>}
        </Panel>
        <Panel title="Popularidad vs. rentabilidad" subtitle="Unidades vendidas y margen estimado" className="md:col-span-6">
          {recPopular.length ? <ResponsiveContainer width="100%" height="100%"><ScatterChart><CartesianGrid stroke={C.grid} strokeDasharray="3 3"/><XAxis type="number" dataKey="cantidadVendida" name="Unidades vendidas" tick={{fontSize:10,fill:C.text}}/><YAxis type="number" dataKey="margen" name="Margen estimado" tickFormatter={num} tick={{fontSize:10,fill:C.text}}/><Tooltip content={<ChartTip/>}/><Scatter data={recPopular} fill={C.muted}/></ScatterChart></ResponsiveContainer> : <Empty text="No hay ventas asociadas a recetas en el período"/>}
        </Panel>
      </TabsContent>

      <TabsContent value="facturacion" className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <Panel title="Facturado vs. cobrado" subtitle="Emisión fiscal frente a pagos registrados" className="md:col-span-8">
          <ChartFrame data={invoiceTrend}>
            <ComposedChart data={invoiceTrend}>
              <Axes moneyAxis/>
              <Bar dataKey="facturado" name="Facturado" fill={C.coffee} radius={[3,3,0,0]}/>
              <Line dataKey="cobrado" name="Cobrado en ventas" stroke={C.sage} strokeWidth={3} dot={false}/>
            </ComposedChart>
          </ChartFrame>
        </Panel>
        <Panel title="Facturas por estado" subtitle="Emitidas y anuladas" className="md:col-span-4"><Donut data={facturasEstado}/></Panel>
        <Panel title="Facturación por día" subtitle="Importe fiscal por fecha de emisión" className="md:col-span-6">
          <ChartFrame data={invoiceTrend}><AreaChart data={invoiceTrend}><Axes moneyAxis/><Area dataKey="facturado" name="Facturado" stroke={C.caramel} fill={C.caramel} fillOpacity={0.15}/></AreaChart></ChartFrame>
        </Panel>
        <Panel title="Diferencia facturado vs. cobrado" subtitle="Una diferencia no siempre equivale a deuda: validar pagos y fechas" className="md:col-span-6">
          {invoiceTrend.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={invoiceTrend.map((x:any)=>({...x,diferencia:Number(x.facturado||0)-Number(x.cobrado||0)}))}><CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false}/><XAxis dataKey="fecha" tick={{fontSize:10,fill:C.text}}/><YAxis tickFormatter={v=>`C$${num(v)}`} tick={{fontSize:10,fill:C.text}} width={60}/><Tooltip content={<ChartTip/>}/><ReferenceLine y={0} stroke={C.text}/><Bar dataKey="diferencia" name="Diferencia" fill={C.muted} radius={[3,3,0,0]}/></BarChart></ResponsiveContainer> : <Empty/>}
        </Panel>
        <Panel title="Facturas anuladas" subtitle="Conteo por período" className="md:col-span-6">
          {g.facturasAnuladas?.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={g.facturasAnuladas}><CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false}/><XAxis dataKey="fecha" tick={{fontSize:10,fill:C.text}}/><YAxis tick={{fontSize:10,fill:C.text}}/><Tooltip content={<ChartTip/>}/><Bar dataKey="cantidad" name="Anuladas" fill={C.caramel} radius={[3,3,0,0]}/></BarChart></ResponsiveContainer> : <Empty text="No hay facturas anuladas en los datos enviados"/>}
        </Panel>
        <Panel title="Pagos por método" subtitle="Importe de pagos registrados en ventas" className="md:col-span-6"><Donut data={payments}/></Panel>
      </TabsContent>
    </Tabs>
    <p className="px-1 text-[11px] text-muted-foreground text-center">Los márgenes de recetas son estimaciones basadas en los costos registrados. Para decisiones contables, contrastá con costos reales, mermas, impuestos, devoluciones y gastos operativos.</p>
  </main>
}