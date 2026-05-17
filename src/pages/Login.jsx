import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [dni, setDni] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [visible, setVisible] = useState(false)
  const [cargando, setCargando] = useState(false)

  // Efecto para desaparecer el error después de 2 segundos
  useEffect(() => {
    if (error) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        setTimeout(() => setError(''), 300) // Espera a que termine la animación
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)

    const dniLimpio = dni.replace(/[^0-9]/g, '')

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: `${dniLimpio}@sofia.com`,
      password: pin,
    })

    if (authError) {
      setError('DNI o PIN incorrecto. Intenta de nuevo.')
      setCargando(false)
    } else {
      // Login exitoso: redirigir a la página principal
      window.location.href = '/home'
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `
          radial-gradient(ellipse at 20% 50%, #c026d3 0%, transparent 50%),
          radial-gradient(ellipse at 80% 30%, #2563eb 0%, transparent 55%),
          radial-gradient(ellipse at 50% 80%, #7c3aed 0%, transparent 60%),
          #1e1b4b
        `
      }}
    >
      <div className="w-full max-w-md">
        
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo_SOFIA.png" 
              alt="Academia Sofia" 
              className="h-24 w-auto object-contain drop-shadow-lg"
            />
          </div>
          <p className="text-violet-200 mt-2 text-sm tracking-wide">
            Plataforma de Exámenes Virtuales
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Campo DNI */}
            <div>
              <label className="block text-sm font-medium text-violet-100 mb-2">
                DNI del Alumno
              </label>
              <input
                type="text"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="12345678"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-violet-300/40 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
                required
                maxLength={8}
              />
            </div>

            {/* Campo PIN */}
            <div>
              <label className="block text-sm font-medium text-violet-100 mb-2">
                PIN Personal (6 dígitos)
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••••"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-violet-300/40 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
                required
                maxLength={6}
              />
            </div>

            {/* Mensaje de error */}
            {error && (
              <div
                className={`
                  flex items-center gap-3 bg-red-500/10 border border-red-400/20 rounded-xl p-4 
                  transition-all duration-300
                  ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
                `}
              >
                {/* Ícono de advertencia */}
                <svg className="w-5 h-5 text-red-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
                  />
                </svg>
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Botón */}
            <button
              type="submit"
              disabled={cargando}
              className="w-full py-3 bg-violet-500 hover:bg-violet-400 disabled:bg-violet-600/50 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed shadow-lg shadow-violet-500/25"
            >
              {cargando ? 'Ingresando...' : 'Ingresar al Sistema'}
            </button>
          </form>

          <p className="text-center text-violet-300/50 text-xs mt-6">
            Ingresa con tu DNI y el PIN de 6 dígitos proporcionado por la academia
          </p>
        </div>
      </div>
    </div>
  )
}