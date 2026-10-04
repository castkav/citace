// Spuštění: node --test test/
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../citace.js');

test('vydání', () => {
  assert.equal(C.normalizeEdition('Vydání první'), '');
  assert.equal(C.normalizeEdition('1. vydání'), '');
  assert.equal(C.normalizeEdition('Druhé vydání'), '2. vyd.');
  assert.equal(C.normalizeEdition('Vydání 25., v Albatrosu 4.'), '25. vyd.');
  assert.equal(C.normalizeEdition('3., přepracované a rozšířené vydání'), '3., přeprac. rozš. vyd.');
  assert.equal(C.normalizeEdition('2nd edition'), '2nd ed.');
  assert.equal(C.normalizeEdition('Second edition'), '2nd ed.');
  assert.equal(C.normalizeEdition('First edition'), '');
});

test('jména', () => {
  assert.deepEqual(C.parseInvertedName('Němcová, Božena, 1820-1862'), { family: 'Němcová', given: 'Božena' });
  assert.deepEqual(C.parseInvertedName('Čapek, Karel, 1890-1938, autor'), { family: 'Čapek', given: 'Karel' });
  assert.deepEqual(C.parseNaturalName('J. R. R. Tolkien'), { family: 'Tolkien', given: 'J. R. R.' });
  assert.deepEqual(C.parseNaturalName('Ludwig van Beethoven'), { family: 'van Beethoven', given: 'Ludwig' });
});

test('autoři – středník, „a“, et al.', () => {
  const p = (f, g) => ({ family: f, given: g });
  assert.equal(C.formatPersons([p('Novák', 'Jan'), p('Dvořák', 'Petr')]), 'NOVÁK, Jan a DVOŘÁK, Petr');
  assert.equal(C.formatPersons([p('A', 'a'), p('B', 'b'), p('C', 'c')]), 'A, a; B, b a C, c');
  assert.equal(C.formatPersons('ABCDEF'.split('').map((x) => p(x, 'x'))), 'A, x; B, x; C, x; D, x; E, x et al.');
});

test('ISBN', () => {
  assert.ok(C.isValidIsbn('978-0-306-40615-7'));
  assert.ok(!C.isValidIsbn('978-0-306-40615-8'));
  assert.equal(C.isbnKey('0-306-40615-2'), '9780306406157');
  assert.deepEqual(C.extractIsbns(['978-0-306-40615-7 (vázáno)', '0-306-40615-2']), ['978-0-306-40615-7']);
  assert.equal(C.queryIsbn('ISBN 978-0-306-40615-7'), '9780306406157');
  assert.equal(C.queryIsbn('babička'), '');
});

test('záznam z Knihovny.cz', () => {
  const r = C.fromKnihovny({
    id: 'mzk.MZK01-1',
    title: 'Babička : obrazy venkovského života /',
    shortTitle: 'Babička :',
    subTitle: 'obrazy venkovského života /',
    authors: { primary: { 'Němcová, Božena, 1820-1862': { role: ['aut'] } }, secondary: [], corporate: [] },
    edition: 'Vydání 25.',
    placesOfPublication: ['Praha :'],
    publishers: ['Albatros,'],
    publicationDates: ['2018'],
    isbns: ['978-0-306-40615-7 (vázáno)'],
  });
  assert.equal(r.title, 'Babička');
  assert.equal(r.subtitle, 'obrazy venkovského života');
  const c = C.buildCitation(r);
  assert.equal(c.text, 'NĚMCOVÁ, Božena. Babička: obrazy venkovského života. 25. vyd. Praha: Albatros, 2018. ISBN 978-0-306-40615-7.');
  assert.equal(c.html, 'NĚMCOVÁ, Božena. <i>Babička: obrazy venkovského života</i>. 25. vyd. Praha: Albatros, 2018. ISBN 978-0-306-40615-7.');
  assert.deepEqual(c.warnings, []);
});

test('editor, překlad, edice, online', () => {
  const c = C.buildCitation({
    authors: [{ family: 'Novák', given: 'Jan' }], creatorRole: 'edt',
    title: 'Sborník', translators: [{ family: 'Dvořák', given: 'Petr' }], series: 'Studie; 3',
    place: 'Brno', publisher: 'Host', year: '2020', online: true, cited: '2026-10-04', url: 'https://example.org/kniha',
  });
  assert.equal(c.text, 'NOVÁK, Jan (ed.). Sborník [online]. Překlad Petr Dvořák. Studie; 3. Brno: Host, 2020 [cit. 2026-10-04]. Dostupné z: https://example.org/kniha');
});

test('Google Books bez místa – odhad podle nakladatele', () => {
  const r = C.fromGoogle({ volumeInfo: { title: 'Saturnin', authors: ['Zdeněk Jirotka'], publisher: 'Nakladatelství Argo', publishedDate: '2011-03-01' } });
  assert.equal(r.place, 'Praha');
  assert.equal(r.placeGuessed, true);
  assert.equal(C.buildCitation(r).text, 'JIROTKA, Zdeněk. Saturnin. Praha: Nakladatelství Argo, 2011.');
});

test('porovnání polí', () => {
  assert.equal(C.compareField('publisher', 'Albatros', 'Nakladatelství Albatros'), 'same');
  assert.equal(C.compareField('year', '2018', '2019'), 'diff');
  assert.equal(C.compareField('isbn', ['0-306-40615-2'], ['9780306406157']), 'same');
  assert.equal(C.compareField('title', 'Babička', 'Babicka'), 'same');
});
