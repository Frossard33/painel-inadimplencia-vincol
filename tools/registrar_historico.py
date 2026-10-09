"""Registra no historico.js os 4 numeros do resumo (total e por filial) da posicao atual.
Rodar toda semana, depois de gerar data.js e data-junsoft.js:
    python tools/registrar_historico.py
O painel compara a posicao atual com a ultima posicao anterior registrada (setinhas de variacao).
As regras abaixo sao as mesmas do app.js (SISTEMAS, GRUPOS e mapa); se mudar la, mude aqui.
"""
import json, os, re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, "historico.js")
DEMORADOS = ["Judicial", "Dívida Antiga"]
SISTEMAS = {
    "tecinco": {
        "arquivo": "data.js", "var": "DADOS",
        "categorias": ["Boletos", "Judicial", "Cobrança Extrajudicial", "Dívida Antiga", "Órgão Público", "Depósito"],
        "pend": ["Frota", "Auditoria", "Tesouraria", "Permuta", "Pneustore", "Conciliação Vanessa", "Conciliação Marla",
                 "Pendências Diversas", "Mercado Livre Koncilli", "Mercado Livre Conta", "Contas a Pagar"],
    },
    "junsoft": {
        "arquivo": "data-junsoft.js", "var": "DADOS_JUNSOFT",
        "categorias": ["Boletos", "Judicial", "Cobrança Extrajudicial", "Dívida Antiga"],
        "pend": ["Clientes em Carteira", "Depósito", "Diversos", "Borrachas Vipal", "Contas a Pagar"],
    },
}


def ler_js(caminho, var):
    txt = open(caminho, encoding="utf-8").read().strip()
    m = re.match(r"window\." + var + r"\s*=\s*(.*?);?\s*$", txt, re.S)
    return json.loads(m.group(1))


def quatro(linhas):
    def em_aberto(x):
        return 0 if (x.get("pg") or x.get("pago")) else (x.get("sal") or 0)
    t = {"receber": 0.0, "demorados": 0.0, "boletos": 0.0, "pagar": 0.0}
    for x in linhas:
        v = em_aberto(x)
        if x.get("d") == "PAGAR":
            t["pagar"] += v
        elif x["c"] in DEMORADOS:
            t["demorados"] += v
        else:
            t["receber"] += v
        if x["c"] == "Boletos":
            t["boletos"] += v
    return {k: round(v, 2) for k, v in t.items()}


hist = {}
if os.path.exists(SAIDA):
    hist = ler_js(SAIDA, "HISTORICO")

for sid, S in SISTEMAS.items():
    caminho = os.path.join(RAIZ, S["arquivo"])
    if not os.path.exists(caminho):
        continue
    D = ler_js(caminho, S["var"])
    # mesmo conjunto "todos" do app.js: tipos de inadimplencia + pendencia + abas extras + contas a pagar
    todos = [x for x in D["titulos"] if x["c"] in S["categorias"] or x["c"] in S["pend"]] + D.get("pend", []) + D.get("pagar", [])
    filiais = sorted({x["f"] for x in todos})
    entrada = {"data": D["gerado"], "total": quatro(todos),
               "filiais": {f: quatro([x for x in todos if x["f"] == f]) for f in filiais}}
    lista = [e for e in hist.get(sid, []) if e["data"] != entrada["data"]] + [entrada]
    hist[sid] = sorted(lista, key=lambda e: e["data"])
    print(sid, entrada["data"], entrada["total"])

with open(SAIDA, "w", encoding="utf-8") as f:
    f.write("// Histórico semanal dos 4 números do resumo. Gerado por tools/registrar_historico.py; não editar à mão.\n")
    f.write("window.HISTORICO = " + json.dumps(hist, ensure_ascii=False, indent=1) + ";\n")
