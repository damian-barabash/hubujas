// Minimal ix2-style interaction engine driven by ixSpec.json
// (events + action lists distilled from the original site's interaction data).
// Elements are matched by the same data-w-id attributes as the original markup.
import spec from './ixSpec.json'

const EASINGS = {
  '': 'ease',
  ease: 'ease',
  easeIn: 'cubic-bezier(0.42,0,1,1)',
  easeOut: 'cubic-bezier(0,0,0.58,1)',
  easeInOut: 'cubic-bezier(0.42,0,0.58,1)',
  inOutExpo: 'cubic-bezier(1,0,0,1)',
  inOutQuart: 'cubic-bezier(0.77,0,0.175,1)',
  inOutCubic: 'cubic-bezier(0.645,0.045,0.355,1)',
  outExpo: 'cubic-bezier(0.19,1,0.22,1)',
  inExpo: 'cubic-bezier(0.95,0.05,0.795,0.035)',
}

const unit = (u) => (u === 'PX' ? 'px' : u === '%' ? '%' : (u || 'px').toLowerCase())

// Per-element accumulated transform state so move+scale coexist.
const tstate = new WeakMap()
function getT(el) {
  let t = tstate.get(el)
  if (!t) { t = { x: null, y: null, xu: 'px', yu: 'px', sx: null, sy: null }; tstate.set(el, t) }
  return t
}
function applyT(el) {
  const t = getT(el)
  let s = ''
  if (t.x !== null || t.y !== null) s += `translate3d(${t.x ?? 0}${t.xu},${t.y ?? 0}${t.yu},0)`
  if (t.sx !== null) s += ` scale3d(${t.sx},${t.sy ?? t.sx},1)`
  el.style.transform = s
  el.style.willChange = 'transform'
}

function resolveTargets(item, evEl, root) {
  if (item.wid) {
    const el = root.querySelector(`[data-w-id="${item.wid}"]`)
    return el ? [el] : []
  }
  if (item.tgt === true && !item.sel) return evEl ? [evEl] : []
  if (item.sel) {
    if (item.tgt === 'CHILDREN' && evEl) return [...evEl.querySelectorAll(item.sel)]
    if (item.tgt === 'SIBLINGS' && evEl && evEl.parentElement)
      return [...evEl.parentElement.querySelectorAll(item.sel)].filter((n) => n !== evEl)
    return [...root.querySelectorAll(item.sel)]
  }
  return []
}

function runItem(item, evEl, root, instant) {
  const els = resolveTargets(item, evEl, root)
  const dur = instant ? 0 : item.dur || 0
  const delay = instant ? 0 : item.delay || 0
  const ease = EASINGS[item.ease || ''] || 'ease'
  for (const el of els) {
    if (item.a === 'GENERAL_DISPLAY') {
      el.style.display = item.v
      continue
    }
    const props = []
    if (item.a === 'STYLE_OPACITY') props.push('opacity')
    if (item.a === 'TRANSFORM_MOVE' || item.a === 'TRANSFORM_SCALE') props.push('transform')
    el.style.transition = props.map((p) => `${p} ${dur}ms ${ease} ${delay}ms`).join(', ')
    if (item.a === 'STYLE_OPACITY') el.style.opacity = String(item.v)
    else if (item.a === 'TRANSFORM_MOVE') {
      const t = getT(el)
      if (item.x !== undefined) { t.x = item.x; t.xu = unit(item.xu) }
      if (item.y !== undefined) { t.y = item.y; t.yu = unit(item.yu) }
      applyT(el)
    } else if (item.a === 'TRANSFORM_SCALE') {
      const t = getT(el)
      t.sx = item.x ?? 1; t.sy = item.y ?? item.x ?? 1
      applyT(el)
    }
  }
  return dur + delay
}

function runGroups(groups, evEl, root, instant = false) {
  let acc = 0
  const timers = []
  for (const g of groups) {
    const run = () => { for (const item of g) runItem(item, evEl, root, instant) }
    if (acc === 0) run()
    else timers.push(setTimeout(run, acc))
    acc += instant ? 0 : Math.max(0, ...g.map((i) => (i.dur || 0) + (i.delay || 0)))
  }
  return timers
}

const lerp = (a, b, t) => a + (b - a) * t

function continuousApply(frames, p, root, evEl) {
  // frames: [{k, it}] sorted; p in 0..100
  for (let fi = 0; fi < frames.length; fi++) {
    const cur = frames[fi]
    const next = frames[fi + 1]
    if (next && p >= cur.k && p <= next.k) {
      const t = (p - cur.k) / Math.max(0.0001, next.k - cur.k)
      blendFrames(cur, next, t, root, evEl)
      return
    }
  }
  if (p <= frames[0].k) blendFrames(frames[0], frames[0], 0, root, evEl)
  else blendFrames(frames[frames.length - 1], frames[frames.length - 1], 0, root, evEl)
}

function blendFrames(f0, f1, t, root, evEl) {
  for (let i = 0; i < f0.it.length; i++) {
    const a0 = f0.it[i]
    const a1 = f1.it.find((x) => x.a === a0.a && x.wid === a0.wid && x.sel === a0.sel) || a0
    const els = resolveTargets(a0, evEl, root)
    for (const el of els) {
      el.style.transition = 'none'
      if (a0.a === 'STYLE_OPACITY') el.style.opacity = String(lerp(a0.v ?? 1, a1.v ?? 1, t))
      else if (a0.a === 'TRANSFORM_MOVE') {
        const ts = getT(el)
        if (a0.x !== undefined) { ts.x = lerp(a0.x, a1.x ?? a0.x, t); ts.xu = unit(a0.xu) }
        if (a0.y !== undefined) { ts.y = lerp(a0.y, a1.y ?? a0.y, t); ts.yu = unit(a0.yu) }
        applyT(el)
      } else if (a0.a === 'TRANSFORM_SCALE') {
        const ts = getT(el)
        ts.sx = lerp(a0.x ?? 1, a1.x ?? a0.x ?? 1, t)
        ts.sy = lerp(a0.y ?? 1, a1.y ?? a0.y ?? 1, t)
        applyT(el)
      }
    }
  }
}

const MQ_RANGES = { main: [992, 1e9], medium: [768, 991], small: [480, 767], tiny: [0, 479] }
function mqActive(mq) {
  if (!mq) return true
  const w = window.innerWidth
  return mq.some((k) => { const r = MQ_RANGES[k]; return r && w >= r[0] && w <= r[1] })
}

export function initIx(root = document) {
  const cleanups = []
  const clickCounts = new WeakMap()
  const hasCounter = new WeakMap()
  // wids that have BOTH 1st-click and 2nd-click actions alternate by parity;
  // a lone MOUSE_CLICK fires on every click (Webflow semantics)
  const secondClickWids = new Set(spec.events.filter((e) => e.type === 'MOUSE_SECOND_CLICK').map((e) => e.wid))

  const scrollLists = [] // {frames, evEl}
  for (const ev of spec.events) {
    if (!mqActive(ev.mq)) continue
    const list = spec.lists[ev.list] || {}
    // duplicate data-w-id are legal here: CMS-added rows reuse the original ids
    const evEls = ev.wid ? [...root.querySelectorAll(`[data-w-id="${ev.wid}"]`)] : []
    const evEl = evEls[0] || null

    if (ev.type === 'PAGE_START' || ev.type === 'PAGE_FINISH') {
      // PAGE_START runs instantly (initial states), PAGE_FINISH animates.
      if (list.g) runGroups(list.g, evEl, root, ev.type === 'PAGE_START')
      continue
    }
    if (ev.type === 'PAGE_SCROLL') {
      if (list.c) for (const frames of list.c) scrollLists.push({ frames, evEl })
      continue
    }
    if (!evEls.length) continue

    for (const el of evEls) {
      if (ev.type === 'MOUSE_OVER' || ev.type === 'MOUSE_OUT') {
        const h = () => list.g && runGroups(list.g, el, root)
        const name = ev.type === 'MOUSE_OVER' ? 'mouseenter' : 'mouseleave'
        el.addEventListener(name, h)
        cleanups.push(() => el.removeEventListener(name, h))
      } else if (ev.type === 'MOUSE_CLICK' || ev.type === 'MOUSE_SECOND_CLICK') {
        // one shared counter per element, incremented once per physical click
        if (!hasCounter.get(el)) {
          hasCounter.set(el, true)
          const inc = () => clickCounts.set(el, (clickCounts.get(el) || 0) + 1)
          el.addEventListener('click', inc)
          cleanups.push(() => el.removeEventListener('click', inc))
        }
        const paired = secondClickWids.has(ev.wid)
        const h = (e) => {
          e.preventDefault()
          const n = clickCounts.get(el) || 0
          const odd = n % 2 === 1
          const shouldRun = !paired
            || (ev.type === 'MOUSE_CLICK' && odd)
            || (ev.type === 'MOUSE_SECOND_CLICK' && !odd)
          if (shouldRun && list.g) {
            runGroups(list.g, el, root)
            // burger open/close toggles tap-ability of the (otherwise invisible) menu links
            if (ev.list === 'a-81' || ev.list === 'a-82') {
              const open = ev.list === 'a-81'
              root.querySelectorAll('.menu-mob, .menu-mob-1, .menu-mob-2')
                .forEach((m) => m.classList.toggle('hub-menu-open', open))
            }
            // fix over the original: the form-close action only fades the overlay out,
            // leaving an invisible fixed layer that swallows clicks — hide it for real
            if (ev.list === 'a-84') {
              setTimeout(() => {
                const f = root.querySelector('.form-block')
                if (f) f.style.display = 'none'
              }, 1050)
            }
          }
        }
        el.addEventListener('click', h)
        cleanups.push(() => el.removeEventListener('click', h))
      } else if (ev.type === 'SCROLL_INTO_VIEW') {
        const io = new IntersectionObserver((entries) => {
          for (const en of entries) {
            if (en.isIntersecting) {
              if (list.g) runGroups(list.g, en.target, root)
              io.disconnect()
            }
          }
        }, { threshold: 0.15 })
        io.observe(el)
        cleanups.push(() => io.disconnect())
      }
    }
  }

  // page-scroll rAF loop with light smoothing
  let target = 0
  let cur = -1
  let raf = 0
  const measure = () => {
    const doc = document.documentElement
    const max = Math.max(1, doc.scrollHeight - window.innerHeight)
    target = Math.min(100, Math.max(0, (window.scrollY / max) * 100))
  }
  const tick = () => {
    cur = cur < 0 ? target : cur + (target - cur) * 0.18
    if (Math.abs(cur - target) < 0.001) cur = target
    for (const { frames, evEl } of scrollLists) continuousApply(frames, cur, root, evEl)
    raf = requestAnimationFrame(tick)
  }
  measure()
  window.addEventListener('scroll', measure, { passive: true })
  window.addEventListener('resize', measure)
  raf = requestAnimationFrame(tick)
  cleanups.push(() => {
    cancelAnimationFrame(raf)
    window.removeEventListener('scroll', measure)
    window.removeEventListener('resize', measure)
  })

  // cursor follower (original custom embed logic)
  const follower = root.querySelector('.cursor-follower')
  if (follower && matchMedia('(hover:hover)').matches) {
    const size = 40
    let x = 0, y = 0, tx = 0, ty = 0
    const mm = (e) => { tx = e.clientX - size / 2; ty = e.clientY - size / 2 }
    document.addEventListener('mousemove', mm)
    let fraf = 0
    const anim = () => {
      x += (tx - x) * 0.1
      y += (ty - y) * 0.1
      follower.style.transform = `translate(${x}px, ${y}px)`
      fraf = requestAnimationFrame(anim)
    }
    anim()
    cleanups.push(() => { document.removeEventListener('mousemove', mm); cancelAnimationFrame(fraf) })
  }

  return () => cleanups.forEach((f) => f())
}
