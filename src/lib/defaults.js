// Default site content — mirrors the original Webflow site 1:1.
// Used as fallback until the CMS publishes content, and as seed data.

export const DEFAULT_TEXT = {
  'nav.portfolio': 'PORTFOLIO',
  'nav.cars': 'CARS FOR SALE',
  'nav.kontakt': 'KONTAKT',
  'menu.kontakt': 'kontakt',
  'menu.cars': 'Car for sale',
  'menu.portfolio': 'PORTFOLIO',
  'hero.logo': 'HUBIJAS',
  'toast.notready': 'Ups! Jezcze nie gotowe...<br/>ale już nad tym pracujemy!',
  'form.title': 'KONTAKT',
  'form.label.name': 'IMIĘ',
  'form.label.mail': 'MAIL',
  'form.label.msg': 'WIADOMOŚĆ',
  'form.submit': 'WYŚLIJ',
  'form.done': 'Dziękuję! Wiadomość została wysłana — odezwę się wkrótce.',
  'marquee.text': 'PRODUKCJA WIDEO   EVENTY   KONFERANCJER   MARKETING   MOTORYZACJA  ',
  'ja.title': '<span class="text-span"><strong>JA+</strong></span><br/>Serial instagramowy Piotra Kędzierskiego',
  'mata.caption': 'Mata ft. Quebonafide, Malik Montana <br/>Papuga<br/>',
  'runtext.1': 'PRODUKCJA WIDEO     EVENTY     KONFERANCJER     MARKETING     MOTORYZACJA<br/><br/>',
  'runtext.2': 'PRODUKCJA WIDEO     EVENTY     KONFERANCJER     MARKETING     MOTORYZACJA<br/>',
  'footer.about': 'Tworzę projekty, które mają rytm, emocje i charakter. Bez nadęcia, bez sztuczności — tylko autentyczna zajawka, doświadczenie i konkretna praca. Od planu zdjęciowego po światło sceny — ogarniam całość albo wchodzę tam, gdzie potrzeba wsparcia.<br/><br/>Zobacz, co już zrobiłem. A potem pogadajmy o tym, co możemy zrobić razem.',
  'footer.link.instagram': 'Instagram',
  'footer.link.youtube': 'Youtube',
  'footer.link.linkedin': 'LinkedIn',
  'footer.link.tiktok': 'TikTok',
  'href.instagram': 'https://www.instagram.com/hubijas/',
  'href.youtube': 'https://www.youtube.com/@hubijas',
  'href.linkedin': 'https://www.linkedin.com/in/hubert-jask%C3%B3lski/',
  'href.tiktok': 'https://www.tiktok.com/@hubijas',
  'img.produkcja': '/assets/PRODUKJA.png',
  'img.eventy': '/assets/EVENTY.png',
  'img.mata': '/assets/MATA.png',
  'img.footerlogo': '/assets/Logo.png',
  'video.hero': '/videos/hero.webm',
  'poster.hero': '/assets/hero-poster.jpg',
  'video.produkcja': '/videos/produkcja.webm',
  'poster.produkcja': '/assets/produkcja-poster.jpg',
  'video.mata': '/videos/mata.webm',
  'poster.mata': '/assets/mata-poster.jpg',
  'video.eventy': '/videos/eventy.webm',
  'poster.eventy': '/assets/eventy-poster.jpg',
  'video.profil': '/videos/profil.webm',
  'poster.profil': '/assets/profil-poster.jpg',
}

export const DEFAULT_WORKS = [
  { id: 'w1', ord: 1, title_html: 'Jan Rapowanie<br/>POZYJEMY ZOBACZYMY ft. Falcon1', title_mobile_html: 'Jan-Rapowanie <br/> Pożyjemy zobaczymy<br/>', youtube: 'https://www.youtube.com/watch?v=eyaLPc3HWO4', image: '/assets/1.jpg', video: '/videos/work-1.webm', poster: '/assets/work-1-poster.jpg' },
  { id: 'w2', ord: 2, title_html: 'Otsochodzi ft. Oskar83<br/>WWA MELANŻ', title_mobile_html: 'Otsochodzi ft. Oskar83  <br/>WWA MELANŻ', youtube: 'https://www.youtube.com/watch?v=GP_HWyS9JWw&ab_channel=2020', image: '/assets/2.jpg', video: '/videos/work-2.webm', poster: '/assets/work-2-poster.jpg' },
  { id: 'w3', ord: 3, title_html: 'Białas ft. Słoń <br/>Klękaj przed panem', title_mobile_html: 'Białas ft. Słoń <br/>Klękaj przed panem<br/>', youtube: 'https://www.youtube.com/watch?v=-XXmHpxDtuU', image: '/assets/3.jpg', video: '/videos/work-3.webm', poster: '/assets/work-3-poster.jpg' },
  { id: 'w4', ord: 4, title_html: 'Jan-Rapowanie <br/>LAXJFK ft. Kinny Zimmer', title_mobile_html: 'Jan-Rapowanie <br/>LAXJFK ft. Kinny Zimmer', youtube: 'https://www.youtube.com/watch?v=M4QiWZf34Qo', image: '/assets/4.jpg', video: '/videos/work-4.webm', poster: '/assets/work-4-poster.jpg' },
  { id: 'w5', ord: 5, title_html: 'Jan-Rapowanie <br/>anioły ft. Misia Furtak<br/>', title_mobile_html: 'Jan-Rapowanie <br/>anioły ft. Misia Furtak', youtube: 'https://www.youtube.com/watch?v=eB2HBWjzm8Y', image: '/assets/5.jpg', video: '/videos/work-5.webm', poster: '/assets/work-5-poster.jpg' },
  { id: 'w6', ord: 6, title_html: 'Jan-Rapowanie <br/>Tryb samolotowy', title_mobile_html: 'Jan-Rapowanie <br/>Tryb samolotowy', youtube: 'https://www.youtube.com/watch?v=qmz7YnhGXgk', image: '/assets/6.jpg', video: '/videos/work-6.webm', poster: '/assets/work-6-poster.jpg' },
  { id: 'w7', ord: 7, title_html: 'Sir Mich feat. Alberto <br/>Dobra karma', title_mobile_html: 'Sir Mich feat. Alberto<br/>Dobra karma<br/>', youtube: 'https://www.youtube.com/watch?v=ldRhAyFlsns', image: '/assets/7.jpg', video: '/videos/work-7.webm', poster: '/assets/work-7-poster.jpg' },
  { id: 'w8', ord: 8, title_html: 'Alberto <br/>Mały gnój', title_mobile_html: 'Alberto <br/>Mały gnój', youtube: 'https://www.youtube.com/watch?v=l9YPmDZEorQ', image: '/assets/8.jpg', video: '/videos/work-8.webm', poster: '/assets/work-8-poster.jpg' },
  { id: 'w9', ord: 9, title_html: 'Dawid Podsiadło <br/>Lata Dwudzieste (promo)', title_mobile_html: 'Dawid Podsiadło <br/>Lata Dwudzieste (promo)<br/>', youtube: 'https://www.youtube.com/watch?v=th9_EBWClHQ&t=32s', image: '/assets/9.jpg', video: '/videos/work-9.webm', poster: '/assets/work-9-poster.jpg' },
  { id: 'w10', ord: 10, title_html: 'Hot spots sponsored <br/>by GLO (newonce)', title_mobile_html: 'Hot spots sponsored <br/>by GLO (newonce)', youtube: 'https://www.youtube.com/watch?v=nMqtO9zspsA', image: '/assets/10.jpg', video: '/videos/work-10.webm', poster: '/assets/work-10-poster.jpg' },
]

export const DEFAULT_EVENTS = [
  { id: 'e1', ord: 1, title: 'Driftingowe Mistrzostwa Polski', subtitle_html: 'marketing<br/>support produkji<br/>konferansjer<br/>social media', images: ['/assets/33.png', '/assets/11.png', '/assets/22.png'] },
  { id: 'e2', ord: 2, title: 'newonce.camp', subtitle_html: 'Produkcja', images: ['/assets/111.png', '/assets/333.png', '/assets/222.png'] },
  { id: 'e3', ord: 3, title: 'newonce b’day', subtitle_html: 'Produkcja', images: ['/assets/1111.png', '/assets/2222.png'] },
  { id: 'e4', ord: 4, title: 'Ultrace', subtitle_html: '<strong>konferansjer</strong>', images: ['/assets/11111.png', '/assets/22222.png', '/assets/33333.png'] },
]

export const JA_IMAGES = [
  '/assets/JA_6.jpg', '/assets/JA_5.jpg', '/assets/JA_4.jpg', '/assets/JA_3.jpg',
  '/assets/JA_7.jpg', '/assets/JA_2.jpg', '/assets/JA_1.jpg',
]
