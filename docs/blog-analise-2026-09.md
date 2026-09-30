# Blog True North: análise do padrão atual e se vale a pena retomar (set/2026)

Pergunta do Leandro: "precisamos entender qual é o padrão de posts que ele tem seguido e se realmente vai ajudar a rankear no Google".

## Resumo em 5 linhas

1. O blog tem **50 posts publicados**: 16 herdados do Lovable (sem data real; `lastmod` 2026-07-17, dia da migração) e **34 gerados por IA (Gemini Flash) e publicados automaticamente, 1 por dia, de 22/07 a 25/08/2026**, sem revisão humana.
2. A automação não quebrou. Ela **esgotou a lista fixa de 34 temas** e desde 26/08 roda todo dia "com sucesso" sem publicar nada (aviso `Every pooled topic is published`).
3. A forma está boa: H2 em pergunta, FAQ, tabela, link para `/loan-estimator`, schema Article + FAQPage, página pré-renderizada, sitemap. O conteúdo é fraco: o prompt **proíbe números, taxas e nomes de credores** e não tem etapa de pesquisa. O resultado são textos genéricos, sem fonte e sem autor nomeado, num assunto YMYL (finanças).
4. Há **canibalização forte**: MCA, invoice factoring, working capital, crédito ruim, equipamentos e requisitos têm 2 ou 3 posts cada, e ainda competem com as páginas de produto e de setor do próprio site.
5. **Veredito: vale retomar, mas não neste formato.** Primeiro consolidar o que existe e olhar o Search Console. Depois publicar de 2 a 4 posts por mês, pesquisados, com fontes canadenses, exemplo em CAD e revisão humana, em temas de cauda longa onde sites pequenos já aparecem.

> Limite desta análise: deste ambiente o acesso ao Supabase e ao site ao vivo foi bloqueado pelo proxy, então não li o HTML de cada post. Os dados vêm do repositório (sitemap, `published-log.md`, prompt e QA do gerador), dos logs do GitHub Actions (tamanho, modelo, avisos) e da busca na web. **Não há dados do Google Search Console aqui**, e essa é a informação que mais falta para decidir (ver "Antes de escrever").

---

## Como os posts são produzidos hoje

| Peça | Onde | O que faz |
|---|---|---|
| Framework | `blog-framework/BLOG-FRAMEWORK.md` | Modelo "WiseFunnel" em 3 camadas (estratégia, elementos `tn-*`, publicação). Fala em pilar/cluster, mas isso não é aplicado na prática. |
| Gerador | `scripts/daily-blog-post.mjs` | Escolhe o tema numa lista fixa `POOL` (34 itens), gera com Gemini Flash (escolha automática; nos logs, `gemini-3.6-flash` / `3.7-flash`), passa um QA mecânico e **publica direto** (`status=published`), com capa SVG gerada. |
| Agendamento | `.github/workflows/daily-blog-post.yml` | Cron diário às 06:00 UTC. Commita sitemap e log, e isso dispara o rebuild no Netlify. |
| Verificação | `scripts/check-blog-content.mjs` + `content-check.yml` | Só verifica forma (CTA duplicado, H1, estilos inline, meta > 60/160). Não roda nos commits do bot. |
| Renderização | `src/pages/BlogPost.tsx` | DOMPurify, schema `Article` (autor = **Organization "True North Team"**) e `FAQPage` quando há 2 ou mais perguntas. CTA fixo no fim. |

Regras do prompt que definem o padrão: foco só no Canadá; de 1.200 a 1.600 palavras; de 7 a 9 H2 em forma de pergunta; de 4 a 6 FAQs; de 2 a 3 links internos (um para `/loan-estimator`); no máximo 6 elementos visuais. E também: *"NEVER invent a specific interest rate, statistic, or a named lender"*. Sem acesso a pesquisa, a IA fica sem nenhum dado concreto para usar. O `DAILY-TASK.md` manda pesquisar na web, mas o script não faz isso.

---

## Tabela dos posts existentes

### A. Herdados do Lovable (16). Data real desconhecida (`lastmod` 2026-07-17)

Tamanho aproximado de 970 a 1.065 palavras (medido no commit `0e21727`). Em 23/07, 12 deles tinham `meta_title` acima de 60 caracteres e 3 citavam os EUA.

| Slug | Tema | Conflita com |
|---|---|---|
| small-business-loan-canada-guide | empréstimo PME Canadá | `/small-business-loans`, rascunho `how-to-get-a-small-business-loan-in-canada` |
| compare-business-loan-interest-rates-canada | taxas | the-fees-behind-a-business-loan |
| unsecured-vs-secured-business-loans-entrepreneurs-guide | garantia | what-counts-as-collateral… |
| credit-score-impact-business-loans | score | how-to-build-business-credit…, bad credit (2 posts) |
| business-loan-bad-credit-canada-how-to-get-funding | crédito ruim | **how-to-get-a-business-loan-with-bad-credit-in-canada** |
| what-lenders-look-for-business-loan-application-prepare | requisitos | business-loan-requirements…, document-checklist… |
| what-is-a-working-capital-loan-a-complete-guide-truenorth-business-loan | capital de giro | **working-capital-loans-when-to-use-one…** |
| 5-signs-business-ready-expansion-loan | expansão | **signs-business-ready-growth-financing** (quase idêntico) |
| signs-business-ready-growth-financing | expansão | idem |
| merchant-cash-advance-explained-flexible-funding-solution | MCA | `/merchant-cash-advance`, **merchant-cash-advance-in-canada…**, mca-help-restaurant… |
| mca-help-restaurant-survive-slow-season | MCA restaurante | restaurant-business-loans…, seasonal-business-financing… |
| invoice-factoring-solve-cash-flow-problems | factoring | `/invoice-factoring`, **invoice-factoring-in-canada…**, is-your-business-good-candidate… |
| is-your-business-good-candidate-invoice-factoring | factoring | idem |
| equipment-financing-guide-canadian-businesses | equipamento | `/equipment-financing`, **equipment-financing-in-canada-how-to-qualify…** |
| how-to-finance-heavy-equipment-construction-business-alberta | equipamento, construção, AB | construction-business-loans-in-canada… |
| cannabis-business-loans-funding-high-risk-industry | cannabis | `/cannabis-dispensary` |

### B. Gerados automaticamente (34). 1 por dia, de 22/07 a 25/08/2026

Tamanho de 1.469 a 1.887 palavras nos logs verificados (30/07: 1.469; 12/08: 1.887; 16/08: 1.510 com aviso "7 elementos"). Falhas sem post em 27/07 e 13/08.

| Data | Slug (resumido) | Palavra-chave alvo | Conflita com |
|---|---|---|---|
| 22/07 | self-storage-business-loans… | self storage business loans | `/self-storage` |
| 22/07 | restaurant-business-loans-in-canada… | (título usado como keyword) | mca-help-restaurant… |
| 23/07 | landscaping-business-loans… | landscaping business loans canada | seasonal-business-financing |
| 24/07 | auto-repair-shop-financing… | auto repair shop financing canada | |
| 25/07 | cleaning-business-loans… | cleaning business loans canada | |
| 26/07 | how-much-can-your-business-borrow… | how much can i borrow business loan | |
| 28/07 | personal-guarantees… | personal guarantee business loan | |
| 29/07 | the-fees-behind-a-business-loan… | business loan fees explained | compare-business-loan-interest-rates |
| 30/07 | refinancing-business-debt-in-canada… | refinance business debt canada | |
| 31/07 | seasonal-business-financing… | seasonal business financing canada | landscaping, mca-restaurant |
| 01/08 | startup-business-loans-in-canada… | startup business loan canada | |
| 02/08 | the-document-checklist… | business loan documents checklist | requirements, what-lenders-look-for |
| 03/08 | how-to-build-business-credit-in-canada… | improve business credit canada | credit-score-impact |
| 04/08 | cash-flow-forecasting… | cash flow forecast small business | |
| 05/08 | used-vs-new-equipment… | used vs new equipment | equipment (3 URLs) |
| 06/08 | business-acquisition-loans-in-canada… | business acquisition loan canada | |
| 07/08 | equipment-financing-in-canada-how-to-qualify… | equipment financing canada | `/equipment-financing`, legado |
| 08/08 | merchant-cash-advance-in-canada… | merchant cash advance canada | `/merchant-cash-advance`, 2 legados |
| 09/08 | invoice-factoring-in-canada… | invoice factoring canada | `/invoice-factoring`, 2 legados |
| 10/08 | how-to-get-a-business-loan-with-bad-credit-in-canada | business loan bad credit canada | legado idêntico |
| 11/08 | trucking-business-loans… | trucking business loans | `/transportation` |
| 12/08 | manufacturing-equipment-loans… | manufacturing equipment loans | `/manufacturing` |
| 14/08 | working-capital-loans… | working capital loan small business | legado |
| 15/08 | business-line-of-credit-vs-term-loan… | line of credit vs term loan | |
| 16/08 | franchise-financing-in-canada… | franchise financing canada | `/established-franchises` |
| 17/08 | business-loan-requirements-in-canada… | business loan requirements canada | 2 posts |
| 18/08 | how-fast-can-you-get-a-business-loan… | how fast business loan approval | |
| 19/08 | bank-vs-alternative-lender… | bank vs alternative lender | |
| 20/08 | construction-business-loans-in-canada… | construction business loans canada | heavy-equipment-alberta |
| 21/08 | retail-business-loans-in-canada… | retail business loans canada | |
| 22/08 | medical-practice-financing-in-canada… | medical practice financing canada | |
| 23/08 | staffing-agency-financing… | staffing agency financing canada | |
| 24/08 | property-management-financing… | property management financing canada | `/property-management` |
| 25/08 | what-counts-as-collateral… | business loan collateral canada | unsecured-vs-secured |

---

## O que está funcionando

- **Base técnica sólida:** posts pré-renderizados (HTML real para o Google e para crawlers de IA), sitemap com `lastmod`, canonical absoluto, `Article` + `FAQPage`, Markdown para agentes, visual consistente (`tn-*`).
- **Estrutura AEO correta:** H2 em pergunta com resposta nas primeiras frases, FAQ, tabelas com rolagem no celular, link para o funil em todo post.
- **Foco no Canadá** consistente nos posts novos, com o QA bloqueando menções aos EUA.
- **Alguns temas de cauda longa bem escolhidos:** personal guarantee, collateral, staffing agency, auto repair, medical practice. Sites pequenos conseguem aparecer nesse tipo de busca.

## O que não está funcionando

1. **Nenhum ganho de informação.** O prompt proíbe taxas, estatísticas e nomes. Sem pesquisa, o texto não cita CSBFP, BDC, CRA, Código Penal (taxa máxima de juros), provinciais, nem traz exemplo em dólares. O Google e as respostas de IA citam quem traz o dado concreto, e esses posts dizem o mesmo que outras 50 páginas.
2. **Volume em escala feito por IA, sem revisão.** Foram 34 posts em 35 dias, todos do mesmo molde, publicados direto em conteúdo YMYL. Isso é exatamente o perfil que a política de *scaled content abuse* e os *core updates* do Google rebaixam. O risco atinge o domínio inteiro, não só o blog.
3. **E-E-A-T fraco:** autor genérico "True North Team" (Organization), sem bio, sem revisor, sem fontes, sem data de revisão visível. Em finanças, isso pesa.
4. **Canibalização:** cerca de 8 grupos de temas com 2 a 4 URLs cada (tabelas acima), mais posts que disputam com as páginas de produto e de setor. O Google escolhe uma URL e as outras diluem a força.
5. **Temas de cabeça sem chance:** "small business loan canada", "equipment financing canada" e "merchant cash advance canada" são dominados por governo (ISED, BC), grandes bancos (RBC, TD, BMO, CIBC, Scotiabank), BDC e marketplaces antigos (smarter.loans, loanscanada, finder, Moneris). Um domínio novo não compete nesses termos.
6. **Sem arquitetura de cluster:** o framework fala em pilar/cluster, mas os posts não linkam entre si (no máximo 1 `link-card`), e não há página pilar.
7. **FAQPage não gera mais rich result** para sites comerciais (o Google restringiu isso em 2023 a sites de governo e saúde). Continua útil para leitura por IA, mas não mostra estrelas nem perguntas na busca.
8. **Automação cega:** esgotou a lista e seguiu "verde" por 5 semanas. Em `CLAUDE.md` e `DAILY-TASK.md` ainda consta "Canada e US", enquanto o gerador é só Canadá (o site tem `/application-usa`). O posicionamento precisa ser decidido.
9. **Marca ambígua:** "True North" já é usado por True North Mortgage, TN Financing, True North Accounting e True North Business Funding (EUA). Buscas de marca não ajudam, o que é mais um motivo para o conteúdo precisar se sustentar sozinho.

Sinal de indexação: uma busca `site:truenorthbusinessloan.ca blog` (WebSearch, índice dos EUA) não retornou nenhuma página do site. É um indício fraco. Confirmar no Search Console.

---

## Veredito: vale a pena?

**Sim, com condições.** O blog é o único canal orgânico do site. Os concorrentes que aparecem em cauda longa são sites do mesmo porte (grantcompass.ca, capitaltoolkit.com, restaurantfinancingcanada.ca, fincapfinancialgroup.ca, solucofinancialgroup.ca), o que mostra que dá para rankear quando o tema é específico e o texto traz dado útil. Retomar o "1 post por dia" como está não ajuda e pode prejudicar.

Condições:

1. **Antes de escrever:** exportar do Search Console (últimos 90 dias) as impressões e cliques por URL `/blog/*`. Posts com zero impressões em 90 dias são candidatos a fusão ou `noindex`.
2. **Consolidar a canibalização** (sem apagar URLs: 301 para o post mais forte): MCA (3→1), factoring (3→1), crédito ruim (2→1), capital de giro (2→1), expansão (2→1), requisitos/documentos/o-que-o-credor-olha (3→1 ou 2 com papéis distintos), equipamentos (3→2). Resultado esperado: cerca de 40 URLs mais fortes.
3. **Pausar o cron diário** (ou deixar só `DRY_RUN`/rascunho) e publicar de **2 a 4 posts por mês**, com revisão humana.
4. **Autor nomeado** (pessoa real, com bio e experiência em crédito PME), "revisado por" e "atualizado em".
5. **Medir por 60 a 90 dias** (impressões e posição nos 4 temas abaixo) antes de aumentar o volume.

---

## 4 temas recomendados

Critérios: cauda longa, específico do Canadá, SERP com sites pequenos ou só com notas jurídicas e americanas, dado citável que a IA pode reproduzir, e ligação direta com um produto do site.

### 1. Existe juro máximo para empréstimo empresarial no Canadá?

- **Palavra-chave:** `maximum interest rate business loan canada` / `criminal interest rate business loan` (sec.: `35% APR rule canada business`, `48% APR commercial loan`).
- **Intenção:** informativa com proteção ("estou sendo explorado?"), dono de PME comparando ofertas caras.
- **Ângulo:** desde 1/1/2025 a taxa criminal é **35% APR**. Empréstimos comerciais a PJ entre **$10.000 e $500.000** são isentos se o APR ficar em até **48%**, e acima de $500.000 não há teto (Código Penal s.347; SOR/2024-114; notas Cassels, McMillan e BLG). A SERP hoje só tem notas de escritórios de advocacia escritas **para credores**. Ninguém explica isso para o tomador, com exemplo em CAD e o caso do MCA (que é compra de recebíveis, não empréstimo). Entra como página de referência citável.
- **H2s:**
  - Qual é a taxa de juros máxima permitida no Canadá?
  - Como a regra muda para empréstimos empresariais (até $10 mil, de $10 mil a $500 mil, acima de $500 mil)?
  - Como calcular o APR real de uma oferta (exemplo em CAD)?
  - Merchant cash advance entra no limite?
  - O que fazer se a oferta passar do limite?
  - FAQ (3 a 5)
- **Links:** `/merchant-cash-advance`, `/small-business-loans`, `/loan-estimator`, tema 2.

### 2. Factor rate para APR: quanto um merchant cash advance custa de verdade no Canadá

- **Palavra-chave:** `merchant cash advance factor rate to apr` / `mca cost calculator canada` (sec.: `holdback percentage`, `mca true cost`).
- **Intenção:** comercial e investigativa (quem está prestes a assinar um MCA).
- **Ângulo:** a SERP é 100% de calculadoras americanas (Nav, LendingTree, Fundmerica) e de financeiras. Nossa versão: **calculadora interativa em CAD** (valor, factor rate, % de retenção, vendas diárias → prazo estimado e APR equivalente), 3 exemplos trabalhados e comparação com o limite do tema 1. **Substitui os 3 posts de MCA existentes** (301 para este).
- **H2s:**
  - O que é factor rate e por que ele não é uma taxa de juros?
  - Como converter factor rate em APR (fórmula e calculadora)?
  - Quanto custa um MCA de $30.000 em 3 cenários de vendas?
  - Quando um MCA ainda faz sentido?
  - Quais são as alternativas mais baratas (linha de crédito, factoring, prazo)?
  - FAQ
- **Links:** `/merchant-cash-advance`, `/invoice-factoring`, `/loan-estimator`, tema 1.

### 3. CSBFP ou BDC: qual empréstimo com apoio do governo serve para o seu negócio (e o que fazer se os dois disserem não)

- **Palavra-chave:** `csbfp vs bdc loan` (sec.: `canada small business financing program requirements`, `bdc loan alternatives`, `bdc loan declined`).
- **Intenção:** comercial, de comparação.
- **Ângulo:** na SERP já aparecem sites pequenos (grantcompass.ca, capitaltoolkit.com, restaurantfinancingcanada.ca), então é possível entrar. O diferencial é uma **tabela de decisão** com os limites oficiais atuais (conferir no ISED na hora de escrever: teto do programa, sublimites de equipamento e capital de giro, taxa de registro de 2%, faturamento ≤ $10M) e um **terceiro caminho honesto**: quando nenhum dos dois serve (pouco histórico, prazo de semanas), o que o alternativo custa a mais. É o ponto natural do funil.
- **H2s:**
  - Qual é a diferença entre CSBFP e BDC?
  - Quem se qualifica para cada um (tabela)?
  - Quanto tempo leva e quanto custa cada um?
  - O que fazer se o banco ou o BDC recusar?
  - Quando o crédito alternativo vale o custo extra?
  - FAQ
- **Links:** `/small-business-loans`, `/how-it-works`, `/loan-estimator`, post `bank-vs-alternative-lender…` (que passa a linkar para cá).

### 4. Leasing ou empréstimo para equipamento: o que muda nos impostos no Canadá (CCA)

- **Palavra-chave:** `equipment lease vs loan canada tax` (sec.: `are equipment lease payments tax deductible canada`, `capital cost allowance equipment loan`).
- **Intenção:** informativa com decisão de compra (quem já decidiu comprar o equipamento).
- **Ângulo:** a SERP mistura NBC, contadores e financeiras pequenas (fincapfinancialgroup.ca, solucofinancialgroup.ca), um espaço acessível. O diferencial é um **exemplo numérico lado a lado** (caminhão ou máquina de $120.000: parcelas do leasing dedutíveis vs juros + CCA da classe correta, com o fluxo de caixa ano a ano), citando as páginas da CRA. Traz aviso claro de "fale com seu contador" (não é conselho fiscal).
- **H2s:**
  - Pagamento de leasing é dedutível no Canadá?
  - Como funciona o CCA quando você financia a compra?
  - Leasing ou empréstimo com os números de um equipamento de $120 mil: qual sai mais barato?
  - Quando o leasing faz mais sentido (e quando não)?
  - FAQ
- **Links:** `/equipment-financing`, `/transportation` ou `/manufacturing`, `/loan-estimator`, post `used-vs-new-equipment…`.

---

## Padrão novo proposto (substitui o do gerador diário)

| Item | Antes | Novo |
|---|---|---|
| Frequência | 1 por dia, automático | 2 a 4 por mês, com revisão humana antes de `published` |
| Escolha do tema | lista fixa `POOL` | brief por post: keyword + checagem da SERP + qual lacuna vamos cobrir + URL que não pode ser canibalizada |
| Dados | proibido citar números | **obrigatório:** no mínimo 3 fontes primárias canadenses (Canada.ca, ISED, CRA, BDC, Justice Laws, reguladores provinciais) com link, e um exemplo trabalhado em CAD |
| Autor | Organization "True North Team" | pessoa nomeada com bio + "revisado por" + "atualizado em" (Article com `author` Person) |
| Tamanho | 1.200 a 1.600 palavras obrigatórias | o que a pergunta pede (em geral de 1.000 a 2.000). Nada de encher para bater contagem |
| Estrutura | 7 a 9 H2 + 4 a 6 FAQ | resposta direta no primeiro parágrafo, de 4 a 7 H2 em pergunta, 1 tabela ou ferramenta, de 3 a 5 FAQs |
| Links internos | `/loan-estimator` + 1 ou 2 produtos | 1 página de produto/setor + `/loan-estimator` + **2 posts relacionados** (cluster), e os posts antigos passam a linkar para o novo |
| Ativo próprio | nenhum | quando fizer sentido: calculadora, tabela comparativa ou checklist baixável (é o que a IA cita e o que atrai links) |
| Pós-publicação | sitemap | sitemap + pedido de indexação no GSC + revisão das posições em 30, 60 e 90 dias |

Mudanças técnicas sugeridas (não feitas neste PR): tirar o `cron` de `daily-blog-post.yml` ou fazer o script gravar como `draft`. Trocar a regra "NEVER … statistic" por "só números com fonte citada". Emitir `author` como Person em `BlogPost.tsx`. Aplicar os 301 da consolidação em `public/_redirects`.

---

### Fontes consultadas (SERP em 30/09/2026)

- Cabeça: ised-isde.canada.ca, rbcroyalbank.com, td.com, bmo.com, cibc.com, gov.bc.ca, bdc.ca, scotiabank.com, accordfinancial.com, moneris.com, smarter.loans, finder.com/ca, loanscanada.ca, swoopfunding.com/ca.
- Cauda longa com sites pequenos: grantcompass.ca, capitaltoolkit.com, restaurantfinancingcanada.ca (CSBFP vs BDC); fincapfinancialgroup.ca, solucofinancialgroup.ca, virtusgroup.ca, nbc.ca (leasing e impostos); nav.com, fundmerica.com, lendingtree.com (factor rate/APR, todos dos EUA).
- Taxa criminal: cassels.com/insights/new-year-no-criminal-interest-rate-for-commercial-loans, gazette.gc.ca (SOR/2024-114), mcmillan.ca, blg.com, dentons.com.
- Observação: a ferramenta de busca usa índice dos EUA. Confirmar as posições no Google.ca (aba anônima, localização Canadá) antes de escrever.
