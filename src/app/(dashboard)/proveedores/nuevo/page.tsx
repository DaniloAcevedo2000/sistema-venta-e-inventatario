import { ProveedorForm } from '../proveedor-form'

export default function NuevoProveedorPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Proveedor</h1>
        <p className="text-muted-foreground">Registra un nuevo proveedor en el sistema</p>
      </div>
      <ProveedorForm />
    </div>
  )
}