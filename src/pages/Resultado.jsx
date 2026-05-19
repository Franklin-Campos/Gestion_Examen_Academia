import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Resultado() {
  const [searchParams] = useSearchParams()
  const examenRealizadoId = searchParams.get('examen_realizado_id')

  const [resultado, setResultado] = useState(null)
  const [preguntas, setPreguntas] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (examenRealizadoId) corregirYMostrar()
  }, [examenRealizadoId])

  const corregirYMostrar = async () => {
    // Llamar a la Edge Function para corregir
    const { data: correccionData } = await supabase.functions.invoke('corregir-examen', {
      body: { examen_realizado_id: parseInt(examenRealizadoId) }
    })

    if (correccionData) {
      setResultado(correccionData)

      // Obtener detalle de respuestas con preguntas
      const { data: respuestasData } = await supabase
        .from('respuestas_alumno')
        .select(`
          *,
          preguntas(id, numero, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta)
        `)
        .eq('examen_realizado_id', examenRealizadoId)
        .order('id', { ascending: true })

      if (respuestasData) setPreguntas(respuestasData)
    }

    setCargando(false)
  }

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1e1b4b' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-white">Corrigiendo examen...</p>
        </div>
      </div>
    )
  }

  if (!resultado) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1e1b4b' }}>
        <p className="text-white">Error al cargar resultados</p>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen p-4 md:p-8"
      style={{
        background: `radial-gradient(ellipse at 20% 50%, #c026d3 0%, transparent 50%), radial-gradient(ellipse at 80% 30%, #2563eb 0%, transparent 55%), radial-gradient(ellipse at 50% 80%, #7c3aed 0%, transparent 60%), #1e1b4b`
      }}
    >
      <div className="max-w-2xl mx-auto">
        
        {/* Resultado principal */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10 mb-6 text-center">
          <h1 className="text-2xl font-bold text-white mb-6">Resultado del Examen</h1>
          
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${
            resultado.color === 'verde' ? 'bg-green-500/20' :
            resultado.color === 'ambar' ? 'bg-yellow-500/20' :
            'bg-red-500/20'
          }`}>
            <span className="text-4xl font-bold text-white">{resultado.nota}</span>
          </div>
          
          <p className="text-3xl font-bold text-white mb-2">{resultado.nota} / 20</p>
          
          <div className={`inline-block px-6 py-2 rounded-full font-bold text-lg ${
            resultado.color === 'verde' ? 'bg-green-600 text-white' :
            resultado.color === 'ambar' ? 'bg-yellow-500 text-white' :
            'bg-red-600 text-white'
          }`}>
            {resultado.color === 'verde' ? '🟢 APROBADO - Excelente' :
             resultado.color === 'ambar' ? '🟡 APROBADO - Puede mejorar' :
             '🔴 DESAPROBADO - Necesita reforzar'}
          </div>

          <div className="flex justify-center gap-8 mt-6 text-sm">
            <div className="text-center">
              <p className="text-green-300 text-2xl font-bold">{resultado.correctas}</p>
              <p className="text-violet-300">✅ Correctas</p>
            </div>
            <div className="text-center">
              <p className="text-red-300 text-2xl font-bold">{resultado.incorrectas}</p>
              <p className="text-violet-300">❌ Incorrectas</p>
            </div>
            <div className="text-center">
              <p className="text-gray-300 text-2xl font-bold">{resultado.sin_responder}</p>
              <p className="text-violet-300">⚪ Sin responder</p>
            </div>
          </div>
        </div>

        {/* Detalle por pregunta */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/10">
          <h2 className="text-xl font-bold text-white mb-6">Detalle por Pregunta</h2>
          
          <div className="space-y-3">
            {preguntas.map((item, index) => {
              const estado = item.respuesta_alumno === null 
                ? 'sin_responder' 
                : item.es_correcta 
                ? 'correcta' 
                : 'incorrecta'

              return (
                <div key={item.id} className={`rounded-xl p-4 border ${
                  estado === 'correcta' ? 'bg-green-500/5 border-green-500/20' :
                  estado === 'incorrecta' ? 'bg-red-500/5 border-red-500/20' :
                  'bg-gray-500/5 border-gray-500/20'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      estado === 'correcta' ? 'bg-green-500 text-white' :
                      estado === 'incorrecta' ? 'bg-red-500 text-white' :
                      'bg-gray-500 text-white'
                    }`}>
                      {estado === 'correcta' ? '✅' : estado === 'incorrecta' ? '❌' : '⚪'}
                    </span>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">
                        {item.preguntas?.numero}. {item.preguntas?.enunciado}
                      </p>
                      <div className="mt-2 text-sm space-y-1">
                        {['a','b','c','d'].map(letra => (
                          <p key={letra} className={`${
                            item.preguntas?.respuesta_correcta === letra
                              ? 'text-green-300 font-semibold'
                              : item.respuesta_alumno === letra && estado === 'incorrecta'
                              ? 'text-red-300 line-through'
                              : 'text-violet-300/60'
                          }`}>
                            {letra.toUpperCase()}) {item.preguntas?.[`opcion_${letra}`]}
                            {item.preguntas?.respuesta_correcta === letra && ' ✓'}
                            {item.respuesta_alumno === letra && estado === 'incorrecta' && ' ← Tu respuesta'}
                          </p>
                        ))}
                      </div>
                      {estado === 'sin_responder' && (
                        <p className="text-gray-400 text-xs mt-1">No respondida</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="text-center mt-6">
          <a
            href="/home"
            className="inline-block px-8 py-3 bg-violet-500 hover:bg-violet-400 text-white font-semibold rounded-xl transition-all shadow-lg"
          >
            Volver al Inicio
          </a>
        </div>

      </div>
    </div>
  )
}