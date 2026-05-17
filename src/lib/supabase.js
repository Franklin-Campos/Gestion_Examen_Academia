import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xvewshifcjjzgbyaasls.supabase.co'  // ← PEGA TU URL AQUÍ
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2ZXdzaGlmY2pqemdieWFhc2xzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4OTU5MDEsImV4cCI6MjA5NDQ3MTkwMX0.W2jr1phXZFiRQGPdwpUVu1876cJpY1MOzrpMoq20ing'       // ← PEGA TU ANON KEY AQUÍ

export const supabase = createClient(supabaseUrl, supabaseAnonKey)