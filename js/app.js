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

  const ORC = window.ORCAMENTO || null;
  const ORCD = window.ORC_DESPESAS || null;
  const ORC_CHAVES = [
    { k: "loa", r: "Dotação (LOA)" },
    { k: "autorizado", r: "Autorizado" },
    { k: "empenhado", r: "Empenhado" },
    { k: "liquidado", r: "Liquidado" },
    { k: "pago", r: "Pago" }
  ];
  const GND_ROTULOS = {
    "1": "Pessoal e encargos",
    "2": "Juros e encargos da dívida",
    "3": "Outras despesas correntes",
    "4": "Investimentos",
    "5": "Inversões financeiras",
    "6": "Amortização da dívida",
    "7": "Outros capitais",
    "8": "Reserva de contingência",
    "9": "Postergadas"
  };
  const GND_CORES = {
    "1": "var(--accent)",
    "2": "var(--c-estadual)",
    "3": "var(--c-federal)",
    "4": "var(--c-if)",
    "5": "var(--c-estadual)",
    "6": "var(--c-municipal)",
    "7": "var(--c-municipal)",
    "8": "var(--c-municipal)",
    "9": "var(--c-municipal)"
  };

  function fmtCompact(v) {
    if (v >= 1e9) return "R$ " + (v / 1e9).toFixed(2).replace(".", ",") + " bi";
    if (v >= 1e6) return "R$ " + (v / 1e6).toFixed(1).replace(".", ",") + " mi";
    return "R$ " + v.toLocaleString("pt-BR");
  }

  function execBar(v) {
    if (!v || !v.autorizado) return "";
    const base = v.autorizado;
    const pctPago = v.pago / base * 100;
    const pctLiq = v.liquidado / base * 100;
    const pctEmp = v.empenhado / base * 100;
    const wp = Math.max(0, Math.min(100, pctPago));
    const wl = Math.max(0, Math.min(100 - wp, pctLiq - pctPago));
    const we = Math.max(0, Math.min(100 - wp - wl, pctEmp - pctLiq));
    const tt = "Pago: " + fmtCompact(v.pago) + " (" + pctPago.toFixed(1) + "%) · Liquidado: " + fmtCompact(v.liquidado) + " (" + pctLiq.toFixed(1) + "%) · Empenhado: " + fmtCompact(v.empenhado) + " (" + pctEmp.toFixed(1) + "%) · Autorizado: " + fmtCompact(base);
    return "<tr><td colspan='2' class='orc-exec'><div class='orc-exec-bar' title='" + esc(tt) + "'>" +
      "<span class='seg seg-pago' style='width:" + wp + "%'></span>" +
      "<span class='seg seg-liq' style='width:" + wl + "%'></span>" +
      "<span class='seg seg-emp' style='width:" + we + "%'></span>" +
      "</div><div class='orc-exec-leg'>" +
      "<span><i class='pt pt-pago'></i>pago " + pctPago.toFixed(0) + "%</span>" +
      "<span><i class='pt pt-liq'></i>liquidado " + pctLiq.toFixed(0) + "%</span>" +
      "<span><i class='pt pt-emp'></i>empenhado " + pctEmp.toFixed(0) + "%</span>" +
      "<span><i class='pt pt-resto'></i>sem empenho " + Math.max(0, 100 - pctEmp).toFixed(0) + "%</span>" +
      "</div></td></tr>";
  }

  let RANKS = null;
  function ranks() {
    if (RANKS) return RANKS;
    RANKS = new Map();
    const porTipo = { "federal": [], "instituto-federal": [] };
    R.institucoes.forEach(function (n) { if (porTipo[n.tipo]) porTipo[n.tipo].push(n); });
    for (const tipo in porTipo) {
      porTipo[tipo].sort(function (a, b) {
        const va = ORC.valores[a.id] ? ORC.valores[a.id]["2026"].loa : 0;
        const vb = ORC.valores[b.id] ? ORC.valores[b.id]["2026"].loa : 0;
        return vb - va;
      });
      porTipo[tipo].forEach(function (n, i) { RANKS.set(n.id, { pos: i + 1, total: porTipo[tipo].length }); });
    }
    return RANKS;
  }

  function renderGnd(id) {
    const gs = ORCD.gnd["2026"][id];
    if (!gs || !gs.length) return "";
    const tot = gs.reduce(function (s, x) { return s + x[3]; }, 0);
    const linhas = gs.slice().sort(function (a, b) { return b[3] - a[3]; }).map(function (g) {
      const pct = tot ? g[3] / tot * 100 : 0;
      return "<div class='orc-compo'><span class='c-k'>" + esc(GND_ROTULOS[g[0]] || g[1]) + "</span><span class='c-v'>" + fmtCompact(g[3]) + " · " + pct.toFixed(1) + "%</span><div class='c-bar'><i style='width:" + Math.max(1, pct) + "%;background:" + (GND_CORES[g[0]] || "var(--muted)") + "'></i></div></div>";
    }).join("");
    return "<h3>Onde vai o dinheiro (2026)</h3><div class='orc-compos'>" + linhas + "</div>";
  }

  function renderAcoes(id) {
    const as = ORCD.acoes["2026"][id];
    if (!as || !as.length) return "";
    const tot = as.reduce(function (s, x) { return s + x[2]; }, 0);
    if (!tot) return "";
    const vis = as.filter(function (x) { return x[0] !== "outros"; }).slice(0, 5);
    const outros = as.find(function (x) { return x[0] === "outros"; });
    const linhas = vis.map(function (x) {
      return "<li title='" + esc(x[1]) + "'><div class='linha'><span class='a-nome'>" + esc(x[0]) + " · " + esc(x[1]) + "</span><span class='a-v'>" + fmtCompact(x[2]) + "</span></div><div class='c-bar'><i style='width:" + Math.max(1, x[2] / tot * 100) + "%'></i></div></li>";
    }).join("");
    let outrosLinha = "";
    if (outros && outros[2] > tot * 0.05) {
      outrosLinha = "<li><div class='linha'><span class='a-nome'>Outras ações</span><span class='a-v'>" + fmtCompact(outros[2]) + "</span></div><div class='c-bar'><i class='bar-outros' style='width:" + (outros[2] / tot * 100) + "%'></i></div></li>";
    }
    return "<h3>Principais ações (2026)</h3><ul class='orc-acoes'>" + linhas + outrosLinha + "</ul>";
  }

  function renderOrc(orc, n) {
    const rot = n.tipo === "federal" ? "universidades federais" : "Institutos Federais";
    const rank = ranks().get(n.id);
    let html = "<h3>Orçamento (LOA)</h3>";
    if (rank) html += "<p class='orc-rank'>" + fmtCompact(orc["2026"].loa) + " em 2026 · " + rank.pos + "ª maior dotação entre " + rank.total + " " + rot + "</p>";
    html += "<table class='ficha-orc'>";
    for (const ano of ORC.meta.exercicios) {
      const v = orc[ano];
      if (!v) continue;
      html += "<tr><td colspan='2' class='orc-ano'>" + esc(ano) + (ano === "2026" ? " (em execução)" : "") + "</td></tr>";
      for (const c of ORC_CHAVES) {
        const val = v[c.k];
        if (val == null) continue;
        html += "<tr><td class='k'>" + c.r + "</td><td class='v' title='" + val.toLocaleString("pt-BR") + "'>" + fmtCompact(val) + "</td></tr>";
      }
      if (ano === "2026") html += execBar(v);
    }
    html += "</table>";
    if (ORCD) html += renderGnd(n.id) + renderAcoes(n.id);
    html += "<p class='ficha-fonte'>Fonte: <a href='" + esc(ORC.meta.url) + "' target='_blank' rel='noopener'>" + esc(ORC.meta.fonte) + "</a> · dados abertos. Exclui unidades de hospitais universitários (EBSERH).</p>";
    return html;
  }

  function renderOrcamento() {
    const tot = ORC.meta.totais;
    const t26 = tot["2026"];
    const t25 = tot["2025"];
    const porTipo = { "federal": 0, "instituto-federal": 0 };
    const cntPorTipo = { "federal": 0, "instituto-federal": 0 };
    R.institucoes.forEach(function (n) {
      const v = ORC.valores[n.id];
      if (!v || porTipo[n.tipo] == null) return;
      porTipo[n.tipo] += v["2026"].loa;
      cntPorTipo[n.tipo]++;
    });
    const gnd = {};
    for (const id of Object.keys(ORCD.gnd["2026"])) {
      for (const g of ORCD.gnd["2026"][id]) gnd[g[0]] = (gnd[g[0]] || 0) + g[3];
    }
    const gndTotal = Object.keys(gnd).reduce(function (s, k) { return s + gnd[k]; }, 0);
    const gndArr = Object.keys(gnd).map(function (k) { return { k: k, v: gnd[k] }; }).sort(function (a, b) { return b.v - a.v; });

    const lista = R.institucoes.filter(function (n) { return ORC.valores[n.id]; })
      .map(function (n) { return { n: n, loa: ORC.valores[n.id]["2026"].loa }; })
      .sort(function (a, b) { return b.loa - a.loa; });
    const max = lista.length ? lista[0].loa : 0;

    const nIes = Object.keys(ORC.valores).length;
    let html = "<p class='ficha-meta'><span class='badge tipo-federal'>" + nIes + " IES federais</span></p>";
    html += "<h2>Orçamento</h2>";
    html += "<p class='orc-big'>" + fmtCompact(t26.loa) + "</p>";
    const cresc = t25.loa ? (((t26.loa / t25.loa) - 1) * 100).toFixed(0) : "0";
    html += "<p class='orc-sub'>dotação inicial do LOA 2026 · autorizado: " + fmtCompact(t26.autorizado) + " · LOA 2025: " + fmtCompact(t25.loa) + " (+" + cresc + "%)</p>";

    html += "<h3>Federais × Institutos Federais</h3>";
    const totTipo = porTipo["federal"] + porTipo["instituto-federal"];
    const ufPct = totTipo ? porTipo["federal"] / totTipo * 100 : 0;
    html += "<div class='orc-stack'><span style='width:" + ufPct + "%;background:var(--c-federal)'></span><span style='width:" + (100 - ufPct) + "%;background:var(--c-if)'></span></div>";
    html += "<div class='orc-leg'><span><i style='background:var(--c-federal)'></i>" + cntPorTipo["federal"] + " universidades · " + fmtCompact(porTipo["federal"]) + " (" + ufPct.toFixed(0) + "%)</span><span><i style='background:var(--c-if)'></i>" + cntPorTipo["instituto-federal"] + " IFs · " + fmtCompact(porTipo["instituto-federal"]) + " (" + (100 - ufPct).toFixed(0) + "%)</span></div>";

    html += "<h3>Composição por grupo de despesa (2026)</h3>";
    html += "<div class='orc-stack'>" + gndArr.map(function (g) { return "<span style='width:" + (g.v / gndTotal * 100) + "%;background:" + (GND_CORES[g.k] || "var(--muted)") + "'></span>"; }).join("") + "</div>";
    html += "<div class='orc-leg'>" + gndArr.map(function (g) { return "<span><i style='background:" + (GND_CORES[g.k] || "var(--muted)") + "'></i>" + esc(GND_ROTULOS[g.k] || g.k) + " · " + (g.v / gndTotal * 100).toFixed(0) + "% · " + fmtCompact(g.v) + "</span>"; }).join("") + "</div>";

    html += "<div class='orc-listas'>";
    html += "<div><h3 class='h3-min'>Maiores dotações (2026)</h3><ul class='orc-lista'>";
    for (const it of lista.slice(0, 5)) {
      html += "<li><div class='linha'><span class='l-nome'>" + esc(it.n.label) + "</span><span class='l-v'>" + fmtCompact(it.loa) + "</span></div><div class='c-bar'><i style='width:" + (max ? it.loa / max * 100 : 0) + "%;background:var(--c-federal)'></i></div></li>";
    }
    html += "</ul></div>";
    html += "<div><h3 class='h3-min'>Menores dotações (2026)</h3><ul class='orc-lista'>";
    for (const it of lista.slice(-5).reverse()) {
      html += "<li><div class='linha'><span class='l-nome'>" + esc(it.n.label) + "</span><span class='l-v'>" + fmtCompact(it.loa) + "</span></div><div class='c-bar'><i style='width:" + (max ? Math.max(1, it.loa / max * 100) : 0) + "%;background:var(--c-if)'></i></div></li>";
    }
    html += "</ul></div>";
    html += "</div>";

    html += "<p class='ficha-fonte'>Fonte: <a href='" + esc(ORC.meta.url) + "' target='_blank' rel='noopener'>" + esc(ORC.meta.fonte) + "</a> · dados abertos. LOA e execução das unidades orçamentárias próprias; exclui hospitais universitários (EBSERH) e instituições estaduais/municipais.</p>";
    return html;
  }

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
    const orc = ORC && ORC.valores[n.id];
    if (orc) html += renderOrc(orc, n);
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

  let vista = null;
  R.onSelect = function (id) {
    if (id) {
      vista = "ficha";
      render(id);
      return;
    }
    vista = null;
    ficha.hidden = true;
  };

  const btnOrc = $("#btn-orc");
  if (btnOrc && ORC && ORCD) {
    document.getElementById("stat-loa").textContent = fmtCompact(ORC.meta.totais["2026"].loa);
    btnOrc.addEventListener("click", function () {
      vista = "orcamento";
      fichaConteudo.innerHTML = renderOrcamento();
      ficha.hidden = false;
      $("#ficha-fechar").focus();
    });
  } else if (btnOrc) {
    btnOrc.hidden = true;
  }

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
