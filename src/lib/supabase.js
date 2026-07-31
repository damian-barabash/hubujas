// Thin REST helpers for Supabase (no SDK) — pattern from earlier projects.
export const SUPABASE_URL = 'https://vbhweyzvdxxyikxnmhst.supabase.co'
// Publishable anon key — safe to ship in the client bundle.
export const SUPABASE_ANON = 'sb_publishable_BiJuAbNOjitA_mER3QCUAQ_AQ0vG6h7'

export async function restSelect(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
  })
  if (!r.ok) throw new Error(`rest ${r.status}`)
  return r.json()
}

export async function restInsert(table, row) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}`,
      'Content-Type': 'application/json', Prefer: 'return=minimal',
    },
    body: JSON.stringify(row),
  })
  if (!r.ok) throw new Error(`insert ${r.status}`)
}

export async function adminApi(action, payload = {}, token = null) {
  const r = await fetch(`${SUPABASE_URL}/functions/v1/admin-api`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}`,
      ...(token ? { 'x-admin-token': token } : {}),
    },
    body: JSON.stringify({ action, ...payload }),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data.error || `admin-api ${r.status}`)
  return data
}
