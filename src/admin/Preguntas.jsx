import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Preguntas() {
  const [searchParams] = useSearchParams()
  const examenId = searchParams.get('examen_id')
  const examenTitulo = searchParams.get('titulo')

  const [preguntas, setPreguntas] = useState([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [enunciado, setEnunciado] = useState('')
  const [opcionA, setOpcionA] = useState('')
  const [opcionB, setOpcionB] = useState('')
  const [opcionC, setOpcionC] = useState('')
  const [opcionD, setOpcionD] = useState('')
  const [respuestaCorrecta, setRespuestaCorrecta] = useState('a')
  const [mensaje, setMensaje] = useState('')
  const [tipoMensaje, setTipoMensaje] = useState('')
  const [visible, setVisible] = useState(false)
  const [confirmarEliminar, setConfirmarEliminar] = useState(null)

  useEffect(() => {
    if (examenId) cargarPreguntas()
  }, [examenId])

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

  const cargarPreguntas = async () => {
    const { data } = await supabase
      .from('preguntas')
      .select('*')
      .eq('examen_id', examenId)
      .order('numero', { ascending: true })
    if (data) setPreguntas(data)
  }

  const agregarPregunta = async (e) => {
    e.preventDefault()
    setMensaje('')
    setTipoMensaje('')
    setVisible(false)

    const numero = preguntas.length + 1

    const { error: insertError } = await supabase
      .from('preguntas')
      .insert({
        examen_id: parseInt(examenId),
        numero: numero,
        enunciado,
        opcion_a: opcionA,
        opcion_b: opcionB,
        opcion_c: opcionC,
        opcion_d: opcionD,
        respuesta_correcta: respuestaCorrecta
      })

    if (insertError) {
      setMensaje('Error: ' + insertError.message)
      setTipoMensaje('error')
      return
    }

    await cargarPreguntas()
    setMensaje(`Pregunta ${numero} de 20 agregada correctamente`)
    setTipoMensaje('success')
    setEnunciado('')
    setOpcionA('')
    setOpcionB('')
    setOpcionC('')
    setOpcionD('')
    setRespuestaCorrecta('a')
    setMostrarFormulario(false)
  }

  const eliminarPregunta = async (id) => {
    await supabase.from('preguntas').delete().eq('id', id)
    await cargarPreguntas()
    setConfirmarEliminar(null)
    setMensaje('Pregunta eliminada correctamente')
    setTipoMensaje('warning')
  }

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-8"
      style={{
        background: `radial-gradient(ellipse at 20% 50%, #c026d3 0%, transparent 50%), radial-gradient(ellipse at 80% 30%, #2563eb 0%, transparent 55%), radial-gradient(ellipse at 50% 80%, #7c3aed 0%, transparent 60%), #1e1b4b`
      }}
    >
      <div className="max-w-5xl mx-auto">
        
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-4">
            <a href="/admin/examenes" className="p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <img src="/logo_SOFIA.png" alt="Academia Sofia" className="h-8 sm:h-12 w-auto" />
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-white">{examenTitulo}</h1>
              <p className="text-violet-300 text-xs sm:text-sm">{preguntas.length} de 20 preguntas cargadas</p>
            </div>
          </div>
          <button
            onClick={() => {
              setMostrarFormulario(!mostrarFormulario)
              setMensaje('')
              setTipoMensaje('')
              setVisible(false)
            }}
            disabled={preguntas.length >= 20}
            className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm bg-violet-500 hover:bg-violet-400 disabled:bg-violet-600/30 disabled:text-violet-300/50 text-white rounded-xl transition-all"
          >
            {preguntas.length >= 20 ? '20/20 Completo' : `+ Agregar Pregunta (${preguntas.length}/20)`}
          </button>
        </div>

        {/* Mensaje flotante */}
        {mensaje && (
          <div className={`mb-4 sm:mb-6 rounded-2xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium transition-all duration-300 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          } ${
            tipoMensaje === 'success' ? 'bg-green-600 text-white' : 
            tipoMensaje === 'error' ? 'bg-red-600 text-white' : 
            'bg-yellow-500 text-white'
          }`}>
            {tipoMensaje === 'success' && (
              <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {tipoMensaje === 'error' && (
              <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {tipoMensaje === 'warning' && (
              <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )}
            {mensaje}
          </div>
        )}

        {/* Modal de confirmación para eliminar */}
        {confirmarEliminar && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl max-w-sm w-full mx-4 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-red-500/20 rounded-full mb-3 sm:mb-4">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">¿Eliminar pregunta?</h3>
              <p className="text-violet-300 text-xs sm:text-sm mb-5 sm:mb-6">Esta acción no se puede deshacer. La pregunta se eliminará permanentemente.</p>
              <div className="flex gap-2 sm:gap-3">
                <button onClick={() => setConfirmarEliminar(null)} className="flex-1 py-2.5 sm:py-3 text-sm bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-medium">Cancelar</button>
                <button onClick={() => eliminarPregunta(confirmarEliminar)} className="flex-1 py-2.5 sm:py-3 text-sm bg-red-500 hover:bg-red-400 text-white rounded-xl transition-all font-medium">Sí, eliminar</button>
              </div>
            </div>
          </div>
        )}

        {/* Formulario */}
        {mostrarFormulario && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-white/10 mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Pregunta {preguntas.length + 1} de 20</h2>
            <form onSubmit={agregarPregunta} className="space-y-3 sm:space-y-4">
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-violet-100 mb-1.5 sm:mb-2">Enunciado de la Pregunta</label>
                <textarea value={enunciado} onChange={(e) => setEnunciado(e.target.value)} placeholder="¿Cuál es la capital de Francia?"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder-violet-300/40 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all" rows={3} required />
              </div>
              
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-violet-100 mb-1.5 sm:mb-2">Opción A</label>
                  <input type="text" value={opcionA} onChange={(e) => setOpcionA(e.target.value)} placeholder="París"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder-violet-300/40 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all" required />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-violet-100 mb-1.5 sm:mb-2">Opción B</label>
                  <input type="text" value={opcionB} onChange={(e) => setOpcionB(e.target.value)} placeholder="Londres"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder-violet-300/40 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all" required />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-violet-100 mb-1.5 sm:mb-2">Opción C</label>
                  <input type="text" value={opcionC} onChange={(e) => setOpcionC(e.target.value)} placeholder="Roma"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder-violet-300/40 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all" required />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-violet-100 mb-1.5 sm:mb-2">Opción D</label>
                  <input type="text" value={opcionD} onChange={(e) => setOpcionD(e.target.value)} placeholder="Madrid"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder-violet-300/40 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all" required />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-violet-100 mb-2 sm:mb-3">Respuesta Correcta</label>
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  {['a', 'b', 'c', 'd'].map((letra) => (
                    <button key={letra} type="button" onClick={() => setRespuestaCorrecta(letra)}
                      className={`py-2.5 sm:py-3 rounded-xl font-bold text-base sm:text-lg transition-all duration-200 ${
                        respuestaCorrecta === letra
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/25 scale-105'
                          : 'bg-white/10 text-violet-300 hover:bg-white/20 hover:scale-105'
                      }`}>
                      {letra.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit"
                className="w-full py-2.5 sm:py-3 text-sm sm:text-base bg-violet-500 hover:bg-violet-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-violet-500/25">
                Guardar Pregunta
              </button>
            </form>
          </div>
        )}

        {/* Lista de preguntas */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-white/10">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">
            Preguntas del Examen
            {preguntas.length > 0 && (
              <span className="text-violet-300 text-xs sm:text-sm font-normal ml-2">({preguntas.length}/20)</span>
            )}
          </h2>
          
          {preguntas.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <svg className="w-10 h-10 sm:w-12 sm:h-12 text-violet-500/50 mx-auto mb-2 sm:mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-violet-300/60 text-xs sm:text-sm">No hay preguntas cargadas aún.</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {preguntas.map((pregunta) => (
                <div key={pregunta.id} className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/5 hover:border-white/10 transition-all">
                  <div className="flex justify-between items-start gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-violet-500/30 text-violet-200 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                          {pregunta.numero}
                        </span>
                        <p className="text-white font-medium text-xs sm:text-sm">{pregunta.enunciado}</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 sm:gap-1 ml-0 sm:ml-7">
                        <span className={`text-[10px] sm:text-sm px-2 py-0.5 sm:py-1 rounded-lg ${
                          pregunta.respuesta_correcta === 'a' ? 'bg-green-500/30 text-green-300 font-semibold' : 'text-violet-300/60'
                        }`}>A) {pregunta.opcion_a}</span>
                        <span className={`text-[10px] sm:text-sm px-2 py-0.5 sm:py-1 rounded-lg ${
                          pregunta.respuesta_correcta === 'b' ? 'bg-green-500/30 text-green-300 font-semibold' : 'text-violet-300/60'
                        }`}>B) {pregunta.opcion_b}</span>
                        <span className={`text-[10px] sm:text-sm px-2 py-0.5 sm:py-1 rounded-lg ${
                          pregunta.respuesta_correcta === 'c' ? 'bg-green-500/30 text-green-300 font-semibold' : 'text-violet-300/60'
                        }`}>C) {pregunta.opcion_c}</span>
                        <span className={`text-[10px] sm:text-sm px-2 py-0.5 sm:py-1 rounded-lg ${
                          pregunta.respuesta_correcta === 'd' ? 'bg-green-500/30 text-green-300 font-semibold' : 'text-violet-300/60'
                        }`}>D) {pregunta.opcion_d}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setConfirmarEliminar(pregunta.id)}
                      className="p-1.5 sm:p-2 bg-red-500/10 hover:bg-red-500/30 text-red-300 hover:text-red-200 rounded-lg transition-all text-sm shrink-0"
                      title="Eliminar pregunta">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
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