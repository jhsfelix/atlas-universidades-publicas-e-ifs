# Briefing CB — Piloto Blogger + seção “Análises” do Atlas

**Data:** 26/09/2026  
**Executor:** IA CB, ambiente Mac do John  
**Repo:** `jhsfelix/atlas-universidades-publicas-e-ifs`  
**Base consultada:** `main` em `a8d535c24e831fc3a16c797d952c7a5b6656a432`. Confirme o HEAD remoto antes de começar; se mudou, leia os commits e adapte sem reverter trabalho alheio.

## 1. Objetivo

Preparar um piloto de publicação editorial no Blogger e integrar, **somente em branch**, uma entrada “Análises” no menu do Atlas. Deixar o blog e os textos como rascunhos privados para revisão de John/JJ. Esta execução não publica, não configura DNS, não mescla e não avança PI.

## 2. Limites absolutos / parada

- **PI e patentes fora do escopo:** não criar nem mencionar publicamente módulo, link, menu, label, rota, post, página, texto, CTA ou metadado de PI/patentes. Não usar os dados BADEPI/local v2.1. A publicação segue bloqueada por licença e auditoria.
- Não publicar texto editorial, tornar o blog indexável, ligar monetização/AdSense, criar newsletter, formulário, afiliados, patrocinadores, analytics/pixels ou conteúdo de terceiros.
- Não alterar DNS/Cloudflare, nameservers, domínio Blogger, Search Console, cobrança ou produção. Não criar/comprar domínio/conta/serviço pago, aceitar termos comerciais, nem coletar segredos.
- Não mesclar, fazer deploy ou alterar `main`; branch separada apenas.
- Só usar sessão Google já autenticada se for claramente a conta do John. Não solicitar senha/2FA. Se não houver sessão inequívoca, parar a configuração do Blogger e documentar os passos manuais.
- Não presumir que MIT cobre dados, gráficos ou artigos de terceiros, nem atribuir endosso à UNILAB/MEC/INPI.
- Em qualquer dúvida de privacidade, domínio, auth, método ou licença: marcar **PENDENTE**, parar e perguntar. Nunca presumir “OK”.

## 3. Estado atual

- Atlas é site estático HTML/CSS/JS vanilla, sem build/dependências; dados em `data/*.js`, SVG em `js/graph.js`, interface em `js/app.js`.
- Menu lateral existente: `#menu-painel` em `index.html`; grupos Explorar, Acompanhar, Dados e método, A roda, Participar. `.menu-item` aceita âncora; handler em `js/app.js` deixa links com `href` navegarem normalmente. Verificar o código no HEAD atual.
- Domínio atual: `https://atlasuniversidadesifs.org/`. O repo não tem `Docs/` neste momento.
- URL candidata `blog.atlasuniversidadesifs.org` **não está configurada/aprovada**. Não a tratar como existente. Blogger fornece URL Blogspot e CNAME específico por conta; registrar instruções privadas se surgirem, sem executá-las ou copiá-las ao repo.

## 4. Fase 0 — pré-voo (sem escrita pública)

1. Registrar `git status`, remote, branch, SHA remoto, browser, resolução e sistema de teste.
2. Criar branch a partir do `main` remoto atual: `feat/analises-blogger-pilot` (ou nome equivalente). Nunca tocar/forçar `main`.
3. Capturar estado inicial da home em desktop 1280×800 e mobile 390×844, menu fechado/aberto, claro/escuro.
4. Ler páginas oficiais antes de configurar: [domínio Blogger](https://support.google.com/blogger/answer/1233387?hl=pt-BR), [visibilidade/SEO Blogger](https://support.google.com/blogger/answer/41373?hl=pt-BR), [regras de anúncio](https://support.google.com/adsense/answer/1269077?hl=pt-BR). Anúncios são referência apenas; fora do escopo.
5. Se houver conflito com CSP/SEO/menu ou alteração recente no repo que mude as premissas, pare e informe John/JJ antes de adaptar arquitetura.

## 5. Fase 1 — Blogger como rascunho (somente se autorizado)

Se e somente se a sessão já aberta for inequivocamente a conta Google de John:

1. Criar o blog como privado/restrito/rascunho sem ligar “visível para mecanismos de busca”. Não conectar domínio customizado.
2. Se Blogger não der um estado de privacidade verificável, **não criar/publicar nada**: prepare os textos localmente e registre o bloqueio.
3. Título de trabalho: **“Análises do Atlas — Universidades Públicas e IFs”**. Descrição: **“Dados públicos, orçamento e universidades explicados com fontes, método e limites.”** Sem promessa promocional ou alegação institucional.
4. Tema responsivo/editorial simples, consistente com o Atlas (Inter se disponível, superfícies compatíveis, quadrado vermelho); sem rebrand nem logo de terceiros. Registrar screenshot sem dados pessoais.
5. Página **“Sobre as Análises”** em rascunho. Escopo: orçamento, governança, financiamento e leitura de dados públicos de universidades/IFs; dizer que os textos identificam fonte, data, método e limites. Não indicar a UNILAB como editora/endossante. Sem PI/patentes.
6. Um artigo-piloto **em rascunho**: **“Quanto custa um aluno de universidade federal? O que este indicador mede — e o que não mede”**. Antes de inserir números, reproduzir a razão com dados atuais do Atlas e registrar instituição, exercício, numerador, denominador, unidade, URL/data da fonte, fórmula e arredondamento. Se a fórmula atual for LOA ÷ matrícula de graduação, dizer isso; **não** chamar de custo total de formar um estudante. Explicar limites apenas com respaldo nas fontes (nível/tipo de matrícula, pessoal, hospitais/EBSERH e cobertura). Não copiar matérias, não afirmar causalidade e não preencher lacunas. Se não reconciliar um valor, deixar sem número e reportar o bloqueio.
7. Labels permitidas apenas para este piloto: `Orçamento`, `Universidades e IFs`, `Dados e método`. Sem labels PI/inovação/patentes/tecnologia.
8. Comentários desligados ou moderados. Sem formulário, newsletter, monetização, analytics, widget que rastreie usuário ou link afiliado. Nunca publicar.
9. Registrar URL Blogspot gerada e estado privado/indexação no relatório; não registrar dados de login nem CNAME único/secreto em GitHub.

### Gate após fase 1

Parar. Não conectar domínio, alterar DNS, publicar, indexar, abrir ao público ou ligar newsletter. Informar John e solicitar aprovação explícita para a próxima fase. Se a conta não estava autenticada, listar instruções manuais — sem alegar que o blog foi criado.

## 6. Fase 2 — seção “Análises” (branch somente)

1. Em `index.html`, adicionar grupo discreto **“Publicações”** (ou “Ler”) depois de “Acompanhar” e antes de “Dados e método”. Inserir âncora `.menu-item` chamada **“Análises”**, subtítulo: “Orçamento e universidades em contexto, com dados, fontes e método.”
2. No menu, chamar “Análises”, não “Blog”. Manter navegação acessível; para nova guia usar `target="_blank"` e `rel="noopener noreferrer"`, com indicação acessível; mesma guia não precisa desses atributos.
3. Não usar URL falsa/quebrada. Se Blogger gerar URL Blogspot, pode ser apontada no código da branch apenas se for o endereço real. **Não** usar `blog.atlasuniversidadesifs.org` até domínio funcionar em HTTPS e John aprovar. Se URL ainda não foi criada/aprovada, documentar e deixar integração de link pendente/inativa na branch; não inventar `href`.
4. Não criar página de conteúdo dentro do Atlas nem teaser/post na home. Não alterar dados, grafo, orçamento, CTA existente, sitemap, canonical, robots, llms.txt, JSON-LD ou CSP. Qualquer exceção estritamente necessária deve ser documentada e aprovada antes.
5. Não adicionar PI/patentes em nenhuma superfície pública.

## 7. Fase 3 — validação e relatório, sem deploy

Executar e registrar evidências reais:

- `git diff --check`, `git status`, revisão do diff completo; confirmar que nenhum dado/cálculo foi reescrito.
- Buscar nos arquivos alterados e em `robots.txt`, `sitemap.xml`, `llms.txt` por strings de PI/patentes; resultado esperado: **nenhuma adição**.
- Servir local conforme README; abrir site; rodar `node --check js/app.js` se arquivo alterado; validar HTML por ferramenta acessível, sem adicionar framework/dependência.
- Regressão em 1280×800 e 390×844, claro/escuro; menu abre/fecha; teclado/Tab/foco/Enter; sem regressão em orçamento, busca ou roda.
- Se Blogger criado, testar a URL Blogspot sem login e confirmar que o conteúdo editorial não está público nem indexável. Não colocar screenshots privados no repo público.
- Criar `Docs/RELATORIO-PILOTO-ANALISES.md`: SHA base, branch/SHAs remotos, arquivos, estado Blogger/URL, estado DNS (não tocado), método e fontes do artigo, testes/saídas, capturas higienizadas, pendências e instruções manuais.

### Critérios de aceite

- [ ] branch separada; sem merge, deploy, force-push, workflow de produção, alteração de `main` ou publicação;
- [ ] Blogger privado/rascunho verificado ou bloqueio documentado sem criar conteúdo público;
- [ ] Sobre e artigo-piloto só em rascunho; todo número reproduzido com fonte ou removido;
- [ ] sem PI, newsletter, formulário, ads, afiliados, patrocinador, analytics ou DNS;
- [ ] menu “Análises” acessível localmente; sem link fake/quebrado; URL real ou link pendente claramente documentado;
- [ ] busca negativa confirma nenhuma menção/link/label de PI adicionada;
- [ ] testes e relatório executados; evidências não expõem conta, e-mail, domínio privado ou CNAME secreto;
- [ ] relatório lista o que John precisa aprovar: domínio/URL, texto, verificação HTTPS, indexação/publicação, e só depois merge/deploy.

Qualquer falha em auth, domínio, privacidade do Blogger, cálculo do artigo ou ambiente que não possa ser verificada é **PENDENTE**, nunca “OK” presumido.

## 8. Saída final e parada obrigatória

Ao concluir a branch e o relatório, **parar**. Não publicar, não habilitar indexação, não tocar DNS, **não mesclar a branch em `main`**, e não avançar PI. Reportar a John:

1. URL e estado real do Blogger ou motivo para não o criar;
2. branch, SHAs remotos e arquivos alterados;
3. artigo-piloto em rascunho e checagem de cada valor/fonte;
4. testes/evidências;
5. instruções manuais para domínio/verificação, se houver;
6. aprovações necessárias antes da próxima fase.

Aguardar auditoria de JJ e autorização explícita de John antes de qualquer merge ou abertura ao público. Autorização para esta implementação **não** autoriza publicar nem mesclar.

## Fontes para o executor

- Ler `README.md`, `index.html`, `css/style.css`, `js/app.js`, `LICENSE` atuais na branch principal.
- Blogger: [CNAME/domínio](https://support.google.com/blogger/answer/1233387?hl=pt-BR), [indexação/SEO](https://support.google.com/blogger/answer/41373?hl=pt-BR), [AdSense](https://support.google.com/adsense/answer/1269077?hl=pt-BR) — monetização excluída.
- [Google Keyword Planner](https://support.google.com/google-ads/answer/7337243?hl=pt-BR), [limites do Trends](https://support.google.com/trends/answer/4365533?hl=pt-BR), [Search Console](https://support.google.com/webmasters/answer/7576553?hl=pt-BR), [orientação Google sobre IA](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content?hl=pt-br).

**O briefing autoriza a CB a preparar a branch e, somente se já houver sessão Google inequívoca do John, rascunhos privados. Não autoriza publicação, alteração DNS ou merge.**
