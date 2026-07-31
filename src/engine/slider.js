// Replica of the Webflow slider used on the events section:
// autoplay 4s, slide animation 500ms ease-in-out, infinite, arrows + dots.
export function initSliders(root = document) {
  const cleanups = []
  root.querySelectorAll('.w-slider').forEach((slider) => {
    const mask = slider.querySelector('.w-slider-mask')
    if (!mask) return
    const slides = [...mask.querySelectorAll('.w-slide')]
    if (!slides.length) return
    const nav = slider.querySelector('.w-slider-nav')
    const left = slider.querySelector('.w-slider-arrow-left')
    const right = slider.querySelector('.w-slider-arrow-right')
    const delay = parseInt(slider.dataset.delay || '4000', 10)
    const dur = parseInt(slider.dataset.duration || '500', 10)
    let idx = 0
    let timer = 0

    // dots
    if (nav) {
      nav.innerHTML = ''
      slides.forEach((_, i) => {
        const d = document.createElement('div')
        d.className = 'w-slider-dot' + (i === 0 ? ' w-active' : '')
        d.addEventListener('click', () => { go(i); restart() })
        nav.appendChild(d)
      })
    }

    slides.forEach((s) => { s.style.width = '100%' })

    function go(i) {
      idx = (i + slides.length) % slides.length
      slides.forEach((s, si) => {
        s.style.transition = `transform ${dur}ms ease-in-out`
        s.style.transform = `translateX(${-idx * 100}%)`
        s.setAttribute('aria-hidden', si === idx ? 'false' : 'true')
      })
      if (nav) [...nav.children].forEach((d, di) => d.classList.toggle('w-active', di === idx))
    }
    function restart() { clearInterval(timer); timer = setInterval(() => go(idx + 1), delay) }

    left && left.addEventListener('click', () => { go(idx - 1); restart() })
    right && right.addEventListener('click', () => { go(idx + 1); restart() })

    // swipe
    let sx = null
    mask.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX }, { passive: true })
    mask.addEventListener('touchend', (e) => {
      if (sx === null) return
      const dx = e.changedTouches[0].clientX - sx
      if (Math.abs(dx) > 40) { go(idx + (dx < 0 ? 1 : -1)); restart() }
      sx = null
    }, { passive: true })

    go(0)
    restart()
    cleanups.push(() => clearInterval(timer))
  })
  return () => cleanups.forEach((f) => f())
}
