(function () {
  'use strict';
  const C = window.Citace;
  const $ = (id) => document.getElementById(id);
  const SOURCES = {
    knihovny: 'Knihovny.cz',
    openlibrary: 'Open Library',
    google: 'Google Books',
  };
  const PRIORITY = ['knihovny', 'openlibrary', 'google'];
  const FIELDS_KNIHOVNY = ['id', 'title', 'shortTitle', 'subTitle', 'authors', 'edition', 'placesOfPublication',
    'publishers', 'publicationDates', 'isbns', 'series', 'formats', 'recordPage'];

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* bez úložiště */ } },
  };

  /* ---------- Jazyk: CZ = ČSN ISO 690:2022, SK = STN ISO 690:2022, EN = ISO 690 v angličtině ---------- */

  const I18N = {
    cs: {
      pageTitle: 'Citace knih',
      h1: 'Citace knih',
      intro: 'Napiš ISBN, název nebo autora, klidně nepřesně. Knihu vyhledám v českých knihovnách (Knihovny.cz), v Open Library a v Google Books, porovnám údaje mezi zdroji a sestavím citaci podle ČSN ISO 690:2022.',
      qPh: 'např. 978-80-00-05056-6 nebo „nemcova babicka albatros“', qAria: 'Hledat knihu',
      search: 'Hledat', manual: 'Vyplnit ručně', results: 'Nalezené knihy',
      formH: 'Údaje o knize', formNote: 'Vše jde upravit, citace se mění hned.',
      creators: 'Tvůrci', roleAut: 'autoři', roleEdt: 'editoři (ed.)', addCreator: '+ přidat tvůrce',
      corporate: 'Korporace jako autor (jen když chybí osoby)', title: 'Název', subtitle: 'Podnázev',
      edition: 'Vydání (1. se neuvádí)', editionPh: 'např. 2. vyd.', series: 'Edice (nepovinné)',
      place: 'Místo vydání', placeHint: 'Odhadnuto podle nakladatele – ověř.', publisher: 'Nakladatel', year: 'Rok vydání',
      translator: 'Překladatel (nepovinné)', addTranslator: '+ přidat překladatele', online: 'Elektronická kniha online',
      url: 'Dostupné z (URL)', cited: 'Datum citování',
      citeH: 'Citace', copy: 'Kopírovat', copyPlain: 'Kopírovat bez formátu', addList: 'Přidat do seznamu',
      verifyH: 'Ověření v dalších zdrojích',
      verifyLegend: '✓ zdroj souhlasí s formulářem, ≠ zdroj uvádí něco jiného (tlačítkem „použít“ hodnotu převezmeš), prázdné = zdroj údaj nemá. Knihovní katalog (Knihovny.cz) bývá u českých knih nejspolehlivější.',
      biblioH: 'Můj seznam literatury', copyAll: 'Kopírovat celý seznam', clear: 'Vymazat',
      settings: 'Nastavení', gkey: 'Klíč Google Books API (nepovinné)',
      gkeyNote: 'Bez klíče funguje Google Books s denním limitem dotazů. Klíč si můžeš zdarma vytvořit v Google Cloud Console a uložit ho sem. Zůstane jen v tomto prohlížeči.',
      footer: 'Formát: ČSN ISO 690:2022 (kniha). Údaje: {sources}. Vše běží v prohlížeči, seznam se ukládá jen v tomto zařízení.',
      unavailable: 'nedostupné', searching: 'Hledám…',
      nothing: 'Nic jsem nenašel. Zkus jiná slova nebo ISBN, případně vyplň údaje ručně.',
      count: (n) => n + (n === 1 ? ' kniha' : n < 5 ? ' knihy' : ' knih'),
      inSources: (n) => `shoda ve ${n} zdrojích`, approx: 'vydání nejisté', pick: 'Vybrat',
      family: 'Příjmení', given: 'Jméno', remove: 'Odebrat', fillIn: 'Vyplň údaje o knize.',
      noIsbn: 'Kniha nemá ISBN, v dalších zdrojích ji nejde spolehlivě dohledat',
      thField: 'Údaj', thForm: 'Ve formuláři', lookup: 'hledám…', notFound: 'nenalezeno', use: 'použít',
      byIsbn: (i) => 'podle ISBN ' + i,
      foundIn: (a, b) => `Kniha nalezena ve ${a} ze ${b} zdrojů`,
      diffs: (n) => `Rozdílů mezi zdroji: ${n}, zkontroluj zvýrazněná pole`,
      match: 'Údaje se shodují', verifying: 'Ověřuji…',
      fAuthors: 'Autoři', fTitle: 'Název', fEdition: 'Vydání', fPlace: 'Místo', fPublisher: 'Nakladatel', fYear: 'Rok', fIsbn: 'ISBN',
      copied: 'Zkopírováno', copiedPlain: 'Zkopírováno (bez formátu)', added: 'Přidáno do seznamu',
      confirmClear: 'Opravdu vymazat celý seznam?', del: 'Smazat',
    },
    sk: {
      pageTitle: 'Citácie kníh',
      h1: 'Citácie kníh',
      intro: 'Napíš ISBN, názov alebo autora, pokojne nepresne. Knihu vyhľadám v českých knižniciach (Knihovny.cz, majú aj veľa slovenských kníh), v Open Library a v Google Books, porovnám údaje medzi zdrojmi a zostavím citáciu podľa STN ISO 690:2022.',
      qPh: 'napr. ISBN alebo „hviezdoslav hajnikova zena“', qAria: 'Hľadať knihu',
      search: 'Hľadať', manual: 'Vyplniť ručne', results: 'Nájdené knihy',
      formH: 'Údaje o knihe', formNote: 'Všetko sa dá upraviť, citácia sa mení hneď.',
      creators: 'Tvorcovia', roleAut: 'autori', roleEdt: 'editori (ed.)', addCreator: '+ pridať tvorcu',
      corporate: 'Korporácia ako autor (len keď chýbajú osoby)', title: 'Názov', subtitle: 'Podnázov',
      edition: 'Vydanie (1. sa neuvádza)', editionPh: 'napr. 2. vyd.', series: 'Edícia (nepovinné)',
      place: 'Miesto vydania', placeHint: 'Odhadnuté podľa vydavateľa – over.', publisher: 'Vydavateľ', year: 'Rok vydania',
      translator: 'Prekladateľ (nepovinné)', addTranslator: '+ pridať prekladateľa', online: 'Elektronická kniha online',
      url: 'Dostupné na (URL)', cited: 'Dátum citovania',
      citeH: 'Citácia', copy: 'Kopírovať', copyPlain: 'Kopírovať bez formátu', addList: 'Pridať do zoznamu',
      verifyH: 'Overenie v ďalších zdrojoch',
      verifyLegend: '✓ zdroj súhlasí s formulárom, ≠ zdroj uvádza niečo iné (tlačidlom „použiť“ hodnotu prevezmeš), prázdne = zdroj údaj nemá. Knižničný katalóg (Knihovny.cz) býva najspoľahlivejší.',
      biblioH: 'Môj zoznam literatúry', copyAll: 'Kopírovať celý zoznam', clear: 'Vymazať',
      settings: 'Nastavenia', gkey: 'Kľúč Google Books API (nepovinné)',
      gkeyNote: 'Bez kľúča funguje Google Books s denným limitom dopytov. Kľúč si môžeš zadarmo vytvoriť v Google Cloud Console a uložiť ho sem. Zostane len v tomto prehliadači.',
      footer: 'Formát: STN ISO 690:2022 (kniha). Údaje: {sources}. Všetko beží v prehliadači, zoznam sa ukladá len v tomto zariadení.',
      unavailable: 'nedostupné', searching: 'Hľadám…',
      nothing: 'Nič som nenašiel. Skús iné slová alebo ISBN, prípadne vyplň údaje ručne.',
      count: (n) => n + (n === 1 ? ' kniha' : n < 5 ? ' knihy' : ' kníh'),
      inSources: (n) => `zhoda v ${n} zdrojoch`, approx: 'vydanie neisté', pick: 'Vybrať',
      family: 'Priezvisko', given: 'Meno', remove: 'Odobrať', fillIn: 'Vyplň údaje o knihe.',
      noIsbn: 'Kniha nemá ISBN, v ďalších zdrojoch ju nemožno spoľahlivo dohľadať',
      thField: 'Údaj', thForm: 'Vo formulári', lookup: 'hľadám…', notFound: 'nenájdené', use: 'použiť',
      byIsbn: (i) => 'podľa ISBN ' + i,
      foundIn: (a, b) => `Kniha nájdená v ${a} z ${b} zdrojov`,
      diffs: (n) => `Rozdielov medzi zdrojmi: ${n}, skontroluj zvýraznené polia`,
      match: 'Údaje sa zhodujú', verifying: 'Overujem…',
      fAuthors: 'Autori', fTitle: 'Názov', fEdition: 'Vydanie', fPlace: 'Miesto', fPublisher: 'Vydavateľ', fYear: 'Rok', fIsbn: 'ISBN',
      copied: 'Skopírované', copiedPlain: 'Skopírované (bez formátu)', added: 'Pridané do zoznamu',
      confirmClear: 'Naozaj vymazať celý zoznam?', del: 'Zmazať',
    },
    en: {
      pageTitle: 'Book References',
      h1: 'Book references',
      intro: 'Type an ISBN, a title or an author – it does not have to be exact. The book is looked up in Czech libraries (Knihovny.cz), Open Library and Google Books, its details are cross-checked between the sources and the reference is formatted according to ISO 690 in English.',
      qPh: 'e.g. 978-0-306-40615-7 or "tolkien hobbit allen unwin"', qAria: 'Search for a book',
      search: 'Search', manual: 'Enter manually', results: 'Results',
      formH: 'Book details', formNote: 'Everything is editable; the reference updates instantly.',
      creators: 'Creators', roleAut: 'authors', roleEdt: 'editors (ed.)', addCreator: '+ add creator',
      corporate: 'Corporate author (only if there are no persons)', title: 'Title', subtitle: 'Subtitle',
      edition: 'Edition (omit the 1st)', editionPh: 'e.g. 2nd ed.', series: 'Series (optional)',
      place: 'Place of publication', placeHint: 'Guessed from the publisher – please check.', publisher: 'Publisher', year: 'Year',
      translator: 'Translator (optional)', addTranslator: '+ add translator', online: 'Online e-book',
      url: 'Available from (URL)', cited: 'Date viewed',
      citeH: 'Reference', copy: 'Copy', copyPlain: 'Copy as plain text', addList: 'Add to list',
      verifyH: 'Cross-check in other sources',
      verifyLegend: '✓ the source agrees with the form, ≠ the source says something else (click “use” to take its value), empty = the source does not have it. For Czech books the library catalogue (Knihovny.cz) is usually the most reliable.',
      biblioH: 'My reference list', copyAll: 'Copy whole list', clear: 'Clear',
      settings: 'Settings', gkey: 'Google Books API key (optional)',
      gkeyNote: 'Without a key Google Books works with a daily request limit. You can create a free key in the Google Cloud Console and save it here. It stays in this browser only.',
      footer: 'Format: ISO 690 (book), English. Data: {sources}. Everything runs in your browser; the list is stored on this device only.',
      unavailable: 'unavailable', searching: 'Searching…',
      nothing: 'Nothing found. Try other words or the ISBN, or enter the details manually.',
      count: (n) => n + (n === 1 ? ' book' : ' books'),
      inSources: (n) => `found in ${n} sources`, approx: 'edition uncertain', pick: 'Select',
      family: 'Surname', given: 'Given name', remove: 'Remove', fillIn: 'Fill in the book details.',
      noIsbn: 'The book has no ISBN, so it cannot be reliably matched in other sources',
      thField: 'Field', thForm: 'In the form', lookup: 'searching…', notFound: 'not found', use: 'use',
      byIsbn: (i) => 'by ISBN ' + i,
      foundIn: (a, b) => `Found in ${a} of ${b} sources`,
      diffs: (n) => `Differences between sources: ${n} – check the highlighted fields`,
      match: 'Details match', verifying: 'Verifying…',
      fAuthors: 'Authors', fTitle: 'Title', fEdition: 'Edition', fPlace: 'Place', fPublisher: 'Publisher', fYear: 'Year', fIsbn: 'ISBN',
      copied: 'Copied', copiedPlain: 'Copied (plain text)', added: 'Added to the list',
      confirmClear: 'Clear the whole list?', del: 'Delete',
    },
  };
  const SOURCE_LINKS = '<a href="https://www.knihovny.cz" target="_blank" rel="noopener">Knihovny.cz</a>, ' +
    '<a href="https://openlibrary.org" target="_blank" rel="noopener">Open Library</a>, ' +
    '<a href="https://books.google.com" target="_blank" rel="noopener">Google Books</a>';

  function initialLang() {
    const q = new URLSearchParams(location.search).get('lang');
    if (I18N[q]) return q;
    const saved = store.get('citace.lang', 'cs');
    return I18N[saved] ? saved : 'cs';
  }
  let lang = initialLang();
  const t = (k, ...a) => { const v = I18N[lang][k]; return typeof v === 'function' ? v(...a) : v; };

  function applyStaticTexts() {
    document.documentElement.lang = lang;
    document.title = t('pageTitle');
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml).replace('{sources}', SOURCE_LINKS); });
    document.querySelectorAll('.lang [data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    document.querySelectorAll('.person').forEach((row) => {
      row.querySelector('[data-k="family"]').placeholder = t('family');
      row.querySelector('[data-k="given"]').placeholder = t('given');
      row.querySelector('[data-remove]').setAttribute('aria-label', t('remove'));
    });
  }

  /* ---------- Volání zdrojů ---------- */

  async function getJson(url, signal) {
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  async function searchKnihovny(q, signal) {
    const p = new URLSearchParams({ lookfor: q, type: 'AllFields', limit: '20', lng: lang === 'en' ? 'en' : 'cs' });
    FIELDS_KNIHOVNY.forEach((f) => p.append('field[]', f));
    const j = await getJson('https://www.knihovny.cz/api/v1/search?' + p, signal);
    return (j.records || []).map(C.fromKnihovny);
  }

  async function searchOpenLibrary(q, isbn, signal) {
    if (isbn) {
      const j = await getJson('https://openlibrary.org/api/books?format=json&jscmd=data&bibkeys=ISBN:' + isbn, signal);
      return Object.values(j).map((d) => C.fromOpenLibraryData(d, isbn));
    }
    const fields = ['key', 'title', 'subtitle', 'author_name', 'first_publish_year', 'publisher', 'publish_place', 'isbn', 'cover_i',
      'editions', 'editions.key', 'editions.title', 'editions.subtitle', 'editions.publisher', 'editions.publish_date',
      'editions.publish_place', 'editions.isbn', 'editions.edition_name', 'editions.cover_i'].join(',');
    const p = new URLSearchParams({ q, limit: '10', fields });
    const j = await getJson('https://openlibrary.org/search.json?' + p, signal);
    return (j.docs || []).map(C.fromOpenLibrarySearch);
  }

  async function searchGoogle(q, isbn, signal) {
    const p = new URLSearchParams({ q: isbn ? 'isbn:' + isbn : q, maxResults: '15', printType: 'books' });
    const key = store.get('citace.gkey', '') || (window.CITACE_CONFIG || {}).googleBooksKey || '';
    if (key) p.set('key', key);
    const j = await getJson('https://www.googleapis.com/books/v1/volumes?' + p, signal);
    return (j.items || []).map(C.fromGoogle);
  }

  function runSource(src, q, isbn, signal) {
    if (src === 'knihovny') return searchKnihovny(isbn || q, signal);
    if (src === 'openlibrary') return searchOpenLibrary(q, isbn, signal);
    return searchGoogle(q, isbn, signal);
  }

  /* ---------- Hledání a výsledky ---------- */

  let searchCtl = null;
  let lastResults = {}; // src → záznamy
  let groups = [];

  const srcState = {};
  function setSrcState(src, state, title) {
    srcState[src] = [state, title];
    const el = document.querySelector(`.src-state[data-src="${src}"]`);
    el.className = 'src-state ' + state;
    el.title = title || '';
    el.textContent = SOURCES[src] + (state === 'ok' ? ` (${title})` : state === 'err' ? ' – ' + t('unavailable') : '');
  }

  function groupKey(r) {
    const k = C.isbnKey(r.isbn);
    return k ? 'isbn:' + k : 'tit:' + C.norm(r.title) + '|' + r.year + '|' + C.norm(r.publisher) + '|' + r.source + r.sourceId;
  }

  function regroup() {
    const map = new Map();
    for (const src of PRIORITY) {
      for (const r of lastResults[src] || []) {
        const k = groupKey(r);
        if (!map.has(k)) map.set(k, { key: k, records: [] });
        const g = map.get(k);
        if (!g.records.some((x) => x.source === r.source)) g.records.push(r);
      }
    }
    groups = [...map.values()];
    // CZ: české knihovny první, pak podle počtu zdrojů; EN: nejdřív knihy známé ve více zdrojích
    groups.forEach((g, i) => { g.order = i; });
    const bySource = (a, b) => PRIORITY.indexOf(a.records[0].source) - PRIORITY.indexOf(b.records[0].source);
    const byCount = (a, b) => b.records.length - a.records.length;
    groups.sort((a, b) => (lang === 'en' ? byCount(a, b) || bySource(a, b) : bySource(a, b) || byCount(a, b)) || a.order - b.order);
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function renderResults() {
    const ul = $('results');
    $('resultsBox').hidden = false;
    if (!groups.length) {
      const pending = document.querySelectorAll('.src-state.loading').length;
      ul.innerHTML = `<li class="empty">${pending ? t('searching') : t('nothing')}</li>`;
      $('resultsNote').textContent = '';
      return;
    }
    $('resultsNote').textContent = t('count', groups.length);
    ul.innerHTML = groups.slice(0, 40).map((g, i) => {
      const r = g.records[0];
      const authors = r.authors.map(C.personNatural).join(', ') || r.corporate;
      const imprint = [r.place && r.publisher ? `${r.place}: ${r.publisher}` : r.place || r.publisher, r.year].filter(Boolean).join(', ');
      const meta = [authors, imprint, C.normalizeEdition(r.editionRaw || r.edition, lang), r.isbn && 'ISBN ' + r.isbn].filter(Boolean).map(esc).join(' · ');
      const tags = g.records.map((x) => `<span class="tag">${SOURCES[x.source]}</span>`).join('') +
        (g.records.length > 1 ? `<span class="tag multi">${t('inSources', g.records.length)}</span>` : '') +
        (r.approximate ? `<span class="tag approx">${t('approx')}</span>` : '');
      const cover = g.records.map((x) => x.cover).find(Boolean);
      return `<li class="result">
        <div class="cover">${cover ? `<img src="${esc(cover)}" alt="" loading="lazy">` : ''}</div>
        <div>
          <div class="r-title">${esc(r.title)}${r.subtitle ? `<span class="r-sub">: ${esc(r.subtitle)}</span>` : ''}</div>
          <div class="r-meta">${meta}</div>
          <div class="tags">${tags}</div>
        </div>
        <div class="btns"><button type="button" class="primary" data-pick="${i}">${t('pick')}</button></div>
      </li>`;
    }).join('');
  }

  async function search(q) {
    q = q.trim();
    if (!q) return;
    if (searchCtl) searchCtl.abort();
    const ctl = new AbortController();
    searchCtl = ctl;
    const isbn = C.queryIsbn(q);
    lastResults = {};
    groups = [];
    PRIORITY.forEach((s) => setSrcState(s, 'loading'));
    renderResults();
    await Promise.all(PRIORITY.map(async (src) => {
      try {
        const recs = await runSource(src, q, isbn, ctl.signal);
        if (ctl.signal.aborted) return;
        lastResults[src] = isbn ? recs.filter((r) => r.isbns.some((x) => C.isbnKey(x) === C.isbnKey(isbn))).concat(
          recs.filter((r) => !r.isbns.length)) : recs;
        setSrcState(src, 'ok', String(lastResults[src].length));
      } catch (e) {
        if (ctl.signal.aborted) return;
        lastResults[src] = [];
        setSrcState(src, 'err', e.message);
      }
      regroup();
      renderResults();
    }));
    // jediný jistý výsledek podle ISBN rovnou vybereme
    if (isbn && groups.length === 1 && !ctl.signal.aborted) pick(groups[0]);
  }

  /* ---------- Formulář ---------- */

  const TEXT_FIELDS = ['corporate', 'title', 'subtitle', 'edition', 'series', 'isbn', 'place', 'publisher', 'year', 'url', 'cited'];

  function personRow(p, listId) {
    const div = document.createElement('div');
    div.className = 'person';
    div.innerHTML = `<input type="text" data-k="family" placeholder="${t('family')}" aria-label="${t('family')}">
      <input type="text" data-k="given" placeholder="${t('given')}" aria-label="${t('given')}">
      <button type="button" data-remove aria-label="${t('remove')}">✕</button>`;
    div.querySelector('[data-k="family"]').value = p.family || '';
    div.querySelector('[data-k="given"]').value = p.given || '';
    $(listId).appendChild(div);
  }

  function setPersons(listId, list) {
    $(listId).innerHTML = '';
    (list.length ? list : listId === 'authors' ? [{}] : []).forEach((p) => personRow(p, listId));
  }

  function getPersons(listId) {
    return [...$(listId).querySelectorAll('.person')].map((row) => ({
      family: row.querySelector('[data-k="family"]').value,
      given: row.querySelector('[data-k="given"]').value,
    })).filter((p) => p.family.trim() || p.given.trim());
  }

  function readForm() {
    const d = { authors: getPersons('authors'), translators: getPersons('translators'), creatorRole: $('creatorRole').value, online: $('online').checked };
    TEXT_FIELDS.forEach((f) => { d[f] = $(f).value; });
    return d;
  }

  // Vydání se píše podle jazyka (2. vyd. / 2nd ed.); dokud ho uživatel nepřepíše, při přepnutí jazyka se přeloží.
  let editionRaw = '';
  let editionAuto = '';

  function fillForm(r) {
    setPersons('authors', r.authors || []);
    setPersons('translators', r.translators || []);
    $('creatorRole').value = r.creatorRole || 'aut';
    TEXT_FIELDS.forEach((f) => { if (f !== 'url' && f !== 'cited') $(f).value = r[f] || ''; });
    editionRaw = r.editionRaw || r.edition || '';
    editionAuto = $('edition').value = C.normalizeEdition(editionRaw, lang);
    $('placeHint').hidden = !r.placeGuessed;
    $('formBox').hidden = false;
    $('citeBox').hidden = false;
    update();
  }

  function update() {
    const online = $('online').checked;
    document.querySelectorAll('[data-online]').forEach((el) => { el.hidden = !online; });
    if (online && !$('cited').value) $('cited').value = new Date().toISOString().slice(0, 10);
    const c = C.buildCitation(readForm(), { lang });
    $('cite').innerHTML = c.html || `<span class="note">${t('fillIn')}</span>`;
    $('warnings').innerHTML = c.warnings.map((w) => `<li>${esc(w)}</li>`).join('');
    current = c;
    renderVerify();
  }
  let current = null;

  /* ---------- Ověření v dalších zdrojích ---------- */

  let verify = null; // { isbn, bySrc: {src: record|null|'err'|'loading'} }
  let verifyCtl = null;

  function pick(g) {
    const r = g.records[0];
    fillForm(r);
    startVerify(r, g.records);
    $('formBox').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function startVerify(r, known) {
    if (verifyCtl) verifyCtl.abort();
    const key = C.isbnKey(r.isbn);
    verify = { isbn: key, bySrc: {}, picked: r.source };
    $('verifyBox').hidden = false;
    if (!key) { renderVerify(); return; }
    const ctl = new AbortController();
    verifyCtl = ctl;
    for (const src of PRIORITY) {
      const k = known.find((x) => x.source === src && !x.approximate);
      verify.bySrc[src] = k || 'loading';
    }
    renderVerify();
    await Promise.all(PRIORITY.filter((s) => verify.bySrc[s] === 'loading').map(async (src) => {
      try {
        const recs = await runSource(src, key, key, ctl.signal);
        if (ctl.signal.aborted) return;
        verify.bySrc[src] = recs.find((x) => x.isbns.some((i) => C.isbnKey(i) === key)) || null;
      } catch (e) {
        if (ctl.signal.aborted) return;
        verify.bySrc[src] = 'err';
      }
      renderVerify();
    }));
  }

  const sourceEdition = (r) => C.normalizeEdition(r.editionRaw || r.edition, lang);
  const VERIFY_FIELDS = [
    ['authors', 'fAuthors', (r) => r.authors, (v) => (v || []).map(C.personNatural).join(', ')],
    ['title', 'fTitle', (r) => r.title, (v) => v],
    ['edition', 'fEdition', sourceEdition, (v) => v],
    ['place', 'fPlace', (r) => (r.placeGuessed ? '' : r.place), (v) => v],
    ['publisher', 'fPublisher', (r) => r.publisher, (v) => v],
    ['year', 'fYear', (r) => r.year, (v) => v],
    ['isbn', 'fIsbn', (r) => r.isbns, (v) => [].concat(v || []).join(', ')],
  ];

  function renderVerify() {
    if (!verify) return;
    const box = $('verifySum');
    const table = $('verifyTable');
    if (!verify.isbn) {
      $('verifyNote').textContent = '';
      box.innerHTML = `<span class="pill warn">${t('noIsbn')}</span>`;
      table.innerHTML = '';
      return;
    }
    const form = readForm();
    const formVals = { authors: form.authors, title: form.title, edition: C.normalizeEdition(form.edition, lang), place: form.place, publisher: form.publisher, year: form.year, isbn: [form.isbn] };
    const srcs = PRIORITY;
    let found = 0;
    let diffs = 0;
    let head = `<thead><tr><th>${t('thField')}</th><th>${t('thForm')}</th>`;
    srcs.forEach((s) => {
      const st = verify.bySrc[s];
      const label = st === 'loading' ? t('lookup') : st === 'err' ? t('unavailable') : st ? '' : t('notFound');
      if (st && typeof st === 'object') found++;
      head += `<th>${SOURCES[s]}${label ? ` <span class="note">(${label})</span>` : ''}</th>`;
    });
    head += '</tr></thead>';
    let body = '<tbody>';
    for (const [f, label, get, show] of VERIFY_FIELDS) {
      const fv = formVals[f];
      body += `<tr><td class="field">${t(label)}</td><td><span class="v">${esc(show(fv)) || '<span class="note">–</span>'}</span></td>`;
      for (const s of srcs) {
        const r = verify.bySrc[s];
        if (!r || typeof r !== 'object') { body += '<td class="none"></td>'; continue; }
        const sv = get(r);
        const shown = show(sv);
        let cmp = C.compareField(f, fv, sv);
        if (f === 'edition') {
          // zdroj bez údaje o vydání (Google Books ho nemá) nic nevyvrací; prázdné pole ve formuláři = 1. vydání
          cmp = !sv ? 'none' : C.compareField(f, fv || (lang === 'en' ? '1st ed.' : '1. vyd.'), sv);
        }
        if (cmp === 'diff' && f !== 'isbn') diffs++;
        const canUse = cmp === 'diff' && f !== 'isbn' && shown;
        body += `<td class="${shown ? cmp : 'none'}"><span class="v">${esc(shown)}</span>${canUse ? `<br><button type="button" data-use="${f}" data-src="${s}">${t('use')}</button>` : ''}</td>`;
      }
      body += '</tr>';
    }
    body += '</tbody>';
    table.innerHTML = head + body;
    const pending = srcs.some((s) => verify.bySrc[s] === 'loading');
    $('verifyNote').textContent = t('byIsbn', verify.isbn);
    const pills = [];
    pills.push(`<span class="pill ${found >= 2 ? 'ok' : 'warn'}">${t('foundIn', found, srcs.length)}</span>`);
    if (!pending) pills.push(diffs ? `<span class="pill warn">${t('diffs', diffs)}</span>` : found >= 2 ? `<span class="pill ok">${t('match')}</span>` : '');
    else pills.push(`<span class="note">${t('verifying')}</span>`);
    box.innerHTML = pills.join('');
  }

  function useValue(field, src) {
    const r = verify && verify.bySrc[src];
    if (!r || typeof r !== 'object') return;
    if (field === 'authors') setPersons('authors', r.authors);
    else if (field === 'edition') {
      editionRaw = r.editionRaw || r.edition || '';
      editionAuto = $('edition').value = sourceEdition(r);
    } else {
      $(field).value = r[field] || '';
      if (field === 'place') $('placeHint').hidden = true;
    }
    update();
  }

  /* ---------- Kopírování a seznam ---------- */

  function toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('show'), 1800);
  }

  async function copy(html, text, plainOnly) {
    try {
      if (!plainOnly && window.ClipboardItem && navigator.clipboard.write) {
        await navigator.clipboard.write([new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' }),
        })]);
      } else {
        await navigator.clipboard.writeText(text);
      }
      toast(t('copied'));
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      toast(t('copiedPlain'));
    }
  }

  // každý jazyk má vlastní seznam
  const biblioKey = () => (lang === 'cs' ? 'citace.seznam' : 'citace.seznam.' + lang);
  let biblio = store.get(biblioKey(), []);

  function renderBiblio() {
    biblio.sort((a, b) => a.text.localeCompare(b.text, lang));
    $('biblioBox').hidden = !biblio.length;
    $('biblioCount').textContent = biblio.length ? `(${biblio.length})` : '';
    $('biblio').innerHTML = biblio.map((b, i) => `<li><span>${b.html}</span><span class="btns">
      <button type="button" data-copy-item="${i}">${t('copy')}</button><button type="button" data-del="${i}" aria-label="${t('del')}">✕</button></span></li>`).join('');
  }

  /* ---------- Události ---------- */

  $('searchForm').addEventListener('submit', (e) => { e.preventDefault(); search($('q').value); });
  $('results').addEventListener('click', (e) => {
    const b = e.target.closest('[data-pick]');
    if (b) pick(groups[+b.dataset.pick]);
  });
  $('manualBtn').addEventListener('click', () => {
    if (verifyCtl) verifyCtl.abort();
    verify = null;
    $('verifyBox').hidden = true;
    fillForm(C.emptyRecord());
    $('formBox').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  // obálka, která se nenačte, zmizí (bez inline onerror kvůli CSP)
  $('results').addEventListener('error', (e) => { if (e.target.tagName === 'IMG') e.target.remove(); }, true);
  $('bookForm').addEventListener('submit', (e) => e.preventDefault());
  $('bookForm').addEventListener('input', update);
  $('bookForm').addEventListener('change', update);
  $('bookForm').addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) { personRow({}, add.dataset.add); return; }
    const rm = e.target.closest('[data-remove]');
    if (rm) { rm.parentElement.remove(); update(); }
  });
  $('place').addEventListener('input', () => { $('placeHint').hidden = true; });
  $('verifyTable').addEventListener('click', (e) => {
    const b = e.target.closest('[data-use]');
    if (b) useValue(b.dataset.use, b.dataset.src);
  });
  $('copyBtn').addEventListener('click', () => current && copy(current.html, current.text));
  $('copyTextBtn').addEventListener('click', () => current && copy('', current.text, true));
  $('addBtn').addEventListener('click', () => {
    if (!current || !current.text) return;
    if (!biblio.some((b) => b.text === current.text)) biblio.push({ html: current.html, text: current.text });
    store.set(biblioKey(), biblio);
    renderBiblio();
    toast(t('added'));
  });
  $('biblio').addEventListener('click', (e) => {
    const c = e.target.closest('[data-copy-item]');
    if (c) { const b = biblio[+c.dataset.copyItem]; copy(b.html, b.text); return; }
    const d = e.target.closest('[data-del]');
    if (d) { biblio.splice(+d.dataset.del, 1); store.set(biblioKey(), biblio); renderBiblio(); }
  });
  $('copyAllBtn').addEventListener('click', () => {
    copy(biblio.map((b) => `<p>${b.html}</p>`).join(''), biblio.map((b) => b.text).join('\n'));
  });
  $('clearAllBtn').addEventListener('click', () => {
    if (!confirm(t('confirmClear'))) return;
    biblio = [];
    store.set(biblioKey(), biblio);
    renderBiblio();
  });
  $('gkey').value = store.get('citace.gkey', '');
  $('gkey').addEventListener('change', () => store.set('citace.gkey', $('gkey').value.trim()));

  $('edition').addEventListener('input', () => { editionAuto = null; });

  function setLang(next) {
    if (next === lang) return;
    lang = next;
    store.set('citace.lang', lang);
    const url = new URL(location.href);
    if (lang !== 'cs') url.searchParams.set('lang', lang); else url.searchParams.delete('lang');
    history.replaceState(null, '', url);
    applyStaticTexts();
    PRIORITY.forEach((s) => { if (srcState[s]) setSrcState(s, ...srcState[s]); });
    if (!$('formBox').hidden) {
      // automaticky vyplněné vydání přeložíme, ručně psané jen převedeme do zkratek
      const raw = editionAuto === $('edition').value ? editionRaw : $('edition').value;
      editionAuto = $('edition').value = C.normalizeEdition(raw, lang);
      editionRaw = raw;
    }
    if (!$('resultsBox').hidden) { regroup(); renderResults(); }
    biblio = store.get(biblioKey(), []);
    renderBiblio();
    if (!$('citeBox').hidden) update();
  }
  document.querySelectorAll('.lang [data-lang]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));

  applyStaticTexts();
  renderBiblio();
})();
