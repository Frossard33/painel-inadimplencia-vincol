# Painel de Inadimplência · Vincol Pneus

Dashboard para a diretoria acompanhar os títulos a receber vencidos, por filial.

- **Abas:** Visão geral, Três Poços (01), Ponte Alta (02), Barra Mansa (03), Beira Rio (04), Resende (06), Outras filiais e *Classificar clientes*.
- **Classificação:** verde = em dia (sempre paga) · amarelo = em atraso (paga, mas com atraso) · vermelho = inadimplente (nunca paga).
- **Exportar:** botão de Excel (CSV) por filial e impressão/PDF.

## Atualizar os dados
```
python tools/build_data.py "caminho/da/planilha.xlsx" data.js
```
Depois envie `data.js` para o repositório. Nomes de pessoas físicas saem abreviados (`MASK` em `tools/build_data.py`).

### Junsoft
```
python tools/build_junsoft.py "caminho/da/planilha-junsoft.xlsx" data-junsoft.js 2026-10-06
```
Usa só as abas (a primeira aba do relatório é ignorada). Inadimplência: Boletos (Cobrança Adm), Judicial, Dívida Antiga e Cobrança Extrajudicial (sem dados). Pendência: Clientes em carteira, Depósito, Diversos, Borrachas Vipal e Contas a pagar. O seletor **Sistema** no topo alterna entre Tecinco e Junsoft.

## Classificação dos clientes
Na aba *Classificar clientes*, escolha a cor e clique em **Baixar classificações**. Substitua `ratings.js` no repositório para todos verem.

## Cores da marca
Variáveis no topo de `style.css`.
