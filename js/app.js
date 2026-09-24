(function () {
  "use strict";

  const A = window.ATLAS;
  const R = window.AtlasRoda;
  if (!A || !R) return;

  const $ = function (sel) { return document.querySelector(sel); };

  const TIPO_ORDEM = ["federal", "instituto-federal", "estadual", "municipal"];
  const ROTULOS = {
    "federal": "Universidade federal",
    "instituto-federal": "Instituto Federal",
    "estadual": "Universidade estadual",
    "municipal": "Universidade municipal"
  };
  const REL_ROTULOS = {
    mantem: "mantém",
    supervisiona: "supervisiona",
    avalia: "avalia",
    fomenta: "fomenta",
    integra: "integra"
  };

  document.getElementById("stat-nos").textContent = A.nodes.length;
  document.getElementById("stat-rel").textContent = R.edges.length;
  const inst = R.institucoes.length;
  document.getElementById("stat-inst").textContent = inst;
  const partes = A.meta.atualizado.split("-");
  document.getElementById("stat-data").textContent = partes[2] + "/" + partes[1] + "/" + partes[0];

  const state = {
    tipos: new Set(TIPO_ORDEM),
    uf: "todas",
    termo: null
  };

  const selUf = $("#filtro-uf");
  const ufs = Array.from(new Set(R.institucoes.map(function (n) { return n.uf; }).filter(Boolean))).sort();
  for (const uf of ufs) {
    const o = document.createElement("option");
    o.value = uf;
    o.textContent = uf;
    selUf.appendChild(o);
  }
  selUf.addEventListener("change", function () {
    state.uf = selUf.value;
    refresh();
  });

  document.querySelectorAll('input[name="tipo"]').forEach(function (cb) {
    cb.addEventListener("change", function () {
      if (cb.checked) state.tipos.add(cb.value);
      else state.tipos.delete(cb.value);
      if (state.tipos.size === 0) {
        cb.checked = true;
        state.tipos.add(cb.value);
        return;
      }
      refresh();
    });
  });

  const btnReset = $("#btn-reset");
  if (btnReset) {
    btnReset.addEventListener("click", function () {
      state.tipos = new Set(TIPO_ORDEM);
      state.uf = "todas";
      state.termo = null;
      $("#busca").value = "";
      selUf.value = "todas";
      document.querySelectorAll('input[name="tipo"]').forEach(function (cb) { cb.checked = true; });
      $("#resultados").hidden = true;
      R.select(null);
      refresh();
    });
  }

  function refresh() {
    R.applyFilter(state);
    const visiveis = R.institucoes.filter(function (n) { return state.tipos.has(n.tipo) && (state.uf === "todas" || n.uf === state.uf); });
    $("#contagem").textContent = visiveis.length + " de " + R.institucoes.length + " instituições em foco";
  }
  refresh();

  const busca = $("#busca");
  const resultados = $("#resultados");
  function normaliza(s) {
    return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  busca.addEventListener("input", function () {
    const q = normaliza(busca.value.trim());
    state.termo = q || null;
    refresh();
    if (!q) {
      resultados.hidden = true;
      resultados.innerHTML = "";
      return;
    }
    const itens = R.institucoes.filter(function (n) {
      const alvo = normaliza(n.label + " " + n.nome + " " + (n.uf || "") + " " + (n.cidade || ""));
      return alvo.indexOf(q) !== -1;
    }).slice(0, 8);
    resultados.innerHTML = "";
    if (itens.length === 0) {
      const li = document.createElement("li");
      li.textContent = "Nada encontrado.";
      resultados.appendChild(li);
      resultados.hidden = false;
      return;
    }
    for (const n of itens) {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.innerHTML = "<strong>" + n.label + "</strong><span>" + n.nome + (n.uf ? " · " + n.uf : "") + "</span>";
      b.addEventListener("click", function () {
        R.select(n.id);
        resultados.hidden = true;
      });
      li.appendChild(b);
      resultados.appendChild(li);
    }
    resultados.hidden = false;
  });

  const ficha = $("#ficha");
  const fichaConteudo = $("#ficha-conteudo");

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function relacoesDe(id) {
    return R.edges.filter(function (e) { return e.t === id || e.s === id; });
  }

  function renderInstituicao(n) {
    const rels = R.edges.filter(function (e) { return e.t === n.id; });
    let html = "<p class='ficha-meta'><span class='badge tipo-" + n.tipo + "'>" + ROTULOS[n.tipo] + "</span>";
    if (n.uf) html += " <span class='ficha-uf'>" + esc(n.uf) + (n.cidade ? " · " + esc(n.cidade) : "") + "</span>";
    html += "</p>";
    html += "<h2>" + esc(n.label) + "</h2>";
    html += "<p class='ficha-nome'>" + esc(n.nome) + "</p>";
    if (n.site) html += "<p class='ficha-site'><a href='" + esc(n.site) + "' target='_blank' rel='noopener'>site oficial</a></p>";
    html += "<h3>Quem manda aqui</h3><ul class='ficha-rels'>";
    for (const e of rels) {
      const origem = R.byId.get(e.s);
      html += "<li><strong>" + esc(origem.label) + "</strong> <span class='rel-nome'>" + (REL_ROTULOS[e.rel] || e.rel) + "</span>" + (e.norm ? "<span class='rel-norma'>" + esc(e.norm) + "</span>" : "") + "</li>";
    }
    html += "</ul>";
    return html;
  }

  function renderHub(n) {
    const saidas = R.edges.filter(function (e) { return e.s === n.id; });
    const grupos = {};
    for (const e of saidas) {
      if (!grupos[e.rel]) grupos[e.rel] = [];
      grupos[e.rel].push(e.t);
    }
    let html = "<p class='ficha-meta'><span class='badge tipo-" + n.tipo + "'>" + esc(A.tipos[n.tipo] ? A.tipos[n.tipo].rotulo : n.tipo) + "</span></p>";
    html += "<h2>" + esc(n.label) + "</h2>";
    html += "<p class='ficha-nome'>" + esc(n.nome) + "</p>";
    if (n.site) html += "<p class='ficha-site'><a href='" + esc(n.site) + "' target='_blank' rel='noopener'>site oficial</a></p>";
    if (n.desc) html += "<p class='ficha-desc'>" + esc(n.desc) + "</p>";
    if (saidas.length) {
      html += "<h3>Relações (" + saidas.length + ")</h3><ul class='ficha-rels'>";
      for (const rel of Object.keys(grupos)) {
        const tipos = {};
        for (const t of grupos[rel]) {
          const tn = R.byId.get(t).tipo;
          tipos[tn] = (tipos[tn] || 0) + 1;
        }
        const resumo = Object.keys(tipos).map(function (k) { return tipos[k] + " " + (ROTULOS[k] ? ROTULOS[k].toLowerCase() : k); }).join(", ");
        html += "<li><span class='rel-nome'>" + (REL_ROTULOS[rel] || rel) + "</span> <span class='rel-resumo'>" + esc(resumo) + "</span></li>";
      }
      html += "</ul>";
    }
    return html;
  }

  function render(id) {
    if (!id) {
      ficha.hidden = true;
      return;
    }
    const n = R.byId.get(id);
    if (!n) return;
    if (n.tipo === "municipal" && n.uf === null) {
      fichaConteudo.innerHTML = "<p class='ficha-meta'><span class='badge tipo-municipal'>Em levantamento</span></p><h2>Municipais</h2><p class='ficha-nome'>" + esc(n.nome) + "</p><p class='ficha-desc'>" + esc(n.nota) + "</p>";
    } else if (n.tipo === "federal" || n.tipo === "instituto-federal" || n.tipo === "estadual") {
      fichaConteudo.innerHTML = renderInstituicao(n);
    } else {
      fichaConteudo.innerHTML = renderHub(n);
    }
    ficha.hidden = false;
    $("#ficha-fechar").focus();
  }

  R.onSelect = render;

  $("#ficha-fechar").addEventListener("click", function () {
    R.select(null);
  });

  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") {
      R.select(null);
      resultados.hidden = true;
    }
  });

  const btnTema = $("#btn-tema");
  function aplicaTema(t) {
    document.documentElement.setAttribute("data-theme", t);
    btnTema.setAttribute("aria-label", t === "dark" ? "Ativar tema claro" : "Ativar tema escuro");
  }
  let tema = null;
  try { tema = localStorage.getItem("atlas-tema"); } catch (e) { tema = null; }
  if (!tema) tema = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  aplicaTema(tema);
  btnTema.addEventListener("click", function () {
    tema = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    try { localStorage.setItem("atlas-tema", tema); } catch (e) { }
    aplicaTema(tema);
  });

  if (A.meta.repo) {
    document.getElementById("link-issues").href = A.meta.repo + "/issues";
    document.getElementById("link-repo").href = A.meta.repo;
  }
})();
