# Painel de Inadimplência · Vincol Pneus

Dashboard para a diretoria acompanhar os títulos a receber vencidos, por filial.

- **Abas:** Visão geral, Três Poços (01), Ponte Alta (02), Barra Mansa (03), Beira Rio (04), Resende (06), Outras filiais e *Classificar clientes*.
- **Semáforo:** verde = pagamento certo · amarelo = precisa cobrar · vermelho = difícil / nunca paga.
- **Exportar:** botão de Excel (CSV) por filial e impressão/PDF.

## Atualizar os dados
```
python tools/build_data.py "caminho/da/planilha.xlsx" data.js
```
Depois envie `data.js` para o repositório. Nomes de pessoas físicas saem abreviados (`MASK` em `tools/build_data.py`).

## Classificação dos clientes
Na aba *Classificar clientes*, escolha a cor e clique em **Baixar classificações**. Substitua `ratings.js` no repositório para todos verem.

## Cores da marca
Variáveis no topo de `style.css`.
