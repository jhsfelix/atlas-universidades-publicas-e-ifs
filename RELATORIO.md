# Relatório — Atlas das Universidades Públicas e dos Institutos Federais

Gerado em 2026-09-25 · versão publicada `?v=2ecb07a` · https://jhsfelix.github.io/atlas-universidades-publicas-e-ifs/

## 1. Resumo executivo

Atlas interativo do ensino superior público brasileiro: uma "roda" de governança com 155 nós e 722 relações normatizadas (Código aberto, licença MIT), construído sem framework, sem backend e sem dependências de runtime — todo o dado é estático, versionado no repositório e auditável. O projeto inclui o conjunto **Ficha 360** (tudo o que dá para saber de cada instituição em um painel único), um menu de navegação no padrão do Atlas da República, e passou por uma auditoria de segurança adaptada do OWASP Top 10, com correções aplicadas e verificadas em Chrome (Blink) e Safari/WebKit.

## 2. Inventário de funcionalidades (todas no ar)

### Núcleo — a roda
| # | Funcionalidade | Descrição |
|---|---|---|
| 1 | Roda de governança | 143 instituições (69 universidades federais, 38 IFs, 36 estaduais, 1 grupo municipal em levantamento) dispostas em anéis; centros: Brasil, União, Estados, Municípios; hubs: MEC, INEP, CAPES, CNPq, ANDIFES, CONIF, ABRUEM |
| 2 | Relações com norma legal | Cada linha cita a norma (CF art. 211, LDB 9.394/1996, Lei 11.892/2008, Lei 10.861/2004, Lei 11.502/2007, Decreto 1.191/1994, estatutos) |
| 3 | Mapa por estados | Alternativa "Estados" com 27 células (UF) |
| 4 | Busca | Por sigla, nome, UF ou cidade, com atalho `/` e navegação por teclado |
| 5 | Filtros | Por tipo de instituição, por estado e "tamanho = orçamento" |
| 6 | Ficha da instituição | Badge do tipo, UF/cidade/fundação, relações, fontes; botões copiar link, imprimir/salvar PDF e comparar |
| 7 | Orçamento (LOA e execução) | LOA 2025–2026 das IES federais e IFs (SOF/SIOP), despesas por natureza (GND), execução empenhado/liquidado/pago e histórico por ano; exclui EBSERH |
| 8 | Gasto por aluno | LOA 2026 ÷ alunos de graduação (Censo 2024/INEP), com ranking "Nª de 107" e nota metodológica para IFs |
| 9 | Per capita | Orçamento federal das IES por habitante do estado (Censo 2022/IBGE) |
| 10 | Interiorização | % do LOA federal em sedes fora das capitais, por estado |
| 11 | Linha do tempo de criação | Distribuição de fundações por década (duas ondas: anos 1960 e expansão pós-2000) |
| 12 | Modo comparação | Marque instituições na roda e compare lado a lado (orçamento, alunos, gasto por aluno, pós, bolsas, fundação) |
| 13 | Tour guiado | 6 passos explicando o grafo ("Entenda a roda") |
| 14 | Zoom, pan e pinch | Roda do mouse, botões, arrasto e toque duplo — com correção específica para Safari (pointerup) |
| 15 | Deep links | `?id=ufmg` abre a ficha direto (whitelist de ids) |
| 16 | Tema claro/escuro | Automático pelo sistema + botão de alternância, persistido em localStorage |

### Ficha 360 (camada acadêmica e social)
| # | Funcionalidade | Descrição |
|---|---|---|
| 17 | Menu "Ficha 360" | Botão no topo abre painel com Explorar, Acompanhar, Dados e método, A roda e Participar (padrão Atlas da República) |
| 18 | Vistas explicativas | Do zero, Metodologia, Movimento, Anéis e formas, Projeto aberto, dica de comparação com botão de exemplo funcional |
| 19 | Pós-graduação (CAPES) | Programas stricto sensu 2024 por IES (mestrados, doutorados, profissionais), nota CAPES máxima/média, ranking; 130/143 IES com dados |
| 20 | Bolsas CAPES | Bolsistas DPB 2025-2026 por IES (mestrado/doutorado/pós-doc); 110.819 bolsistas mapeados |
| 21 | Pesquisa (CNPq) | Bolsas pagas em 2023 por IES: IC, IC Júnior, iniciação tecnológica, mestrado, doutorado, PQ, pós-doutorado + R$ pago em IC; 142/143 IES, 61.832 bolsas |
| 22 | Assistência estudantil (PNAES) | Quadro legal do Decreto 7.234/2010 com as dez áreas; aviso de que cada IES define valores/critérios (não há base nacional unificada) |
| 23 | Ficha em PDF | Impressão otimizada (`window.print`) de qualquer ficha |

### Integridade e segurança aplicadas
| # | Item | Descrição |
|---|---|---|
| 24 | Versionamento de assets | `?v=<hash git>` em todos os CSS/JS/dados — cache sempre renovado |
| 25 | CSP + referrer | `<meta http-equiv="Content-Security-Policy">` restritiva e `referrer` strict-origin-when-cross-origin |
| 26 | Framebust | `js/framebust.js` (o GitHub Pages não permite X-Frame-Options) |
| 27 | `.nojekyll` | Serviço direto e previsível dos arquivos |

## 3. Dados e metodologia

| Bloco | Fonte | Detalhes |
|---|---|---|
| Governança/estrutura | Elaboração própria a partir da legislação citada | Relações derivam do tipo da instituição |
| Orçamento | SOF/SIOP (dados abertos) | LOA e execução 2025–2026; federais e IFs |
| Alunos de graduação | INEP — Censo da Educação Superior 2024 (microdados) | `MICRODADOS_CADASTRO_CURSOS_2024.CSV`: graduação pública (TP_REDE=1, TP_NIVEL_ACADEMICO=1); pareamento 107/107 IES federais+IFs (norm + apelidos de sigla); Censo 2023 descartado por subnotificação da UFRPE |
| Pós-graduação | CAPES — COLSUCUP Programas 2024 | 3.522 programas mapeados; 13 IES sem pós são dado real (IFs pequenos, Univesp, Unitins) |
| Bolsas CAPES | CAPES — Bolsistas DPB 2025-2026 | 110.819 bolsistas; deduplicado por CPF mascarado+nível+IES |
| Bolsas CNPq | CNPq — Bolsas e auxílios pagos 2023 | 61.832 bolsas; 1 linha = 1 processo pago no ano (não vigência); portal `dadosabertos.cnpq.br` bloqueou esta rede — arquivo baixado pelo link direto da nuvem oficial (`nuvem.cnpq.br`) |
| Fundações | Arquivo estrutural do atlas | Ano de criação da instituição de origem |

Pareamento IES: normalização de acentos + siglas (com e sem espaços) + apelidos documentados (IFC↔IFCATARINENSE, IFF↔IFFLUMINENSE, IFSudesteMG↔IFSEMG) + regras de sufixo para IFs.

## 4. Auditoria de segurança (OWASP Top 10, adaptado a site estático)

Referência: skill **Segurança de Aplicações (OWASP Top 10)** da comunidade Cultura Builder. Contexto: site 100% estático no GitHub Pages — sem backend, sem autenticação, sem banco, sem uploads; superfície de ataque reduzida ao cliente.

### Aplicáveis e verificados
- **A03 — Injeção/XSS**: todas as 10 atribuições de `innerHTML` usam dados próprios do repositório ou passam por `esc()` (agora também escapando `'`). Nenhum input do usuário é injetado: o parâmetro `?id=` é validado por whitelist (`R.byId.has`); o campo de busca só filtra, nunca é renderizado. **Sem `eval`, `new Function`, `document.write`, `fetch`, `XMLHttpRequest` ou WebSocket** no código. Risco residual: baixo.
- **A05 — Configuração/headers**: adicionada CSP meta restritiva (`script-src 'self'`; `style-src 'self' 'unsafe-inline' fonts.googleapis.com`; `font-src fonts.gstatic.com`; `img-src 'self' data:`; `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`; `upgrade-insecure-requests`) + `referrer` policy. Verificado ao vivo: zero violações, fontes carregam, todas as telas funcionam. **Limitação conhecida do GitHub Pages**: não há como definir `X-Frame-Options`/`Strict-Transport-Security`/`nosniff` (o HSTS é do domínio github.io); clickjacking mitigado em profundidade com `js/framebust.js`.
- **A06 — Dependências**: zero dependências de runtime (sem npm no cliente); única referência externa é a fonte Inter (Google Fonts, CSS+fontes, https). SRI não é aplicável ao CSS do Google Fonts (conteúdo rotativo) e seria redundante para assets próprios na mesma origem.
- **A08 — Integridade**: todos os assets são da mesma origem e versionados com `?v=<hash git>`; dados conferidos contra os md5 oficiais quando disponíveis (INEP); pipeline documentado com as armadilhas de encoding (`LC_ALL=C`).
- **Gestão de segredos**: varredura por padrões (tokens, chaves, senhas) — **nenhum segredo no repositório**; não há nada que precise de segredo.
- **HTTPS/mixed content**: nenhum link `http://` no código; todas as referências externas usam HTTPS.

### Não aplicáveis (sem backend)
- A01 (controle de acesso), A02 (criptografia de armazenamento), A04 (limites de negócio), A07 (autenticação), A09 (logs de segurança), A10 (SSRF) — não existem rotas, sessões, dados sensíveis nem requisições do servidor; nada a proteger.

### Testes executados na auditoria
- Regressão WebKit (Safari) local e ao vivo: boot (155 nós, fontes carregadas), ficha UFMG com as 4 seções (Orçamento, Pós, CNPq, PNAES), menu → comparar → botão de exemplo → painel, tour, tema. Zero erros e zero violações de CSP.
- Chrome (Blink): mesma suíte no desenvolvimento das fases anteriores.
- Smoke test de unidade (fake DOM): 10 arquivos carregados, mapa com 27 UF, modos roda/mapa — tudo OK.

### Recomendações futuras (não bloqueantes)
1. Painel "Pesquisa e pós" com rankings nacionais (mais programas, mais IC) — extensão natural.
2. Se surgir fonte oficial unificada de execução do PNAES por IES, plugar valores por instituição.
3. Atualizar CNPq quando sair o recorte 2024 (padrão atual: pagos 2023).
4. GitHub Actions para rodar o smoke test a cada push (CI).

## 5. Como reproduzir

- Local: `python3 -m http.server` na raiz e abrir `http://localhost:8000`.
- Testes: `node T/opencode/smoke-ui.js` (smoke) e as suítes Playwright/WebKit do ambiente de trabalho (menu, fichas, comparar, CSP).
- Dados: regenerar com os scripts de pipeline documentados no histórico de commits (Censo 2024, CAPES, CNPq).

## 6. Estatísticas vivas

- 155 nós · 722 relações · 143 instituições mapeadas (69 federais, 38 IFs, 36 estaduais, municipais em levantamento)
- LOA 2026 das IES federais: R$ 98,96 bi · 107 IES com orçamento e matrículas (1.296.177 alunos de graduação)
- 3.522 programas de pós · 110.819 bolsistas CAPES · 61.832 bolsas CNPq pagas (2023)
- Atualizado em 2026-09-24
