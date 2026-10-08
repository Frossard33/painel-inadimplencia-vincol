# Checklist de revisão do painel (destilado das skills)

## Para leigos (clarify)
- [ ] Cada gráfico tem título em forma de pergunta ou frase simples e uma explicação curta.
- [ ] Sem jargão sem explicação (inadimplência, aging, saldo). Termo técnico só com tradução ao lado.
- [ ] Rótulos de botão específicos ("Baixar classificações", não "Enviar").
- [ ] Estado vazio explica o que fazer.

## Acessibilidade (fixing-accessibility, web-design-guidelines)
- [ ] Link "pular para o conteúdo"; hierarquia de títulos correta.
- [ ] Abas com `role=tablist/tab`, setas do teclado, `aria-selected`.
- [ ] Todo campo e seletor com nome acessível; ícones decorativos escondidos.
- [ ] `:focus-visible` com contorno visível; nada escondido atrás do cabeçalho fixo.
- [ ] Cor nunca é o único sinal (semáforo tem texto/título); contraste mínimo 4,5:1.
- [ ] Gráficos com `role="img"` e resumo em texto; alteração de resultados anunciada (`aria-live`).
- [ ] Alvos de toque de pelo menos 44 px no celular.
- [ ] `prefers-reduced-motion` respeitado.

## Dados e tipografia
- [ ] Números com `font-variant-numeric: tabular-nums`; moeda e datas via `Intl`.
- [ ] Texto longo truncado com `title`; tabela vira cartões no celular.
- [ ] Filtros refletidos na URL (link compartilhável).

## Visual (frontend-design, critique)
- [ ] Paleta curta e nomeada (variáveis CSS); sem gradientes decorativos.
- [ ] Estrutura carrega significado: cor só para status e destaque.
- [ ] Revisar com `critique` e `audit` antes de publicar.