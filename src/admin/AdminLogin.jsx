import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [visible, setVisible] = useState(false)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (error) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        setTimeout(() => setError(''), 300)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (authError) {
      setError('Credenciales incorrectas. Intenta de nuevo.')
      setCargando(false)
    } else {
      window.location.href = '/admin/dashboard'
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-3 sm:p-4"
      style={{
        background: `
          radial-gradient(ellipse at 20% 50%, #c026d3 0%, transparent 50%),
          radial-gradient(ellipse at 80% 30%, #2563eb 0%, transparent 55%),
          radial-gradient(ellipse at 50% 80%, #7c3aed 0%, transparent 60%),
          #1e1b4b
        `
      }}
    >
      <div className="w-full max-w-md px-1 sm:px-0">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-3 sm:mb-4">
            <img 
              src="/logo_SOFIA.png" 
              alt="Academia Sofia" 
              className="h-16 sm:h-20 md:h-24 w-auto object-contain drop-shadow-lg"
            />
          </div>
          <p className="text-violet-200 text-xs sm:text-sm tracking-wide">
            Panel de Administración
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl border border-white/10">
          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-violet-100 mb-1.5 sm:mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sofia.com"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-white/5 border border-white/10 rounded-xl text-white placeholder-violet-300/40 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-violet-100 mb-1.5 sm:mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-white/5 border border-white/10 rounded-xl text-white placeholder-violet-300/40 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Mensaje de error */}
            {error && (
              <div
                className={`
                  flex items-center gap-2 sm:gap-3 bg-red-600 rounded-xl p-3 sm:p-4 text-white text-xs sm:text-sm font-medium
                  transition-all duration-300
                  ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
                `}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
                  />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-2.5 sm:py-3 text-sm sm:text-base bg-violet-500 hover:bg-violet-400 disabled:bg-violet-600/50 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-violet-500/25"
            >
              {cargando ? 'Ingresando...' : 'Ingresar al Panel'}
            </button>
            <div className="text-center mt-4 pt-4 border-t border-white/10">
              <a 
                href="/" 
                className="text-violet-400/50 hover:text-violet-300 text-[10px] sm:text-xs transition-all"
              >
                ¿Eres alumno? Ingresa aquí
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}