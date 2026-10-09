# Painel de Inadimplência · Vincol Pneus

Painel executivo para a diretoria acompanhar o que falta receber, a previsão de entrada e os maiores devedores, nos sistemas Tecinco e Junsoft.

- **Visão geral:** A receber, Previsto para 30 dias, Vencido há mais de 90 dias e Judicial + Dívida Antiga; onde está o dinheiro (por filial ou tipo), previsão por faixa de atraso, maiores devedores, próximos vencimentos e resumo por filial. Clicar em barras e linhas filtra o painel.
- **Títulos:** lista com filtros por coluna estilo Excel, situação (não pagos, vencidos, pagos) e exportação para Excel.
- **Classificar clientes:** verde = em dia (sempre paga) · amarelo = em atraso (paga, mas com atraso) · vermelho = inadimplente (nunca paga).
- **Ficha do cliente:** busca no topo ou clique no nome.
- **Imprimir:** folha A4 de resumo para reunião.
- Contas a pagar não aparecem no painel.

## Estrutura
- `web/`: o painel (React + TypeScript + Vite). Código em `web/src/`.
- Raiz: dados gerados a partir das planilhas (`data.js`, `data-junsoft.js`, `historico.js`, `ratings.js`) e os scripts em `tools/`. O build copia esses arquivos para `dist/dados/`.
- Quando o sistema tiver API, troque só `web/src/dados/carregar.ts`.
- `index.html`, `app.js` e `style.css` da raiz são o painel antigo (não é mais publicado).

## Rodar no computador
```
npm --prefix web install
npm --prefix web run dev
```
Abre em http://localhost:5173.

## Publicar
Todo envio para a `main` dispara o GitHub Actions (`.github/workflows/publicar.yml`), que compila `web/` e publica no GitHub Pages.

## Atualizar os dados (toda semana)
Informe a data da posição da planilha (AAAA-MM-DD) e depois registre o histórico:
```
python tools/build_data.py "caminho/da/planilha.xlsx" data.js 2026-10-13
python tools/build_junsoft.py "caminho/da/planilha-junsoft.xlsx" data-junsoft.js 2026-10-13
python tools/registrar_historico.py
```
Depois envie `data.js`, `data-junsoft.js` e `historico.js` para o repositório. O `historico.js` guarda os números de cada semana; é ele que faz aparecer as setinhas de variação. Nomes de pessoas físicas saem abreviados (`MASK` em `tools/build_data.py`).

### Junsoft
Usa só as abas (a primeira aba do relatório é ignorada). Inadimplência: Boletos (Cobrança Adm), Judicial, Dívida Antiga e Cobrança Extrajudicial (sem dados). Pendência: Clientes em carteira, Depósito, Diversos e Borrachas Vipal. Títulos pintados de azul na aba de boletos contam como pagos.

## Classificação dos clientes
Na tela *Classificar clientes*, escolha a cor e clique em **Baixar classificações**. Substitua `ratings.js` no repositório para todos verem (o arquivo leva os dois sistemas).

## Cores e regras
- Cores e tipografia: tokens no topo de `web/src/styles.css`.
- Tipos de título de cada sistema: `web/src/dados/sistemas.ts`.
- Chance de pagar por faixa de atraso (previsão): `web/src/dados/calculos.ts`.
