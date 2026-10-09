# Instruções do projeto: Painel de Inadimplência Vincol

**Ao começar qualquer sessão neste projeto, leia primeiro `Skill.MD/LEIA-ME.md`** e siga as skills indicadas lá antes de mexer na interface.

- Público do painel: diretoria leiga em análise de dados. Linguagem simples, visual claro, profissional e corporativo.
- Funciona em computador e celular. O painel é React + TypeScript + Vite em `web/`, publicado no GitHub Pages pelo GitHub Actions (`.github/workflows/publicar.yml`). Os arquivos `index.html`, `app.js` e `style.css` da raiz são o painel antigo.
- Dados vêm das planilhas via `tools/build_data.py` e `tools/build_junsoft.py` (geram `data.js` e `data-junsoft.js` na raiz). Nunca publicar observações dos títulos. Contas a pagar não entram no painel.