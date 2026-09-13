// Supporto per URL "puliti" (client-side routing) su hosting statici che
// non riescono a reindirizzare le rotte dell'app verso index.html (es.
// GitHub Pages). Su Vercel il routing è gestito direttamente da
// vercel.json (rewrites) e questo script non fa nulla; resta qui solo per
// compatibilità con un eventuale deploy su GitHub Pages in futuro.
// Tecnica: https://github.com/rafgraph/spa-github-pages
;(function (l) {
  if (l.search[1] === '/') {
    var decoded = l.search
      .slice(1)
      .split('&')
      .map(function (s) {
        return s.replace(/~and~/g, '&')
      })
      .join('?')
    window.history.replaceState(null, null, l.pathname.slice(0, -1) + decoded + l.hash)
  }
})(window.location)
