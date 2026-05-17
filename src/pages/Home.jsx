import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [alumno, setAlumno] = useState(null)

  useEffect(() => {
    const cargarAlumno = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Buscar datos del alumno en la tabla alumnos
        const { data } = await supabase
          .from('alumnos')
          .select('*')
          .eq('id', user.id)
          .single()
        setAlumno(data)
      }
    }
    cargarAlumno()
  }, [])

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (!alumno) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: '#1e1b4b' }}>
        <p className="text-white">Cargando...</p>
      </div>
    )
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
      <div className="w-full max-w-md text-center">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-500/20 rounded-full mb-4">
            <svg className="w-8 h-8 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Bienvenido, {alumno.nombre_completo}
          </h1>
          <p className="text-violet-300 text-sm mb-6">
            DNI: {alumno.dni}
          </p>
          <button
            onClick={cerrarSesion}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all text-sm"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  )
}