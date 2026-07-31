# HUBIJAS — portfolio

React-порт hubijas-portfolio.webflow.io (1:1) + визуальный CMS на Supabase.

Прод: **https://hubijas.pl** · репозиторий `damian-barabash/hubujas` · деплой — GitHub Actions.

## Запуск локально

```bash
npm install
npm run dev        # http://localhost:5173
# или прод-сборка:
npm run build
npx vite preview   # http://localhost:4173
```

## Структура

- `/` — сайт (контент тянется из Supabase, фолбэк — вшитые дефолты `src/lib/defaults.js`)
- `/admin` — CMS: логин → инлайн-редактор текстов/картинок/видео + вкладки Prace / Eventy / Wiadomości
- `src/engine/ix.js` + `ixSpec.json` — движок интеракций (снятые с Webflow ix2 ховеры/параллаксы/клики)
- `src/engine/slider.js` — реплика Webflow-слайдера (автоплей 4с, стрелки, точки, свайп)
- `public/videos/*.webm` — пережатые VP9 (основной формат) + `*.mp4` (фоллбэк для старых Safari)
- `supabase/` — миграция схемы + edge-функция `admin-api`

## Бэкенд (Supabase `vbhweyzvdxxyikxnmhst`, «hubijas backend»)

- Таблицы: `site_content` (published/draft jsonb), `works`, `events`, `admins`, `admin_sessions`, `messages`
- RLS: anon читает контент/работы/эвенты, может только INSERT в `messages`; всё остальное — через edge `admin-api` (bcrypt-логин, токен-сессии 30 дней)
- Storage bucket `media` (public) — загрузки из админки через подписанные URL

## SEO / соцсети (OG-обёртка)

- `index.html` — полный набор мета: title/description PL, canonical `https://hubijas.pl/`, Open Graph
  (`og:image` = `https://hubijas.pl/assets/og.jpg`, 1200×630), Twitter `summary_large_image`,
  JSON-LD `Person` со ссылками на Instagram / YouTube / LinkedIn / TikTok.
- `public/assets/og.jpg` — превью-картинка (чёрный фон, вордмарк Organetto, жёлтая линия, портрет, `hubijas.pl`).
  Исходник — `tools/og-image.html`; перерисовать: `npm run og` (headless Chrome + sips, без npm-зависимостей).
- `public/robots.txt` (закрывает `/admin`), `public/sitemap.xml`, `public/site.webmanifest`.
- Роут `/admin` на лету ставит `<meta name="robots" content="noindex, nofollow">` — панель не попадает в выдачу.

После деплоя прогнать превью в дебаггерах: <https://developers.facebook.com/tools/debug/> и
<https://www.linkedin.com/post-inspector/> (они кэшируют og:image — при замене картинки нужен «Scrape again»).

## Деплой

GH Pages через Actions (`.github/workflows/deploy.yml`): Settings → Pages → Source: GitHub Actions.

- Домен **hubijas.pl**: `public/CNAME` едет в сборку → `dist/CNAME` (workflow падает, если его нет —
  иначе Pages сбросил бы кастомный домен). В Settings → Pages → Custom domain вписать `hubijas.pl`,
  галочка «Enforce HTTPS» после выдачи сертификата.
- DNS у регистратора: `A @` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
  (+ `AAAA` при желании), `CNAME www` → `damian-barabash.github.io`.
- `404.html` = копия `index.html` (SPA-фолбэк для `/admin`). База `/` — под кастомный домен;
  для project-page без домена поменять `base` в `vite.config.js`.

Папка `site-src/` (оригинал с Webflow, ~220 МБ) — только локальный референс, в git не идёт.
