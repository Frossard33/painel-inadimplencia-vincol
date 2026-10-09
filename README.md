# Painel de Inadimplência · Vincol Pneus

Dashboard para a diretoria acompanhar os títulos a receber vencidos, por filial.

- **Sistema:** Tecinco ou Junsoft, no topo (cada um com sua cor).
- **Abas:** Visão geral, Títulos (com filtro de filial) e *Classificar clientes*.
- **Resumo:** A receber, Judicial + Dívida Antiga, Boletos e Contas a pagar; cada número abre a lista e mostra se subiu ou caiu desde a semana anterior.
- **Classificação:** verde = em dia (sempre paga) · amarelo = em atraso (paga, mas com atraso) · vermelho = inadimplente (nunca paga).
- **Exportar:** botão de Excel (CSV) por filial e impressão/PDF.

## Atualizar os dados (toda semana)
Informe a data da posição da planilha (AAAA-MM-DD) e depois registre o histórico:
```
python tools/build_data.py "caminho/da/planilha.xlsx" data.js 2026-10-13
python tools/build_junsoft.py "caminho/da/planilha-junsoft.xlsx" data-junsoft.js 2026-10-13
python tools/registrar_historico.py
```
Depois envie `data.js`, `data-junsoft.js` e `historico.js` para o repositório. O `historico.js` guarda os 4 números de cada semana; é ele que faz aparecer as setinhas de variação. Nomes de pessoas físicas saem abreviados (`MASK` em `tools/build_data.py`).

### Junsoft
Usa só as abas (a primeira aba do relatório é ignorada). Inadimplência: Boletos (Cobrança Adm), Judicial, Dívida Antiga e Cobrança Extrajudicial (sem dados). Pendência: Clientes em carteira, Depósito, Diversos, Borrachas Vipal e Contas a pagar.

## Classificação dos clientes
Na aba *Classificar clientes*, escolha a cor e clique em **Baixar classificações**. Substitua `ratings.js` no repositório para todos verem.

## Cores da marca
Variáveis no topo de `style.css`.
