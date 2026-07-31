import React, { useCallback, useEffect, useRef, useState } from 'react'
import Home from './Home'
import { defaultContent } from '../lib/content'
import { adminApi } from '../lib/supabase'
import '../styles/admin.css'

const TOKEN_KEY = 'hubijas-admin-token'

// user-friendly title editing: the DB stores HTML with <br/>, the admin shows plain lines
const htmlToLines = (h) => (h || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim()
const linesToHtml = (s) => (s || '').trim().split('\n').map((l) => l.trim()).filter(Boolean).join('<br/>')

function pickFile(accept) {
  return new Promise((resolve) => {
    const inp = document.createElement('input')
    inp.type = 'file'
    inp.accept = accept
    inp.onchange = () => resolve(inp.files[0] || null)
    inp.click()
  })
}

async function uploadFile(file, folder, token) {
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { signedUrl, publicUrl } = await adminApi('upload.sign', { path }, token)
  const r = await fetch(signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream', 'x-upsert': 'true' },
    body: file,
  })
  if (!r.ok) throw new Error(`upload ${r.status}`)
  return publicUrl
}

export default function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [checked, setChecked] = useState(false)

  // the editor lives under the public domain — keep it out of search results
  useEffect(() => {
    const meta = document.querySelector('meta[name="robots"]')
    const prev = meta ? meta.content : null
    if (meta) meta.content = 'noindex, nofollow'
    const prevTitle = document.title
    document.title = 'HUBIJAS — panel'
    return () => {
      if (meta && prev !== null) meta.content = prev
      document.title = prevTitle
    }
  }, [])

  useEffect(() => {
    if (!token) { setChecked(true); return }
    adminApi('check', {}, token)
      .then(() => setChecked(true))
      .catch(() => { localStorage.removeItem(TOKEN_KEY); setToken(null); setChecked(true) })
  }, [])

  if (!checked) return null
  if (!token) return <Login onToken={(t) => { localStorage.setItem(TOKEN_KEY, t); setToken(t) }} />
  return <Editor token={token} onLogout={() => { localStorage.removeItem(TOKEN_KEY); setToken(null) }} />
}

function Login({ onToken }) {
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErr('')
    const fd = new FormData(e.target)
    try {
      const { token } = await adminApi('login', { login: fd.get('login'), password: fd.get('password') })
      onToken(token)
    } catch (ex) {
      setErr(ex.message || 'Błąd logowania')
    } finally { setBusy(false) }
  }
  return (
    <div className="hub-login">
      <form className="hub-login-card" onSubmit={submit}>
        <h1>HUBIJAS</h1>
        <label>Login</label>
        <input name="login" autoComplete="username" required />
        <label>Hasło</label>
        <input name="password" type="password" autoComplete="current-password" required />
        <button disabled={busy}>{busy ? '...' : 'ZALOGUJ'}</button>
        <div className="hub-login-err">{err}</div>
      </form>
    </div>
  )
}

function Editor({ token, onLogout }) {
  const [content, setContent] = useState(defaultContent)
  const [loaded, setLoaded] = useState(false)
  const [tab, setTab] = useState('strona')
  const [status, setStatus] = useState({ kind: 'saved', label: 'Zapisano' })
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toasts, setToasts] = useState([])
  const hostRef = useRef(null)

  const toast = useCallback((msg, err = false) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((ts) => [...ts, { id, msg, err }])
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 2600)
  }, [])

  const reloadCollections = useCallback(async () => {
    const [works, events] = await Promise.all([
      adminApi('works.list', {}, token),
      adminApi('events.list', {}, token),
    ])
    setContent((c) => ({ ...c, works, events }))
  }, [token])

  useEffect(() => {
    (async () => {
      try {
        const base = defaultContent()
        const { published, draft } = await adminApi('content.get', {}, token)
        Object.assign(base.text, published || {}, draft || {})
        const [works, events] = await Promise.all([
          adminApi('works.list', {}, token),
          adminApi('events.list', {}, token),
        ])
        if (works.length) base.works = works
        if (events.length) base.events = events
        setContent(base)
        setStatus(draft ? { kind: 'draft', label: 'Wersja robocza' } : { kind: 'saved', label: 'Zapisano' })
      } catch (e) {
        setStatus({ kind: 'dirty', label: 'Błąd ładowania' })
      } finally { setLoaded(true) }
    })()
  }, [token])

  const collect = useCallback(() => {
    const map = {}
    document.querySelectorAll('[data-edit]').forEach((el) => {
      const k = el.getAttribute('data-edit')
      if (k.startsWith('ev.')) return // event fields live in the Eventy tab
      if (!(k in map)) map[k] = el.innerHTML
    })
    return map
  }, [])

  const markDirty = useCallback(() => setStatus({ kind: 'dirty', label: 'Niezapisane' }), [])

  useEffect(() => {
    if (!loaded || tab !== 'strona') return
    document.body.classList.add('hub-edit')
    const root = hostRef.current
    const offs = []

    root.querySelectorAll('[data-edit]').forEach((el) => {
      if (el.getAttribute('data-edit')?.startsWith('ev.')) return
      el.setAttribute('contenteditable', 'true')
      el.setAttribute('spellcheck', 'false')
      const onInput = () => markDirty()
      const onPaste = (e) => {
        e.preventDefault()
        document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
      }
      const onClick = (e) => e.preventDefault()
      el.addEventListener('input', onInput)
      el.addEventListener('paste', onPaste)
      el.addEventListener('click', onClick)
      offs.push(() => {
        el.removeAttribute('contenteditable')
        el.removeEventListener('input', onInput)
        el.removeEventListener('paste', onPaste)
        el.removeEventListener('click', onClick)
      })
    })

    root.querySelectorAll('[data-edit-img]').forEach((el) => {
      const onClick = async (e) => {
        e.preventDefault(); e.stopPropagation()
        const file = await pickFile('image/*')
        if (!file) return
        setUploading(true)
        try {
          const url = await uploadFile(file, 'images', token)
          const key = el.getAttribute('data-edit-img')
          const text = collect()
          setContent((c) => ({ ...c, text: { ...c.text, ...text, [key]: url } }))
          markDirty()
          toast('Grafika podmieniona — pamiętaj o „Opublikuj”')
        } catch (ex) { toast('Błąd uploadu: ' + ex.message, true) } finally { setUploading(false) }
      }
      el.addEventListener('click', onClick)
      offs.push(() => el.removeEventListener('click', onClick))
    })

    root.querySelectorAll('[data-edit-href]').forEach((el) => {
      const onClick = (e) => {
        if (e.target.closest('[data-edit]')) return
        e.preventDefault(); e.stopPropagation()
        const key = el.getAttribute('data-edit-href')
        const cur = content.text[key] || ''
        const next = window.prompt('Adres linku:', cur)
        if (next !== null && next !== cur) {
          const text = collect()
          setContent((c) => ({ ...c, text: { ...c.text, ...text, [key]: next } }))
          markDirty()
        }
      }
      el.addEventListener('click', onClick)
      offs.push(() => el.removeEventListener('click', onClick))
    })

    root.querySelectorAll('[data-edit-video]').forEach((el) => {
      const btn = document.createElement('button')
      btn.className = 'hub-vid-btn'
      btn.textContent = 'ZMIEŃ WIDEO'
      btn.onclick = async (e) => {
        e.preventDefault(); e.stopPropagation()
        const file = await pickFile('video/webm,video/mp4')
        if (!file) return
        if (file.size > 45 * 1024 * 1024) { toast('Max 45 MB — skompresuj wideo (najlepiej WebM).', true); return }
        setUploading(true)
        try {
          const url = await uploadFile(file, 'videos', token)
          const key = el.getAttribute('data-edit-video')
          const text = collect()
          setContent((c) => ({ ...c, text: { ...c.text, ...text, [key]: url, [key.replace('video.', 'poster.')]: '' } }))
          markDirty()
          toast('Wideo podmienione — pamiętaj o „Opublikuj”')
        } catch (ex) { toast('Błąd uploadu: ' + ex.message, true) } finally { setUploading(false) }
      }
      el.appendChild(btn)
      offs.push(() => btn.remove())
    })

    return () => { document.body.classList.remove('hub-edit'); offs.forEach((f) => f()) }
  }, [loaded, tab, content, token, collect, markDirty, toast])

  useEffect(() => {
    const fb = document.querySelector('.form-block')
    const tb = document.querySelector('.text-block-11')
    if (fb) fb.classList.toggle('hub-show', showForm && tab === 'strona')
    if (tb) tb.classList.toggle('hub-show', showForm && tab === 'strona')
  }, [showForm, tab, content, loaded])

  async function save(mode) {
    const text = collect()
    const merged = { ...content.text, ...text }
    setContent((c) => ({ ...c, text: merged }))
    setStatus({ kind: 'dirty', label: 'Zapisywanie…' })
    try {
      await adminApi('content.save', { mode, content: merged }, token)
      setStatus(mode === 'publish'
        ? { kind: 'saved', label: 'Opublikowano' }
        : { kind: 'draft', label: 'Wersja robocza' })
      toast(mode === 'publish' ? 'Zmiany opublikowane na stronie' : 'Wersja robocza zapisana')
    } catch (e) {
      setStatus({ kind: 'dirty', label: 'Błąd zapisu' })
      toast('Błąd zapisu: ' + e.message, true)
    }
  }

  async function logout() {
    try { await adminApi('logout', {}, token) } catch {}
    onLogout()
  }

  return (
    <div ref={hostRef}>
      <Home content={content} editor />
      {tab === 'prace' && (
        <WorksPanel token={token} works={content.works} onChange={reloadCollections} setUploading={setUploading} toast={toast} />
      )}
      {tab === 'eventy' && (
        <EventsPanel token={token} events={content.events} onChange={reloadCollections} setUploading={setUploading} toast={toast} />
      )}
      {tab === 'wiadomosci' && <MessagesPanel token={token} />}
      <div className="hub-bar">
        <div className="tabs">
          {[['strona', 'Strona'], ['prace', 'Prace'], ['eventy', 'Eventy'], ['wiadomosci', 'Wiadomości']].map(([id, label]) => (
            <button key={id} className={'tab' + (tab === id ? ' on' : '')} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>
        {tab === 'strona' && (
          <button className="act ghost" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Ukryj formularz' : 'Pokaż formularz'}
          </button>
        )}
        {uploading && <span className="hub-uploading">Wysyłanie pliku…</span>}
        <span className={`hub-status ${status.kind}`}>{status.label}</span>
        <button className="act primary" onClick={() => save('publish')}>Opublikuj</button>
        <button className="act" onClick={() => save('draft')}>Wersja robocza</button>
        <button className="act ghost" onClick={logout}>Wyloguj</button>
      </div>
      <div className="hub-toasts">
        {toasts.map((t) => <div key={t.id} className={'hub-toast' + (t.err ? ' err' : '')}>{t.msg}</div>)}
      </div>
    </div>
  )
}

// ---------- Works tab ----------
function WorksPanel({ token, works, onChange, setUploading, toast }) {
  const [rows, setRows] = useState(works)
  useEffect(() => { setRows(works) }, [works])

  async function persist(row, note = 'Zapisano') {
    try {
      await adminApi('works.upsert', { row }, token)
      await onChange()
      toast(note)
    } catch (e) { toast('Błąd zapisu: ' + e.message, true) }
  }
  function edit(id, patch) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }
  async function move(idx, dir) {
    const next = [...rows]
    const j = idx + dir
    if (j < 0 || j >= next.length) return
    ;[next[idx], next[j]] = [next[j], next[idx]]
    setRows(next)
    await adminApi('works.reorder', { ids: next.map((r) => r.id) }, token)
    await onChange()
    toast('Kolejność zmieniona')
  }
  async function del(row) {
    if (!confirm('Usunąć pracę „' + htmlToLines(row.title_html).replace(/\n/g, ' — ') + '”?')) return
    await adminApi('works.delete', { id: row.id }, token)
    await onChange()
    toast('Praca usunięta')
  }
  async function add() {
    await adminApi('works.upsert', {
      row: { ord: rows.length + 1, title_html: 'Wykonawca<br/>Tytuł utworu', youtube: '', image: '', video: '' },
    }, token)
    await onChange()
    toast('Nowa praca dodana — uzupełnij dane')
  }
  async function upImage(row) {
    const f = await pickFile('image/*'); if (!f) return
    setUploading(true)
    try { await persist({ ...row, image: await uploadFile(f, 'works', token) }, 'Okładka wgrana') }
    catch (e) { toast('Błąd: ' + e.message, true) } finally { setUploading(false) }
  }
  async function upVideo(row) {
    const f = await pickFile('video/webm,video/mp4'); if (!f) return
    if (f.size > 45 * 1024 * 1024) { toast('Max 45 MB — skompresuj wideo (najlepiej WebM).', true); return }
    setUploading(true)
    try { await persist({ ...row, video: await uploadFile(f, 'works', token), poster: '' }, 'Wideo wgrane') }
    catch (e) { toast('Błąd: ' + e.message, true) } finally { setUploading(false) }
  }

  return (
    <div className="hub-panel">
      <h2>Prace — klipy</h2>
      <div className="hub-note">
        Każda praca to kafelek na stronie: okładka, wideo odtwarzane po najechaniu i link do YouTube.
        Tytuł wpisuj w dwóch liniach (Enter = nowa linia) — np. wykonawca, pod spodem tytuł utworu.
      </div>
      {rows.map((r, i) => (
        <div className="hub-row" key={r.id}>
          <div className="num">{i + 1}</div>
          <div className="media">
            <div className="m-cell">
              {r.image
                ? <img className="thumb" src={r.image} alt="" />
                : <div className="thumb empty">brak okładki</div>}
              <span className="m-tag">Okładka</span>
            </div>
            <div className="m-cell">
              {r.video
                ? <video className="thumb" src={r.video} muted loop autoPlay playsInline />
                : <div className="thumb empty">brak wideo</div>}
              <span className="m-tag">Wideo (hover)</span>
            </div>
          </div>
          <div className="fields">
            <div className="lbl">Tytuł — desktop</div>
            <textarea rows="2" value={htmlToLines(r.title_html)}
              placeholder={'Wykonawca\nTytuł utworu'}
              onChange={(e) => edit(r.id, { title_html: linesToHtml(e.target.value) })}
              onBlur={() => persist(rows[i])} />
            <div className="lbl">Tytuł — mobile (puste = jak desktop)</div>
            <textarea rows="2" value={htmlToLines(r.title_mobile_html)}
              placeholder={'Wykonawca\nTytuł utworu'}
              onChange={(e) => edit(r.id, { title_mobile_html: linesToHtml(e.target.value) })}
              onBlur={() => persist(rows[i])} />
            <div className="lbl">Link YouTube</div>
            <input type="text" value={r.youtube} placeholder="https://www.youtube.com/watch?v=…"
              onChange={(e) => edit(r.id, { youtube: e.target.value })}
              onBlur={() => persist(rows[i])} />
          </div>
          <div className="side">
            <button className="hub-mini" onClick={() => upImage(r)}>🖼 Zmień okładkę</button>
            <button className="hub-mini" onClick={() => upVideo(r)}>🎬 Zmień wideo</button>
            <button className="hub-mini arrow" onClick={() => move(i, -1)} title="Do góry">↑</button>
            <button className="hub-mini arrow" onClick={() => move(i, 1)} title="W dół">↓</button>
            <button className="hub-mini danger" onClick={() => del(r)}>✕ Usuń</button>
          </div>
        </div>
      ))}
      <button className="hub-add" onClick={add}>+ Dodaj pracę</button>
    </div>
  )
}

// ---------- Events tab ----------
function EventsPanel({ token, events, onChange, setUploading, toast }) {
  const [rows, setRows] = useState(events)
  useEffect(() => { setRows(events) }, [events])

  async function persist(row, note = 'Zapisano') {
    try {
      await adminApi('events.upsert', { row }, token)
      await onChange()
      toast(note)
    } catch (e) { toast('Błąd zapisu: ' + e.message, true) }
  }
  function edit(id, patch) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }
  async function move(idx, dir) {
    const next = [...rows]
    const j = idx + dir
    if (j < 0 || j >= next.length) return
    ;[next[idx], next[j]] = [next[j], next[idx]]
    setRows(next)
    await adminApi('events.reorder', { ids: next.map((r) => r.id) }, token)
    await onChange()
    toast('Kolejność zmieniona')
  }
  async function del(row) {
    if (!confirm('Usunąć event „' + row.title + '”?')) return
    await adminApi('events.delete', { id: row.id }, token)
    await onChange()
    toast('Event usunięty')
  }
  async function add() {
    await adminApi('events.upsert', { row: { ord: rows.length + 1, title: 'Nowy event', subtitle_html: '', images: [] } }, token)
    await onChange()
    toast('Nowy event dodany — uzupełnij dane')
  }
  async function addImage(row) {
    const f = await pickFile('image/*'); if (!f) return
    setUploading(true)
    try {
      const url = await uploadFile(f, 'events', token)
      await persist({ ...row, images: [...(row.images || []), url] }, 'Zdjęcie dodane')
    } catch (e) { toast('Błąd: ' + e.message, true) } finally { setUploading(false) }
  }
  async function rmImage(row, i) {
    await persist({ ...row, images: row.images.filter((_, x) => x !== i) }, 'Zdjęcie usunięte')
  }
  async function mvImage(row, i, dir) {
    const imgs = [...row.images]
    const j = i + dir
    if (j < 0 || j >= imgs.length) return
    ;[imgs[i], imgs[j]] = [imgs[j], imgs[i]]
    await persist({ ...row, images: imgs }, 'Kolejność zdjęć zmieniona')
  }

  return (
    <div className="hub-panel">
      <h2>Eventy — slidery</h2>
      <div className="hub-note">
        Każdy event to slider na dole strony — zdjęcia zmieniają się co 4 sekundy.
        Podtytuł wpisuj liniami (Enter = nowa linia), np. zakres usług.
      </div>
      {rows.map((r, i) => (
        <div className="hub-row" key={r.id}>
          <div className="num">{i + 1}</div>
          <div className="fields">
            <div className="lbl">Nazwa eventu</div>
            <input type="text" value={r.title}
              onChange={(e) => edit(r.id, { title: e.target.value })}
              onBlur={() => persist(rows[i])} />
            <div className="lbl">Podtytuł / zakres</div>
            <textarea rows="2" value={htmlToLines(r.subtitle_html)}
              placeholder={'produkcja\nkonferansjer'}
              onChange={(e) => edit(r.id, { subtitle_html: linesToHtml(e.target.value) })}
              onBlur={() => persist(rows[i])} />
            <div className="lbl">Zdjęcia slidera</div>
            <div className="hub-imgs">
              {(r.images || []).map((im, x) => (
                <div className="im" key={x}>
                  <img src={im} alt="" />
                  <button className="im-x" title="Usuń zdjęcie" onClick={() => rmImage(r, x)}>×</button>
                  <button className="im-mv l" title="W lewo" onClick={() => mvImage(r, x, -1)}>‹</button>
                  <button className="im-mv r" title="W prawo" onClick={() => mvImage(r, x, 1)}>›</button>
                </div>
              ))}
              <button className="add-im" onClick={() => addImage(r)}>+ zdjęcie</button>
            </div>
          </div>
          <div className="side">
            <button className="hub-mini arrow" onClick={() => move(i, -1)} title="Do góry">↑</button>
            <button className="hub-mini arrow" onClick={() => move(i, 1)} title="W dół">↓</button>
            <button className="hub-mini danger" onClick={() => del(r)}>✕ Usuń</button>
          </div>
        </div>
      ))}
      <button className="hub-add" onClick={add}>+ Dodaj event</button>
    </div>
  )
}

// ---------- Messages tab ----------
function MessagesPanel({ token }) {
  const [rows, setRows] = useState(null)
  useEffect(() => {
    adminApi('messages.list', {}, token).then(setRows).catch(() => setRows([]))
  }, [token])
  return (
    <div className="hub-panel">
      <h2>Wiadomości</h2>
      <div className="hub-note">Zgłoszenia z formularza kontaktowego na stronie. Kliknij adres, aby odpisać mailem.</div>
      {!rows && <div className="hub-empty">Ładowanie…</div>}
      {rows && !rows.length && <div className="hub-empty">Brak wiadomości.</div>}
      {rows && rows.map((m) => (
        <div className="hub-msg" key={m.id}>
          <div className="m-head">
            <span>{m.name || '—'}</span>
            <a href={`mailto:${m.email}`}>{m.email}</a>
            <span className="date">{new Date(m.created_at).toLocaleString('pl-PL')}</span>
          </div>
          <div className="m-body">{m.body}</div>
        </div>
      ))}
    </div>
  )
}
