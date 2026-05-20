import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Examen() {
  const [searchParams] = useSearchParams()
  const examenId = searchParams.get('examen_id')

  const [examen, setExamen] = useState(null)
  const [preguntas, setPreguntas] = useState([])
  const [preguntaActual, setPreguntaActual] = useState(0)
  const [respuestas, setRespuestas] = useState({})
  const [tiempoRestante, setTiempoRestante] = useState(0)
  const [examenRealizadoId, setExamenRealizadoId] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [entregando, setEntregando] = useState(false)
  const [mostrarAdvertencia, setMostrarAdvertencia] = useState(false)

  useEffect(() => {
    cargarExamen()
  }, [examenId])

  const cargarExamen = async () => {
    const { data: examenData } = await supabase
      .from('examenes')
      .select('*')
      .eq('id', examenId)
      .single()

    if (!examenData) {
      setCargando(false)
      return
    }
    setExamen(examenData)

    const { data: preguntasData } = await supabase
      .from('preguntas')
      .select('id, numero, enunciado, opcion_a, opcion_b, opcion_c, opcion_d')
      .eq('examen_id', examenId)
      .order('numero', { ascending: true })

    if (preguntasData) {
      setPreguntas(preguntasData)
      const respuestasIniciales = {}
      preguntasData.forEach(p => {
        respuestasIniciales[p.id] = null
      })
      setRespuestas(respuestasIniciales)
    }

    const { data: { user } } = await supabase.auth.getUser()
    const { data: realizadoData } = await supabase
      .from('examenes_realizados')
      .select('*')
      .eq('alumno_id', user.id)
      .eq('examen_id', examenId)
      .single()

    if (realizadoData) {
      if (realizadoData.estado === 'finalizado') {
        window.location.href = '/home'
        return
      }
      setExamenRealizadoId(realizadoData.id)
    } else {
      await supabase
        .from('examenes')
        .update({ estado: 'en_curso' })
        .eq('id', examenId)
        .eq('estado', 'programado')

      const { data: nuevoRealizado } = await supabase
        .from('examenes_realizados')
        .insert({
          alumno_id: user.id,
          examen_id: parseInt(examenId),
          estado: 'en_curso'
        })
        .select()
        .single()

      if (nuevoRealizado) {
        setExamenRealizadoId(nuevoRealizado.id)
      }
    }

    const ahoraPeru = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }))
    const [year, month, day] = examenData.fecha_programada.split('-')
    const horaExamen = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 14, 0, 0)
    const horaFin = new Date(horaExamen.getTime() + examenData.duracion_minutos * 60000)
    const segundosRestantes = Math.max(0, Math.floor((horaFin - ahoraPeru) / 1000))
    setTiempoRestante(segundosRestantes)

    setCargando(false)
  }

  useEffect(() => {
    if (tiempoRestante <= 0 || cargando) return

    const intervalo = setInterval(() => {
      setTiempoRestante(prev => {
        if (prev <= 1) {
          clearInterval(intervalo)
          entregarExamen()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(intervalo)
  }, [tiempoRestante, cargando])

  const seleccionarRespuesta = (preguntaId, opcion) => {
    setRespuestas(prev => ({
      ...prev,
      [preguntaId]: opcion
    }))
  }

  const irAPregunta = (index) => {
    if (index >= 0 && index < preguntas.length) {
      setPreguntaActual(index)
    }
  }

  const preguntaAnterior = () => irAPregunta(preguntaActual - 1)
  const preguntaSiguiente = () => irAPregunta(preguntaActual + 1)

  const sinResponder = Object.values(respuestas).filter(r => r === null).length

  const iniciarEntrega = () => {
    if (sinResponder > 0) {
      setMostrarAdvertencia(true)
    } else {
      entregarExamen()
    }
  }

  const entregarExamen = useCallback(async () => {
    if (entregando) return
    setEntregando(true)

    const respuestasArray = Object.entries(respuestas).map(([preguntaId, respuesta]) => ({
      examen_realizado_id: examenRealizadoId,
      pregunta_id: parseInt(preguntaId),
      respuesta_alumno: respuesta
    }))

    await supabase.from('respuestas_alumno').insert(respuestasArray)

    window.location.href = `/resultado?examen_realizado_id=${examenRealizadoId}`
  }, [respuestas, examenRealizadoId, entregando])

  const formatearTiempo = (segundos) => {
    const min = Math.floor(segundos / 60)
    const seg = segundos % 60
    return `${min.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`
  }

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1e1b4b' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-white text-sm">Cargando examen...</p>
        </div>
      </div>
    )
  }

  if (!examen || preguntas.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1e1b4b' }}>
        <p className="text-white text-sm">Error al cargar el examen</p>
      </div>
    )
  }

  const pregunta = preguntas[preguntaActual]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#1e1b4b' }}>
      
      {/* Barra superior */}
      <div className="bg-white/5 border-b border-white/10 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-white font-medium text-xs sm:text-sm truncate">{examen.titulo}</h1>
          <p className="text-violet-400/60 text-[10px] sm:text-xs truncate">{examen.descripcion}</p>
        </div>
        <div className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-mono text-base sm:text-lg font-bold shrink-0 ${
          tiempoRestante <= 300 ? 'bg-red-500/20 text-red-300 animate-pulse' : 'bg-white/10 text-white'
        }`}>
          {formatearTiempo(tiempoRestante)}
        </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto p-3 sm:p-4 w-full">
        
        {/* Indicador de pregunta */}
        <div className="text-center mb-4 sm:mb-6">
          <span className="text-violet-300 text-xs sm:text-sm">
            Pregunta {preguntaActual + 1} de {preguntas.length}
          </span>
        </div>

        {/* Enunciado */}
        <div className="bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 border border-white/10">
          <p className="text-white text-sm sm:text-lg">{pregunta.enunciado}</p>
        </div>

        {/* Opciones */}
        <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
          {['a', 'b', 'c', 'd'].map((letra) => (
            <button
              key={letra}
              onClick={() => seleccionarRespuesta(pregunta.id, letra)}
              className={`w-full p-3 sm:p-4 rounded-xl text-left transition-all duration-200 border text-xs sm:text-base ${
                respuestas[pregunta.id] === letra
                  ? 'bg-violet-500/30 border-violet-400 text-white shadow-lg shadow-violet-500/10'
                  : 'bg-white/5 border-white/10 text-violet-100 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <span className="font-bold mr-2 sm:mr-3">{letra.toUpperCase()})</span>
              {pregunta[`opcion_${letra}`]}
            </button>
          ))}
        </div>

        {/* Navegación */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <button
            onClick={preguntaAnterior}
            disabled={preguntaActual === 0}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30 text-white rounded-xl transition-all"
          >
            ← Anterior
          </button>
          <button
            onClick={preguntaSiguiente}
            disabled={preguntaActual === preguntas.length - 1}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30 text-white rounded-xl transition-all"
          >
            Siguiente →
          </button>
        </div>

        {/* Bolitas de progreso */}
        <div className="flex justify-center gap-1 sm:gap-2 mb-6 sm:mb-8 flex-wrap px-1">
          {preguntas.map((p, index) => (
            <button
              key={p.id}
              onClick={() => irAPregunta(index)}
              className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full text-[10px] sm:text-xs font-medium transition-all ${
                index === preguntaActual
                  ? 'bg-violet-500 text-white scale-110'
                  : respuestas[p.id]
                  ? 'bg-violet-500/40 text-white'
                  : 'bg-white/10 text-violet-300/50 hover:bg-white/20'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {/* Botón finalizar */}
        <button
          onClick={iniciarEntrega}
          className="w-full py-2.5 sm:py-3 text-sm sm:text-base bg-violet-500 hover:bg-violet-400 text-white font-semibold rounded-xl transition-all shadow-lg"
        >
          Finalizar Examen
        </button>

        {/* Advertencia */}
        {mostrarAdvertencia && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl max-w-sm w-full mx-4 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-yellow-500/20 rounded-full mb-3 sm:mb-4">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">¿Finalizar examen?</h3>
              <p className="text-violet-300 text-xs sm:text-sm mb-5 sm:mb-6">
                Tienes <strong className="text-yellow-300">{sinResponder} preguntas sin responder</strong>. 
                Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-2 sm:gap-3">
                <button onClick={() => setMostrarAdvertencia(false)} className="flex-1 py-2.5 sm:py-3 text-sm bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-medium">
                  Volver
                </button>
                <button onClick={entregarExamen} className="flex-1 py-2.5 sm:py-3 text-sm bg-yellow-500 hover:bg-yellow-400 text-white rounded-xl transition-all font-medium">
                  Finalizar igual
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}