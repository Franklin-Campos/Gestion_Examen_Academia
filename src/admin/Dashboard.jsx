import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const [alumnos, setAlumnos] = useState([])
  const [dni, setDni] = useState('')
  const [nombre, setNombre] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [pinGenerado, setPinGenerado] = useState('')
  const [busqueda, setBusqueda] = useState('')

  // Estado para confirmación de cerrar sesión
  const [confirmarSalir, setConfirmarSalir] = useState(false)

  // Cargar lista de alumnos al entrar
  useEffect(() => {
    cargarAlumnos()
  }, [])

  const cargarAlumnos = async () => {
    const { data } = await supabase
      .from('alumnos')
      .select('*')
      .order('creado_en', { ascending: false })
    if (data) setAlumnos(data)
  }

  // Filtrar alumnos en tiempo real
  const alumnosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return alumnos

    const termino = busqueda.toLowerCase().trim()
    return alumnos.filter(alumno => 
      alumno.dni.includes(termino) || 
      alumno.nombre_completo.toLowerCase().includes(termino)
    )
  }, [alumnos, busqueda])

  // Registrar alumno
  const registrarAlumno = async (e) => {
    e.preventDefault()
    setError('')
    setMensaje('')

    const dniLimpio = dni.replace(/[^0-9]/g, '')

    if (dniLimpio.length < 8) {
      setError('El DNI debe tener al menos 8 dígitos')
      setCargando(false)
      return
    }

    setCargando(true)

    // Llamar a la Edge Function
    const { data: responseData, error: fnError } = await supabase.functions.invoke('registrar-alumno', {
      body: { dni: dniLimpio, nombre: nombre }
    })

    if (fnError) {
      setError('Error: ' + fnError.message)
      setCargando(false)
      return
    }

    if (responseData.error) {
      setError('Error: ' + responseData.error)
      setCargando(false)
      return
    }

    // Éxito
    setPinGenerado(responseData.pin)
    setMensaje(responseData.mensaje)
    setDni('')
    setNombre('')
    setCargando(false)
    cargarAlumnos()
  }

  // Cerrar sesión
  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    window.location.href = '/admin'
  }

  return (
    <div
      className="min-h-screen p-4 md:p-8"
      style={{
        background: `
          radial-gradient(ellipse at 20% 50%, #c026d3 0%, transparent 50%),
          radial-gradient(ellipse at 80% 30%, #2563eb 0%, transparent 55%),
          radial-gradient(ellipse at 50% 80%, #7c3aed 0%, transparent 60%),
          #1e1b4b
        `
      }}
    >
      <div className="max-w-5xl mx-auto">

        {/* Modal de confirmación para cerrar sesión */}
        {confirmarSalir && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-white/10 rounded-3xl p-8 shadow-2xl max-w-md w-full text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/20 rounded-full mb-4">
                <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">¿Cerrar sesión?</h3>
              <p className="text-violet-300 text-sm mb-6">
                Serás redirigido al inicio de sesión del panel de administración.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmarSalir(false)}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={cerrarSesion}
                  className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-white rounded-xl transition-all font-medium"
                >
                  Sí, salir
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img 
              src="/logo_SOFIA.png" 
              alt="Academia Sofia" 
              className="h-12 w-auto"
            />
            <h1 className="text-2xl font-bold text-white">Panel de Administración</h1>
          </div>
          <div className="flex gap-2">
            <a
              href="/admin/examenes"
              className="px-4 py-2 bg-violet-500/50 hover:bg-violet-500 text-white rounded-xl transition-all text-sm"
            >
              Exámenes
            </a>
            <button
              onClick={() => setConfirmarSalir(true)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all text-sm"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Formulario de registro */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/10">
            <h2 className="text-xl font-bold text-white mb-6">Registrar Alumno</h2>
            
            <form onSubmit={registrarAlumno} className="space-y-4">
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

              <div>
                <label className="block text-sm font-medium text-violet-100 mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Juan Pérez"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-violet-300/40 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-600 rounded-xl p-3 text-white text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              {mensaje && (
                <div className="bg-green-600 rounded-xl p-4">
                  <p className="text-white text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {mensaje}
                  </p>
                  {pinGenerado && (
                    <div className="mt-3 bg-white/10 rounded-xl p-4 text-center">
                      <p className="text-green-200 text-xs mb-1">PIN del alumno (entregar en privado):</p>
                      <p className="text-3xl font-bold text-white tracking-widest">{pinGenerado}</p>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="w-full py-3 bg-violet-500 hover:bg-violet-400 disabled:bg-violet-600/50 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-violet-500/25"
              >
                {cargando ? 'Registrando...' : 'Registrar Alumno'}
              </button>
            </form>
          </div>

          {/* Lista de alumnos */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Alumnos Registrados</h2>
              {alumnos.length > 0 && (
                <span className="text-violet-300 text-sm">
                  {alumnosFiltrados.length} de {alumnos.length}
                </span>
              )}
            </div>

            {/* Barra de búsqueda */}
            <div className="relative mb-4">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por DNI o nombre..."
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-violet-300/40 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all text-sm"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-lg transition-all"
                >
                  <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            {alumnos.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-violet-500/50 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-violet-300/60 text-sm">No hay alumnos registrados aún.</p>
              </div>
            ) : alumnosFiltrados.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-violet-500/50 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-violet-300/60 text-sm">Sin resultados para "{busqueda}"</p>
                <button
                  onClick={() => setBusqueda('')}
                  className="text-violet-400 text-xs mt-1 hover:text-violet-300 transition-all"
                >
                  Limpiar búsqueda
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {alumnosFiltrados.map((alumno) => (
                  <div 
                    key={alumno.id}
                    className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all"
                  >
                    <p className="text-white font-medium">{alumno.nombre_completo}</p>
                    <div className="flex gap-4 mt-1 text-sm text-violet-300/70">
                      <span>DNI: {alumno.dni}</span>
                      <span>PIN: {alumno.pin}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}