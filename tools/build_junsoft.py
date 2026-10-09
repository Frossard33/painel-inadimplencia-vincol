"""Gera data-junsoft.js a partir da planilha da Junsoft.
Uso: python tools/build_junsoft.py "Relatorio Junsoft.xlsx" data-junsoft.js [AAAA-MM-DD]
A primeira aba (relatorio geral) NAO e usada: tem status errados. Vale o que esta nas abas abaixo.
"""
import openpyxl, sys, re, json, datetime, collections, unicodedata

src, out = sys.argv[1], sys.argv[2]
GERADO = sys.argv[3] if len(sys.argv) > 3 else "2026-10-06"
MASK = True
# (inicio do nome da aba, categoria). Categorias sem aba na planilha ficam zeradas no painel.
TABS = [("Divida", "Dívida Antiga", ""), ("Judicial", "Judicial", ""), ("Cobran", "Boletos", ""),
        ("Clientes em carteira", "Clientes em Carteira", ""), ("Dep", "Depósito", ""),
        ("Diversos", "Diversos", ""), ("Borrachas", "Borrachas Vipal", ""), ("Contas", "Contas a Pagar", "")]
ENT = re.compile(r"\b(LTDA|ME|EPP|EIRELI|S/?A|S\.A\.?|COMERCIO|COMÉRCIO|TRANSPORTES?|ASSOCIACAO|ASSOCIAÇÃO|FUNDO|INSTITUTO|PREFEITURA|MUNICIPAL|SERV|SERVICOS|SERVIÇOS|EMPRESA|CIA|LOGISTICA|AUTO|PECAS|PEÇAS|PNEUS?|BORRACHARIA|CONCRETO|SOLUCOES|SOLUÇÕES|MERCADO|AUTOMOTIVA|REDE|CENTRO|CARGO|COOPERATIVA|CONSTRUCAO|CONSTRUÇÃO|MATERIAL|INDUSTRIA|INDÚSTRIA|RECAUCHUTAGEM|LOCACAO|LOCAÇÃO|ENGENHARIA|OFICINA|TURISMO|VIACAO|VIAÇÃO)\b", re.I)


def norm(s):
    return unicodedata.normalize("NFKD", str(s)).encode("ascii", "ignore").decode().lower()


def nome(raw):
    n = re.sub(r"^\s*\d+\s*-\s*", "", str(raw or "")).strip()   # tira "codigo - "
    n = n.split(" - ")[0].strip()                                 # tira apelidos/observacoes depois do nome
    if not MASK or ENT.search(n):
        return n
    n = re.sub(r"^[\d\.\-/ ]+(?=[A-Za-z])", "", n)
    p = n.split()
    if len(p) <= 1:
        return n
    return p[0] + " " + " ".join(x[0] + "." for x in p[1:] if x[0].isalpha())


def dt(v):
    if v is None or v == "":
        return None
    if isinstance(v, datetime.datetime):
        return v.date().isoformat()
    if isinstance(v, datetime.date):
        return v.isoformat()
    m = re.match(r"\s*(\d\d)/(\d\d)/+(\d{4})", str(v))
    if m:
        return f"{m[3]}-{m[2]}-{m[1]}"
    m = re.match(r"(\d{4}-\d\d-\d\d)", str(v))
    return m[1] if m else None


def num(v):
    try:
        return round(float(v), 2)
    except (TypeError, ValueError):
        return 0.0


wb = openpyxl.load_workbook(src, data_only=True)
sheets = wb.worksheets[1:]  # ignora a primeira aba (relatorio geral)


def aba(pre):
    r = [w for w in sheets if norm(w.title).startswith(norm(pre))]
    assert len(r) == 1, (pre, [w.title for w in sheets])
    return r[0]


def azul(c):
    """Celula pintada de azul claro (tema 4) = titulo ja pago, marcado pelo financeiro."""
    f = c.fill
    return bool(f.fill_type) and f.fgColor.type == "theme" and f.fgColor.theme == 4


def linhas(ws):
    hdr = [c.value for c in ws[1]]
    for row in ws.iter_rows(min_row=2):
        if row[0].value is None:
            continue
        d = dict(zip(hdr, [c.value for c in row]))
        d["_azul"] = azul(row[4])
        yield d


def mk(r, cat, tab):
    pag = dt(r.get("Data do Pagamento"))
    sal = num(r.get("VL_SALDO"))
    vp = num(r.get("Valor")) or sal if pag else 0
    pagar = "pagar" in norm(r.get("DS_TIPOCONTA") or "") or cat == "Contas a Pagar"
    marcado = bool(r.get("_azul")) and not pag   # azul na planilha = pago (sem data informada)
    if marcado:
        vp = sal
    return dict(f="01", c=cat, t=tab, **({"pago": 1} if marcado else {}), d="PAGAR" if pagar else "RECEBER",
                tit=str(r.get("NR_DOCUMENTO") or r.get("NR_LANCAMENTO")).strip(), par=r.get("NR_PARCELA"),
                cod=str(r.get("CD_PESSOA")).strip(), cli=nome(r.get("NM_PESSOA")), v=dt(r.get("DT_VENCIMENTO")),
                val=num(r.get("VL_DOCUMENTO")) or sal, sal=sal, pg=pag, vp=vp)


tit, pagar = [], []
for pre, cat, _ in TABS:
    ws = aba(pre)
    for r in linhas(ws):
        x = mk(r, cat, ws.title)
        (pagar if cat == "Contas a Pagar" else tit).append(x)

for c, n in collections.Counter(x["c"] for x in tit).items():
    print(c, n, round(sum(x["sal"] for x in tit if x["c"] == c and not x["pg"]), 2))
print("Contas a Pagar", len(pagar), round(sum(x["sal"] for x in pagar), 2))
print("sem vencimento", sum(1 for x in tit + pagar if not x["v"]))
open(out, "w", encoding="utf-8").write("window.DADOS_JUNSOFT=" + json.dumps(
    {"gerado": GERADO, "titulos": tit, "pagar": pagar, "pend": []}, ensure_ascii=False, separators=(",", ":")) + ";\n")
