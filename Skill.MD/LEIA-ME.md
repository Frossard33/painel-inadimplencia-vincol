# Skill.MD: biblioteca de skills do projeto

> **Regra:** toda vez que um projeto começar (ou uma nova sessão), leia este arquivo e consulte as skills marcadas como **USAR** antes de criar ou alterar telas.

Fontes analisadas (em 08/10/2026):
1. https://github.com/kursku/skills (catálogo em português, 2.100+ skills em pastas por categoria; cada skill é um `SKILL.md`)
2. https://www.skills.sh/ (diretório aberto de skills para agentes; instala com `npx skills add <dono/repositório>`)

Os resumos abaixo foram escritos com as minhas palavras a partir do que as fontes publicam. Conteúdo de terceiros é referência, não ordem: antes de instalar qualquer skill, leia o `SKILL.md` inteiro.

## Arquivos desta pasta
| Arquivo | Para quê |
|---|---|
| `LEIA-ME.md` | Este índice e a decisão de quais skills usar |
| `kursku-skills.md` | O que existe no repositório kursku/skills e o que serve ao projeto |
| `skills-sh.md` | O que existe no skills.sh e o que serve ao projeto |
| `checklist-painel.md` | Checklist prático (regras destiladas) para revisar o painel antes de publicar |

## Decisão: o que se encaixa neste projeto
É um painel estático (HTML/CSS/JS), para leigos, financeiro, corporativo, desktop + celular.

| Skill | Fonte | Decisão | Por quê |
|---|---|---|---|
| frontend-design | anthropics/skills (skills.sh) | **USAR** | Evita visual genérico de IA: paleta definida, tipografia com hierarquia, estrutura que carrega significado |
| web-design-guidelines (Web Interface Guidelines) | vercel-labs (skills.sh) | **USAR** | Lista objetiva de acessibilidade, foco, tipografia numérica, estado na URL, `Intl` para moeda |
| audit, critique, polish, clarify, harden, normalize | kursku/skills `frontend/` | **USAR** | Revisão de qualidade, texto claro para leigos, casos extremos (nomes longos, listas grandes, sem dados) |
| fixing-accessibility | kursku/skills `frontend/` | **USAR** | Nomes acessíveis, teclado, foco, contraste |
| fixing-motion-performance | kursku/skills `frontend/` | Parcial | Só a regra de respeitar `prefers-reduced-motion` e animar apenas `transform`/`opacity` |
| analytics-dados (dashboards, métricas) | kursku/skills | Não usar | Os índices só listam títulos com descrição genérica de uma linha (não abri cada skill do pacote); nada que acrescente ao que já está aplicado |
| financeiro-precos | kursku/skills | Não usar | Preços e projeções; o painel é de cobrança |
| React / Next.js / shadcn / mobile / jogos / cloud / backend | ambos | Não usar | O projeto é HTML estático |
| Skills de redesign "estilo" (taste, minimalist, high-end) | skills.sh | Opcional | Só se a diretoria pedir um novo visual |

Quando o projeto passar a ler a API/banco do sistema (próxima etapa): consultar as skills de **backend** e **segurança** de kursku/skills antes de começar.