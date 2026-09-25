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
  const ORCE = window.ORC_EXEC || null;
  const ORCH = window.ORC_HIST || null;
  const EST = window.ESTADOS || null;
  const CRIACAO = window.CRIACAO || null;
  const MAT = window.MATRICULAS || null;
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

  function fmtInt(v) { return v.toLocaleString("pt-BR"); }

  let UF_AGREG = null;
  function agregUf() {
    if (UF_AGREG) return UF_AGREG;
    const map = {};
    for (const n of R.institucoes) {
      if (!n.uf || !ORC || !ORC.valores[n.id]) continue;
      if (!map[n.uf]) map[n.uf] = { loa: 0, cap: 0, count: 0 };
      map[n.uf].count++;
      const v = ORC.valores[n.id]["2026"].loa;
      map[n.uf].loa += v;
      const capital = EST && EST.ufs[n.uf] ? normaliza(EST.ufs[n.uf].capital) : "";
      if (capital && normaliza(n.cidade) === capital) map[n.uf].cap += v;
    }
    UF_AGREG = map;
    return map;
  }

  function ehCapital(n) {
    if (!EST || !n.uf || !n.cidade) return false;
    return normaliza(n.cidade) === normaliza(EST.ufs[n.uf].capital || "");
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

  let RANKS_AL = null;
  function ranksAluno() {
    if (RANKS_AL) return RANKS_AL;
    RANKS_AL = new Map();
    if (!ORC || !MAT) return RANKS_AL;
    const ls = R.institucoes.filter(function (n) { return ORC.valores[n.id] && MAT.mat[n.id]; })
      .map(function (n) { return { id: n.id, pa: ORC.valores[n.id]["2026"].loa / MAT.mat[n.id] }; })
      .sort(function (a, b) { return b.pa - a.pa; });
    ls.forEach(function (x, i) { RANKS_AL.set(x.id, { pos: i + 1, total: ls.length }); });
    return RANKS_AL;
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

  const ELEM_CORES = ["var(--accent)", "var(--c-federal)", "var(--c-if)", "var(--c-estadual)", "var(--c-municipal)", "#7C828A"];

  function renderExecElementos(id) {
    if (!ORCE) return "";
    const es = ORCE.elementos["2026"][id];
    if (!es || !es.length) return "";
    const tot = es.reduce(function (s, x) { return s + x[2]; }, 0);
    if (!tot) return "";
    const vis = es.filter(function (x) { return x[0] !== "outros"; }).slice(0, 6);
    const outros = es.find(function (x) { return x[0] === "outros"; });
    let html = "<h3>Para onde foi o empenho (2026)</h3><div class='orc-compos'>";
    vis.forEach(function (x, i) {
      const pct = x[2] / tot * 100;
      html += "<div class='orc-compo' title='" + esc(x[1]) + "'><span class='c-k'>" + esc(x[0]) + " · " + esc(x[1]) + "</span><span class='c-v'>" + fmtCompact(x[2]) + " · " + pct.toFixed(1) + "%</span><div class='c-bar'><i style='width:" + Math.max(1, pct) + "%;background:" + ELEM_CORES[i % ELEM_CORES.length] + "'></i></div></div>";
    });
    if (outros && outros[2] > tot * 0.05) {
      html += "<div class='orc-compo'><span class='c-k'>Outros elementos</span><span class='c-v'>" + fmtCompact(outros[2]) + " · " + (outros[2] / tot * 100).toFixed(1) + "%</span><div class='c-bar'><i class='bar-outros' style='width:" + (outros[2] / tot * 100) + "%'></i></div></div>";
    }
    html += "</div>";
    return html;
  }

  function chartLinha(vals, anos, titulo) {
    let max = 0;
    let min = Infinity;
    const idxs = [];
    for (let i = 0; i < vals.length; i++) {
      if (vals[i] == null) continue;
      idxs.push(i);
      if (vals[i] > max) max = vals[i];
      if (vals[i] < min) min = vals[i];
    }
    if (idxs.length < 2) return "";
    const W = 320;
    const H = 92;
    const X0 = 6;
    const X1 = 314;
    const Y0 = 16;
    const Y1 = 74;
    const x = function (i) { return X0 + (i * (X1 - X0)) / (anos.length - 1); };
    const y = function (v) { return Y0 + (Y1 - Y0) * (1 - (v - min) / (max - min || 1)); };
    let d = "";
    for (const i of idxs) {
      d += (d ? " L" : " M") + x(i).toFixed(1) + " " + y(vals[i]).toFixed(1);
    }
    const dArea = d + " L" + x(idxs[idxs.length - 1]).toFixed(1) + " " + Y1 + " L" + x(idxs[0]).toFixed(1) + " " + Y1 + " Z";
    let pontos = "";
    for (const i of idxs) {
      pontos += "<circle cx='" + x(i).toFixed(1) + "' cy='" + y(vals[i]).toFixed(1) + "' r='2.6'><title>" + anos[i] + ": " + fmtCompact(vals[i]) + "</title></circle>";
    }
    const titulos = anos.map(function (a, i) { return a + ": " + (vals[i] == null ? "—" : fmtCompact(vals[i])); }).join(" · ");
    return "<svg class='hist' viewBox='0 0 320 92' role='img' aria-label='" + esc(titulo || "Evolução do orçamento") + "'><title>" + esc(titulos) + "</title>" +
      "<path class='hist-area' d='" + dArea + "'/>" +
      "<path class='hist-linha' d='" + d + "'/>" +
      pontos +
      "<text class='hist-max' x='" + X0 + "' y='10'>" + fmtCompact(max) + "</text>" +
      "<text class='hist-ano' x='" + X0 + "' y='90'>" + anos[idxs[0]] + "</text>" +
      "<text class='hist-ano' x='" + X1 + "' y='90' text-anchor='end'>" + anos[idxs[idxs.length - 1]] + "</text>" +
      "<text class='hist-fim' x='" + X1 + "' y='" + Math.max(10, y(vals[idxs[idxs.length - 1]]) - 6).toFixed(1) + "' text-anchor='end'>" + fmtCompact(vals[idxs[idxs.length - 1]]) + "</text>" +
      "</svg>";
  }

  function renderHist(id) {
    if (!ORCH || !ORCH.valores[id]) return "";
    return chartLinha(ORCH.valores[id], ORCH.anos, "Evolução do orçamento de " + (R.byId.get(id) ? R.byId.get(id).label : ""));
  }

  function renderOrc(orc, n) {
    const rot = n.tipo === "federal" ? "universidades federais" : "Institutos Federais";
    const rank = ranks().get(n.id);
    let html = "<h3>Orçamento (LOA)</h3>";
    if (rank) html += "<p class='orc-rank'>" + fmtCompact(orc["2026"].loa) + " em 2026 · " + rank.pos + "ª maior dotação entre " + rank.total + " " + rot + "</p>";
    if (MAT && MAT.mat[n.id] && orc["2026"] && orc["2026"].loa) {
      const pa = orc["2026"].loa / MAT.mat[n.id];
      const rA = ranksAluno().get(n.id);
      html += "<p class='orc-contexto'>Gasto por aluno: R$ " + fmtInt(Math.round(pa)) + (rA ? " · " + rA.pos + "ª de " + rA.total : "") + " · ~" + fmtInt(MAT.mat[n.id]) + " alunos de graduação (Censo 2024/INEP)</p>";
    }
    if (EST && EST.ufs[n.uf]) {
      const u = agregUf()[n.uf];
      const ufD = EST.ufs[n.uf];
      if (u && u.loa && ufD.pop) {
        const pctInt = 100 - u.cap / u.loa * 100;
        html += "<p class='orc-contexto'>Estado: " + esc(ufD.nome) + " (" + fmtInt(ufD.pop) + " hab. — Censo 2022) · R$ " + fmtInt(Math.round(u.loa / ufD.pop)) + " por habitante nas IES federais do estado · " + pctInt.toFixed(0) + "% do orçamento federal do estado fica fora da capital</p>";
      }
    }
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
    if (ORCE) html += renderExecElementos(n.id);
    html += renderHist(n.id);
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

    if (ORCH) {
      html += "<h3>Evolução 2019–2026</h3>";
      const porAno = ORCH.anos.map(function (a, i) {
        let s = null;
        for (const id of Object.keys(ORCH.valores)) {
          const v = ORCH.valores[id][i];
          if (v != null) s = (s || 0) + v;
        }
        return s;
      });
      html += chartLinha(porAno, ORCH.anos, "Evolução do orçamento das IES federais");
    }

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

    if (EST) {
      const ag = agregUf();
      const porestado = Object.keys(ag).filter(function (uf) { return EST.ufs[uf]; }).map(function (uf) {
        const u = ag[uf];
        return { uf: uf, nome: EST.ufs[uf].nome, pop: EST.ufs[uf].pop, loa: u.loa, pctInt: 100 - u.cap / u.loa * 100, pc: u.loa / EST.ufs[uf].pop };
      });
      let totLoa = 0;
      let totCap = 0;
      for (const it of porestado) { totLoa += it.loa; totCap += it.loa - it.pctInt / 100 * it.loa; }

      const porPc = porestado.slice().sort(function (a, b) { return b.pc - a.pc; });
      const maxPc = porPc.length ? porPc[0].pc : 0;
      html += "<h3>Per capita — orçamento federal das IES por habitante do estado</h3>";
      html += "<ul class='orc-lista'>";
      for (const it of porPc.slice(0, 5)) {
        html += "<li><div class='linha'><span class='l-nome'>" + esc(it.uf) + " · " + esc(it.nome) + "</span><span class='l-v'>R$ " + fmtInt(Math.round(it.pc)) + "/hab</span></div><div class='c-bar'><i style='width:" + (maxPc ? it.pc / maxPc * 100 : 0) + "%;background:var(--accent)'></i></div></li>";
      }
      html += "</ul>";
      html += "<p class='orc-contexto'>Menores: " + porPc.slice(-3).reverse().map(function (x) { return esc(x.uf) + " (R$ " + fmtInt(Math.round(x.pc)) + ")"; }).join(", ") + " · população: Censo 2022 (IBGE)</p>";

      const porInt = porestado.slice().sort(function (a, b) { return b.pctInt - a.pctInt; });
      const totInt = totLoa ? 100 - (totCap / totLoa * 100) : 0;
      html += "<h3>Interiorização — quanto do orçamento federal fica fora das capitais</h3>";
      html += "<p class='orc-contexto'>" + totInt.toFixed(0) + "% dos R$ " + (totLoa / 1e9).toFixed(2).replace(".", ",") + " bilhões das IES federais é aplicado em sedes fora das capitais estaduais.</p>";
      html += "<ul class='orc-lista'>";
      const maxInt = porInt.length ? porInt[0].pctInt : 0;
      for (const it of porInt.slice(0, 5)) {
        html += "<li><div class='linha'><span class='l-nome'>" + esc(it.uf) + " · " + esc(it.nome) + "</span><span class='l-v'>" + it.pctInt.toFixed(0) + "% no interior</span></div><div class='c-bar'><i style='width:" + (maxInt ? it.pctInt / maxInt * 100 : 0) + "%;background:var(--c-if)'></i></div></li>";
      }
      html += "</ul>";
      html += "<p class='orc-contexto'>Menor interiorização: " + porInt.slice(-3).map(function (x) { return esc(x.uf) + " (" + x.pctInt.toFixed(0) + "%)"; }).join(", ") + "</p>";
    }

    if (MAT) {
      const al = R.institucoes.filter(function (n) { return ORC.valores[n.id] && MAT.mat[n.id]; })
        .map(function (n) { return { n: n, pa: ORC.valores[n.id]["2026"].loa / MAT.mat[n.id] }; })
        .sort(function (a, b) { return b.pa - a.pa; });
      const maxPa = al.length ? al[0].pa : 0;
      html += "<h3>Gasto por aluno — LOA 2026 ÷ alunos de graduação</h3>";
      html += "<ul class='orc-lista'>";
      for (const it of al.slice(0, 5)) {
        html += "<li><div class='linha'><span class='l-nome'>" + esc(it.n.label) + "</span><span class='l-v'>R$ " + fmtInt(Math.round(it.pa)) + "/aluno</span></div><div class='c-bar'><i style='width:" + (maxPa ? it.pa / maxPa * 100 : 0) + "%;background:var(--accent)'></i></div></li>";
      }
      html += "</ul>";
      html += "<p class='orc-contexto'>Menores: " + al.slice(-3).reverse().map(function (x) { return esc(x.n.label) + " (R$ " + fmtInt(Math.round(x.pa)) + ")"; }).join(", ") + " · matrículas: Censo 2024 (INEP), graduação das IES federais. IFs atendem também ensino médio e técnico (não contados): o gasto por aluno de graduação deles aparece inflado.</p>";
    }

    if (CRIACAO) {
      const dec = {};
      for (const id of Object.keys(CRIACAO.anos)) dec[Math.floor(CRIACAO.anos[id] / 10) * 10] = (dec[Math.floor(CRIACAO.anos[id] / 10) * 10] || 0) + 1;
      const decs = Object.keys(dec).map(Number).sort(function (a, b) { return a - b; });
      const maxDec = Math.max.apply(null, decs.map(function (d) { return dec[d]; }));
      html += "<h3>Fundação — de onde vêm as IES mapeadas</h3>";
      html += "<ul class='orc-lista'>";
      for (const d of decs) {
        html += "<li><div class='linha'><span class='l-nome'>" + d + "–" + (d + 9) + "</span><span class='l-v'>" + dec[d] + "</span></div><div class='c-bar'><i style='width:" + (dec[d] / maxDec * 100) + "%;background:var(--c-federal)'></i></div></li>";
      }
      html += "</ul>";
      html += "<p class='orc-contexto'>Duas grandes ondas: os anos 1960 e a expansão iniciada nos anos 2000. A UFOP remonta à Escola de Farmácia de Ouro Preto (1839); os 38 IFs resultam da Lei 11.892/2008. Ano da fundação da instituição de origem ou da lei de criação (desmembramentos).</p>";
    }

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
    const mapCont = $("#mapa-uf");
    if (mapCont && mapCont.dataset.pronto) {
      mapCont.querySelectorAll(".uf-cel").forEach(function (cel) {
        cel.classList.toggle("off", state.uf !== "todas" && cel.dataset.uf !== state.uf);
      });
    }
  }
  refresh();

  const busca = $("#busca");
  const resultados = $("#resultados");
  let idxBusca = -1;
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
    idxBusca = -1;
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
    if (n.uf) html += " <span class='ficha-uf'>" + esc(n.uf) + (n.cidade ? " · " + esc(n.cidade) : "") + (ehCapital(n) ? " · capital" : "") + "</span>";
    if (CRIACAO && CRIACAO.anos[n.id]) html += " <span class='ficha-uf'>fundação " + CRIACAO.anos[n.id] + "</span>";
    html += "</p>";
    html += "<h2>" + esc(n.label) + "</h2>";
    html += "<p class='ficha-nome'>" + esc(n.nome) + "</p>";
    if (n.site) html += "<p class='ficha-site'><a href='" + esc(n.site) + "' target='_blank' rel='noopener'>site oficial</a> <button type='button' class='ficha-link'>copiar link</button> <button type='button' class='ficha-link ficha-print'>imprimir / salvar PDF</button> <button type='button' class='ficha-link ficha-compara'>comparar</button></p>";
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
    if (n.site) html += "<p class='ficha-site'><a href='" + esc(n.site) + "' target='_blank' rel='noopener'>site oficial</a> <button type='button' class='ficha-link'>copiar link</button></p>";
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
    const linkBtns = fichaConteudo.querySelectorAll(".ficha-link");
    linkBtns.forEach(function (linkBtn) {
      if (linkBtn.classList.contains("ficha-print")) {
        linkBtn.addEventListener("click", function () { window.print(); });
        return;
      }
      if (linkBtn.classList.contains("ficha-compara")) {
        linkBtn.addEventListener("click", function () {
          toggleComparar(id);
          linkBtn.textContent = compara.indexOf(id) !== -1 ? "na comparação" : "comparar";
        });
        return;
      }
      linkBtn.addEventListener("click", function () {
        const url = location.href.split("?")[0] + (id ? "?id=" + id : "");
        const ok = function () {
          linkBtn.textContent = "link copiado";
          setTimeout(function () { linkBtn.textContent = "copiar link"; }, 1800);
        };
        try { navigator.clipboard.writeText(url).then(ok, ok); } catch (e) { ok(); }
      });
    });
    ficha.hidden = false;
    $("#ficha-fechar").focus();
  }

  function urlDe(id) {
    return location.pathname + (id ? "?id=" + id : "");
  }

  let vista = null;
  R.onSelect = function (id) {
    if (id && !R.byId.has(id)) return;
    if (id) {
      const tEl = $("#tour");
      if (tEl && !tEl.hidden) saiTour();
      vista = "ficha";
      render(id);
    } else {
      vista = null;
      ficha.hidden = true;
    }
    try { history.replaceState(null, "", urlDe(id)); } catch (e) { }
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
    const alvo = ev.target;
    const digitando = alvo && (alvo.tagName === "INPUT" || alvo.tagName === "TEXTAREA" || alvo.tagName === "SELECT");
    if (ev.key === "Escape") {
      R.select(null);
      resultados.hidden = true;
      idxBusca = -1;
    } else if (ev.key === "/" && !digitando) {
      ev.preventDefault();
      busca.focus();
    } else if (!resultados.hidden && (ev.key === "ArrowDown" || ev.key === "ArrowUp")) {
      ev.preventDefault();
      const bts = resultados.querySelectorAll("button");
      if (!bts.length) return;
      idxBusca = ev.key === "ArrowDown" ? Math.min(bts.length - 1, idxBusca + 1) : Math.max(0, idxBusca - 1);
      bts.forEach(function (b, i) { b.classList.toggle("ativo", i === idxBusca); });
    } else if (ev.key === "Enter" && !resultados.hidden) {
      const ativo = resultados.querySelector("button.ativo") || resultados.querySelector("button");
      if (ativo) ativo.click();
    }
  });

  const MAPA_UF = [
    ["RR", 0, 0], ["AP", 1, 0],
    ["AM", 0, 1], ["PA", 1, 1], ["MA", 2, 1], ["PI", 3, 1], ["CE", 4, 1],
    ["AC", 0, 2], ["MT", 1, 2], ["TO", 2, 2], ["BA", 3, 2], ["RN", 4, 2], ["PB", 5, 2], ["PE", 6, 2], ["AL", 7, 2], ["SE", 8, 2],
    ["RO", 0, 3], ["GO", 1, 3], ["MG", 2, 3], ["ES", 3, 3],
    ["MS", 0, 4], ["DF", 1, 4], ["SP", 2, 4], ["RJ", 3, 4],
    ["PR", 2, 5], ["SC", 3, 5],
    ["RS", 2, 6]
  ];

  function constroiMapa() {
    const cont = $("#mapa-uf");
    if (!cont || cont.dataset.pronto) return;
    const porUf = {};
    for (const n of R.institucoes) {
      if (!n.uf) continue;
      if (!porUf[n.uf]) porUf[n.uf] = { count: 0, loa: 0 };
      porUf[n.uf].count++;
      const v = ORC && ORC.valores[n.id];
      if (v) porUf[n.uf].loa += v["2026"].loa;
    }
    let maxCount = 0;
    let maxLoa = 0;
    for (const uf in porUf) {
      if (porUf[uf].count > maxCount) maxCount = porUf[uf].count;
      if (porUf[uf].loa > maxLoa) maxLoa = porUf[uf].loa;
    }
    let html = "<p class='mapa-nota'>Tamanho da bolha = número de IES públicas no estado. Intensidade da cor = orçamento federal (LOA 2026). Clique em um estado para filtrar a roda.</p><div class='uf-grid'>";
    for (const m of MAPA_UF) {
      const uf = m[0];
      const d = porUf[uf] || { count: 0, loa: 0 };
      const diam = d.count ? Math.round(20 + 26 * Math.sqrt(d.count / (maxCount || 1))) : 0;
      const intens = d.loa ? Math.round(18 + 72 * Math.sqrt(d.loa / (maxLoa || 1))) : 0;
      const cor = d.loa ? "background:color-mix(in srgb, var(--accent) " + intens + "%, var(--line))" : "background:var(--line)";
      const pop = EST && EST.ufs[uf] ? EST.ufs[uf].pop : 0;
      html += "<button type='button' class='uf-cel' data-uf='" + uf + "' style='grid-column:" + (m[1] + 1) + ";grid-row:" + (m[2] + 1) + "' title='" + uf + (d.loa ? " · LOA 2026 das IES federais: " + fmtCompact(d.loa) : " · sem IES federal") + "'>" +
        "<span class='uf-bolha' style='width:" + diam + "px;height:" + diam + "px;" + cor + "'></span>" +
        "<span class='uf-sigla'>" + uf + "</span>" +
        "<span class='uf-info'>" + d.count + " IES" + (d.loa ? " · " + fmtCompact(d.loa) + (pop ? " · R$ " + fmtInt(Math.round(d.loa / pop)) + "/hab" : "") : "") + "</span></button>";
    }
    html += "</div>";
    cont.innerHTML = html;
    cont.dataset.pronto = "1";
    cont.addEventListener("click", function (ev) {
      const cel = ev.target.closest(".uf-cel");
      if (!cel) return;
      state.uf = cel.dataset.uf;
      selUf.value = state.uf;
      setModo("roda");
      refresh();
    });
  }

  const btnRoda = $("#modo-roda");
  const btnMapa = $("#modo-mapa");
  function setModo(m) {
    if (btnRoda) btnRoda.classList.toggle("ativo", m === "roda");
    if (btnMapa) btnMapa.classList.toggle("ativo", m === "mapa");
    const wrapEl = $("#roda-wrap");
    const contEl = $("#mapa-uf");
    const dicaEl = $(".dica");
    const tEl = $("#tour");
    if (wrapEl) wrapEl.hidden = m !== "roda";
    if (contEl) contEl.hidden = m !== "mapa";
    if (dicaEl) dicaEl.hidden = m !== "roda";
    if (tEl && !tEl.hidden && m !== "roda") saiTour();
  }
  if (btnRoda) btnRoda.addEventListener("click", function () { setModo("roda"); });
  if (btnMapa) btnMapa.addEventListener("click", function () { constroiMapa(); setModo("mapa"); });

  const chkEscala = $("#chk-escala");
  if (chkEscala) {
    if (!ORC) chkEscala.disabled = true;
    chkEscala.addEventListener("change", function () { R.setEscalaOrcamento(chkEscala.checked); });
  }

  const zoomBtnIn = $("#zoom-in");
  if (zoomBtnIn) zoomBtnIn.addEventListener("click", function () { R.zoomIn(); });
  const zoomBtnOut = $("#zoom-out");
  if (zoomBtnOut) zoomBtnOut.addEventListener("click", function () { R.zoomOut(); });
  const zoomBtnReset = $("#zoom-reset");
  if (zoomBtnReset) zoomBtnReset.addEventListener("click", function () { R.resetZoom(); });

  const PASSOS = [
    { texto: "O sistema: a União, os Estados e os Municípios mantêm o ensino superior público — art. 211 da Constituição.", ids: ["brasil", "uniao", "estados", "municipios"] },
    { texto: "O MEC supervisiona as 69 universidades federais e os 38 Institutos Federais — LDB (arts. 9º e 46) e Lei 11.892/2008.", ids: ["mec"] },
    { texto: "O INEP avalia todas as instituições pelo SINAES — Lei 10.861/2004. É a linha que liga o INEP a cada IES.", ids: ["inep"] },
    { texto: "CAPES avalia e CNPq fomenta a pós-graduação e a pesquisa — Lei 11.502/2007.", ids: ["capes", "cnpq"] },
    { texto: "As associações reúnem os dirigentes: ANDIFES (federais), CONIF (IFs) e ABRUEM (estaduais e municipais).", ids: ["andifes", "conif", "abruem"] },
    { texto: "E quem paga a conta: R$ 98,96 bilhões no LOA 2026 para as 107 IES federais — 83% vão para pessoal e encargos. Abra o painel do Orçamento no topo para explorar.", ids: [] }
  ];
  let passo = 0;
  const tourEl = $("#tour");
  const tourTexto = $("#tour-texto");
  function mostraPasso() {
    const p = PASSOS[passo];
    if (tourTexto) tourTexto.textContent = p.texto;
    const pos = $("#tour-pos");
    if (pos) pos.textContent = (passo + 1) + "/" + PASSOS.length;
    R.highlightMany(p.ids);
  }
  function iniciaTour() {
    passo = 0;
    if (tourEl) tourEl.hidden = false;
    R.setTour(true);
    mostraPasso();
  }
  function saiTour() {
    if (tourEl) tourEl.hidden = true;
    R.setTour(false);
  }
  const btnTour = $("#btn-tour");
  if (btnTour) btnTour.addEventListener("click", iniciaTour);
  const tourProximo = $("#tour-proximo");
  if (tourProximo) tourProximo.addEventListener("click", function () {
    if (passo < PASSOS.length - 1) { passo++; mostraPasso(); } else saiTour();
  });
  const tourAnterior = $("#tour-anterior");
  if (tourAnterior) tourAnterior.addEventListener("click", function () { if (passo > 0) { passo--; mostraPasso(); } });
  const tourSair = $("#tour-sair");
  if (tourSair) tourSair.addEventListener("click", saiTour);

  let compara = [];
  const comparaBar = $("#compara-bar");
  const comparaInfo = $("#compara-info");
  const painelCompara = $("#painel-compara");
  const painelComparaCont = $("#painel-compara-conteudo");
  function atualizaBarra() {
    if (!comparaBar) return;
    if (!compara.length) { comparaBar.hidden = true; return; }
    comparaBar.hidden = false;
    if (comparaInfo) comparaInfo.textContent = compara.map(function (id) { return R.byId.get(id) ? R.byId.get(id).label : ""; }).join(" × ") + (compara.length < 2 ? " — escolha outra instituição" : "");
    const abrir = $("#compara-abrir");
    if (abrir) abrir.disabled = compara.length !== 2;
  }
  function toggleComparar(id) {
    if (compara.indexOf(id) !== -1) compara = compara.filter(function (x) { return x !== id; });
    else if (compara.length >= 2) compara = [compara[1], id];
    else compara.push(id);
    atualizaBarra();
  }
  function renderCompara() {
    if (!painelComparaCont) return;
    let html = "<div class='compara-cols'>";
    for (const id of compara) {
      const n = R.byId.get(id);
      if (!n) continue;
      html += "<div>";
      html += "<p class='ficha-meta'><span class='badge tipo-" + n.tipo + "'>" + ROTULOS[n.tipo] + "</span></p>";
      html += "<h3>" + esc(n.label) + "</h3>";
      html += "<p class='ficha-nome'>" + esc(n.nome) + "</p>";
      if (n.uf) html += "<p class='orc-contexto'>" + esc(n.uf) + (n.cidade ? " · " + esc(n.cidade) : "") + (ehCapital(n) ? " · capital" : "") + (CRIACAO && CRIACAO.anos[id] ? " · fundação " + CRIACAO.anos[id] : "") + "</p>";
      const orc = ORC && ORC.valores[id];
      if (orc) {
        const rank = ranks().get(id);
        html += "<p class='orc-big'>" + fmtCompact(orc["2026"].loa) + "</p>";
        html += "<p class='orc-sub'>LOA 2026" + (rank ? " · " + rank.pos + "ª de " + rank.total + " " + (n.tipo === "federal" ? "universidades federais" : "Institutos Federais") : "") + "</p>";
        if (MAT && MAT.mat[id] && orc["2026"] && orc["2026"].loa) html += "<p class='orc-sub'>~" + fmtInt(MAT.mat[id]) + " alunos de graduação (Censo 2024) · R$ " + fmtInt(Math.round(orc["2026"].loa / MAT.mat[id])) + " por aluno</p>";
        html += renderGnd(id);
        if (ORCH && ORCH.valores[id]) html += chartLinha(ORCH.valores[id], ORCH.anos, "Evolução de " + n.label);
      }
      html += "</div>";
    }
    html += "</div>";
    painelComparaCont.innerHTML = html;
  }
  const btnComparaAbrir = $("#compara-abrir");
  if (btnComparaAbrir) btnComparaAbrir.addEventListener("click", function () {
    renderCompara();
    if (painelCompara) painelCompara.hidden = false;
  });
  const btnComparaFechar = $("#compara-fechar");
  if (btnComparaFechar) btnComparaFechar.addEventListener("click", function () { if (painelCompara) painelCompara.hidden = true; });
  const btnComparaLimpar = $("#compara-limpar");
  if (btnComparaLimpar) btnComparaLimpar.addEventListener("click", function () { compara = []; atualizaBarra(); });

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

  try {
    const p = new URLSearchParams(location.search);
    const idDeep = p.get("id");
    if (idDeep && R.byId.has(idDeep)) R.select(idDeep);
  } catch (e) { }
})();
