/*
 * Nastavení webu. Tento soubor uprav až na webhostingu.
 *
 * googleBooksKey: klíč Google Books API, který budou používat všichni návštěvníci.
 *   Prázdný = Google Books funguje bez klíče (s denním limitem).
 *   Klíč je v tomto souboru veřejně čitelný, proto ho v Google Cloud Console omez:
 *   - Application restrictions → Websites → https://akademikus.cz/* a https://www.akademikus.cz/*
 *   - API restrictions → jen Books API
 *   Uživatel může mít v Nastavení vlastní klíč, ten má přednost.
 */
window.CITACE_CONFIG = {
  googleBooksKey: '',
};
