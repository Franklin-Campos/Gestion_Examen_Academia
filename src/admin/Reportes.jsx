import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Reportes() {
  const [examenes, setExamenes] = useState([])
  const [examenSeleccionado, setExamenSeleccionado] = useState('')
  const [resultados, setResultados] = useState([])
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    cargarExamenes()
  }, [])

  const cargarExamenes = async () => {
    const { data } = await supabase
      .from('examenes')
      .select('id, titulo, fecha_programada')
      .order('fecha_programada', { ascending: false })
    if (data) setExamenes(data)
  }

  const cargarResultados = async (examenId) => {
    setExamenSeleccionado(examenId)
    if (!examenId) {
      setResultados([])
      return
    }

    setCargando(true)

    const { data: resultadosData, error } = await supabase
      .from('alumnos')
      .select(`
        dni,
        nombre_completo,
        examenes_realizados!inner(
          nota, color, correctas, incorrectas, sin_responder, estado
        )
      `)
      .eq('examenes_realizados.examen_id', parseInt(examenId))
      .order('nombre_completo')

    if (error) {
      console.error('Error:', error)
      setResultados([])
      setCargando(false)
      return
    }

    const { data: todosAlumnos } = await supabase
      .from('alumnos')
      .select('dni, nombre_completo')
      .order('nombre_completo')

    const resultadosCompletos = todosAlumnos.map(alumno => {
      const realizado = resultadosData?.find(r => r.dni === alumno.dni)
      if (realizado && realizado.examenes_realizados && realizado.examenes_realizados.length > 0) {
        const r = realizado.examenes_realizados[0]
        return {
          dni: alumno.dni,
          nombre: alumno.nombre_completo,
          nota: r.nota ?? '-',
          color: r.color ?? 'sin_nota',
          correctas: r.correctas ?? '-',
          incorrectas: r.incorrectas ?? '-',
          sin_responder: r.sin_responder ?? '-',
          estado: r.nota === 0 && r.sin_responder === 20 ? 'No se presentó' : 'Finalizado'
        }
      }
      return {
        dni: alumno.dni,
        nombre: alumno.nombre_completo,
        nota: '-',
        color: 'sin_nota',
        correctas: '-',
        incorrectas: '-',
        sin_responder: '-',
        estado: 'No se presentó'
      }
    })

    setResultados(resultadosCompletos)
    setCargando(false)
  }

  const promedio = () => {
    const conNota = resultados.filter(r => typeof r.nota === 'number')
    if (conNota.length === 0) return '-'
    const suma = conNota.reduce((acc, r) => acc + r.nota, 0)
    return (suma / conNota.length).toFixed(1)
  }

  const exportarCSV = () => {
    const examen = examenes.find(e => e.id === parseInt(examenSeleccionado))
    const titulo = examen?.titulo || 'examen'
    const fecha = examen?.fecha_programada || ''

    let csv = `DNI,Nombre,Nota,Correctas,Incorrectas,Sin responder,Estado\n`
    resultados.forEach(r => {
      csv += `${r.dni},"${r.nombre}",${r.nota},${r.correctas},${r.incorrectas},${r.sin_responder},"${r.estado}"\n`
    })

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${titulo}_${fecha}.csv`
    a.click()
  }

  const examenActual = examenes.find(e => e.id === parseInt(examenSeleccionado))

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-8"
      style={{
        background: `radial-gradient(ellipse at 20% 50%, #c026d3 0%, transparent 50%), radial-gradient(ellipse at 80% 30%, #2563eb 0%, transparent 55%), radial-gradient(ellipse at 50% 80%, #7c3aed 0%, transparent 60%), #1e1b4b`
      }}
    >
      <div className="max-w-5xl mx-auto">
        
        {/* Encabezado */}
        <div className="flex items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
          <a href="/admin/dashboard" className="p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <img src="/logo_SOFIA.png" alt="Academia Sofia" className="h-8 sm:h-12 w-auto" />
          <h1 className="text-lg sm:text-2xl font-bold text-white">Reportes de Notas</h1>
        </div>

        {/* Filtro por examen */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-white/10 mb-4 sm:mb-6">
          <label className="block text-xs sm:text-sm font-medium text-violet-100 mb-2 sm:mb-3">Filtrar por Examen</label>
          <select
            value={examenSeleccionado}
            onChange={(e) => cargarResultados(e.target.value)}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm bg-white/10 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-400"
          >
            <option value="">-- Seleccionar examen --</option>
            {examenes.map(examen => (
              <option key={examen.id} value={examen.id}>
                {examen.titulo} - {examen.fecha_programada}
              </option>
            ))}
          </select>
        </div>

        {/* Tabla de resultados */}
        {examenSeleccionado && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-white/10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {examenActual?.titulo} - {examenActual?.fecha_programada}
              </h2>
              <button
                onClick={exportarCSV}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-xl transition-all flex items-center gap-2"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar CSV
              </button>
            </div>

            {cargando ? (
              <div className="text-center py-6 sm:py-8">
                <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-white text-xs sm:text-sm">Cargando resultados...</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full text-xs sm:text-sm min-w-[500px]">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-2 sm:py-3 px-2 text-violet-300 font-medium">DNI</th>
                        <th className="text-left py-2 sm:py-3 px-2 text-violet-300 font-medium">Nombre</th>
                        <th className="text-center py-2 sm:py-3 px-1 sm:px-2 text-violet-300 font-medium">Nota</th>
                        <th className="text-center py-2 sm:py-3 px-1 sm:px-2 text-violet-300 font-medium">✅</th>
                        <th className="text-center py-2 sm:py-3 px-1 sm:px-2 text-violet-300 font-medium">❌</th>
                        <th className="text-center py-2 sm:py-3 px-1 sm:px-2 text-violet-300 font-medium">⚪</th>
                        <th className="text-center py-2 sm:py-3 px-2 text-violet-300 font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultados.map((r, i) => (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-2 sm:py-3 px-2 text-white whitespace-nowrap">{r.dni}</td>
                          <td className="py-2 sm:py-3 px-2 text-white truncate max-w-[100px] sm:max-w-none">{r.nombre}</td>
                          <td className="py-2 sm:py-3 px-1 sm:px-2 text-center">
                            <span className={`inline-flex w-6 h-6 sm:w-8 sm:h-8 rounded-full items-center justify-center text-[10px] sm:text-xs font-bold ${
                              r.color === 'verde' ? 'bg-green-500/30 text-green-300' :
                              r.color === 'ambar' ? 'bg-yellow-500/30 text-yellow-300' :
                              r.color === 'rojo' ? 'bg-red-500/30 text-red-300' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {r.nota}
                            </span>
                          </td>
                          <td className="py-2 sm:py-3 px-1 sm:px-2 text-center text-green-300">{r.correctas}</td>
                          <td className="py-2 sm:py-3 px-1 sm:px-2 text-center text-red-300">{r.incorrectas}</td>
                          <td className="py-2 sm:py-3 px-1 sm:px-2 text-center text-gray-400">{r.sin_responder}</td>
                          <td className="py-2 sm:py-3 px-2 text-center">
                            <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap ${
                              r.estado === 'Finalizado' ? 'bg-green-500/20 text-green-300' :
                              'bg-red-500/20 text-red-300'
                            }`}>
                              {r.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-white/5 font-medium">
                        <td className="py-2 sm:py-3 px-2" colSpan={2}>
                          <span className="text-violet-300 text-xs sm:text-sm">PROMEDIO</span>
                        </td>
                        <td className="py-2 sm:py-3 px-2 text-center text-white font-bold text-xs sm:text-sm">{promedio()}</td>
                        <td className="py-2 sm:py-3 px-2" colSpan={4}></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Estadísticas rápidas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/10">
                  <div className="text-center">
                    <p className="text-xl sm:text-2xl font-bold text-green-300">
                      {resultados.filter(r => r.color === 'verde').length}
                    </p>
                    <p className="text-violet-300/60 text-[10px] sm:text-xs">🟢 Excelente</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl sm:text-2xl font-bold text-yellow-300">
                      {resultados.filter(r => r.color === 'ambar').length}
                    </p>
                    <p className="text-violet-300/60 text-[10px] sm:text-xs">🟡 Puede mejorar</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl sm:text-2xl font-bold text-red-300">
                      {resultados.filter(r => r.color === 'rojo').length}
                    </p>
                    <p className="text-violet-300/60 text-[10px] sm:text-xs">🔴 Desaprobado</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl sm:text-2xl font-bold text-gray-300">
                      {resultados.filter(r => r.estado === 'No se presentó').length}
                    </p>
                    <p className="text-violet-300/60 text-[10px] sm:text-xs">⚪ No presentados</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  )
}