import React, { useEffect, useRef, useState } from 'react'
import { JA_IMAGES } from '../lib/defaults'
import { restInsert } from '../lib/supabase'
import { initIx } from '../engine/ix'
import { initSliders } from '../engine/slider'

// data-w-id pools from the original markup — hover/parallax bindings cycle
// through them so CMS-added rows get identical interactions.
const WORK_WIDS = [
  'aea65ba3-35f3-8320-8ceb-f7d54091bd63', '713aae2a-24ce-1d8e-f898-133479cc71bc',
  '4b988dd0-d1f0-0c50-3af8-2b14144ffc47', '4b988dd0-d1f0-0c50-3af8-2b14144ffc50',
  'b001315c-1f24-0e65-6275-6638e1cc40af', 'b001315c-1f24-0e65-6275-6638e1cc40b8',
  '09a6d8d3-77be-1e0a-2ace-5895aeaa95fa', '09a6d8d3-77be-1e0a-2ace-5895aeaa9603',
  '034590c7-800a-7192-0a36-358d1eba4575', '034590c7-800a-7192-0a36-358d1eba457e',
]
const STACK_IDS = [
  'w-node-_238e5ee6-8b6f-da12-8b63-617784d9eae4-70d2b324',
  'w-node-_4b988dd0-d1f0-0c50-3af8-2b14144ffc44-70d2b324',
  'w-node-b001315c-1f24-0e65-6275-6638e1cc40ac-70d2b324',
  'w-node-_09a6d8d3-77be-1e0a-2ace-5895aeaa95f7-70d2b324',
  'w-node-_034590c7-800a-7192-0a36-358d1eba4572-70d2b324',
]
const EVENT_STACK_IDS = [
  'w-node-eed0edba-065f-8a69-49ff-718986582472-70d2b324',
  'w-node-_78a9e854-56f5-577b-beee-63e576d02c02-70d2b324',
]
const JA_WIDS = [
  '44c52484-16e0-e060-3718-83cb11be32f8', '5af40a95-bf9f-545f-9646-d234941286a9',
  '479df75e-847b-0ba5-d87f-d665d7ac3882', null,
  '0adb0eca-97df-87c0-3d54-d4afc7cedc43', 'b1304f13-c42d-e334-be0c-e5c7ad0e2839',
  '7ae90929-fba3-871c-41b0-8252e67a3d84',
]

export function BgVideo({ video, poster, className, children, editKey, ...rest }) {
  const isMp4 = /\.mp4($|\?)/.test(video || '')
  return (
    <div
      className={`${className} w-background-video w-background-video-atom`}
      data-autoplay="true" data-loop="true" data-wf-ignore="true"
      {...(editKey ? { 'data-edit-video': editKey } : {})} {...rest}
    >
      <video
        autoPlay loop muted playsInline data-wf-ignore="true" data-object-fit="cover"
        key={video}
        style={poster ? { backgroundImage: `url("${poster}")` } : undefined}
      >
        {!isMp4 && <source src={video} type="video/webm" data-wf-ignore="true" />}
        {!isMp4 && <source src={video.replace(/\.webm$/, '.mp4')} type="video/mp4" data-wf-ignore="true" />}
        {isMp4 && <source src={video} type="video/mp4" data-wf-ignore="true" />}
      </video>
      {children}
    </div>
  )
}

function T({ k, content, tag: Tag = 'div', className, ...rest }) {
  return (
    <Tag className={className} data-edit={k} {...rest}
      dangerouslySetInnerHTML={{ __html: content.text[k] ?? '' }} />
  )
}

function EventSlider({ ev }) {
  return (
    <div data-delay="4000" data-animation="slide" className="slider w-slider" data-autoplay="true"
      data-easing="ease-in-out" data-hide-arrows="false" data-disable-swipe="false"
      data-autoplay-limit="0" data-nav-spacing="3" data-duration="500" data-infinite="true">
      <div className="text-block-9"><strong data-edit={`ev.${ev.id}.title`}>{ev.title}</strong></div>
      <div className="text-block-10" data-edit={`ev.${ev.id}.subtitle`}
        dangerouslySetInnerHTML={{ __html: ev.subtitle_html || '' }} />
      <div className="w-slider-mask">
        {(ev.images || []).map((im, i) => (
          <div className="w-slide" key={i}>
            <img src={im} loading="lazy" sizes="(max-width: 953px) 100vw, 953px" alt="" className="image-12" />
          </div>
        ))}
      </div>
      <div className="w-slider-arrow-left"><div className="w-icon-slider-left" /></div>
      <div className="w-slider-arrow-right"><div className="w-icon-slider-right" /></div>
      <div className="slide-nav w-slider-nav w-slider-nav-invert w-round" />
    </div>
  )
}

export default function Home({ content, editor = false }) {
  const rootRef = useRef(null)
  const [formState, setFormState] = useState('idle')

  useEffect(() => {
    if (editor) return
    const offIx = initIx(document)
    const offSl = initSliders(document)
    return () => { offIx(); offSl() }
  }, [editor, content])

  async function submitForm(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    const name = fd.get('name') || ''
    const email = fd.get('email-2') || ''
    const body = fd.get('email') || ''
    if (!email || !body) return
    setFormState('sending')
    try {
      await restInsert('messages', { name, email, body })
      setFormState('done')
    } catch {
      setFormState('error')
    }
  }

  const works = content.works
  const events = content.events
  const t = content.text

  // desktop stacks: chunk works into pairs
  const pairs = []
  for (let i = 0; i < works.length; i += 2) pairs.push(works.slice(i, i + 2))
  const evPairs = []
  for (let i = 0; i < events.length; i += 2) evPairs.push(events.slice(i, i + 2))

  return (
    <div ref={rootRef}>
      <div data-collapse="all" data-animation="default" data-duration="400" data-easing="ease"
        data-easing2="ease" role="banner" className="navbar w-nav" />
      <div className="cursor-follower" />
      <div className="hero">
        <section className="section-3">
          <a href="#" className="link-3" data-edit="nav.portfolio"
            dangerouslySetInnerHTML={{ __html: t['nav.portfolio'] }} />
          <a data-w-id="a20f6f1f-ed3a-ddc0-831f-9f1c1ca4928d" href="#" className="link-3"
            data-edit="nav.cars" dangerouslySetInnerHTML={{ __html: t['nav.cars'] }} />
          <a data-w-id="e4852ea0-2926-3378-13ca-f075509fff3e" href="#" className="link-3"
            data-edit="nav.kontakt" dangerouslySetInnerHTML={{ __html: t['nav.kontakt'] }} />
          <div className="menu-mobi">
            <a data-w-id="1b822552-2230-ac70-d9e8-cd1c99c5c678" href="#" className="menu-mob"
              data-edit="menu.kontakt" dangerouslySetInnerHTML={{ __html: t['menu.kontakt'] }} />
            <a data-w-id="6f30fdbe-73b3-afa9-f13d-335f8b0f7da1" href="#" className="menu-mob-1"
              data-edit="menu.cars" dangerouslySetInnerHTML={{ __html: t['menu.cars'] }} />
            <a href="#" className="menu-mob-2" data-edit="menu.portfolio"
              dangerouslySetInnerHTML={{ __html: t['menu.portfolio'] }} />
            <img src="/assets/icons8-menu-500.png" loading="lazy"
              data-w-id="d29affda-8db0-f190-56d0-ecde1cc26d7c" alt="" className="image-10" />
          </div>
          <div className="margin-logo" />
          <div data-w-id="1b822552-2230-ac70-d9e8-cd1c99c5c67f" className="icons-header">
            <a href={t['href.instagram']} data-edit-href="href.instagram" target="_blank" rel="noreferrer" className="icons w-inline-block">
              <img src="/assets/icons8-instagram-logo-100.png" loading="lazy" width="30" height="30" alt="" className="iconsimg" />
            </a>
            <a href={t['href.youtube']} data-edit-href="href.youtube" target="_blank" rel="noreferrer" className="icons w-inline-block">
              <img src="/assets/icons8-youtube-logo-100.png" loading="lazy" width="30" height="30" alt="" className="iconsimg" />
            </a>
            <a href={t['href.linkedin']} data-edit-href="href.linkedin" target="_blank" rel="noreferrer" className="icons w-inline-block">
              <img src="/assets/icons8-linked-in.svg" loading="lazy" width="30" height="30" alt="" className="iconsimg" />
            </a>
            <a href={t['href.tiktok']} data-edit-href="href.tiktok" target="_blank" rel="noreferrer" className="icons w-inline-block">
              <img src="/assets/icons8-tiktok.svg" loading="lazy" width="30" height="30" alt="" className="iconsimg" />
            </a>
          </div>
        </section>
        <T k="toast.notready" content={content} className="text-block-11" />
        <div className="form-block w-form">
          <img src="/assets/icons8-cancel.svg" loading="lazy"
            data-w-id="6e27fe43-2439-a6dd-6c47-75cadccb1142" alt="" className="image-13" />
          {formState !== 'done' ? (
            <form id="wf-form-WIADOMO" name="wf-form-WIADOMO" data-name="WIADOMOŚĆ" className="form-2"
              onSubmit={submitForm}>
              <div className="hub-form-title" data-edit="form.title"
                dangerouslySetInnerHTML={{ __html: t['form.title'] }} />
              <label htmlFor="name" className="field-label" data-edit="form.label.name"
                dangerouslySetInnerHTML={{ __html: t['form.label.name'] }} />
              <input className="text-field-2 w-input" maxLength="256" name="name" type="text" id="name" autoComplete="name" />
              <label htmlFor="email-2" className="field-label-2" data-edit="form.label.mail"
                dangerouslySetInnerHTML={{ __html: t['form.label.mail'] }} />
              <input className="text-field-3 w-input" maxLength="256" name="email-2" type="email" id="email-2" autoComplete="email" required />
              <label htmlFor="email" className="field-label-3" data-edit="form.label.msg"
                dangerouslySetInnerHTML={{ __html: t['form.label.msg'] }} />
              <textarea className="text-field w-input" maxLength="2000" name="email" id="email" rows="4" required />
              <input type="submit" className="submit-button w-button" disabled={formState === 'sending'}
                value={formState === 'sending' ? 'WYSYŁANIE…' : (t['form.submit'] || 'WYŚLIJ').replace(/<[^>]+>/g, '')} />
              <div className="hub-form-err">{formState === 'error' ? 'Nie udało się wysłać — spróbuj jeszcze raz.' : ''}</div>
            </form>
          ) : (
            <div className="w-form-done" style={{ display: 'block' }}>
              <div className="hub-form-done-mark">✓</div>
              <div data-edit="form.done" dangerouslySetInnerHTML={{ __html: t['form.done'] }} />
            </div>
          )}
        </div>
        <div data-w-id="5c194141-5666-57a6-f713-008e38ec0309" className="logo"
          data-edit="hero.logo" dangerouslySetInnerHTML={{ __html: t['hero.logo'] }} />
        <BgVideo editKey="video.hero" video={t['video.hero']} poster={t['poster.hero']} className="background-video"
          data-w-id="98686a2d-ffe7-4280-e408-a48bf901a225" />
        <img src="/assets/arrow.svg" data-w-id="5dc97db0-3f12-f98a-a95c-62ea1d6cbbab" alt="" className="arrow" />
        <div className="wrapper-title" />
      </div>
      <div className="section main">
        <div className="w-embed">
          <div className="marquee-wrapper">
            <div className="marquee">
              <div className="marquee-content" data-edit="marquee.text"
                dangerouslySetInnerHTML={{ __html: editor ? (t['marquee.text'] || '') : (t['marquee.text'] || '') + ' ' + (t['marquee.text'] || '') }} />
              <div className="marquee-content"
                dangerouslySetInnerHTML={{ __html: (t['marquee.text'] || '') + ' ' + (t['marquee.text'] || '') }} />
            </div>
          </div>
        </div>
        <div>
          <BgVideo editKey="video.produkcja" video={t['video.produkcja']} poster={t['poster.produkcja']} className="background-video-2">
            <img src={t['img.produkcja']} data-edit-img="img.produkcja" loading="lazy"
              sizes="(max-width: 1094px) 100vw, 1094px" alt="" className="image-9" />
          </BgVideo>
        </div>
        {works.map((w, i) => (
          <div key={w.id || i} className={i % 2 === 0 ? 'portfolio-div-mobi-l' : 'portfolio-div-mobi-r'}>
            <a href={w.youtube} target="_blank" rel="noreferrer"
              className={(i % 2 === 0 ? 'button-3' : 'button-3-copy') + ' w-button'}>CHECK IT</a>
            <div className={i % 2 === 0 ? 'portfolio-text-mobi' : 'potrfolio-text-mobi'}
              dangerouslySetInnerHTML={{ __html: w.title_mobile_html || w.title_html }} />
            <img src={w.image} loading="lazy" sizes="(max-width: 953px) 100vw, 953px" alt="" className="image-11" />
          </div>
        ))}
        {pairs.map((pair, pi) => (
          <div key={pi} id={STACK_IDS[pi]} className="w-layout-layout quick-stack wf-layout-layout">
            {pair.map((w, ci) => {
              const idx = pi * 2 + ci
              return (
                <div key={w.id || ci} className={ci === 0 ? 'w-layout-cell cell' : 'w-layout-cell'}>
                  <a href={w.youtube} target="_blank" rel="noreferrer" className="link-block-4 w-inline-block">
                    <div data-w-id={WORK_WIDS[idx % WORK_WIDS.length]} className="div-port">
                      <img src={w.image} loading="lazy" sizes="(max-width: 953px) 100vw, 953px" alt="" className="_1" />
                      <BgVideo video={w.video} poster={w.poster} className="background-video-4" />
                      <div className="text-block-5" dangerouslySetInnerHTML={{ __html: w.title_html }} />
                    </div>
                  </a>
                </div>
              )
            })}
          </div>
        ))}
        <div className="div-block-34">
          <T k="ja.title" content={content} className="text-block-6" />
        </div>
        <div className="div-block-31">
          {JA_IMAGES.map((src, i) => (
            <img key={i} src={src} loading="lazy" alt="" className="ja"
              {...(JA_WIDS[i] ? { 'data-w-id': JA_WIDS[i] } : {})} />
          ))}
        </div>
        <div>
          <BgVideo editKey="video.mata" video={t['video.mata']} poster={t['poster.mata']} className="background-video-2">
            <T k="mata.caption" content={content} className="text-block-8" />
            <img src={t['img.mata']} data-edit-img="img.mata" loading="lazy"
              sizes="(max-width: 1094px) 100vw, 1094px" alt="" className="image-9" />
          </BgVideo>
        </div>
        <div>
          <div className="runtext">
            <div className="text-run">
              <div data-w-id="94729c0e-9bd9-174b-de0d-50eefc95ec38" className="text_run-1"
                data-edit="runtext.1" dangerouslySetInnerHTML={{ __html: t['runtext.1'] }} />
              <div data-w-id="6076be1b-6b34-7848-068a-ca14211a97b7" className="text_run"
                data-edit="runtext.2" dangerouslySetInnerHTML={{ __html: t['runtext.2'] }} />
            </div>
          </div>
        </div>
        <div className="w-embed">
          <div className="marquee-wrapper">
            <div className="marquee">
              <div className="marquee-content"
                dangerouslySetInnerHTML={{ __html: (t['marquee.text'] || '') + ' ' + (t['marquee.text'] || '') }} />
              <div className="marquee-content"
                dangerouslySetInnerHTML={{ __html: (t['marquee.text'] || '') + ' ' + (t['marquee.text'] || '') }} />
            </div>
          </div>
        </div>
        <div className="div-block-35">
          <BgVideo editKey="video.eventy" video={t['video.eventy']} poster={t['poster.eventy']} className="background-video-2">
            <img src={t['img.eventy']} data-edit-img="img.eventy" loading="lazy"
              sizes="(max-width: 1094px) 100vw, 1094px" alt="" className="image-9" />
          </BgVideo>
        </div>
        {events.map((ev, i) => (
          <div key={ev.id || i} className={i % 2 === 0 ? 'portfolio-div-mobi-l' : 'portfolio-div-mobi-r'}>
            <EventSlider ev={ev} />
          </div>
        ))}
        {evPairs.map((pair, pi) => (
          <div key={pi} id={EVENT_STACK_IDS[pi]} className="w-layout-layout quick-stack wf-layout-layout">
            {pair.map((ev, ci) => (
              <div key={ev.id || ci} className={ci === 0 ? 'w-layout-cell cell' : 'w-layout-cell'}>
                <EventSlider ev={ev} />
              </div>
            ))}
          </div>
        ))}
        <div className="div-block-27">
          <div className="div-block-26">
            <div className="wrapper-list-links">
              <a href={t['href.instagram']} data-edit-href="href.instagram" className="footer-links"
                data-edit="footer.link.instagram" dangerouslySetInnerHTML={{ __html: t['footer.link.instagram'] }} />
              <a href={t['href.youtube']} data-edit-href="href.youtube" target="_blank" rel="noreferrer" className="footer-links"
                data-edit="footer.link.youtube" dangerouslySetInnerHTML={{ __html: t['footer.link.youtube'] }} />
              <a href={t['href.linkedin']} data-edit-href="href.linkedin" target="_blank" rel="noreferrer" className="footer-links"
                data-edit="footer.link.linkedin" dangerouslySetInnerHTML={{ __html: t['footer.link.linkedin'] }} />
              <a href={t['href.tiktok']} data-edit-href="href.tiktok" target="_blank" rel="noreferrer" className="footer-links"
                data-edit="footer.link.tiktok" dangerouslySetInnerHTML={{ __html: t['footer.link.tiktok'] }} />
            </div>
            <T k="footer.about" content={content} tag="p" className="small-p" />
            <BgVideo editKey="video.profil" video={t['video.profil']} poster={t['poster.profil']} className="background-video-5">
              <img src={t['img.footerlogo']} data-edit-img="img.footerlogo" loading="lazy"
                sizes="(max-width: 986px) 100vw, 986px" alt="" />
            </BgVideo>
          </div>
        </div>
      </div>
    </div>
  )
}
