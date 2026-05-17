import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejar preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { dni, nombre } = await req.json()

    // Validar datos
    if (!dni || !nombre) {
      return new Response(
        JSON.stringify({ error: 'DNI y nombre son obligatorios' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Generar PIN de 6 dígitos
    const pin = Math.floor(100000 + Math.random() * 900000).toString()

    // Crear cliente de Supabase con permisos de admin (service_role)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Crear usuario en Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: `${dni}@sofia.com`,
      password: pin,
      email_confirm: true,
      user_metadata: {
        dni: dni,
        nombre_completo: nombre
      }
    })

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 2. Insertar en tabla alumnos
    const { error: dbError } = await supabaseAdmin
      .from('alumnos')
      .insert({
        id: authData.user.id,
        dni: dni,
        nombre_completo: nombre,
        pin: pin
      })

    if (dbError) {
      return new Response(
        JSON.stringify({ error: dbError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 3. Devolver éxito con el PIN
    return new Response(
      JSON.stringify({ 
        success: true, 
        pin: pin,
        mensaje: `Alumno ${nombre} registrado correctamente`
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