# Citace knih

Citátor knih podle **ČSN ISO 690:2022**. Napíšeš ISBN, název nebo autora (klidně nepřesně), aplikace knihu najde a sestaví citaci, kterou zkopíruješ i s kurzívou rovnou do Wordu.

## Odkud bere údaje

Všechny zdroje jsou zdarma a bez registrace:

| Zdroj | K čemu |
|---|---|
| [Knihovny.cz](https://www.knihovny.cz) | Centrální portál českých knihoven (včetně Národní knihovny). Hlavní zdroj pro české knihy. |
| [Open Library](https://openlibrary.org) | Zahraniční knihy. |
| [Google Books](https://books.google.com) | Doplňkový zdroj. Bez klíče má denní limit dotazů, klíč jde volitelně vložit v Nastavení. |

## Ověření z více zdrojů

Po výběru knihy se její ISBN dohledá i v ostatních zdrojích. Tabulka u každého údaje (autoři, název, vydání, místo, nakladatel, rok, ISBN) ukáže, jestli zdroje souhlasí (✓), nebo se liší (≠). Hodnotu z jiného zdroje převezmeš tlačítkem „použít“. Už ve výsledcích hledání je vidět, kolik zdrojů danou knihu zná.

## Co aplikace upravuje automaticky

- jména z katalogového tvaru `Němcová, Božena, 1820-1862` → `NĚMCOVÁ, Božena`
- více autorů: oddělení středníkem, poslední spojkou „a“, víc než pět → prvních pět a „et al.“
- vydání: `Vydání druhé, přepracované` → `2., přeprac. vyd.`; první vydání se neuvádí
- interpunkce z katalogů (`Praha :`, `Albatros,`, `Babička /`)
- místo vydání chybí (Google Books ho neuvádí) → odhad podle nakladatele, označený k ověření
- kontrola kontrolního součtu ISBN
- e-knihy: `[online]`, datum citování a „Dostupné z:“

Před použitím citaci vždy zkontroluj. Údaje v katalozích nejsou vždy úplné.

## Můj seznam literatury

Citace jde přidat do seznamu, který se řadí abecedně a kopíruje najednou. Ukládá se jen v tvém prohlížeči.

## Spuštění

Statická stránka bez serveru: `index.html` + `citace.js`. Zapni GitHub Pages (Settings → Pages → Deploy from a branch → `main` / root) a aplikace poběží na `https://castkav.github.io/citace/`.

Testy jádra: `node --test test/*.test.js`
