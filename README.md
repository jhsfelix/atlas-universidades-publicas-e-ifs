# Atlas das Universidades Públicas e dos Institutos Federais

Roda interativa das relações de governança do ensino superior público brasileiro, no modelo do [Atlas da República](https://atlasdarepublica.org/): quem manda em quê, e com qual norma legal.

**O que está mapeado (155 nós, ~720 relações):**

- **69 universidades federais** — supervisionadas pelo MEC, criadas por lei federal (LDB, art. 46)
- **38 Institutos Federais** — supervisionados pelo MEC, criados por lei federal (Lei 11.892/2008)
- **36 universidades estaduais** — mantidas por lei estadual de criação (LDB, art. 10)
- **Universidades municipais** — em levantamento: as IES municipais existentes são, em regra, mantidas por fundações de direito privado (ex.: USCS). Nenhuma pública confirmada até a data do atlas
- **Governança** — União, MEC, INEP (SINAES, Lei 10.861/2004), CAPES e CNPq (Lei 11.502/2007), Estados e DF, Municípios, ANDIFES, CONIF e ABRUEM

Cada relação cita a norma que a funda (Constituição art. 211; LDB arts. 9º, 10, 11 e 46; Lei 11.892/2008; Lei 10.861/2004; Lei 11.502/2007; Decreto 1.191/1994 — indicação de reitores).

## Como usar

Abra `index.html` — não há build nem dependências. Dados em `data/atlas.js`, orçamento em `data/orcamento.js` (mais `orcamento-despesas.js`, `orcamento-execucao.js` e `orcamento-historico.js`), visualização em `js/graph.js` (SVG puro, sem bibliotecas) e interface em `js/app.js`.

- Passe o mouse (ou toque) em um ponto: as relações daquela instituição se destacam; role para aproximar e arraste para navegar (mouse, trackpad ou toque)
- Clique: abre a ficha com nome oficial, UF, sede, site (com botão "copiar link"), todas as relações com as normas citadas — e, nas IES federais, o orçamento (LOA e execução, exercícios 2025 e 2026), composição por grupo de despesa (pessoal, correntes, investimentos), principais ações específicas, para onde foi o empenho por elemento de despesa e a evolução do orçamento 2019–2026
- Clique em **Orçamento** no topo: resumo do sistema — total, federais × IFs, composição por grupo de despesa, evolução 2019–2026 e maiores/menores dotações
- **Estados**: mapa em grade de bolhas por UF — tamanho = número de IES públicas, cor = orçamento federal; clique em um estado para filtrar a roda
- **Entenda a roda**: tour guiado em 6 passos pela estrutura de governança
- Marque **Tamanho = orçamento** para que o diâmetro de cada IES federal/IF reflita sua dotação; use `+`, `−` e o botão de restaurar para controlar o zoom
- Filtre por tipo e estado, ou busque por sigla, nome, UF e cidade (`/` foca a busca; setas e Enter navegam nos resultados)
- Toda ficha tem um link direto: `?id=ufmg` etc. abre o atlas já com a ficha aberta

## Como contribuir

Os dados são mantidos no estilo do Atlas da República: correções e inclusões por issues.

- [`Adicionar instituição`](.github/ISSUE_TEMPLATE/adicionar-instituicao.md) — informe nome oficial, sigla, tipo, UF, cidade-sede, site e a norma de criação com link (e-MEC, Planalto ou lei estadual)
- [`Corrigir dados`](.github/ISSUE_TEMPLATE/corrigir-dados.md) — informe o que está errado, a correção proposta e a fonte oficial

Números de nós e relações derivam automaticamente do tipo da instituição: ao registrar uma nova, as relações correspondentes são criadas pelo próprio atlas.

## Fontes

- [CF/1988, art. 211](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm)
- [LDB — Lei 9.394/1996](https://www.planalto.gov.br/ccivil_03/leis/l9394.htm)
- [Lei dos IFs — 11.892/2008](https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2008/lei/l11892.htm)
- [Lei do SINAES — 10.861/2004](https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/lei/l10.861.htm)
- [Lei CAPES/CNPq — 11.502/2007](https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2007/lei/l11502.htm)
- [Decreto 1.191/1994 — dirigentes federais](https://www.planalto.gov.br/ccivil_03/decreto/1994/d1191.htm)
- [e-MEC](https://emec.mec.gov.br)
- [SOF/SIOP — dados abertos do orçamento federal](https://orcamento.dados.gov.br/siopdoc/doku.php/acesso_publico:dados_abertos/) — dotações e execução orçamentária das unidades orçamentárias das IES federais (excluídos os hospitais universitários/EBSERH); universidades estaduais não constam por não haver fonte nacional unificada para as LOAs estaduais

**Nota:** nomes, siglas, sedes e sites seguem e-MEC/portais institucionais na data de atualização. Se algo divergir, abra uma issue.

## Licença

MIT — veja [LICENSE](LICENSE).
