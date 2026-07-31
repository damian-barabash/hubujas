import { DEFAULT_TEXT, DEFAULT_WORKS, DEFAULT_EVENTS } from './defaults'
import { restSelect } from './supabase'

// Merged content shape: { text: {...}, works: [...], events: [...] }
export function defaultContent() {
  return { text: { ...DEFAULT_TEXT }, works: DEFAULT_WORKS, events: DEFAULT_EVENTS }
}

export async function loadPublished() {
  const out = defaultContent()
  try {
    const [rows, works, events] = await Promise.all([
      restSelect('site_content?id=eq.index&select=published'),
      restSelect('works?select=*&order=ord.asc'),
      restSelect('events?select=*&order=ord.asc'),
    ])
    const pub = rows?.[0]?.published
    if (pub && typeof pub === 'object') Object.assign(out.text, pub)
    if (Array.isArray(works) && works.length) out.works = works
    if (Array.isArray(events) && events.length) out.events = events
  } catch (e) {
    // offline / first boot: defaults already in place
  }
  return out
}
