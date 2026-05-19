import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { examen_realizado_id } = await req.json()

    if (!examen_realizado_id) {
      return new Response(
        JSON.stringify({ error: 'Falta examen_realizado_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Obtener respuestas del alumno
    const { data: respuestas, error: respError } = await supabaseAdmin
      .from('respuestas_alumno')
      .select('*, preguntas(respuesta_correcta)')
      .eq('examen_realizado_id', examen_realizado_id)

    if (respError) {
      return new Response(
        JSON.stringify({ error: respError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 2. Corregir cada respuesta
    let correctas = 0
    let incorrectas = 0
    let sinResponder = 0

    for (const respuesta of respuestas) {
      if (respuesta.respuesta_alumno === null) {
        sinResponder++
        await supabaseAdmin
          .from('respuestas_alumno')
          .update({ es_correcta: false })
          .eq('id', respuesta.id)
      } else if (respuesta.respuesta_alumno === respuesta.preguntas.respuesta_correcta) {
        correctas++
        await supabaseAdmin
          .from('respuestas_alumno')
          .update({ es_correcta: true })
          .eq('id', respuesta.id)
      } else {
        incorrectas++
        await supabaseAdmin
          .from('respuestas_alumno')
          .update({ es_correcta: false })
          .eq('id', respuesta.id)
      }
    }

    // 3. Calcular nota (0-20)
    const totalPreguntas = respuestas.length
    const nota = totalPreguntas > 0 ? (correctas / totalPreguntas) * 20 : 0
    const notaRedondeada = Math.round(nota * 100) / 100

    // 4. Determinar color (semáforo)
    let color = 'rojo'
    if (notaRedondeada >= 11 && notaRedondeada <= 15) color = 'ambar'
    if (notaRedondeada >= 16) color = 'verde'

    // 5. Actualizar examen realizado
    const { error: updateError } = await supabaseAdmin
      .from('examenes_realizados')
      .update({
        nota: notaRedondeada,
        color: color,
        correctas: correctas,
        incorrectas: incorrectas,
        sin_responder: sinResponder,
        estado: 'finalizado',
        finalizado_en: new Date().toISOString()
      })
      .eq('id', examen_realizado_id)

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 6. Devolver resultado
    return new Response(
      JSON.stringify({
        success: true,
        nota: notaRedondeada,
        color: color,
        correctas: correctas,
        incorrectas: incorrectas,
        sin_responder: sinResponder,
        total: totalPreguntas
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})