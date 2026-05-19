import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Examenes() {
  const [examenes, setExamenes] = useState([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [duracion, setDuracion] = useState(30)
  const [fecha, setFecha] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [tipoMensaje, setTipoMensaje] = useState('')
  const [visible, setVisible] = useState(false)

  // Estado para confirmación de eliminar
  const [confirmarEliminar, setConfirmarEliminar] = useState(null)

  useEffect(() => {
    cargarExamenes()
  }, [])

  // Efecto para desaparecer el mensaje después de 2 segundos
  useEffect(() => {
    if (mensaje) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        setTimeout(() => {
          setMensaje('')
          setTipoMensaje('')
        }, 300)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [mensaje])

  const cargarExamenes = async () => {
    const { data } = await supabase
      .from('examenes')
      .select('*')
      .order('fecha_programada', { ascending: false })
    
    if (data) {
      // Actualizar estados de exámenes que ya pasaron
      const ahoraPeru = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }))
      
      for (const examen of data) {
        if (examen.estado !== 'finalizado') {
          const [y, m, d] = examen.fecha_programada.split('-')
          const horaExamen = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), 14, 0, 0)
          const horaFin = new Date(horaExamen.getTime() + examen.duracion_minutos * 60000)
          
          if (ahoraPeru > horaFin) {
            await supabase
              .from('examenes')
              .update({ estado: 'finalizado' })
              .eq('id', examen.id)
            examen.estado = 'finalizado'
          }
        }
      }
      
      setExamenes(data)
    }
  }

  const abrirFormularioNuevo = () => {
    setEditandoId(null)
    setTitulo('')
    setDescripcion('')
    setDuracion(30)
    setFecha('')
    setMostrarFormulario(true)
    setMensaje('')
    setTipoMensaje('')
    setVisible(false)
  }

  const abrirFormularioEditar = (examen) => {
    setEditandoId(examen.id)
    setTitulo(examen.titulo)
    setDescripcion(examen.descripcion || '')
    setDuracion(examen.duracion_minutos)
    setFecha(examen.fecha_programada)
    setMostrarFormulario(true)
    setMensaje('')
    setTipoMensaje('')
    setVisible(false)
  }

  const cerrarFormulario = () => {
    setMostrarFormulario(false)
    setEditandoId(null)
  }

  const guardarExamen = async (e) => {
    e.preventDefault()
    setMensaje('')
    setTipoMensaje('')

    if (editandoId) {
      const { error: updateError } = await supabase
        .from('examenes')
        .update({
          titulo,
          descripcion,
          duracion_minutos: duracion,
          fecha_programada: fecha
        })
        .eq('id', editandoId)

      if (updateError) {
        setMensaje('Error: ' + updateError.message)
        setTipoMensaje('error')
        return
      }

      setMensaje('Examen actualizado correctamente')
      setTipoMensaje('success')
    } else {
      const { error: insertError } = await supabase
        .from('examenes')
        .insert({
          titulo,
          descripcion,
          duracion_minutos: duracion,
          fecha_programada: fecha,
          hora_programada: '14:00:00',
          estado: 'programado'
        })

      if (insertError) {
        setMensaje('Error: ' + insertError.message)
        setTipoMensaje('error')
        return
      }

      setMensaje('Examen creado correctamente')
      setTipoMensaje('success')
    }

    cerrarFormulario()
    cargarExamenes()
  }

  const eliminarExamen = async (id) => {
    await supabase.from('examenes').delete().eq('id', id)
    setConfirmarEliminar(null)
    setMensaje('Examen eliminado correctamente')
    setTipoMensaje('warning')
    cargarExamenes()
  }

  return (
    <div className="min-h-screen p-4 md:p-8"
      style={{
        background: `radial-gradient(ellipse at 20% 50%, #c026d3 0%, transparent 50%), radial-gradient(ellipse at 80% 30%, #2563eb 0%, transparent 55%), radial-gradient(ellipse at 50% 80%, #7c3aed 0%, transparent 60%), #1e1b4b`
      }}
    >
      <div className="max-w-5xl mx-auto">
        
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <a 
              href="/admin/dashboard"
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <img src="/logo_SOFIA.png" alt="Academia Sofia" className="h-12 w-auto" />
            <h1 className="text-2xl font-bold text-white">Gestión de Exámenes</h1>
          </div>
          <button
            onClick={abrirFormularioNuevo}
            className="px-4 py-2 bg-violet-500 hover:bg-violet-400 text-white rounded-xl transition-all text-sm"
          >
            + Nuevo Examen
          </button>
        </div>

        {/* Mensaje flotante */}
        {mensaje && (
          <div className={`mb-6 rounded-2xl p-4 flex items-center gap-3 text-sm font-medium transition-all duration-300 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          } ${
            tipoMensaje === 'success' 
              ? 'bg-green-600 text-white' 
              : tipoMensaje === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-yellow-500 text-white'
          }`}>
            {tipoMensaje === 'success' && (
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {tipoMensaje === 'error' && (
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {tipoMensaje === 'warning' && (
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )}
            {mensaje}
          </div>
        )}

        {/* Modal de confirmación para eliminar */}
        {confirmarEliminar && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-white/10 rounded-3xl p-8 shadow-2xl max-w-md w-full text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">¿Eliminar examen?</h3>
              <p className="text-violet-300 text-sm mb-6">
                Se eliminará <strong className="text-white">{confirmarEliminar.titulo}</strong> y todas sus preguntas. Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmarEliminar(null)}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => eliminarExamen(confirmarEliminar.id)}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-400 text-white rounded-xl transition-all font-medium"
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Formulario para crear/editar examen */}
        {mostrarFormulario && (
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/10 mb-8">
            <h2 className="text-xl font-bold text-white mb-6">
              {editandoId ? 'Editar Examen' : 'Nuevo Examen'}
            </h2>
            <form onSubmit={guardarExamen} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-violet-100 mb-2">Título</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Matemáticas - Unidad 1"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-violet-300/40 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-violet-100 mb-2">Descripción</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Sumas y restas básicas"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-violet-300/40 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-violet-100 mb-2">Duración (minutos)</label>
                  <input
                    type="number"
                    value={duracion}
                    onChange={(e) => setDuracion(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                    min={5}
                    max={180}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-violet-100 mb-2">Fecha</label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={cerrarFormulario}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-violet-500 hover:bg-violet-400 text-white font-semibold rounded-xl transition-all"
                >
                  {editandoId ? 'Guardar Cambios' : 'Crear Examen'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de exámenes */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/10">
          <h2 className="text-xl font-bold text-white mb-6">Exámenes</h2>
          
          {examenes.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-violet-500/50 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-violet-300/60 text-sm">No hay exámenes creados aún.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {examenes.map((examen) => (
                <div key={examen.id} className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-white font-medium">{examen.titulo}</p>
                      {examen.descripcion && (
                        <p className="text-violet-400/60 text-xs mt-0.5">{examen.descripcion}</p>
                      )}
                      <div className="flex gap-4 mt-1 text-sm text-violet-300/70">
                        <span>{examen.fecha_programada} - 2:00 PM</span>
                        <span>{examen.duracion_minutos} min</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          examen.estado === 'programado' ? 'bg-blue-500/20 text-blue-300' :
                          examen.estado === 'en_curso' ? 'bg-green-500/20 text-green-300' :
                          'bg-gray-500/20 text-gray-300'
                        }`}>
                          {examen.estado}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <button
                        onClick={() => abrirFormularioEditar(examen)}
                        className="p-2 bg-white/10 hover:bg-white/20 text-violet-300 hover:text-white rounded-lg transition-all text-sm"
                        title="Editar examen"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <a
                        href={`/admin/preguntas?examen_id=${examen.id}&titulo=${encodeURIComponent(examen.titulo)}`}
                        className="p-2 bg-white/10 hover:bg-white/20 text-violet-300 hover:text-white rounded-lg transition-all text-sm"
                        title="Gestionar preguntas"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </a>
                      <button
                        onClick={() => setConfirmarEliminar({ id: examen.id, titulo: examen.titulo })}
                        className="p-2 bg-red-500/10 hover:bg-red-500/30 text-red-300 hover:text-red-200 rounded-lg transition-all text-sm"
                        title="Eliminar examen"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  )
}