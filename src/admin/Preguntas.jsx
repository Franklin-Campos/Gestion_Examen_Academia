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

  // Estado para confirmación de eliminar
  const [confirmarEliminar, setConfirmarEliminar] = useState(null) // null o el id de la pregunta

  useEffect(() => {
    if (examenId) cargarPreguntas()
  }, [examenId])

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
              href="/admin/examenes"
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <img src="/logo_SOFIA.png" alt="Academia Sofia" className="h-12 w-auto" />
            <div>
              <h1 className="text-2xl font-bold text-white">{examenTitulo}</h1>
              <p className="text-violet-300 text-sm">{preguntas.length} de 20 preguntas cargadas</p>
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
            className="px-4 py-2 bg-violet-500 hover:bg-violet-400 disabled:bg-violet-600/30 disabled:text-violet-300/50 text-white rounded-xl transition-all text-sm"
          >
            {preguntas.length >= 20 ? '20/20 Completo' : `+ Agregar Pregunta (${preguntas.length}/20)`}
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
              <h3 className="text-xl font-bold text-white mb-2">¿Eliminar pregunta?</h3>
              <p className="text-violet-300 text-sm mb-6">
                Esta acción no se puede deshacer. La pregunta se eliminará permanentemente.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmarEliminar(null)}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => eliminarPregunta(confirmarEliminar)}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-400 text-white rounded-xl transition-all font-medium"
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Formulario */}
        {mostrarFormulario && (
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/10 mb-8">
            <h2 className="text-xl font-bold text-white mb-6">Pregunta {preguntas.length + 1} de 20</h2>
            <form onSubmit={agregarPregunta} className="space-y-4">
              
              {/* Enunciado */}
              <div>
                <label className="block text-sm font-medium text-violet-100 mb-2">Enunciado de la Pregunta</label>
                <textarea
                  value={enunciado}
                  onChange={(e) => setEnunciado(e.target.value)}
                  placeholder="¿Cuál es la capital de Francia?"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-violet-300/40 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all"
                  rows={3}
                  required
                />
              </div>
              
              {/* Opciones */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-violet-100 mb-2">Opción A</label>
                  <input
                    type="text"
                    value={opcionA}
                    onChange={(e) => setOpcionA(e.target.value)}
                    placeholder="París"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-violet-300/40 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-violet-100 mb-2">Opción B</label>
                  <input
                    type="text"
                    value={opcionB}
                    onChange={(e) => setOpcionB(e.target.value)}
                    placeholder="Londres"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-violet-300/40 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-violet-100 mb-2">Opción C</label>
                  <input
                    type="text"
                    value={opcionC}
                    onChange={(e) => setOpcionC(e.target.value)}
                    placeholder="Roma"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-violet-300/40 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-violet-100 mb-2">Opción D</label>
                  <input
                    type="text"
                    value={opcionD}
                    onChange={(e) => setOpcionD(e.target.value)}
                    placeholder="Madrid"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-violet-300/40 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Respuesta correcta con botones */}
              <div>
                <label className="block text-sm font-medium text-violet-100 mb-3">
                  Respuesta Correcta
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {['a', 'b', 'c', 'd'].map((letra) => (
                    <button
                      key={letra}
                      type="button"
                      onClick={() => setRespuestaCorrecta(letra)}
                      className={`py-3 rounded-xl font-bold text-lg transition-all duration-200 ${
                        respuestaCorrecta === letra
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/25 scale-105'
                          : 'bg-white/10 text-violet-300 hover:bg-white/20 hover:scale-105'
                      }`}
                    >
                      {letra.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botón guardar */}
              <button
                type="submit"
                className="w-full py-3 bg-violet-500 hover:bg-violet-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-violet-500/25 hover:scale-[1.02] active:scale-[0.98]"
              >
                Guardar Pregunta
              </button>
            </form>
          </div>
        )}

        {/* Lista de preguntas */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/10">
          <h2 className="text-xl font-bold text-white mb-6">
            Preguntas del Examen
            {preguntas.length > 0 && (
              <span className="text-violet-300 text-sm font-normal ml-2">({preguntas.length}/20)</span>
            )}
          </h2>
          
          {preguntas.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-violet-500/50 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-violet-300/60 text-sm">No hay preguntas cargadas aún.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {preguntas.map((pregunta) => (
                <div 
                  key={pregunta.id} 
                  className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-violet-500/30 text-violet-200 text-xs font-bold px-2 py-0.5 rounded-full">
                          {pregunta.numero}
                        </span>
                        <p className="text-white font-medium">{pregunta.enunciado}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-1 ml-7">
                        <span className={`text-sm px-2 py-1 rounded-lg ${
                          pregunta.respuesta_correcta === 'a' 
                            ? 'bg-green-500/30 text-green-300 font-semibold' 
                            : 'text-violet-300/60'
                        }`}>
                          A) {pregunta.opcion_a}
                        </span>
                        <span className={`text-sm px-2 py-1 rounded-lg ${
                          pregunta.respuesta_correcta === 'b' 
                            ? 'bg-green-500/30 text-green-300 font-semibold' 
                            : 'text-violet-300/60'
                        }`}>
                          B) {pregunta.opcion_b}
                        </span>
                        <span className={`text-sm px-2 py-1 rounded-lg ${
                          pregunta.respuesta_correcta === 'c' 
                            ? 'bg-green-500/30 text-green-300 font-semibold' 
                            : 'text-violet-300/60'
                        }`}>
                          C) {pregunta.opcion_c}
                        </span>
                        <span className={`text-sm px-2 py-1 rounded-lg ${
                          pregunta.respuesta_correcta === 'd' 
                            ? 'bg-green-500/30 text-green-300 font-semibold' 
                            : 'text-violet-300/60'
                        }`}>
                          D) {pregunta.opcion_d}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setConfirmarEliminar(pregunta.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/30 text-red-300 hover:text-red-200 rounded-lg transition-all text-sm shrink-0"
                      title="Eliminar pregunta"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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