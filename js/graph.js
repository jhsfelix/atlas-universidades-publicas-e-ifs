(function () {
  "use strict";

  const ATLAS = window.ATLAS;
  const svg = document.getElementById("roda");
  const wrap = document.getElementById("roda-wrap");
  const tip = document.getElementById("tip");
  if (!svg || !ATLAS) return;

  const NS = "http://www.w3.org/2000/svg";
  const CX = 550;
  const CY = 550;
  const R_HUB = 168;
  const R_INST = 322;
  const R_STEP = 25;
  const RINGOS = 5;
  const TIPO_ORDEM = ["federal", "instituto-federal", "estadual", "municipal"];

  const REGRA = {
    "federal": { hub: "mec", rel: "supervisiona", norm: "LDB (Lei 9.394/1996), arts. 9º e 46" },
    "instituto-federal": { hub: "mec", rel: "supervisiona", norm: "Lei 11.892/2008, arts. 1º e 2º" },
    "estadual": { hub: "estados", rel: "mantem", norm: "LDB (Lei 9.394/1996), art. 10" },
    "municipal": { hub: "municipios", rel: "mantem", norm: "LDB (Lei 9.394/1996), arts. 10, I e 11" }
  };

  const byId = new Map();
  for (const n of ATLAS.nodes) byId.set(n.id, n);

  const institucoes = ATLAS.nodes
    .filter(function (n) { return TIPO_ORDEM.indexOf(n.tipo) !== -1; })
    .sort(function (a, b) {
      return (
        TIPO_ORDEM.indexOf(a.tipo) - TIPO_ORDEM.indexOf(b.tipo) ||
        String(a.uf || "").localeCompare(String(b.uf || ""), "pt-BR") ||
        a.label.localeCompare(b.label, "pt-BR")
      );
    });

  const HUB_IDS = ["uniao", "mec", "estados", "municipios", "inep", "capes", "cnpq", "andifes", "conif", "abruem"];

  const edges = [];
  function addEdge(s, t, rel, norm) { edges.push({ s: s, t: t, rel: rel, norm: norm }); }

  addEdge("brasil", "uniao", "integra", "CF/1988, art. 211");
  addEdge("brasil", "estados", "integra", "CF/1988, art. 211, §§ 1º a 3º");
  addEdge("brasil", "municipios", "integra", "CF/1988, art. 211");
  addEdge("uniao", "mec", "integra", "Decreto nº 9.656/2019 (estrutura regulatória do MEC)");

  for (const n of institucoes) {
    const r = REGRA[n.tipo];
    addEdge(r.hub, n.id, r.rel, r.norm);
    addEdge("inep", n.id, "avalia", "Lei 10.861/2004 (SINAES)");
    if (n.tipo !== "municipal") {
      addEdge("capes", n.id, "avalia", "Lei 11.502/2007 (CAPES)");
      addEdge("cnpq", n.id, "fomenta", "Lei 11.502/2007 (CNPq)");
    }
    if (n.tipo === "federal") addEdge("andifes", n.id, "integra", "Estatuto da ANDIFES");
    else if (n.tipo === "instituto-federal") addEdge("conif", n.id, "integra", "Estatuto do CONIF");
    else addEdge("abruem", n.id, "integra", "Estatuto da ABRUEM");
  }

  function pos(deg, r) {
    const a = (deg * Math.PI) / 180;
    return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
  }

  function placeNode(n, deg, r) {
    const p = pos(deg, r);
    n._x = p.x;
    n._y = p.y;
    n._deg = deg;
    n._r = r;
    n._flip = deg > 90 && deg < 270;
  }

  const N = institucoes.length;
  institucoes.forEach(function (n, i) {
    placeNode(n, -90 + ((i + 0.5) * 360) / N, R_INST + (i % RINGOS) * R_STEP);
  });

  HUB_IDS.forEach(function (id, k) {
    const n = byId.get(id);
    if (n) placeNode(n, -90 + (k * 360) / HUB_IDS.length, R_HUB);
  });

  const centro = byId.get("brasil");
  centro._x = CX;
  centro._y = CY;
  centro._r = 0;
  centro._deg = 0;

  function edgePath(e) {
    const a = byId.get(e.s);
    const b = byId.get(e.t);
    const mx = (a._x + b._x) / 2 - CX;
    const my = (a._y + b._y) / 2 - CY;
    const cx = CX + mx * 0.72;
    const cy = CY + my * 0.72;
    return "M" + a._x.toFixed(1) + " " + a._y.toFixed(1) +
      " Q" + cx.toFixed(1) + " " + cy.toFixed(1) +
      " " + b._x.toFixed(1) + " " + b._y.toFixed(1);
  }

  function el(name, attrs, parent) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) {
      if (attrs[k] !== null && attrs[k] !== undefined) e.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(e);
    return e;
  }

  const gGuide = el("g", { class: "guides" }, svg);
  el("circle", { cx: CX, cy: CY, r: R_HUB, class: "guide" }, gGuide);
  for (let i = 0; i < RINGOS; i++) {
    el("circle", { cx: CX, cy: CY, r: R_INST + i * R_STEP, class: "guide" }, gGuide);
  }

  const gEdges = el("g", { class: "edges" }, svg);
  const edgeEls = [];
  edges.forEach(function (e) {
    const p = el("path", { d: edgePath(e), class: "edge rel-" + e.rel }, gEdges);
    p.dataset.s = e.s;
    p.dataset.t = e.t;
    edgeEls.push(p);
  });

  const gNodes = el("g", { class: "nodes" }, svg);
  const nodeEls = new Map();

  ATLAS.nodes.forEach(function (n) {
    const isInst = TIPO_ORDEM.indexOf(n.tipo) !== -1;
    const g = el("g", { class: "node tipo-" + n.tipo + (isInst ? " inst" : "") }, gNodes);
    g.dataset.id = n.id;
    if (n.tipo === "centro") {
      el("circle", { cx: n._x, cy: n._y, r: 34, class: "dot" }, g);
      const t = el("text", { x: n._x, y: n._y, class: "centro-label", "text-anchor": "middle", dy: "0.35em" }, g);
      t.textContent = "Brasil";
    } else {
      el("circle", { cx: n._x, cy: n._y, r: isInst ? 4.6 : 9, class: "dot" }, g);
      const g2 = el("g", { transform: "translate(" + CX + " " + CY + ") rotate(" + n._deg + ") translate(" + n._r + " 0)" }, g);
      const t = el("text", {
        class: isInst ? "label" : "label hub-label",
        x: n._flip ? -9 : 9,
        "text-anchor": n._flip ? "end" : "start",
        dy: n._flip ? "-0.34em" : "0.34em",
        transform: n._flip ? "rotate(180)" : null
      }, g2);
      let texto = n.label;
      if (isInst && n.tipo === "municipal") texto += " (em levantamento)";
      t.textContent = texto;
    }
    nodeEls.set(n.id, g);
  });

  const edgesOf = new Map();
  edges.forEach(function (e, i) {
    if (!edgesOf.has(e.s)) edgesOf.set(e.s, []);
    if (!edgesOf.has(e.t)) edgesOf.set(e.t, []);
    edgesOf.get(e.s).push(i);
    edgesOf.get(e.t).push(i);
  });

  let selected = null;
  let filterActive = false;
  let currentFilter = null;

  function edgesIdx(id) { return edgesOf.get(id) || []; }

  function matchedNode(n, f) {
    if (!TIPO_ORDEM.includes(n.tipo)) return true;
    if (n.tipo === "municipal" && n.uf === null) {
      return f.tipos.has("municipal") && f.uf === "todas" && !f.termo;
    }
    if (!f.tipos.has(n.tipo)) return false;
    if (f.uf !== "todas" && n.uf !== f.uf) return false;
    if (f.termo) {
      const q = f.termo;
      const alvo = (n.label + " " + n.nome + " " + (n.uf || "") + " " + (n.cidade || "")).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (alvo.indexOf(q) === -1) return false;
    }
    return true;
  }

  function applyFilter(f) {
    currentFilter = f;
    const temFiltro = f && (f.tipos.size < TIPO_ORDEM.length || f.uf !== "todas" || f.termo);
    filterActive = !!temFiltro;
    const matched = new Map();
    for (const n of ATLAS.nodes) matched.set(n.id, matchedNode(n, f));
    nodeEls.forEach(function (g, id) {
      if (!TIPO_ORDEM.includes(byId.get(id).tipo)) return;
      g.classList.toggle("off", filterActive && !matched.get(id));
    });
    edgeEls.forEach(function (p) {
      const t = p.dataset.t;
      const alvo = byId.get(t);
      if (TIPO_ORDEM.includes(alvo.tipo)) {
        p.classList.toggle("off", filterActive && !matched.get(t));
      }
    });
  }

  function highlight(id) {
    const idx = edgesIdx(id);
    const keep = new Set([id]);
    idx.forEach(function (i) {
      keep.add(edges[i].s);
      keep.add(edges[i].t);
    });
    edgeEls.forEach(function (p, i) {
      const on = idx.indexOf(i) !== -1;
      p.classList.toggle("hl", on);
      p.classList.toggle("dim", !on);
    });
    nodeEls.forEach(function (g, nid) {
      const on = keep.has(nid);
      g.classList.toggle("hl", on);
      g.classList.toggle("dim", !on);
    });
  }

  function clearHighlight() {
    edgeEls.forEach(function (p) { p.classList.remove("hl", "dim"); });
    nodeEls.forEach(function (g) { g.classList.remove("hl", "dim"); });
    if (filterActive && currentFilter) applyFilter(currentFilter);
  }

  function showTip(n, ev) {
    if (!tip) return;
    const rect = wrap.getBoundingClientRect();
    tip.textContent = n.nome + (n.uf ? " · " + n.uf : "");
    tip.hidden = false;
    const x = ev.clientX - rect.left + 14;
    const y = ev.clientY - rect.top + 14;
    tip.style.left = Math.min(x, rect.width - 240) + "px";
    tip.style.top = y + "px";
  }

  function hideTip() { if (tip) tip.hidden = true; }

  svg.addEventListener("pointerover", function (ev) {
    const g = ev.target.closest("g.node");
    if (!g || selected) return;
    const n = byId.get(g.dataset.id);
    highlight(g.dataset.id);
    showTip(n, ev);
  });

  svg.addEventListener("pointermove", function (ev) {
    if (tip.hidden) return;
    const g = ev.target.closest("g.node");
    if (!g) return;
    const n = byId.get(g.dataset.id);
    showTip(n, ev);
  });

  svg.addEventListener("pointerout", function (ev) {
    const g = ev.target.closest("g.node");
    if (!g || selected) return;
    clearHighlight();
    hideTip();
  });

  svg.addEventListener("click", function (ev) {
    const g = ev.target.closest("g.node");
    if (!g) {
      select(null);
      return;
    }
    if (selected === g.dataset.id) {
      select(null);
      return;
    }
    select(g.dataset.id);
  });

  function select(id) {
    selected = id;
    if (id) {
      highlight(id);
    } else {
      clearHighlight();
    }
    if (window.AtlasRoda && typeof window.AtlasRoda.onSelect === "function") {
      window.AtlasRoda.onSelect(id);
    }
  }

  window.AtlasRoda = {
    edges: edges,
    institucoes: institucoes,
    byId: byId,
    tipos: TIPO_ORDEM,
    select: function (id) { select(id); },
    applyFilter: applyFilter,
    isFilterActive: function () { return filterActive; }
  };
})();
