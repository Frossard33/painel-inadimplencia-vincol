(function () {
  "use strict";

  /* ---------- Dados ---------- */
  var FILIAIS = [
    { id: "01", nome: "Três Poços" },
    { id: "02", nome: "Ponte Alta" },
    { id: "03", nome: "Barra Mansa" },
    { id: "04", nome: "Beira Rio" },
    { id: "06", nome: "Resende" },
    { id: "OUT", nome: "Outras filiais (05 e 08)" }
  ];
  var BOLETO = "Boletos";
  var CATEGORIAS = [BOLETO, "Judicial", "Cobrança Extrajudicial", "Dívida Antiga", "Órgão Público", "Depósito"];
  var PEND = ["Frota", "Auditoria", "Tesouraria", "Permuta", "Pneustore", "Conciliação Vanessa", "Conciliação Marla", "Pendências Diversas", "Mercado Livre Koncilli", "Mercado Livre Conta", "Contas a Pagar"];
  var CORES_CAT = ["#E02727", "#1F2933", "#3B82C4", "#F5B800", "#8FA3B8", "#7A1F5C", "#3FA7A0", "#A8B0BB", "#C77D2E", "#5E6B7A", "#2F6B4F"];
  var DESCR = {
    "Boletos": "Boletos em cobrança administrativa. É o único tipo considerado boleto.",
    "Judicial": "Títulos em cobrança judicial. Não são boletos.",
    "Conciliação Vanessa": "Pendências de conciliação acompanhadas pela Vanessa (a pagar e a receber).",
    "Conciliação Marla": "Pendências de conciliação acompanhadas pela Marla (a pagar e a receber).",
    "Pendências Diversas": "Pendências diversas a receber.",
    "Mercado Livre Koncilli": "Recebimentos do Mercado Livre pela Koncilli.",
    "Mercado Livre Conta": "Recebimentos do Mercado Livre na conta.",
    "Contas a Pagar": "Contas a pagar da empresa (fornecedores). É dinheiro que a empresa deve, não que recebe.",
    "Cobrança Extrajudicial": "Títulos em cobrança extrajudicial. Não são boletos.",
    "Dívida Antiga": "Dívidas antigas. Não são boletos.",
    "Frota": "Títulos de clientes de frota. Não são boletos.",
    "Auditoria": "Títulos em conciliação / auditoria. Não são boletos.",
    "Órgão Público": "Títulos de órgãos públicos. Não são boletos.",
    "Depósito": "Títulos pagos por depósito. Não são boletos.",
    "Pneustore": "Títulos da Pneustore. Não são boletos.",
    "Permuta": "Títulos pagos por permuta (troca). Não são boletos.",
    "Tesouraria": "Títulos acompanhados pela tesouraria. Não são boletos."
  };
  var NOMES_COR = { verde: "Sempre paga", amarelo: "Paga, mas com atraso", vermelho: "Nunca paga", nenhum: "Sem classificação" };
  var COR_HEX = { verde: "#1E9E5A", amarelo: "#F2B705", vermelho: "#D6322E", nenhum: "#B8C1CF" };
  var FAIXAS = ["A vencer", "1 a 30 dias", "31 a 60 dias", "61 a 90 dias", "Mais de 90 dias"];
  var FAIXA_CORES = ["#9AA5B1", "#F2B705", "#F28C28", "#D6322E", "#8E1B17"];

  var REF = new Date(DADOS.gerado + "T00:00:00");
  function mapa(t) {
    var venc = new Date(t.v + "T00:00:00");
    var dias = Math.floor((REF - venc) / 86400000);
    var pago = !!t.pg;
    return {
      f: t.f, c: t.c, tit: t.tit, par: t.par, cod: t.cod, cli: t.cli, v: t.v, dias: dias,
      val: t.val, pago: pago, pg: t.pg, d: t.d,
      aberto: pago ? 0 : t.sal,
      recebido: pago ? t.vp : 0
    };
  }
  var receber = DADOS.titulos.map(mapa);
  var titulos = receber.filter(function (x) { return CATEGORIAS.indexOf(x.c) >= 0; });
  var pagar = (DADOS.pagar || []).map(mapa);
  var pend = receber.filter(function (x) { return PEND.indexOf(x.c) >= 0; }).concat((DADOS.pend || []).map(mapa), pagar);
  var todos = titulos.concat(pend);

  /* ---------- Utilidades ---------- */
  var brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  function R(n) { return brl.format(n || 0); }
  function Rk(n) {
    n = n || 0;
    if (Math.abs(n) >= 1e6) return "R$ " + (n / 1e6).toFixed(1).replace(".", ",") + " mi";
    if (Math.abs(n) >= 1e3) return "R$ " + Math.round(n / 1e3) + " mil";
    return R(n);
  }
  function pct(n) { return (n * 100).toFixed(1).replace(".", ",") + "%"; }
  function dataBR(iso) { return iso ? iso.split("-").reverse().join("/") : "-"; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function soma(arr, k) { return arr.reduce(function (a, x) { return a + x[k]; }, 0); }
  function faixa(d) { return d <= 0 ? 0 : d <= 30 ? 1 : d <= 60 ? 2 : d <= 90 ? 3 : 4; }
  function nomeFilial(id) { var f = FILIAIS.filter(function (x) { return x.id === id; })[0]; return f ? f.nome : id; }
  function diasTxt(d) { return d <= 0 ? "a vencer" : d === 1 ? "1 dia" : d >= 365 ? Math.floor(d / 365) + " ano(s) e " + (d % 365) + " dias" : d + " dias"; }
  function agrupar(arr, keyFn) {
    var m = {};
    arr.forEach(function (x) { var k = keyFn(x); (m[k] = m[k] || []).push(x); });
    return m;
  }
  function topDevedores(arr, n) {
    var g = agrupar(arr.filter(function (x) { return !x.pago; }), function (x) { return x.cod; });
    return Object.keys(g).map(function (k) { return { cod: k, cli: g[k][0].cli, aberto: soma(g[k], "aberto"), n: g[k].length }; })
      .sort(function (a, b) { return b.aberto - a.aberto; }).slice(0, n);
  }

  /* ---------- Classificações (semáforo) ---------- */
  var LS_KEY = "vincol_classificacoes_v1";
  var pintarLS = "vincol_pintar_v1", pintarIni = true;
  try { pintarIni = localStorage.getItem(pintarLS) !== "0"; } catch (e) { pintarIni = true; }
  var locais = {};
  try { locais = JSON.parse(localStorage.getItem(LS_KEY) || "{}") || {}; } catch (e) { locais = {}; }
  function salvarLocais() { try { localStorage.setItem(LS_KEY, JSON.stringify(locais)); } catch (e) { /* sem armazenamento */ } }
  function cor(cod) {
    if (Object.prototype.hasOwnProperty.call(locais, cod)) return locais[cod] || "nenhum";
    return (window.CLASSIFICACOES && window.CLASSIFICACOES[cod]) || "nenhum";
  }
  function setCor(cod, c) {
    var base = (window.CLASSIFICACOES && window.CLASSIFICACOES[cod]) || "";
    if (c === "nenhum") c = "";
    if (c === base) delete locais[cod]; else locais[cod] = c;
    salvarLocais();
  }
  function todasClassificacoes() {
    var o = {}, k;
    for (k in (window.CLASSIFICACOES || {})) o[k] = window.CLASSIFICACOES[k];
    for (k in locais) { if (locais[k]) o[k] = locais[k]; else delete o[k]; }
    return o;
  }

  /* ---------- Estado ---------- */
  var estado = { aba: "geral", cat: "Boletos", secGeral: "Boletos", lanc: "receber", status: "todos", busca: "", ordem: "valor", limite: 100,
                 colFilt: {}, ordemCol: null, pintar: pintarIni, cBusca: "", cCor: "todos", cFilial: "todas", cLimite: 100 };
  var charts = [];
  function limparCharts() { charts.forEach(function (c) { c.destroy(); }); charts = []; }
  function grafico(id, cfg) {
    var el = document.getElementById(id);
    if (!el || !window.Chart) return;
    charts.push(new Chart(el, cfg));
  }
  if (window.Chart) {
    Chart.defaults.font.family = '"Segoe UI",system-ui,Arial,sans-serif';
    Chart.defaults.color = "#5B6676";
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) Chart.defaults.animation = false;
  }
  var tipR = { callbacks: { label: function (c) { return " " + (c.dataset.label ? c.dataset.label + ": " : "") + R(c.parsed.x != null && c.chart.options.indexAxis === "y" ? c.parsed.x : (c.parsed.y != null ? c.parsed.y : c.parsed)); } } };

  /* ---------- Blocos reutilizáveis ---------- */
  function kpi(rotulo, valor, ajuda, classe) {
    return '<div class="kpi ' + (classe || "") + '"><div class="rotulo">' + rotulo + '</div><div class="valor">' + valor + '</div><div class="ajuda">' + ajuda + "</div></div>";
  }
  function cardGraf(titulo, explica, id, span, alto) {
    return '<div class="card ' + span + '"><h3>' + titulo + '</h3><p class="explica">' + explica + '</p><div class="graf ' + (alto ? "alto" : "") + '"><canvas id="' + id + '" role="img" aria-label="Gráfico: ' + esc(titulo) + ". " + esc(explica) + '"></canvas></div></div>';
  }
  function resumo(arr) {
    var abertos = arr.filter(function (x) { return !x.pago; });
    var aberto = soma(arr, "aberto"), rec = soma(arr, "recebido");
    var clientes = {}; abertos.forEach(function (x) { clientes[x.cod] = 1; });
    return { aberto: aberto, rec: rec, nAbertos: abertos.length, nClientes: Object.keys(clientes).length,
             taxa: (aberto + rec) ? aberto / (aberto + rec) : 0, nPagos: arr.length - abertos.length,
             velho: soma(abertos.filter(function (x) { return x.dias > 90; }), "aberto") };
  }
  function kpisHtml(r, boleto) {
    var velho = r.aberto ? r.velho / r.aberto : 0;
    if (boleto) return '<div class="kpis">' +
      kpi("Quantos clientes de boleto devem?", r.nClientes.toLocaleString("pt-BR"), "Clientes diferentes com boleto em aberto") +
      kpi("Quanto já entrou?", R(r.rec), r.nPagos + " boleto(s) pago(s) (com data de pagamento)", "verde") + "</div>";
    return '<div class="kpis">' +
      kpi("Quantos clientes devem?", r.nClientes.toLocaleString("pt-BR"), "Clientes diferentes com valor em aberto") +
      kpi("Quanto está atrasado há mais de 90 dias?", pct(velho), "Parte do valor em aberto vencida há mais de 3 meses", "amarelo") + "</div>";
  }  function insights(arr, titulo) {
    var ab = soma(arr, "aberto"); if (!ab) return "";
    var top = topDevedores(arr, 10), topSoma = top.reduce(function (a, x) { return a + x.aberto; }, 0);
    var velho = soma(arr.filter(function (x) { return x.dias > 90 && !x.pago; }), "aberto");
    return '<div class="insight"><strong>Resumo em uma frase:</strong> ' + esc(titulo) + " têm <strong>" + R(ab) + "</strong> em aberto. " +
      "Os 10 maiores devedores respondem por <strong>" + pct(topSoma / ab) + "</strong> e " + pct(velho / ab) + " do valor está atrasado há mais de 90 dias.</div>";
  }

  /* ---------- Gráficos ---------- */
  function gFaixas(id, arr) {
    var v = FAIXAS.map(function (_, i) { return soma(arr.filter(function (x) { return !x.pago && faixa(x.dias) === i; }), "aberto"); });
    grafico(id, { type: "bar", data: { labels: FAIXAS, datasets: [{ label: "Em aberto", data: v, backgroundColor: FAIXA_CORES, borderRadius: 6 }] },
      options: { maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return " " + R(c.parsed.y); } } } },
        scales: { y: { ticks: { callback: function (v) { return Rk(v); } } } } } });
  }
  function gTop(id, arr, n, pagos) {
    var t;
    if (pagos) {
      var g = agrupar(arr.filter(function (x) { return x.pago; }), function (x) { return x.cod; });
      t = Object.keys(g).map(function (k) { return { cli: g[k][0].cli, aberto: soma(g[k], "recebido") }; }).sort(function (a, b) { return b.aberto - a.aberto; }).slice(0, n);
    } else t = topDevedores(arr, n);
    var rot = pagos ? "Recebido" : "Em aberto";
    grafico(id, { type: "bar", data: { labels: t.map(function (x) { return x.cli.length > 28 ? x.cli.slice(0, 27) + "…" : x.cli; }),
        datasets: [{ label: rot, data: t.map(function (x) { return x.aberto; }), backgroundColor: pagos ? "#1E9E5A" : "#D6322E", borderRadius: 4 }] },
      options: { indexAxis: "y", maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return " " + rot + ": " + R(c.parsed.x); } } } },
        scales: { x: { ticks: { callback: function (v) { return Rk(v); } } } } } });
  }  function gCategoriaRosca(id, arr) {
    var g = agrupar(arr, function (x) { return x.c; });
    var cats = CATEGORIAS.filter(function (c) { return g[c] && soma(g[c], "aberto") > 0; });
    grafico(id, { type: "doughnut", data: { labels: cats, datasets: [{ data: cats.map(function (c) { return soma(g[c], "aberto"); }),
        backgroundColor: cats.map(function (c) { return CORES_CAT[CATEGORIAS.indexOf(c)]; }), borderColor: "#fff", borderWidth: 2 }] },
      options: { maintainAspectRatio: false, cutout: "58%", plugins: { legend: { position: "right" }, tooltip: { callbacks: { label: function (c) { return " " + c.label + ": " + R(c.parsed); } } } } } });
  }
  function gCategoriaBarras(id, arr) {
    var g = agrupar(arr, function (x) { return x.c; });
    var cats = CATEGORIAS.filter(function (c) { return g[c]; });
    var vals = cats.map(function (c) { return soma(g[c], "aberto"); });
    grafico(id, { type: "bar", data: { labels: cats, datasets: [{ label: "Em aberto", data: vals,
        backgroundColor: cats.map(function (c) { return c === BOLETO ? "#D6322E" : "#8FA3B8"; }), borderRadius: 4 }] },
      options: { maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return " Em aberto: " + R(c.parsed.y); } } } },
        scales: { y: { ticks: { callback: function (v) { return Rk(v); } } } } } });
  }
    function gSemaforo(id, arr) {
    var ks = ["verde", "amarelo", "vermelho", "nenhum"];
    var v = ks.map(function (k) { return soma(arr.filter(function (x) { return !x.pago && cor(x.cod) === k; }), "aberto"); });
    grafico(id, { type: "doughnut", data: { labels: ks.map(function (k) { return NOMES_COR[k]; }), datasets: [{ data: v, backgroundColor: ks.map(function (k) { return COR_HEX[k]; }), borderColor: "#fff", borderWidth: 2 }] },
      options: { maintainAspectRatio: false, cutout: "58%", plugins: { legend: { position: "right" }, tooltip: { callbacks: { label: function (c) { return " " + c.label + ": " + R(c.parsed); } } } } } });
  }

  /* ---------- Visão geral ---------- */
  function quad(cat, arr, ativo, extra) {
    var rr = resumo(arr);
    if (PEND.indexOf(cat) >= 0 && cat !== "Contas a Pagar" && arr.some(function (x) { return x.d === "PAGAR"; }) && arr.some(function (x) { return x.d !== "PAGAR"; }))
      extra = "<small>A pagar " + Rk(soma(arr.filter(function (x) { return x.d === "PAGAR"; }), "aberto")) + " · a receber " + Rk(soma(arr.filter(function (x) { return x.d !== "PAGAR"; }), "aberto")) + "</small>";
    return '<button type="button" class="quad ' + (ativo ? "on " : "") + (cat === BOLETO ? "boleto " : "") + '" data-sec="' + esc(cat) + '" aria-pressed="' + !!ativo + '"><b>' + esc(cat) + '</b><span class="v">' + R(rr.aberto) + "</span><small>" + rr.nAbertos.toLocaleString("pt-BR") + " título(s) em aberto · " + rr.nClientes + " cliente(s)</small>" + (extra || "") + "</button>";
  }
  function graficosSecao(prefixo, arr, comSemaforo) {
    var semaforo = comSemaforo ? cardGraf("Semáforo dos clientes", "Valor em aberto por cor: verde = sempre paga · amarelo = paga, mas com atraso · vermelho = nunca paga. Classifique na aba “Classificar clientes”.", prefixo + "Sem", "c6") : "";
    return cardGraf("Há quanto tempo está atrasado", "Valor em aberto agrupado por tempo de atraso. Quanto mais à direita, mais difícil de recuperar.", prefixo + "Faixa", "c6") +
      cardGraf("Os 10 maiores devedores", "Clientes com maior valor em aberto.", prefixo + "Top", "c6", true) + semaforo;
  }
  function desenharSecao(prefixo, arr, comSemaforo) {
    gFaixas(prefixo + "Faixa", arr);
    gTop(prefixo + "Top", arr, 10);
    if (comSemaforo) gSemaforo(prefixo + "Sem", arr);
  }
  function gPorFilial(id, arr, comRecebido) {
    var fs = FILIAIS.filter(function (f) { return titulos.some(function (x) { return x.f === f.id; }); });
    var ds = [{ label: "Em aberto", data: fs.map(function (f) { return soma(arr.filter(function (x) { return x.f === f.id; }), "aberto"); }), backgroundColor: "#D6322E", borderRadius: 6 }];
    if (comRecebido) ds.push({ label: "Recebido", data: fs.map(function (f) { return soma(arr.filter(function (x) { return x.f === f.id; }), "recebido"); }), backgroundColor: "#1E9E5A", borderRadius: 6 });
    grafico(id, { type: "bar", data: { labels: fs.map(function (f) { return f.nome; }), datasets: ds },
      options: { maintainAspectRatio: false, plugins: { legend: { display: comRecebido }, tooltip: { callbacks: { label: function (c) { return " " + c.dataset.label + ": " + R(c.parsed.y); } } } }, scales: { y: { ticks: { callback: function (v) { return Rk(v); } } } } } });
  }
  function quadVazio(cat) {
    return '<div class="quad vazio" aria-disabled="true"><b>' + esc(cat) + '</b><span class="v">—</span><small>A alimentar</small></div>';
  }
  function gruposQuads(arrDe, ativo) {
    return '<h3 class="subtit">Inadimplência</h3><div class="quads" role="group" aria-label="Inadimplência por tipo de título">' +
      CATEGORIAS.map(function (c) { return quad(c, arrDe(c), c === ativo); }).join("") + "</div>" +
      '<h3 class="subtit">Pendência</h3><div class="quads" role="group" aria-label="Pendência por tipo de título">' +
      PEND.map(function (c) { return quad(c, arrDe(c), c === ativo); }).join("") + '</div><p class="explica">Pendência reúne as demais abas da planilha: Frota, Auditoria, Tesouraria, Permuta, Pneustore, conciliações, pendências diversas, Mercado Livre e contas a pagar. Não são boletos.</p>';
  }
  function renderGeral(el) {
    if (CATEGORIAS.indexOf(estado.secGeral) < 0 && PEND.indexOf(estado.secGeral) < 0) estado.secGeral = BOLETO;
    var eb = estado.secGeral === BOLETO;
    var sel = todos.filter(function (x) { return x.c === estado.secGeral; });
    var html = '<div class="titulo-secao"><h2>Visão geral da empresa</h2><p>Todas as filiais juntas. Clique em uma filial para ver o detalhe.</p></div>' +
      '<details class="como"><summary>Como ler este painel (30 segundos)</summary><ul>' +
      '<li><b>Boleto</b> é somente o que está na <b>Cobrança Administrativa</b>. Judicial, Cobrança Extrajudicial, Dívida Antiga, Órgão Público e Depósito <b>não são boletos</b> e ficam separados, cada um no seu quadro.</li>' +
      '<li><b>Em aberto</b> é o dinheiro que os clientes deviam pagar e ainda não pagaram. <b>Recebido</b> é o que já entrou (data de pagamento preenchida na planilha).</li>' +
      '<li><b>Atraso</b> é quantos dias passaram desde o vencimento. Quanto maior o atraso, mais difícil de receber.</li>' +
      '<li><b>Semáforo</b> (só para clientes de boleto): verde = cliente que sempre paga · amarelo = cliente que paga, mas com atraso · vermelho = cliente que nunca paga.</li>' +
      '<li>Use as abas no topo para ver cada filial. Em cada filial dá para trocar o tipo de título, buscar um cliente e baixar a lista para Excel.</li></ul></details>';
    html += gruposQuads(function (c) { return todos.filter(function (x) { return x.c === c; }); }, estado.secGeral);
    html += '<div class="titulo-secao"><h3>' + esc(estado.secGeral) + '</h3><p>' + esc(DESCR[estado.secGeral] || "") + "</p></div>" +
      kpisHtml(resumo(sel), eb) + insights(sel, eb ? "Os boletos" : estado.secGeral) +
      '<div class="grade">' + cardGraf(esc(estado.secGeral) + (eb ? ": em aberto × recebido por filial" : ": em aberto por filial"), eb ? "Vermelho é o que falta receber; verde é o que já foi pago." : "Quanto cada filial tem para receber neste tipo de título.", "sFilial", "c12") + graficosSecao("s", sel, eb) + "</div>" +
      '<div class="grade">' + cardGraf("Quanto cada tipo representa", "Valor em aberto de cada tipo de título. Os boletos aparecem em vermelho; os demais tipos (que não são boletos) em cinza-azulado.", "gTipos", "c12") + "</div>" +
      '<div class="card"><h3>Filiais</h3><p class="explica">Clique para abrir o detalhe de cada uma.</p><div class="filiais">' +
      FILIAIS.map(function (f) {
        var a = titulos.filter(function (x) { return x.f === f.id; }); if (!a.length) return "";
        var b = a.filter(function (x) { return x.c === BOLETO; }), rb = resumo(b), ro = resumo(a.filter(function (x) { return x.c !== BOLETO; }));
        return '<button class="filial-card" data-aba="' + f.id + '"><b>' + f.nome + (f.id !== "OUT" ? " (" + f.id + ")" : "") + '</b><small>Boletos em aberto</small><span class="v">' + R(rb.aberto) + "</span><small>" + rb.nAbertos + " boleto(s) · outros títulos: " + R(ro.aberto) + "</small></button>";
      }).join("") + "</div></div>";
    el.innerHTML = html;
    gPorFilial("sFilial", sel, eb);
    desenharSecao("s", sel, eb);
    gCategoriaBarras("gTipos", titulos);
  }

  /* ---------- Filial ---------- */
  function passaStatus(x) {
    if (estado.status === "aberto") return !x.pago;
    if (estado.status === "atrasado") return !x.pago && x.dias > 0;
    if (estado.status === "pago") return x.pago;
    return true;
  }
  var COLS = [
    { k: "cli", t: "Cliente / Fornecedor", v: function (x) { return x.cli; }, o: function (a, b) { return a.cli.localeCompare(b.cli, "pt-BR"); } },
    { k: "tit", t: "Título", v: function (x) { return String(x.tit); }, o: function (a, b) { return String(a.tit).localeCompare(String(b.tit), "pt-BR", { numeric: true }); } },
    { k: "venc", t: "Vencimento", v: function (x) { return dataBR(x.v); }, o: function (a, b) { return a.v < b.v ? -1 : a.v > b.v ? 1 : 0; } },
    { k: "atraso", t: "Atraso", num: 1, v: function (x) { return x.pago ? "Pago" : FAIXAS[faixa(x.dias)]; }, o: function (a, b) { return a.dias - b.dias; } },
    { k: "val", t: "Valor do título", num: 1, v: function (x) { return R(x.val); }, o: function (a, b) { return a.val - b.val; } },
    { k: "sit", t: "Situação / valor", num: 1, v: function (x) { return x.pago ? "Pago" : "Em aberto"; }, o: function (a, b) { return (a.aberto + a.recebido) - (b.aberto + b.recebido); } },
    { k: "sem", t: "Semáforo", v: function (x) { return NOMES_COR[cor(x.cod)]; }, o: function (a, b) { return NOMES_COR[cor(a.cod)].localeCompare(NOMES_COR[cor(b.cod)], "pt-BR"); } }
  ];
  function colDef(k) { return COLS.filter(function (c) { return c.k === k; })[0]; }
  function filtrar(base, ignorar) {
    var q = estado.busca.trim().toLowerCase();
    return base.filter(function (x) {
      if (estado.lanc !== "pagar" && x.c !== estado.cat) return false;
      if (!passaStatus(x)) return false;
      if (q && (x.cli + " " + x.cod + " " + x.tit).toLowerCase().indexOf(q) < 0) return false;
      for (var k in estado.colFilt) {
        if (k === ignorar) continue;
        var d = colDef(k);
        if (d && estado.colFilt[k].indexOf(d.v(x)) < 0) return false;
      }
      return true;
    });
  }
  function ordenar(arr) {
    var a = arr.slice();
    if (estado.ordemCol) {
      var d = colDef(estado.ordemCol.k), dir = estado.ordemCol.dir;
      if (d) { a.sort(function (x, y) { return d.o(x, y) * dir; }); return a; }
    }
    if (estado.ordem === "valor") a.sort(function (x, y) { return (y.aberto + y.recebido) - (x.aberto + x.recebido); });
    else if (estado.ordem === "atraso") a.sort(function (x, y) { return y.dias - x.dias; });
    else a.sort(function (x, y) { return x.cli.localeCompare(y.cli, "pt-BR"); });
    return a;
  }
  function fecharFiltro() {
    [].forEach.call(document.querySelectorAll(".popfiltro"), function (p) { p.remove(); });
    document.removeEventListener("mousedown", fora, true);
    document.removeEventListener("keydown", esc2, true);
  }
  function fora(e) { if (!e.target.closest(".popfiltro") && !e.target.closest("[data-col]")) fecharFiltro(); }
  function esc2(e) { if (e.key === "Escape") fecharFiltro(); }
  /* Filtro de coluna no estilo Excel: lista de valores com caixas de seleção, pesquisa e ordenação */
  function abrirFiltro(k, btn, fonte, aplicar) {
    fecharFiltro();
    var d = colDef(k), linhas = filtrar(fonte, k), m = {};
    linhas.forEach(function (x) { var v = d.v(x); if (!m[v]) m[v] = { n: 0, row: x }; m[v].n++; });
    var vals = Object.keys(m).sort(function (a, b) { return d.o(m[a].row, m[b].row); });
    var sel = {}, atual = estado.colFilt[k];
    vals.forEach(function (v) { sel[v] = !atual || atual.indexOf(v) >= 0; });
    var p = document.createElement("div");
    p.className = "popfiltro"; p.setAttribute("role", "dialog"); p.setAttribute("aria-label", "Filtrar coluna " + d.t);
    p.innerHTML = '<div class="pf-ord"><button type="button" data-o="1">Ordenar de A a Z / menor para maior</button><button type="button" data-o="-1">Ordenar de Z a A / maior para menor</button></div>' +
      '<input type="search" class="pf-busca" placeholder="Pesquisar…" aria-label="Pesquisar valores" autocomplete="off">' +
      '<label class="pf-todos"><input type="checkbox" class="pf-all"> (Selecionar tudo)</label><div class="pf-lista"></div>' +
      '<div class="pf-acoes"><button type="button" class="btn primario" data-a="ok">OK</button><button type="button" class="btn" data-a="cancel">Cancelar</button><button type="button" class="btn" data-a="limpar">Limpar filtro</button></div>';
    document.body.appendChild(p);
    var r = btn.getBoundingClientRect();
    p.style.top = (r.bottom + window.scrollY + 4) + "px";
    p.style.left = Math.max(8, Math.min(r.left + window.scrollX, window.innerWidth - 310)) + "px";
    var lista = p.querySelector(".pf-lista"), busca = p.querySelector(".pf-busca"), all = p.querySelector(".pf-all");
    function visiveis() { var q = busca.value.trim().toLowerCase(); return vals.filter(function (v) { return !q || v.toLowerCase().indexOf(q) >= 0; }); }
    function desenhar() {
      var vs = visiveis();
      lista.innerHTML = vs.slice(0, 500).map(function (v) { var i = vals.indexOf(v); return '<label class="pf-item"><input type="checkbox" data-i="' + i + '"' + (sel[v] ? " checked" : "") + "> <span>" + esc(v) + ' <small>(' + m[v].n + ")</small></span></label>"; }).join("") +
        (vs.length > 500 ? '<p class="pf-mais">Mostrando 500 de ' + vs.length + ". Use a pesquisa para refinar.</p>" : "") + (vs.length ? "" : '<p class="pf-mais">Nenhum valor encontrado.</p>');
      all.checked = vs.length > 0 && vs.every(function (v) { return sel[v]; });
    }
    p.addEventListener("change", function (e) {
      if (e.target === all) { visiveis().forEach(function (v) { sel[v] = all.checked; }); desenhar(); }
      else if (e.target.dataset.i != null) { sel[vals[+e.target.dataset.i]] = e.target.checked; all.checked = visiveis().every(function (v) { return sel[v]; }); }
    });
    busca.addEventListener("input", desenhar);
    p.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.o) { estado.ordemCol = { k: k, dir: +b.dataset.o }; fecharFiltro(); aplicar(); return; }
      if (b.dataset.a === "cancel") { fecharFiltro(); return; }
      if (b.dataset.a === "limpar") { delete estado.colFilt[k]; fecharFiltro(); aplicar(); return; }
      if (b.dataset.a === "ok") {
        var ch = vals.filter(function (v) { return sel[v]; });
        if (ch.length === vals.length) delete estado.colFilt[k]; else estado.colFilt[k] = ch;
        estado.limite = 100; fecharFiltro(); aplicar();
      }
    });
    desenhar(); busca.focus({ preventScroll: true });
    document.addEventListener("mousedown", fora, true);
    document.addEventListener("keydown", esc2, true);
  }
  function renderFilial(el, fid) {
    var base = todos.filter(function (x) { return x.f === fid; });
    var tipos = CATEGORIAS.concat(PEND), pagarF = pagar.filter(function (x) { return x.f === fid; });
    if (tipos.indexOf(estado.cat) < 0) estado.cat = BOLETO;
    el.innerHTML = '<div class="titulo-secao"><h2>' + (fid !== "OUT" ? "Filial " + fid + " · " : "") + nomeFilial(fid) + '</h2><p>Escolha o tipo de título. Só <b>Boletos</b> são boletos; os demais ficam separados. Posição em ' + dataBR(DADOS.gerado) + '</p></div>' +
      '<div id="zCat"></div>' +
      '<div id="zKpi"></div>' +
      '<div class="controles"><div class="chips" id="zStatus"></div></div>' +
      '<div class="grade" id="zGraf"></div>' +
      '<div class="legenda" id="zLeg"></div>' +
      '<div class="controles" role="group" aria-label="Tipo de lançamento"><b>Mostrar na tabela:</b><div class="chips" id="zLanc"></div></div>' +
      '<div class="controles"><input type="search" id="busca" aria-label="Buscar cliente, código ou título" placeholder="Buscar cliente, código ou título…" autocomplete="off" spellcheck="false" value="' + esc(estado.busca) + '">' +
      '<label>Ordenar: <select id="ordem"><option value="valor">Maior valor</option><option value="atraso">Mais atrasado</option><option value="cliente">Cliente A–Z</option></select></label>' +
      '<button class="btn" id="btnCsv" type="button">Exportar para Excel</button></div>' +
      '<div id="zTab"></div>';
    el.querySelector("#ordem").value = estado.ordem;

    function sec() { return base.filter(function (x) { return x.c === estado.cat; }); }
    function chips() {
      el.querySelector("#zCat").innerHTML = gruposQuads(function (c) { return base.filter(function (x) { return x.c === c; }); }, estado.cat);
      el.querySelector("#zLanc").innerHTML = [["receber", "Contas a receber"], ["pagar", "Contas a pagar (" + pagarF.length + ")"]].map(function (s) { return '<button class="chip ' + (estado.lanc === s[0] ? "on" : "") + '" data-lanc="' + s[0] + '" aria-pressed="' + (estado.lanc === s[0]) + '">' + s[1] + "</button>"; }).join("");
      var sts = [["todos", "Todos"], ["aberto", "Em aberto"], ["atrasado", "Atrasado"], ["pago", "Pagos ✔"]];
      el.querySelector("#zStatus").innerHTML = sts.map(function (s) { return '<button class="chip ' + (estado.status === s[0] ? "on" : "") + '" data-st="' + s[0] + '">' + s[1] + "</button>"; }).join("");
      el.querySelector("#zLeg").innerHTML = estado.cat === BOLETO ? '<span class="sem-cel sem-verde pill">Sempre paga</span><span class="sem-cel sem-amarelo pill">Paga, mas com atraso</span><span class="sem-cel sem-vermelho pill">Nunca paga</span><span class="sem-cel sem-nenhum pill">Sem classificação (altere em “Classificar clientes”)</span><label class="chk"><input type="checkbox" id="pintar"' + (estado.pintar ? " checked" : "") + '> Preencher o fundo com as cores</label>' : "";
    }
    function atualizaGraficos() {
      limparCharts();
      var arr = sec(), eb = estado.cat === BOLETO;
      if (!arr.length) {
        el.querySelector("#zKpi").innerHTML = '<div class="aviso"><b>Nenhum ' + (eb ? "boleto" : "título de " + esc(estado.cat)) + '</b> nesta filial na planilha.</div>';
        el.querySelector("#zGraf").innerHTML = ""; return;
      }
      el.querySelector("#zKpi").innerHTML = '<p class="explica" style="margin:0 0 8px">' + esc(DESCR[estado.cat] || "") + "</p>" + kpisHtml(resumo(arr), eb) + insights(arr, eb ? "Os boletos desta filial" : estado.cat + " nesta filial");
      var sa = arr.filter(passaStatus);
      if (!sa.length) { el.querySelector("#zGraf").innerHTML = '<div class="aviso">Nenhum título com este filtro nesta filial.</div>'; return; }
      if (estado.status === "pago") {
        el.querySelector("#zGraf").innerHTML = cardGraf("Quem já pagou", "Clientes com maior valor já recebido (títulos pagos).", "fTopPagos", "c12", true);
        gTop("fTopPagos", sa, 10, true);
      } else {
        el.querySelector("#zGraf").innerHTML = graficosSecao("f", sa, eb);
        desenharSecao("f", sa, eb);
      }
    }
    function atualizaTabela() {
      var pg = estado.lanc === "pagar", eb = estado.cat === BOLETO && !pg, lista = ordenar(filtrar(pg ? pagarF : base)), vis = lista.slice(0, estado.limite), nc = eb ? 7 : 6;
      var cabec = COLS.filter(function (c) { return c.k !== "sem" || eb; }).map(function (c) {
        var on = !!estado.colFilt[c.k], ord = estado.ordemCol && estado.ordemCol.k === c.k;
        return '<th class="' + (c.num ? "num" : "") + '" aria-sort="' + (ord ? (estado.ordemCol.dir > 0 ? "ascending" : "descending") : "none") + '"><button type="button" class="thf' + (on || ord ? " on" : "") + '" data-col="' + c.k + '" aria-haspopup="dialog" title="Filtrar e ordenar: ' + esc(c.t) + '">' + esc(c.t) + ' <span aria-hidden="true">' + (on ? "⏷" : ord ? (estado.ordemCol.dir > 0 ? "▲" : "▼") : "▾") + "</span></button></th>";
      }).join("");
      var barra = '<div class="colfiltros" role="group" aria-label="Filtrar colunas">' + COLS.filter(function (c) { return c.k !== "sem" || eb; }).map(function (c) {
        var on = !!estado.colFilt[c.k] || (estado.ordemCol && estado.ordemCol.k === c.k);
        return '<button type="button" class="chip' + (on ? " on" : "") + '" data-col="' + c.k + '" aria-haspopup="dialog">' + esc(c.t) + ' ▾</button>';
      }).join("") + "</div>";
      var h = barra + '<div class="tabela-wrap"><table class="' + (eb && estado.pintar ? "pintar" : "") + '"><thead><tr>' + cabec + "</tr></thead><tbody>";
      if (!lista.length) h += '<tr><td colspan="' + nc + '" class="vazio">Nenhum título encontrado. Tente limpar a busca ou escolher “Todos” nos filtros.</td></tr>';
      vis.forEach(function (x) {
        var c = cor(x.cod);
        h += '<tr class="' + (eb && estado.pintar ? "linha-" + c : (x.pago ? "pago" : "")) + '"><td class="cli"><span class="nome" title="' + esc(x.cli) + '">' + esc(x.cli) + "</span><small>Cód. " + esc(x.cod) + "</small></td>" +
          '<td data-label="Título">' + esc(x.tit) + (x.par ? "<small> parc. " + esc(x.par) + "</small>" : "") + (x.d && PEND.indexOf(x.c) >= 0 ? "<small>" + (x.d === "PAGAR" ? "A pagar" : "A receber") + "</small>" : "") + "</td>" +
          '<td data-label="Vencimento">' + dataBR(x.v) + '</td><td class="num" data-label="Atraso">' + (x.pago ? "-" : diasTxt(x.dias)) + '</td><td class="num" data-label="Valor do título">' + R(x.val) + "</td>" +
          '<td class="num" data-label="Situação">' + (x.pago ? '<span class="selo pago">Pago em ' + dataBR(x.pg) + "</span><br>" + R(x.recebido) : '<span class="selo aberto">Em aberto</span><br>' + R(x.aberto)) + "</td>" +
          (eb ? '<td data-label="Semáforo" class="sem-cel sem-' + c + '">' + NOMES_COR[c] + "</td>" : "") + "</tr>";
      });
      h += "</tbody></table></div>";
      if (lista.length > vis.length) h += '<div class="mais"><button class="btn primario" id="maisBtn" type="button">Mostrar mais (' + (lista.length - vis.length) + " restantes)</button></div>";
      var nf = Object.keys(estado.colFilt).length;
      h = '<p class="explica" style="margin:0 0 8px;color:var(--texto-suave)">' + lista.length.toLocaleString("pt-BR") + " título(s) de " + (pg ? "Contas a pagar" : esc(estado.cat)) + ". Total em aberto: <strong>" + R(soma(lista, "aberto")) + "</strong> " + (nf || estado.ordemCol ? '<button type="button" class="btn" id="limparCols">Limpar filtros das colunas</button>' : "") + "</p>" + h;
      el.querySelector("#zTab").innerHTML = h;
      anunciar(lista.length.toLocaleString("pt-BR") + " títulos encontrados");
      var mb = el.querySelector("#maisBtn");
      if (mb) mb.onclick = function () { estado.limite += 200; atualizaTabela(); };
      var lc = el.querySelector("#limparCols");
      if (lc) lc.onclick = function () { estado.colFilt = {}; estado.ordemCol = null; atualizaTabela(); };
    }
    function tudo() { chips(); atualizaGraficos(); atualizaTabela(); }
    el.onclick = function (e) {
      var cb = e.target.closest("[data-col]");
      if (cb) { abrirFiltro(cb.dataset.col, cb, estado.lanc === "pagar" ? pagarF : base, atualizaTabela); return; }
      var b = e.target.closest("[data-sec],[data-st],[data-lanc]"); if (!b) return;
      fecharFiltro(); estado.colFilt = {}; estado.ordemCol = null;
      if (b.dataset.lanc) estado.lanc = b.dataset.lanc;
      if (b.dataset.sec) { if (estado.cat !== b.dataset.sec) estado.status = "todos"; estado.cat = b.dataset.sec; estado.lanc = "receber"; }
      if (b.dataset.st) estado.status = b.dataset.st;
      estado.limite = 100; tudo();
    };
    el.addEventListener("change", function (e) {
      if (e.target.id === "pintar") { estado.pintar = e.target.checked; try { localStorage.setItem(pintarLS, estado.pintar ? "1" : "0"); } catch (x) { /* sem armazenamento */ } atualizaTabela(); }
    });
    el.querySelector("#busca").oninput = function (e) { estado.busca = e.target.value; estado.limite = 100; atualizaTabela(); };
    el.querySelector("#ordem").onchange = function (e) { estado.ordem = e.target.value; estado.ordemCol = null; atualizaTabela(); };
    el.querySelector("#btnCsv").onclick = function () {
      var pg = estado.lanc === "pagar", lista = ordenar(filtrar(pg ? pagarF : base)), eb = estado.cat === BOLETO && !pg;
      var linhas = [["Filial", "Tipo", "Cliente", "Codigo cliente", "Titulo", "Parcela", "Vencimento", "Dias de atraso", "Valor do titulo", "Em aberto", "Recebido", "Data pagamento"].concat(eb ? ["Semaforo"] : [])];
      lista.forEach(function (x) { linhas.push([nomeFilial(x.f), x.c, x.cli, x.cod, x.tit, x.par || "", dataBR(x.v), x.pago ? "" : x.dias, String(x.val).replace(".", ","), String(x.aberto).replace(".", ","), String(x.recebido).replace(".", ","), x.pg ? dataBR(x.pg) : ""].concat(eb ? [x.pago ? "pago" : cor(x.cod)] : [])); });
      baixar(estado.cat.replace(/\s+/g, "_") + "_" + nomeFilial(fid).replace(/\s+/g, "_") + ".csv", "﻿" + linhas.map(function (l) { return l.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(";"); }).join("\r\n"), "text/csv;charset=utf-8");
    };
    tudo();
  }

  function baixar(nome, conteudo, tipo) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
    a.download = nome; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ---------- Classificar clientes ---------- */
  function renderClientes(el) {
    var g = agrupar(titulos.filter(function (x) { return x.c === BOLETO; }), function (x) { return x.cod; });
    var clientes = Object.keys(g).map(function (k) {
      var a = g[k], ab = a.filter(function (x) { return !x.pago; });
      var fs = {}; a.forEach(function (x) { fs[x.f] = 1; });
      return { cod: k, cli: a[0].cli, aberto: soma(a, "aberto"), n: ab.length, filiais: Object.keys(fs), dias: ab.length ? Math.max.apply(null, ab.map(function (x) { return x.dias; })) : 0, pagou: a.some(function (x) { return x.pago; }) };
    }).sort(function (a, b) { return b.aberto - a.aberto; });

    el.innerHTML = '<div class="titulo-secao"><h2>Classificar clientes</h2><p>Só aparecem clientes de boleto (Cobrança Administrativa)</p></div>' +
      '<div class="aviso"><b>Como funciona:</b> clique na bolinha para classificar. <b>Verde</b> = cliente que sempre paga · <b>Amarelo</b> = cliente que paga, mas com atraso · <b>Vermelho</b> = cliente que nunca paga. ' +
      'As escolhas ficam salvas neste navegador. Para que <b>todos</b> vejam, clique em “Baixar classificações” e envie o arquivo <code>ratings.js</code> para atualizar o repositório.</div>' +
      '<div id="zAviso"></div>' +
      '<div class="controles"><input type="search" id="cBusca" aria-label="Buscar cliente ou código" placeholder="Buscar cliente ou código…" autocomplete="off" spellcheck="false" value="' + esc(estado.cBusca) + '">' +
      '<label>Filial: <select id="cFilial"><option value="todas">Todas</option>' + FILIAIS.map(function (f) { return '<option value="' + f.id + '">' + f.nome + "</option>"; }).join("") + "</select></label>" +
      '<button class="btn primario" id="cBaixar" type="button">Baixar classificações</button><button class="btn" id="cDescartar" type="button">Descartar alterações locais</button></div>' +
      '<div class="controles"><div class="chips" id="cChips"></div></div><div id="zLista"></div>';
    el.querySelector("#cFilial").value = estado.cFilial;

    function aviso() {
      var n = Object.keys(locais).length;
      el.querySelector("#zAviso").innerHTML = n ? '<div class="aviso alerta">Você tem <b>' + n + "</b> alteração(ões) ainda não publicada(s). Baixe o arquivo e envie para o repositório para todos verem.</div>" : "";
    }
    function lista() {
      var q = estado.cBusca.trim().toLowerCase();
      var l = clientes.filter(function (c) {
        if (estado.cFilial !== "todas" && c.filiais.indexOf(estado.cFilial) < 0) return false;
        if (estado.cCor !== "todos" && cor(c.cod) !== estado.cCor) return false;
        if (q && (c.cli + " " + c.cod).toLowerCase().indexOf(q) < 0) return false;
        return true;
      });
      var chips = [["todos", "Todos"], ["nenhum", "Sem classificação"], ["verde", "● Verde"], ["amarelo", "● Amarelo"], ["vermelho", "● Vermelho"]];
      el.querySelector("#cChips").innerHTML = chips.map(function (s) {
        var n = s[0] === "todos" ? clientes.length : clientes.filter(function (c) { return cor(c.cod) === s[0]; }).length;
        return '<button class="chip ' + (estado.cCor === s[0] ? "on" : "") + '" data-cc="' + s[0] + '">' + s[1] + ' <span class="n">' + n + "</span></button>";
      }).join("");
      var vis = l.slice(0, estado.cLimite);
      var h = '<p class="explica" style="margin:0 0 8px;color:var(--texto-suave)">' + l.length.toLocaleString("pt-BR") + " cliente(s)</p><div class=\"tabela-wrap\"><table><thead><tr><th>Cliente</th><th>Filial(is)</th><th class=\"num\">Títulos em aberto</th><th class=\"num\">Total em aberto</th><th class=\"num\">Maior atraso</th><th>Semáforo</th></tr></thead><tbody>";
      if (!l.length) h += '<tr><td colspan="6" class="vazio">Nenhum cliente encontrado.</td></tr>';
      vis.forEach(function (c) {
        var cc = cor(c.cod);
        h += '<tr><td class="cli"><span class="nome" title="' + esc(c.cli) + '">' + esc(c.cli) + "</span><small>Cód. " + esc(c.cod) + (c.pagou ? ", já pagou título" : "") + '</small></td><td data-label="Filial(is)">' + c.filiais.map(function (f) { return f === "OUT" ? "Outras" : f; }).join(", ") + '</td><td class="num" data-label="Títulos em aberto">' + c.n + '</td><td class="num" data-label="Total em aberto">' + R(c.aberto) + '</td><td class="num" data-label="Maior atraso">' + (c.n ? diasTxt(c.dias) : "-") + "</td>" +
          '<td data-label="Semáforo"><span class="seletor" role="group" aria-label="Classificação de ' + esc(c.cli) + '" data-cod="' + esc(c.cod) + '">' +
          ["verde", "amarelo", "vermelho", "nenhum"].map(function (k) { return '<button type="button" class="s-' + k + (cc === k ? " on" : "") + '" data-c="' + k + '" aria-pressed="' + (cc === k) + '" aria-label="' + NOMES_COR[k] + '" title="' + NOMES_COR[k] + '"><i></i></button>'; }).join("") + "</span></td></tr>";
      });
      h += "</tbody></table></div>";
      if (l.length > vis.length) h += '<div class="mais"><button class="btn primario" id="cMais" type="button">Mostrar mais (' + (l.length - vis.length) + ")</button></div>";
      el.querySelector("#zLista").innerHTML = h;
      var mb = el.querySelector("#cMais"); if (mb) mb.onclick = function () { estado.cLimite += 200; lista(); };
    }
    el.onclick = function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.cc) { estado.cCor = b.dataset.cc; estado.cLimite = 100; lista(); return; }
      var s = b.closest(".seletor");
      if (s && b.dataset.c) {
        setCor(s.dataset.cod, b.dataset.c);
        [].forEach.call(s.querySelectorAll("button"), function (x) { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b); });
        anunciar("Classificação alterada para: " + NOMES_COR[b.dataset.c]);
        aviso();
        
      }
    };
    el.querySelector("#cBusca").oninput = function (e) { estado.cBusca = e.target.value; estado.cLimite = 100; lista(); };
    el.querySelector("#cFilial").onchange = function (e) { estado.cFilial = e.target.value; estado.cLimite = 100; lista(); };
    el.querySelector("#cBaixar").onclick = function () {
      var o = todasClassificacoes(), ks = Object.keys(o).sort();
      var txt = "// Classificação dos clientes (semáforo). Chave = código do cliente.\n// Valores: \"verde\" (sempre paga), \"amarelo\" (paga, mas com atraso), \"vermelho\" (nunca paga).\nwindow.CLASSIFICACOES = {\n" +
        ks.map(function (k) { return '  "' + k + '": "' + o[k] + '"'; }).join(",\n") + "\n};\n";
      baixar("ratings.js", txt, "text/javascript;charset=utf-8");
    };
    el.querySelector("#cDescartar").onclick = function () {
      if (!Object.keys(locais).length) return;
      if (confirm("Descartar as alterações feitas neste navegador e voltar à classificação publicada?")) { locais = {}; salvarLocais(); lista(); aviso(); }
    };
    aviso(); lista();
  }

  /* ---------- Abas e roteamento ---------- */
  function anunciar(txt) { var a = document.getElementById("anuncio"); if (a) a.textContent = txt; }
  function abasValidas() { return ["geral"].concat(FILIAIS.filter(function (f) { return titulos.some(function (x) { return x.f === f.id; }); }).map(function (f) { return f.id; }), ["clientes"]); }
  function salvarUrl() {
    var h = "#" + estado.aba;
    if (estado.aba !== "geral" && estado.aba !== "clientes") {
      var p = [];
      if (estado.cat !== BOLETO) p.push("cat=" + encodeURIComponent(estado.cat));
      if (estado.status !== "todos") p.push("st=" + estado.status);
      if (p.length) h += "?" + p.join("&");
    }
    try { history.replaceState(null, "", h); } catch (e) { /* ignora */ }
  }
  function lerUrl() {
    var h = (location.hash || "").slice(1).split("?"), aba = h[0];
    estado.aba = abasValidas().indexOf(aba) >= 0 ? aba : "geral";
    (h[1] || "").split("&").forEach(function (kv) {
      var p = kv.split("="), v = decodeURIComponent(p[1] || "");
      if (p[0] === "cat" && CATEGORIAS.indexOf(v) >= 0) estado.cat = v;
      if (p[0] === "st" && ["aberto", "atrasado", "pago"].indexOf(v) >= 0) estado.status = v;
    });
  }
  function montarAbas() {
    var h = '<button class="aba" role="tab" id="aba-geral" aria-controls="conteudo" data-aba="geral">Visão geral</button>';
    FILIAIS.forEach(function (f) {
      if (!titulos.some(function (x) { return x.f === f.id; })) return;
      h += '<button class="aba" role="tab" id="aba-' + f.id + '" aria-controls="conteudo" data-aba="' + f.id + '">' + f.nome + (f.id !== "OUT" ? " <small>" + f.id + "</small>" : "") + "</button>";
    });
    h += '<button class="aba" role="tab" id="aba-clientes" aria-controls="conteudo" data-aba="clientes">Classificar clientes</button>';
    document.getElementById("abas").innerHTML = h;
  }
  function render() {
    limparCharts(); fecharFiltro();
    var el = document.getElementById("conteudo"); el.onclick = null;
    el.setAttribute("role", "tabpanel"); el.setAttribute("aria-labelledby", "aba-" + estado.aba);
    [].forEach.call(document.querySelectorAll(".aba"), function (a) {
      var on = a.dataset.aba === estado.aba;
      a.classList.toggle("ativa", on); a.setAttribute("aria-selected", on); a.tabIndex = on ? 0 : -1;
    });
    if (estado.aba === "geral") renderGeral(el);
    else if (estado.aba === "clientes") renderClientes(el);
    else renderFilial(el, estado.aba);
  }
  function ir(aba, foco) {
    if (aba !== estado.aba) { estado.cat = BOLETO; estado.lanc = "receber"; estado.status = "todos"; estado.busca = ""; estado.limite = 100; estado.colFilt = {}; estado.ordemCol = null; }
    estado.aba = aba; salvarUrl();
    render(); window.scrollTo(0, 0);
    if (foco) document.getElementById("aba-" + aba).focus();
    anunciar("Aba aberta: " + document.getElementById("aba-" + aba).textContent.trim());
  }
  document.addEventListener("click", function (e) {
    var q = e.target.closest("#conteudo [data-sec]");
    if (q && estado.aba === "geral") { var y = window.scrollY; estado.secGeral = q.dataset.sec; render(); window.scrollTo(0, y); return; }
    var b = e.target.closest("[data-aba]"); if (b) ir(b.dataset.aba);
    if (e.target.closest("#conteudo [data-sec],#conteudo [data-st]")) salvarUrl();
  });
  document.getElementById("abas").addEventListener("keydown", function (e) {
    var ks = abasValidas(), i = ks.indexOf(estado.aba), n = null;
    if (e.key === "ArrowRight") n = ks[(i + 1) % ks.length];
    else if (e.key === "ArrowLeft") n = ks[(i - 1 + ks.length) % ks.length];
    else if (e.key === "Home") n = ks[0];
    else if (e.key === "End") n = ks[ks.length - 1];
    if (n) { e.preventDefault(); ir(n, true); }
  });
  window.addEventListener("hashchange", function () { var a = estado.aba; lerUrl(); if (a !== estado.aba) render(); });
  document.getElementById("btnImprimir").onclick = function () { window.print(); };
  document.getElementById("dataRef").textContent = dataBR(DADOS.gerado);

  montarAbas();
  lerUrl();
  render();
})();
