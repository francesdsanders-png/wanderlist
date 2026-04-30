import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function generateCode(name) {
  const clean = name.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6)
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${clean}-${rand}`
}

export async function POST(request) {
  const { action, code, name } = await request.json()

  if (action === 'create') {
    const newCode = generateCode(name)
    const { data, error } = await supabase
      .from('households')
      .insert({ code: newCode, name })
      .select()
      .single()
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ household: data })
  }

  if (action === 'join') {
    const { data, error } = await supabase
      .from('households')
      .select()
      .eq('code', code.toUpperCase().trim())
      .single()
    if (error || !data) return Response.json({ error: 'Code not found' }, { status: 404 })
    return Response.json({ household: data })
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 })
}
