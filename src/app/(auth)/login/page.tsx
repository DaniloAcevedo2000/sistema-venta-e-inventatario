import { LoginForm } from './login-form'

export const metadata = {
  title: 'Iniciar sesión | Momoto Café',
  description: 'Accede al sistema de ventas e inventario',
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Lado Izquierdo: Collage de Imágenes Animado */}
      <div className="relative hidden w-1/2 lg:flex flex-col justify-center p-12 overflow-hidden bg-zinc-950">
        {/* Gradiente para asegurar legibilidad del texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 z-10" />
        
        {/* Grid de Imágenes (Collage) */}
        <div className="absolute inset-0 grid grid-cols-2 gap-4 p-4 opacity-60 scale-105">
          <div className="space-y-4 animate-[float_8s_ease-in-out_infinite]">
            <img src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=800&auto=format&fit=crop" className="rounded-2xl object-cover w-full h-64 shadow-2xl" alt="Café 1" />
            <img src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800&auto=format&fit=crop" className="rounded-2xl object-cover w-full h-80 shadow-2xl" alt="Café 2" />
          </div>
          <div className="space-y-4 animate-[float_10s_ease-in-out_infinite_reverse] mt-12">
            <img src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800&auto=format&fit=crop" className="rounded-2xl object-cover w-full h-80 shadow-2xl" alt="Café 3" />
            <img src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?q=80&w=800&auto=format&fit=crop" className="rounded-2xl object-cover w-full h-64 shadow-2xl" alt="Café 4" />
          </div>
        </div>

        {/* Texto Flotante */}
        <div className="relative z-20 mt-auto text-white max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Sistema de Ventas e Inventario
          </div>
          <h2 className="text-5xl font-bold mb-4 tracking-tight">Buen café,<br/>mejores momentos.</h2>
          <p className="text-lg text-white/70 leading-relaxed">
            Gestiona tu cafetería con la pasión que le pones a cada taza. Todo en un solo lugar.
          </p>
        </div>
      </div>

      {/* Lado Derecho: Formulario con Animaciones */}
      <div className="flex flex-1 flex-col justify-center px-6 sm:px-12 lg:px-24 bg-card relative overflow-hidden">
        
        {/* Orbes de Luz Animados (Fondo) */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-[blob_7s_infinite] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-[blob_7s_infinite_reverse] translate-y-1/2 -translate-x-1/2" />
        
        <div className="mx-auto w-full max-w-md relative z-10">
          <LoginForm />
        </div>

        {/* Footer / Redes Sociales */}
        <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-3 z-10">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Síguenos</p>
          <div className="flex items-center gap-4">
            <a 
              href="https://instagram.com/tu_cuenta" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group p-2 rounded-full bg-muted hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-pink-500 hover:to-purple-500 transition-all duration-300 shadow-sm"
            >
              <svg className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
            <a 
              href="https://facebook.com/tu_cuenta" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group p-2 rounded-full bg-muted hover:bg-[#1877F2] transition-all duration-300 shadow-sm"
            >
              <svg className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a 
              href="https://wa.me/tu_numero" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group p-2 rounded-full bg-muted hover:bg-[#25D366] transition-all duration-300 shadow-sm"
            >
              <svg className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}