import React, { useEffect, useRef, useState } from 'react'

// Underground boot-screen: glitched HUBIJAS wordmark + progress. Sits on top of
// the page while the hero video buffers; leaves as soon as it can play
// (or after a hard 4s cap, so a slow network never traps the user).
const MIN_SHOW = 900
const HARD_CAP = 4000
const TICKER = 'PRODUKCJA WIDEO · EVENTY · KONFERANSJER · MARKETING · MOTORYZACJA · '

export default function Preloader() {
  const [pct, setPct] = useState(0)
  const [out, setOut] = useState(false)
  const [gone, setGone] = useState(false)
  const ready = useRef(false)

  useEffect(() => {
    document.documentElement.classList.add('hub-noscroll')
    const t0 = performance.now()

    const markReady = () => { ready.current = true }
    const video = document.querySelector('.background-video video')
    if (video) {
      if (video.readyState >= 3) markReady()
      else video.addEventListener('canplay', markReady, { once: true })
    }
    const cap = setTimeout(markReady, HARD_CAP)

    let raf
    let shown = 0
    const tick = (now) => {
      const el = now - t0
      // fake ramp that stalls at 90 until the hero can actually play
      const target = ready.current && el >= MIN_SHOW ? 100 : Math.min(90, (el / HARD_CAP) * 130)
      shown += (target - shown) * 0.12
      if (shown > 99.2) shown = 100
      setPct(Math.floor(shown))
      if (shown >= 100) { setOut(true); return }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(cap)
      if (video) video.removeEventListener('canplay', markReady)
      document.documentElement.classList.remove('hub-noscroll')
    }
  }, [])

  useEffect(() => {
    if (!out) return
    const t = setTimeout(() => {
      document.documentElement.classList.remove('hub-noscroll')
      setGone(true)
    }, 650)
    return () => clearTimeout(t)
  }, [out])

  if (gone) return null

  return (
    <div className={'hub-pre' + (out ? ' hub-pre-out' : '')} aria-hidden="true">
      <div className="hub-pre-noise" />
      <div className="hub-pre-scan" />
      <div className="hub-pre-frame" />
      <div className="hub-pre-center">
        <div className="hub-pre-logo" data-text="HUBIJAS">HUBIJAS</div>
        <div className="hub-pre-bar"><span style={{ width: pct + '%' }} /></div>
        <div className="hub-pre-meta">
          <span className="hub-pre-blink">● REC</span>
          <span>WCZYTYWANIE…</span>
          <span className="hub-pre-pct">{pct}%</span>
        </div>
      </div>
      <div className="hub-pre-ticker"><div>{TICKER.repeat(4)}</div></div>
    </div>
  )
}
