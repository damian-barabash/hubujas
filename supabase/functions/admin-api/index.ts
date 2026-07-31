// HUBIJAS admin API: login (bcrypt via verify_admin RPC), content save,
// works/events CRUD, messages list, storage signed uploads.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const SB_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const db = createClient(SB_URL, SERVICE, { auth: { persistSession: false } })

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-admin-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

async function requireAdmin(req: Request): Promise<string | null> {
  const token = req.headers.get('x-admin-token')
  if (!token) return null
  const { data } = await db.from('admin_sessions').select('admin_id, expires_at').eq('token', token).maybeSingle()
  if (!data) return null
  if (new Date(data.expires_at) < new Date()) return null
  return data.admin_id
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)
  let body: any
  try { body = await req.json() } catch { return json({ error: 'bad json' }, 400) }
  const action = String(body.action || '')

  try {
    if (action === 'login') {
      const { data: adminId, error } = await db.rpc('verify_admin', {
        p_login: String(body.login || ''), p_password: String(body.password || ''),
      })
      if (error || !adminId) return json({ error: 'Nieprawidłowy login lub hasło' }, 401)
      const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '')
      await db.from('admin_sessions').insert({ token, admin_id: adminId })
      return json({ token })
    }

    const adminId = await requireAdmin(req)
    if (!adminId) return json({ error: 'unauthorized' }, 401)

    switch (action) {
      case 'check':
        return json({ ok: true })
      case 'logout': {
        await db.from('admin_sessions').delete().eq('token', req.headers.get('x-admin-token')!)
        return json({ ok: true })
      }
      case 'content.get': {
        const { data } = await db.from('site_content').select('published, draft').eq('id', 'index').maybeSingle()
        return json(data || { published: {}, draft: null })
      }
      case 'content.save': {
        const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
        if (body.mode === 'publish') { patch.published = body.content || {}; patch.draft = null }
        else patch.draft = body.content || {}
        const { error } = await db.from('site_content').update(patch).eq('id', 'index')
        if (error) return json({ error: error.message }, 500)
        return json({ ok: true })
      }
      case 'works.list': {
        const { data } = await db.from('works').select('*').order('ord')
        return json(data || [])
      }
      case 'works.upsert': {
        const row = body.row || {}
        delete row.created_at
        if (!row.id) delete row.id
        const { data, error } = await db.from('works').upsert(row).select().single()
        if (error) return json({ error: error.message }, 500)
        return json(data)
      }
      case 'works.delete': {
        const { error } = await db.from('works').delete().eq('id', body.id)
        if (error) return json({ error: error.message }, 500)
        return json({ ok: true })
      }
      case 'works.reorder': {
        const ids: string[] = body.ids || []
        for (let i = 0; i < ids.length; i++) await db.from('works').update({ ord: i + 1 }).eq('id', ids[i])
        return json({ ok: true })
      }
      case 'events.list': {
        const { data } = await db.from('events').select('*').order('ord')
        return json(data || [])
      }
      case 'events.upsert': {
        const row = body.row || {}
        delete row.created_at
        if (!row.id) delete row.id
        const { data, error } = await db.from('events').upsert(row).select().single()
        if (error) return json({ error: error.message }, 500)
        return json(data)
      }
      case 'events.delete': {
        const { error } = await db.from('events').delete().eq('id', body.id)
        if (error) return json({ error: error.message }, 500)
        return json({ ok: true })
      }
      case 'events.reorder': {
        const ids: string[] = body.ids || []
        for (let i = 0; i < ids.length; i++) await db.from('events').update({ ord: i + 1 }).eq('id', ids[i])
        return json({ ok: true })
      }
      case 'messages.list': {
        const { data } = await db.from('messages').select('*').order('created_at', { ascending: false }).limit(200)
        return json(data || [])
      }
      case 'upload.sign': {
        const path = String(body.path || '').replace(/[^\w./-]/g, '_')
        if (!path || path.includes('..')) return json({ error: 'bad path' }, 400)
        const { data, error } = await db.storage.from('media').createSignedUploadUrl(path, { upsert: true })
        if (error) return json({ error: error.message }, 500)
        const publicUrl = `${SB_URL}/storage/v1/object/public/media/${path}`
        return json({ signedUrl: data.signedUrl, token: data.token, path, publicUrl })
      }
      default:
        return json({ error: 'unknown action' }, 400)
    }
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500)
  }
})
