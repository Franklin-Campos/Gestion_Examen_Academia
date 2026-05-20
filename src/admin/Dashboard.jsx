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
  const [confirmarSalir, setConfirmarSalir] = useState(false)
  const [editandoAlumno, setEditandoAlumno] = useState(null)
  const [confirmarEliminarAlumno, setConfirmarEliminarAlumno] = useState(null)

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

  const alumnosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return alumnos
    const termino = busqueda.toLowerCase().trim()
    return alumnos.filter(alumno => 
      alumno.dni.includes(termino) || 
      alumno.nombre_completo.toLowerCase().includes(termino)
    )
  }, [alumnos, busqueda])

  const registrarAlumno = async (e) => {
    e.preventDefault()
    setError('')
    setMensaje('')

    const dniLimpio = dni.replace(/[^0-9]/g, '')

    if (dniLimpio.length < 8) {
      setError('El DNI debe tener al menos 8 dígitos')
      return
    }

    setCargando(true)

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

    setPinGenerado(responseData.pin)
    setMensaje(responseData.mensaje)
    setDni('')
    setNombre('')
    setCargando(false)
    cargarAlumnos()
  }

  const actualizarAlumno = async (e) => {
    e.preventDefault()
    setError('')
    setMensaje('')

    const dniLimpio = editandoAlumno.dni.replace(/[^0-9]/g, '')

    if (dniLimpio.length < 8) {
      setError('El DNI debe tener al menos 8 dígitos')
      return
    }

    setCargando(true)

    const { error: updateError } = await supabase
      .from('alumnos')
      .update({
        dni: dniLimpio,
        nombre_completo: editandoAlumno.nombre
      })
      .eq('id', editandoAlumno.id)

    if (updateError) {
      setError('Error: ' + updateError.message)
      setCargando(false)
      return
    }

    setMensaje('Alumno actualizado correctamente')
    setEditandoAlumno(null)
    setCargando(false)
    cargarAlumnos()
  }

  const regenerarPin = async (alumnoId, nuevoPin) => {
    setCargando(true)

    const { error: updateError } = await supabase
      .from('alumnos')
      .update({ pin: nuevoPin })
      .eq('id', alumnoId)

    if (updateError) {
      setError('Error al regenerar PIN: ' + updateError.message)
      setCargando(false)
      return
    }

    setMensaje(`Nuevo PIN generado: ${nuevoPin}`)
    setCargando(false)
    cargarAlumnos()
  }

  const eliminarAlumno = async (alumnoId) => {
    setCargando(true)

    const { error: deleteError } = await supabase
      .from('alumnos')
      .delete()
      .eq('id', alumnoId)

    if (deleteError) {
      setError('Error al eliminar alumno: ' + deleteError.message)
      setCargando(false)
      return
    }

    setMensaje('Alumno eliminado correctamente')
    setConfirmarEliminarAlumno(null)
    setCargando(false)
    cargarAlumnos()
  }

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    window.location.href = '/admin'
  }

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-8"
      style={{
        background: `radial-gradient(ellipse at 20% 50%, #c026d3 0%, transparent 50%), radial-gradient(ellipse at 80% 30%, #2563eb 0%, transparent 55%), radial-gradient(ellipse at 50% 80%, #7c3aed 0%, transparent 60%), #1e1b4b`
      }}
    >
      <div className="max-w-5xl mx-auto">

        {/* Modal confirmar salir */}
        {confirmarSalir && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl max-w-sm w-full mx-4 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-yellow-500/20 rounded-full mb-3 sm:mb-4">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">¿Cerrar sesión?</h3>
              <p className="text-violet-300 text-xs sm:text-sm mb-5 sm:mb-6">Serás redirigido al inicio de sesión del panel de administración.</p>
              <div className="flex gap-2 sm:gap-3">
                <button onClick={() => setConfirmarSalir(false)} className="flex-1 py-2.5 sm:py-3 text-sm bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-medium">Cancelar</button>
                <button onClick={cerrarSesion} className="flex-1 py-2.5 sm:py-3 text-sm bg-yellow-500 hover:bg-yellow-400 text-white rounded-xl transition-all font-medium">Sí, salir</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal confirmar eliminar alumno */}
        {confirmarEliminarAlumno && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl max-w-sm w-full mx-4 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-red-500/20 rounded-full mb-3 sm:mb-4">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">¿Eliminar alumno?</h3>
              <p className="text-violet-300 text-xs sm:text-sm mb-5 sm:mb-6">
                Se eliminará a <strong className="text-white">{confirmarEliminarAlumno.nombre}</strong> (DNI: {confirmarEliminarAlumno.dni}). Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-2 sm:gap-3">
                <button onClick={() => setConfirmarEliminarAlumno(null)} className="flex-1 py-2.5 sm:py-3 text-sm bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-medium">Cancelar</button>
                <button onClick={() => eliminarAlumno(confirmarEliminarAlumno.id)} className="flex-1 py-2.5 sm:py-3 text-sm bg-red-500 hover:bg-red-400 text-white rounded-xl transition-all font-medium">Sí, eliminar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal editar alumno */}
        {editandoAlumno && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl max-w-sm w-full mx-4">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Editar Alumno</h2>
              <form onSubmit={actualizarAlumno} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-violet-100 mb-1.5 sm:mb-2">DNI</label>
                  <input type="text" value={editandoAlumno.dni} onChange={(e) => setEditandoAlumno({ ...editandoAlumno, dni: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-400" required maxLength={8} />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-violet-100 mb-1.5 sm:mb-2">Nombre Completo</label>
                  <input type="text" value={editandoAlumno.nombre} onChange={(e) => setEditandoAlumno({ ...editandoAlumno, nombre: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-400" required />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-violet-100 mb-1.5 sm:mb-2">PIN Actual: {editandoAlumno.pin}</label>
                  <button type="button"
                    onClick={() => {
                      const nuevoPin = Math.floor(100000 + Math.random() * 900000).toString()
                      setEditandoAlumno({ ...editandoAlumno, pin: nuevoPin })
                      regenerarPin(editandoAlumno.id, nuevoPin)
                    }}
                    className="w-full py-2 sm:py-2.5 text-xs sm:text-sm bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-xl transition-all">
                    Regenerar PIN
                  </button>
                </div>

                {error && (
                  <div className="bg-red-600 rounded-xl p-3 text-white text-xs sm:text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                )}

                <div className="flex gap-2 sm:gap-3">
                  <button type="button" onClick={() => setEditandoAlumno(null)} className="flex-1 py-2.5 sm:py-3 text-sm bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-medium">Cancelar</button>
                  <button type="submit" disabled={cargando} className="flex-1 py-2.5 sm:py-3 text-sm bg-violet-500 hover:bg-violet-400 disabled:bg-violet-600/50 text-white font-semibold rounded-xl transition-all">
                    {cargando ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Encabezado responsivo */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <img src="/logo_SOFIA.png" alt="Academia Sofia" className="h-8 sm:h-12 w-auto" />
            <h1 className="text-lg sm:text-2xl font-bold text-white">Panel de Administración</h1>
          </div>
          <div className="flex gap-1.5 sm:gap-2 flex-wrap">
            <a href="/admin/examenes" className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-violet-500/50 hover:bg-violet-500 text-white rounded-xl transition-all">Exámenes</a>
            <a href="/admin/reportes" className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-green-500/50 hover:bg-green-500 text-white rounded-xl transition-all">Reportes</a>
            <button onClick={() => setConfirmarSalir(true)} className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all">Cerrar Sesión</button>
          </div>
        </div>

        {mensaje && (
          <div className="mb-4 sm:mb-6 rounded-2xl p-3 sm:p-4 bg-green-600 text-white text-xs sm:text-sm flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {mensaje}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
          
          {/* Formulario de registro */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-white/10">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Registrar Alumno</h2>
            <form onSubmit={registrarAlumno} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-violet-100 mb-1.5 sm:mb-2">DNI del Alumno</label>
                <input type="text" value={dni} onChange={(e) => setDni(e.target.value)} placeholder="12345678"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder-violet-300/40 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all" required maxLength={8} />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-violet-100 mb-1.5 sm:mb-2">Nombre Completo</label>
                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Juan Pérez"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder-violet-300/40 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all" required />
              </div>

              {error && (
                <div className="bg-red-600 rounded-xl p-3 text-white text-xs sm:text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              {pinGenerado && (
                <div className="bg-green-600 rounded-xl p-3 sm:p-4 text-center">
                  <p className="text-green-200 text-[10px] sm:text-xs mb-1">PIN del alumno (entregar en privado):</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white tracking-widest">{pinGenerado}</p>
                </div>
              )}

              <button type="submit" disabled={cargando}
                className="w-full py-2.5 sm:py-3 text-sm sm:text-base bg-violet-500 hover:bg-violet-400 disabled:bg-violet-600/50 text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-500/25">
                {cargando ? 'Registrando...' : 'Registrar Alumno'}
              </button>
            </form>
          </div>

          {/* Lista de alumnos */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-white">Alumnos Registrados</h2>
              {alumnos.length > 0 && (
                <span className="text-violet-300 text-xs sm:text-sm">{alumnosFiltrados.length} de {alumnos.length}</span>
              )}
            </div>

            <div className="relative mb-3 sm:mb-4">
              <svg className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por DNI o nombre..."
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-xs sm:text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder-violet-300/40 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all" />
              {busqueda && (
                <button onClick={() => setBusqueda('')} className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-lg transition-all">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            {alumnos.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <p className="text-violet-300/60 text-xs sm:text-sm">No hay alumnos registrados aún.</p>
              </div>
            ) : alumnosFiltrados.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <p className="text-violet-300/60 text-xs sm:text-sm">Sin resultados para "{busqueda}"</p>
                <button onClick={() => setBusqueda('')} className="text-violet-400 text-xs mt-1 hover:text-violet-300">Limpiar búsqueda</button>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
                {alumnosFiltrados.map((alumno) => (
                  <div key={alumno.id} className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium text-xs sm:text-sm truncate">{alumno.nombre_completo}</p>
                        <div className="flex gap-2 sm:gap-4 mt-0.5 sm:mt-1 text-[10px] sm:text-sm text-violet-300/70">
                          <span>DNI: {alumno.dni}</span>
                          <span>PIN: {alumno.pin}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                        <button
                          onClick={() => setEditandoAlumno({ id: alumno.id, dni: alumno.dni, nombre: alumno.nombre_completo, pin: alumno.pin })}
                          className="p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 text-violet-300 hover:text-white rounded-lg transition-all"
                          title="Editar alumno">
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setConfirmarEliminarAlumno({ id: alumno.id, nombre: alumno.nombre_completo, dni: alumno.dni })}
                          className="p-1.5 sm:p-2 bg-red-500/10 hover:bg-red-500/30 text-red-300 hover:text-red-200 rounded-lg transition-all"
                          title="Eliminar alumno">
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
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