import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [alumno, setAlumno] = useState(null)
  const [examenHoy, setExamenHoy] = useState(null)
  const [yaRindio, setYaRindio] = useState(false)
  const [notaActual, setNotaActual] = useState(null)
  const [historial, setHistorial] = useState([])
  const [cargando, setCargando] = useState(true)
  const [confirmarSalir, setConfirmarSalir] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: alumnoData } = await supabase
      .from('alumnos')
      .select('*')
      .eq('id', user.id)
      .single()
    if (alumnoData) setAlumno(alumnoData)

    const ahoraPeru = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }))
    const year = ahoraPeru.getFullYear()
    const month = String(ahoraPeru.getMonth() + 1).padStart(2, '0')
    const day = String(ahoraPeru.getDate()).padStart(2, '0')
    const hoy = `${year}-${month}-${day}`
    
    const { data: examenData } = await supabase
      .from('examenes')
      .select('*')
      .eq('fecha_programada', hoy)
      .single()

    if (examenData) {
      const [y2, m2, d2] = examenData.fecha_programada.split('-')
      const horaExamen2 = new Date(parseInt(y2), parseInt(m2) - 1, parseInt(d2), 14, 0, 0)
      const horaFin2 = new Date(horaExamen2.getTime() + examenData.duracion_minutos * 60000)
      
      if (examenData.estado === 'en_curso' && ahoraPeru > horaFin2) {
        await supabase
          .from('examenes')
          .update({ estado: 'finalizado' })
          .eq('id', examenData.id)
        examenData.estado = 'finalizado'
      }

      setExamenHoy(examenData)

      const { data: realizadoData } = await supabase
        .from('examenes_realizados')
        .select('*')
        .eq('alumno_id', user.id)
        .eq('examen_id', examenData.id)
        .eq('estado', 'finalizado')
        .single()

      if (realizadoData) {
        setYaRindio(true)
        setNotaActual(realizadoData)
      } else if (examenData.estado === 'finalizado' && ahoraPeru > horaFin2) {
        const { data: noPresentado } = await supabase
          .from('examenes_realizados')
          .insert({
            alumno_id: user.id,
            examen_id: examenData.id,
            nota: 0,
            color: 'rojo',
            correctas: 0,
            incorrectas: 0,
            sin_responder: 20,
            estado: 'finalizado',
            finalizado_en: new Date().toISOString()
          })
          .select()
          .single()

        if (noPresentado) {
          setYaRindio(true)
          setNotaActual(noPresentado)
        }
      }
    }

    const { data: historialData } = await supabase
      .from('examenes_realizados')
      .select(`
        *,
        examen:examen_id(titulo)
      `)
      .eq('alumno_id', user.id)
      .eq('estado', 'finalizado')
      .order('finalizado_en', { ascending: false })

    if (historialData) setHistorial(historialData)

    setCargando(false)
  }

  const getAhoraPeru = () => {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }))
  }

  const esHoraExamen = () => {
    if (!examenHoy) return false
    const ahora = getAhoraPeru()
    const [year, month, day] = examenHoy.fecha_programada.split('-')
    const horaExamen = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 14, 0, 0)
    return ahora >= horaExamen
  }

  const examenFinalizo = () => {
    if (!examenHoy) return false
    const ahora = getAhoraPeru()
    const [year, month, day] = examenHoy.fecha_programada.split('-')
    const horaExamen = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 14, 0, 0)
    const horaFin = new Date(horaExamen.getTime() + examenHoy.duracion_minutos * 60000)
    return ahora > horaFin
  }

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1e1b4b' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-white">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!alumno) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1e1b4b' }}>
        <p className="text-white">Error al cargar datos</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8"
      style={{
        background: `radial-gradient(ellipse at 20% 50%, #c026d3 0%, transparent 50%), radial-gradient(ellipse at 80% 30%, #2563eb 0%, transparent 55%), radial-gradient(ellipse at 50% 80%, #7c3aed 0%, transparent 60%), #1e1b4b`
      }}
    >
      {/* Modal confirmar salir */}
      {confirmarSalir && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-3xl p-8 shadow-2xl max-w-md w-full text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/20 rounded-full mb-4">
              <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">¿Cerrar sesión?</h3>
            <p className="text-violet-300 text-sm mb-6">Serás redirigido al inicio de sesión.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmarSalir(false)} className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-medium">Cancelar</button>
              <button onClick={cerrarSesion} className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-white rounded-xl transition-all font-medium">Sí, salir</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img src="/logo_SOFIA.png" alt="Academia Sofia" className="h-10 w-auto" />
            <div>
              <h1 className="text-xl font-bold text-white">Bienvenido, {alumno.nombre_completo}</h1>
              <p className="text-violet-300 text-sm">DNI: {alumno.dni}</p>
            </div>
          </div>
          <button onClick={() => setConfirmarSalir(true)} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all text-sm">
            Cerrar Sesión
          </button>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/10 mb-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Examen de Hoy
          </h2>

          {!examenHoy ? (
            <div className="text-center py-6">
              <svg className="w-12 h-12 text-violet-500/50 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <p className="text-violet-300/60 text-sm">No hay exámenes programados para hoy.</p>
            </div>
          ) : yaRindio ? (
            <div className="bg-white/5 rounded-2xl p-6 text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
                notaActual.color === 'verde' ? 'bg-green-500/20' :
                notaActual.color === 'ambar' ? 'bg-yellow-500/20' :
                'bg-red-500/20'
              }`}>
                <span className="text-2xl font-bold text-white">{notaActual.nota}</span>
              </div>
              <p className="text-white font-medium">{examenHoy.titulo}</p>
              {notaActual.nota === 0 && notaActual.sin_responder === 20 ? (
                <p className="text-red-300 text-sm mt-1">No te presentaste a este examen</p>
              ) : (
                <p className="text-violet-300 text-sm mt-1">Ya realizaste este examen</p>
              )}
              <p className="text-sm mt-2 font-medium">
                {notaActual.correctas} ✅ {notaActual.incorrectas} ❌ {notaActual.sin_responder} ⚪
              </p>
            </div>
          ) : (
            <div className="bg-white/5 rounded-2xl p-6 text-center">
              <p className="text-white font-medium text-lg">{examenHoy.titulo}</p>
              {examenHoy.descripcion && (
                <p className="text-violet-400/60 text-sm mt-1">{examenHoy.descripcion}</p>
              )}
              <div className="flex justify-center gap-6 mt-3 text-sm text-violet-300/70">
                <span>⏱️ {examenHoy.duracion_minutos} minutos</span>
                <span>📝 20 preguntas</span>
              </div>

              {!esHoraExamen() ? (
                <div className="mt-4">
                  <button disabled className="px-6 py-3 bg-violet-600/30 text-violet-300/50 rounded-xl font-medium cursor-not-allowed">Iniciar Examen</button>
                  <p className="text-violet-400/50 text-xs mt-2">Disponible a las 2:00 PM</p>
                </div>
              ) : examenFinalizo() ? (
                <div className="mt-4">
                  <p className="text-yellow-300 text-sm">El examen ya finalizó. No se aceptan más ingresos.</p>
                </div>
              ) : (
                <a href={`/examen?examen_id=${examenHoy.id}`} className="mt-4 inline-block px-8 py-3 bg-violet-500 hover:bg-violet-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-500/25">Iniciar Examen</a>
              )}
            </div>
          )}
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/10">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Mis Notas
          </h2>

          {historial.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-violet-300/60 text-sm">Aún no has realizado ningún examen.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historial.map((item) => (
                <div key={item.id} className="bg-white/5 rounded-xl p-4 border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{item.examen?.titulo || 'Examen'}</p>
                    <p className="text-violet-400/60 text-xs mt-0.5">
                      {new Date(item.finalizado_en).toLocaleDateString('es-PE')}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    item.color === 'verde' ? 'bg-green-500/20 text-green-300' :
                    item.color === 'ambar' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {item.nota}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}