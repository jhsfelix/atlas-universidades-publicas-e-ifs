// Defesa em profundidade contra clickjacking: o GitHub Pages nao permite
// definir o header X-Frame-Options, entao o site sai do quadro se estiver incorporado.
try {
  if (window.top !== window.self) window.top.location = window.self.location;
} catch (e) { }
