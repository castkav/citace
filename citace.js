/*
 * Jádro citátoru: úprava dat z katalogů a sestavení citace podle ČSN ISO 690:2022.
 * Bez závislostí, funguje v prohlížeči i v Node (kvůli testům).
 */
(function (root) {
  'use strict';

  const UP = (s) => s.toLocaleUpperCase('cs');

  /* ---------- Obecné čištění ---------- */

  // Odstraní interpunkci ISBD na konci údaje („Praha :“, „Albatros,“, „Babička /“).
  function clean(s) {
    if (s == null) return '';
    return String(s)
      .replace(/\s+/g, ' ')
      .replace(/^[\s:;,/=]+/, '')
      .replace(/[\s:;,/=.]+$/, '')
      .trim();
  }

  // „[Praha]“ → „Praha“; neznámé místo → prázdné.
  function cleanPlace(s) {
    let p = clean(String(s || '').replace(/[[\]]/g, ''));
    if (/^(s\.\s*l|b\.\s*m|místo\s+(vydání\s+)?(není\s+)?neznám|sine\s+loco)/i.test(p)) return '';
    return p;
  }

  function cleanPublisher(s) {
    let p = clean(String(s || '').replace(/[[\]]/g, ''));
    if (/^(s\.\s*n|b\.\s*n|nakladatel\s+neznám)/i.test(p)) return '';
    return p;
  }

  // „c2018“, „[2018]“, „2018-05-01“, „May 2018“ → „2018“
  function cleanYear(s) {
    const m = String(s || '').match(/\b(1[5-9]\d{2}|20\d{2})\b/);
    return m ? m[1] : '';
  }

  /* ---------- ISBN ---------- */

  function isbnDigits(s) {
    return String(s || '').toUpperCase().replace(/[^0-9X]/g, '');
  }

  function isValidIsbn(s) {
    const d = isbnDigits(s);
    if (/^\d{9}[\dX]$/.test(d)) {
      let sum = 0;
      for (let i = 0; i < 10; i++) sum += (d[i] === 'X' ? 10 : +d[i]) * (10 - i);
      return sum % 11 === 0;
    }
    if (/^\d{13}$/.test(d)) {
      let sum = 0;
      for (let i = 0; i < 13; i++) sum += +d[i] * (i % 2 ? 3 : 1);
      return sum % 10 === 0;
    }
    return false;
  }

  function isbn10to13(d) {
    const core = '978' + d.slice(0, 9);
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += +core[i] * (i % 2 ? 3 : 1);
    return core + ((10 - (sum % 10)) % 10);
  }

  // Porovnatelný tvar: ISBN-13 bez pomlček.
  function isbnKey(s) {
    const d = isbnDigits(s);
    if (!isValidIsbn(d)) return '';
    return d.length === 10 ? isbn10to13(d) : d;
  }

  // Vytáhne ISBN z textu jako „978-80-00-05056-6 (vázáno)“; zachová pomlčky ze zdroje.
  function extractIsbns(list) {
    const out = [];
    const seen = new Set();
    for (const raw of [].concat(list || [])) {
      const re = /(?:97[89][\d\- ]{10,14}\d|\d[\d\- ]{7,11}[\dXx])/g;
      let m;
      while ((m = re.exec(String(raw)))) {
        const shown = m[0].replace(/\s+/g, '').replace(/-+$/, '');
        const key = isbnKey(shown);
        if (key && !seen.has(key)) { seen.add(key); out.push(shown); }
      }
    }
    // ISBN-13 má přednost
    return out.sort((a, b) => isbnDigits(b).length - isbnDigits(a).length);
  }

  // Rozpozná, že uživatel zadal ISBN.
  function queryIsbn(q) {
    const d = isbnDigits(String(q).replace(/^\s*isbn[:\s]*/i, ''));
    const onlyIsbnChars = /^[\s\d\-xX]+$/.test(String(q).replace(/^\s*isbn[:\s]*/i, ''));
    return onlyIsbnChars && isValidIsbn(d) ? d : '';
  }

  /* ---------- Jména ---------- */

  const PARTICLES = /^(van|von|de|der|den|da|di|du|la|le|del|della|ten|ter|zu)$/i;

  // Katalogový tvar „Němcová, Božena, 1820-1862“ → {family, given}
  function parseInvertedName(raw) {
    const s = String(raw || '').replace(/\([^)]*\)/g, ' ');
    const parts = s.split(',').map(clean).filter(Boolean)
      .filter((p) => !/\d/.test(p) && !/^(autor|author|editor|ed|překladatel|ilustrátor|sest|red|aut|edt|trl)\b/i.test(p));
    if (parts.length >= 2) return { family: parts[0], given: parts.slice(1).join(' ') };
    if (parts.length === 1) return parseNaturalName(parts[0]);
    return { family: '', given: '' };
  }

  // „Božena Němcová“, „Ludwig van Beethoven“ → {family, given}
  function parseNaturalName(raw) {
    const s = clean(raw);
    if (!s) return { family: '', given: '' };
    if (s.includes(',')) return parseInvertedName(s);
    const t = s.split(' ');
    if (t.length === 1) return { family: t[0], given: '' };
    let i = t.length - 1;
    while (i > 1 && PARTICLES.test(t[i - 1])) i--;
    return { family: t.slice(i).join(' '), given: t.slice(0, i).join(' ') };
  }

  function personInverted(p) {
    const fam = UP(clean(p.family));
    const giv = String(p.given || '').replace(/\s+/g, ' ').trim().replace(/,$/, '');
    return giv ? `${fam}, ${giv}` : fam;
  }

  function personNatural(p) {
    return [String(p.given || '').trim(), clean(p.family)].filter(Boolean).join(' ');
  }

  // Do pěti tvůrců všichni, jinak prvních pět a „et al.“
  function formatPersons(list) {
    const names = list.filter((p) => clean(p.family)).map(personInverted);
    if (!names.length) return '';
    if (names.length > 5) return names.slice(0, 5).join('; ') + ' et al.';
    if (names.length === 1) return names[0];
    return names.slice(0, -1).join('; ') + ' a ' + names[names.length - 1];
  }

  /* ---------- Vydání ---------- */

  const ORD_CS = {
    'první': 1, 'druhé': 2, 'třetí': 3, 'čtvrté': 4, 'páté': 5, 'šesté': 6, 'sedmé': 7,
    'osmé': 8, 'deváté': 9, 'desáté': 10, 'jedenácté': 11, 'dvanácté': 12,
  };
  const ORD_EN = {
    first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
  };
  const QUALIFIERS = [
    [/přeprac\w*/i, 'přeprac.'],
    [/rozšíř\w*|rozš\./i, 'rozš.'],
    [/doplň\w*|doplněn\w*|dopl\./i, 'dopl.'],
    [/upraven\w*|upr\./i, 'upr.'],
    [/opraven\w*|opr\./i, 'opr.'],
    [/aktualiz\w*/i, 'aktualiz.'],
    [/revid\w*/i, 'rev.'],
  ];

  function enSuffix(n) {
    if (n % 100 >= 11 && n % 100 <= 13) return 'th';
    return { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th';
  }

  // „Vydání druhé, přepracované“ → „2., přeprac. vyd.“, „První vydání“ → „“ (1. vydání se neuvádí)
  function normalizeEdition(raw) {
    const s = clean(raw);
    if (!s) return '';
    const lower = s.toLocaleLowerCase('cs');

    const english = /\b(edition|ed)\b|\d+(st|nd|rd|th)\b/.test(lower) && !/vyd/.test(lower);
    let n = null;
    const dig = lower.match(/(\d+)\s*(\.|st|nd|rd|th)?/);
    if (dig) n = +dig[1];
    else {
      for (const [w, v] of Object.entries(english ? ORD_EN : ORD_CS)) {
        if (new RegExp('(^|[^\\p{L}])' + w + '($|[^\\p{L}])', 'u').test(lower)) { n = v; break; }
      }
    }
    const quals = QUALIFIERS.filter(([re]) => re.test(lower)).map(([, a]) => a);

    if (n == null) {
      // Neznámý tvar – ponecháme slova, jen zkrátíme „vydání“.
      return s.replace(/vydání/gi, 'vyd.');
    }
    if (english) {
      if (n === 1 && !quals.length) return '';
      return `${n}${enSuffix(n)}${/rev/i.test(lower) ? ' rev.' : ''} ed.`;
    }
    if (n === 1 && !quals.length) return '';
    return quals.length ? `${n}., ${quals.join(' ')} vyd.` : `${n}. vyd.`;
  }

  /* ---------- Odhad místa vydání podle nakladatele ---------- */

  const PUBLISHER_PLACES = [
    [/academia/i, 'Praha'], [/albatros/i, 'Praha'], [/argo/i, 'Praha'], [/grada/i, 'Praha'],
    [/portál/i, 'Praha'], [/euromedia/i, 'Praha'], [/mladá fronta/i, 'Praha'], [/odeon/i, 'Praha'],
    [/paseka/i, 'Praha'], [/torst/i, 'Praha'], [/karolinum/i, 'Praha'], [/vyšehrad/i, 'Praha'],
    [/triton/i, 'Praha'], [/galén/i, 'Praha'], [/wolters kluwer/i, 'Praha'], [/c\. ?h\. ?beck/i, 'Praha'],
    [/fragment/i, 'Praha'], [/ikar/i, 'Praha'], [/slovart/i, 'Praha'], [/práh/i, 'Praha'],
    [/dokořán/i, 'Praha'], [/lidové noviny|\bnln\b/i, 'Praha'], [/baronet/i, 'Praha'], [/plus\b/i, 'Praha'],
    [/knižní klub/i, 'Praha'], [/motto/i, 'Praha'], [/mladá fronta/i, 'Praha'], [/svoboda/i, 'Praha'],
    [/československý spisovatel/i, 'Praha'], [/státní pedagogické|\bspn\b/i, 'Praha'], [/fortuna/i, 'Praha'],
    [/prometheus/i, 'Praha'], [/maxdorf/i, 'Praha'], [/avicenum/i, 'Praha'], [/naše vojsko/i, 'Praha'],
    [/leda/i, 'Voznice'], [/host\b/i, 'Brno'], [/jota/i, 'Brno'], [/computer press/i, 'Brno'],
    [/masarykova univerzita|munipress/i, 'Brno'], [/\bcpress\b/i, 'Brno'], [/moba/i, 'Brno'],
    [/barrister/i, 'Brno'], [/books & pipes/i, 'Brno'], [/větrné mlýny/i, 'Brno'], [/atlantis/i, 'Brno'],
    [/kniha zlín/i, 'Zlín'], [/univerzita palackého/i, 'Olomouc'], [/votobia/i, 'Olomouc'],
    [/ostravská univerzita/i, 'Ostrava'], [/vysoká škola báňská|všb/i, 'Ostrava'],
    [/univerzita karlova/i, 'Praha'], [/čvut|české vysoké učení/i, 'Praha'], [/oeconomica/i, 'Praha'],
    [/západočeská univerzita/i, 'Plzeň'], [/univerzita pardubice/i, 'Pardubice'],
    [/jihočeská univerzita/i, 'České Budějovice'], [/mendelova univerzita/i, 'Brno'],
    [/penguin/i, 'London'], [/oxford university press/i, 'Oxford'], [/cambridge university press/i, 'Cambridge'],
    [/routledge/i, 'London'], [/springer/i, 'Cham'], [/wiley/i, 'Hoboken'], [/o'reilly/i, 'Sebastopol'],
  ];

  function guessPlace(publisher) {
    const p = String(publisher || '');
    for (const [re, place] of PUBLISHER_PLACES) if (re.test(p)) return place;
    return '';
  }

  /* ---------- Normalizace záznamů ze zdrojů ---------- */

  const ROLE_EDITOR = /edt|editor|^ed\.?$|sestav|redak|uspoř|pořad|compil|^com$/i;
  const ROLE_TRANSLATOR = /trl|překl|translat/i;
  const ROLE_AUTHOR = /^aut|autor|author|^cre$/i;

  function splitTitle(title, subtitle) {
    let t = clean(title);
    let sub = clean(subtitle);
    if (!sub) {
      const i = t.indexOf(' : ');
      if (i > 0) { sub = clean(t.slice(i + 3)); t = clean(t.slice(0, i)); }
    } else if (t.toLocaleLowerCase('cs').endsWith(sub.toLocaleLowerCase('cs'))) {
      t = clean(t.slice(0, t.length - sub.length));
    }
    // podnázev se ukončuje před údajem o odpovědnosti („… / Božena Němcová“)
    sub = clean(sub.split(' / ')[0]);
    t = clean(t.split(' / ')[0]);
    return { title: t, subtitle: sub };
  }

  function emptyRecord() {
    return {
      source: '', sourceId: '', link: '', cover: '',
      authors: [], creatorRole: 'aut', corporate: '', translators: [],
      title: '', subtitle: '', edition: '', series: '',
      place: '', placeGuessed: false, publisher: '', year: '', isbn: '', isbns: [],
    };
  }

  function finish(r) {
    if (!r.place && r.publisher) {
      const g = guessPlace(r.publisher);
      if (g) { r.place = g; r.placeGuessed = true; }
    }
    r.isbn = r.isbns[0] || '';
    return r;
  }

  // Záznam z API Knihovny.cz (VuFind)
  function fromKnihovny(rec) {
    const r = emptyRecord();
    r.source = 'knihovny';
    r.sourceId = rec.id || '';
    if (rec.recordPage) r.link = 'https://www.knihovny.cz' + rec.recordPage;
    else if (rec.id) r.link = 'https://www.knihovny.cz/Record/' + encodeURIComponent(rec.id);

    const a = rec.authors || {};
    const asObj = (x) => (x && !Array.isArray(x) && typeof x === 'object' ? x : {});
    const rolesOf = (data) => [].concat((data && data.role) || []).map(String);
    const eds = [];
    for (const [name, data] of Object.entries(asObj(a.primary))) {
      const roles = rolesOf(data);
      const p = parseInvertedName(name);
      if (roles.some((x) => ROLE_EDITOR.test(x)) && !roles.some((x) => ROLE_AUTHOR.test(x))) eds.push(p);
      else r.authors.push(p);
    }
    for (const [name, data] of Object.entries(asObj(a.secondary))) {
      const roles = rolesOf(data);
      const p = parseInvertedName(name);
      if (roles.some((x) => ROLE_AUTHOR.test(x))) r.authors.push(p);
      else if (roles.some((x) => ROLE_EDITOR.test(x))) eds.push(p);
      else if (roles.some((x) => ROLE_TRANSLATOR.test(x))) r.translators.push(p);
    }
    if (!r.authors.length && eds.length) { r.authors = eds; r.creatorRole = 'edt'; }
    const corp = Object.keys(asObj(a.corporate));
    if (!r.authors.length && corp.length) r.corporate = clean(corp[0]);

    Object.assign(r, splitTitle(rec.shortTitle || rec.title, rec.subTitle));
    r.edition = normalizeEdition(rec.edition);
    r.series = clean([].concat(rec.series || []).map((s) => (typeof s === 'string' ? s : s && s.name) || '')[0]);
    r.place = cleanPlace([].concat(rec.placesOfPublication || [])[0]);
    r.publisher = cleanPublisher([].concat(rec.publishers || [])[0]);
    r.year = cleanYear([].concat(rec.publicationDates || [])[0]);
    r.isbns = extractIsbns(rec.isbns);
    if (r.isbns[0]) r.cover = 'https://covers.openlibrary.org/b/isbn/' + isbnDigits(r.isbns[0]) + '-M.jpg?default=false';
    return finish(r);
  }

  // Záznam z Open Library – /api/books?jscmd=data
  function fromOpenLibraryData(d, isbnHint) {
    const r = emptyRecord();
    r.source = 'openlibrary';
    r.link = d.url || '';
    r.authors = (d.authors || []).map((x) => parseNaturalName(x.name));
    Object.assign(r, splitTitle(d.title, d.subtitle));
    r.place = cleanPlace(((d.publish_places || [])[0] || {}).name);
    r.publisher = cleanPublisher(((d.publishers || [])[0] || {}).name);
    r.year = cleanYear(d.publish_date);
    const ids = d.identifiers || {};
    r.isbns = extractIsbns([].concat(ids.isbn_13 || [], ids.isbn_10 || [], isbnHint || []));
    r.cover = (d.cover && (d.cover.medium || d.cover.small)) || '';
    return finish(r);
  }

  // Záznam z vyhledávání Open Library – search.json (dílo + nejlépe odpovídající vydání)
  function fromOpenLibrarySearch(doc) {
    const r = emptyRecord();
    r.source = 'openlibrary';
    r.link = doc.key ? 'https://openlibrary.org' + doc.key : '';
    r.authors = (doc.author_name || []).map(parseNaturalName);
    const ed = (doc.editions && doc.editions.docs && doc.editions.docs[0]) || null;
    const src = ed || doc;
    Object.assign(r, splitTitle(src.title || doc.title, src.subtitle || doc.subtitle));
    r.edition = normalizeEdition(ed && ed.edition_name);
    r.place = cleanPlace((src.publish_place || [])[0]);
    r.publisher = cleanPublisher((src.publisher || [])[0]);
    r.year = cleanYear(ed ? (ed.publish_date || [])[0] : doc.first_publish_year);
    r.isbns = extractIsbns(src.isbn || []);
    if (ed && ed.key) r.link = 'https://openlibrary.org' + ed.key;
    const coverId = (ed && ed.cover_i) || doc.cover_i;
    if (coverId) r.cover = 'https://covers.openlibrary.org/b/id/' + coverId + '-M.jpg';
    r.approximate = !ed; // údaje vydání mohou být smíchané z více vydání
    return finish(r);
  }

  // Záznam z Google Books
  function fromGoogle(item) {
    const v = (item && item.volumeInfo) || {};
    const r = emptyRecord();
    r.source = 'google';
    r.sourceId = item.id || '';
    r.link = v.infoLink || v.canonicalVolumeLink || '';
    r.authors = (v.authors || []).map(parseNaturalName);
    Object.assign(r, splitTitle(v.title, v.subtitle));
    r.publisher = cleanPublisher(v.publisher);
    r.year = cleanYear(v.publishedDate);
    r.isbns = extractIsbns((v.industryIdentifiers || []).filter((x) => /ISBN/.test(x.type)).map((x) => x.identifier));
    const img = v.imageLinks && (v.imageLinks.thumbnail || v.imageLinks.smallThumbnail);
    if (img) r.cover = img.replace(/^http:/, 'https:');
    return finish(r);
  }

  /* ---------- Sestavení citace ---------- */

  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  // Vrací { text, html, warnings }
  function buildCitation(d, opts) {
    opts = opts || {};
    const parts = []; // {text, html, noDot}
    const add = (text, html, noDot) => { if (text) parts.push({ text, html: html == null ? esc(text) : html, noDot }); };
    const warnings = [];

    // Tvůrce
    const persons = (d.authors || []).filter((p) => clean(p.family));
    if (persons.length) {
      let c = formatPersons(persons);
      if (d.creatorRole === 'edt') c += persons.length > 1 ? ' (eds.)' : ' (ed.)';
      add(c);
    } else if (clean(d.corporate)) {
      add(UP(clean(d.corporate)));
    }

    // Název
    const title = clean(d.title);
    const sub = clean(d.subtitle);
    if (!title) warnings.push('Chybí název.');
    const full = sub ? `${title}: ${sub}` : title;
    if (full) {
      const medium = d.online ? ' [online]' : '';
      add(full + medium, `<i>${esc(full)}</i>${medium}`);
    }

    // Vydání
    add(clean(d.edition) ? normalizeEditionLoose(d.edition) : '');

    // Překladatel
    const tr = (d.translators || []).filter((p) => clean(p.family)).map(personNatural);
    if (tr.length) add('Překlad ' + (tr.length > 1 ? tr.slice(0, -1).join(', ') + ' a ' + tr[tr.length - 1] : tr[0]));

    // Edice
    add(clean(d.series));

    // Nakladatelské údaje
    const place = clean(d.place);
    const pub = clean(d.publisher);
    const year = clean(d.year);
    let imprint = '';
    if (place && pub) imprint = `${place}: ${pub}`;
    else imprint = place || pub;
    if (year) imprint = imprint ? `${imprint}, ${year}` : year;
    if (d.online && d.cited) imprint += ` [cit. ${d.cited}]`;
    add(imprint);
    if (!pub) warnings.push('Chybí nakladatel.');
    if (!place) warnings.push('Chybí místo vydání.');
    if (!year) warnings.push('Chybí rok vydání.');

    // ISBN
    const isbn = String(d.isbn || '').trim().replace(/^isbn[:\s]*/i, '');
    if (isbn) {
      add('ISBN ' + isbn);
      if (!isValidIsbn(isbn)) warnings.push('ISBN nemá platný kontrolní součet – zkontroluj ho.');
    }

    // Dostupnost
    if (d.online) {
      const url = String(d.url || '').trim();
      if (url) add('Dostupné z: ' + url, 'Dostupné z: ' + esc(url), true);
      else warnings.push('U online knihy chybí adresa (URL).');
    }

    let text = '';
    let html = '';
    parts.forEach((p, i) => {
      const last = i === parts.length - 1;
      const needsDot = !p.noDot && !/[.!?]$/.test(p.text);
      text += p.text + (needsDot ? '.' : '') + (last ? '' : ' ');
      html += p.html + (needsDot ? '.' : '') + (last ? '' : ' ');
    });
    return { text, html, warnings };
  }

  // Ve formuláři může být vydání napsané volně; „1. vyd.“ necháme, jak je, pokud ho tam uživatel dal.
  function normalizeEditionLoose(s) {
    const c = clean(s);
    return /\bvyd\b(?!\.)/i.test(c) ? c.replace(/\bvyd\b(?!\.)/gi, 'vyd.') : c;
  }

  /* ---------- Porovnání zdrojů ---------- */

  function norm(s) {
    return String(s || '')
      .toLocaleLowerCase('cs')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/\b(nakladatelstvi|nakl|vydavatelstvi|publishing|publishers?|verlag|books|knihy|s\.? ?r\.? ?o|spol|a\.? ?s|ltd|inc|gmbh|group)\b\.?/g, ' ')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  // Shodují se dvě hodnoty daného pole? Vrací 'same' | 'diff' | 'none'
  function compareField(field, a, b) {
    if (field === 'authors') {
      const fa = (a || []).map((p) => norm(p.family)).filter(Boolean).sort();
      const fb = (b || []).map((p) => norm(p.family)).filter(Boolean).sort();
      if (!fa.length || !fb.length) return 'none';
      return fa.some((x) => fb.includes(x)) ? 'same' : 'diff';
    }
    if (field === 'isbn') {
      const ka = new Set([].concat(a || []).map(isbnKey).filter(Boolean));
      const kb = [].concat(b || []).map(isbnKey).filter(Boolean);
      if (!ka.size || !kb.length) return 'none';
      return kb.some((k) => ka.has(k)) ? 'same' : 'diff';
    }
    const na = norm(a);
    const nb = norm(b);
    if (!na || !nb) return 'none';
    if (na === nb) return 'same';
    if (field === 'title' || field === 'publisher' || field === 'subtitle') {
      // „Babička“ vs. „Babička obrazy venkovského života“, „Host“ vs. „Host vydavatelství“
      if (na.startsWith(nb) || nb.startsWith(na)) return 'same';
    }
    return 'diff';
  }

  const api = {
    clean, cleanPlace, cleanPublisher, cleanYear,
    isbnDigits, isValidIsbn, isbnKey, extractIsbns, queryIsbn,
    parseInvertedName, parseNaturalName, formatPersons, personNatural,
    normalizeEdition, guessPlace, splitTitle, emptyRecord,
    fromKnihovny, fromOpenLibraryData, fromOpenLibrarySearch, fromGoogle,
    buildCitation, compareField, norm,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Citace = api;
})(typeof window !== 'undefined' ? window : globalThis);
