# Referências da versão 2.3.0

Consulta: 01/11/2026.
- PokerStars, glossário: https://www.pokerstars.com/pt-BR/poker/terms/ — pagar, desistir, aumentar, botão e blefe. Interface usa também “mesa (check)” e “tudo (all-in)”.
- PokerStars, rake: https://www.pokerstars.com/pt-BR/poker/room/rake/ — definição da taxa; a estrutura de cobrança deste app é própria.
- GTO Wizard, preço para pagar: https://blog.gtowizard.com/what-are-pot-odds-in-poker/ — custo versus pote final, efeito do rake e limites de realização de equidade.

Dicas originais, sem copiar tabelas de solver. O cálculo didático usa o pote total estimado, não o pote elegível individual em all-ins com potes laterais. O motor de pagamentos, por sua vez, respeita a elegibilidade. A estimativa de equidade usa mãos aleatórias e não resolve GTO.

## Documentação anterior (exercícios legados)

# Mesa 10: fontes, regras e premissas

Versão 2.1, revisada em 01/11/2026. O aplicativo é independente e usa tabelas e heurísticas próprias. As referências orientam os fundamentos; não constituem endosso ou certificação GTO.

## Referências de poker

- [Upswing: estratégia 6-max](https://upswingpoker.com/6-handed-max-poker-strategy/)
- [Upswing: tabelas públicas](https://upswingpoker.com/charts/)
- [PokerStars: regras do Omaha](https://www.pokerstars.com/pt-BR/poker/games/omaha/)
- [PokerStars: ranking e desempates](https://www.pokerstars.com/poker/games/rules/hand-rankings/)

As faixas da grade de 169 classes são simplificações próprias de RFI em 6-max com 100 fichas, sem ante/rake. Não são transcrições certificadas dessas fontes. Os percentuais ponderam 6 combos por par, 4 por suited e 12 por offsuit, totalizando 1.326. Na grade dos exercícios anteriores, o SB usa raise/fold como convenção. A nova grade cash usa somente as posições sem blinds descritas abaixo.

## Cash contínuo da versão 2.1

### Cobrança e posição

A regra desta mesa é **entrada pelo dealer**: o botão coloca 1 ficha como aposta inicial viva. Os demais jogadores precisam pagar essa entrada, aumentar ou desistir antes do flop. Se houver aumento, é preciso igualar a aposta vigente ou estar all-in. O dealer já tem a entrada creditada e só paga uma diferença adicional, quando houver. Um check pré-flop só é possível para quem já igualou a aposta; nunca significa entrada gratuita.

Não há small blind ou big blind no formato solicitado. As posições relativas ao botão são BTN, UTG, UTG+1, MP, HJ e CO. A ação começa à esquerda do dealer em todas as rodadas e o botão gira uma cadeira por mão. O herói permanece visualmente embaixo. Essa é a regra específica do simulador; não é uma afirmação sobre todos os formatos de cash game.

A nomenclatura de fichas substitui BB na interface cash. A migração mantém o histórico concluído; uma mão antiga incompleta é cancelada, preservada e integralmente estornada antes de redistribuir. O diagnóstico inicia uma amostra da regra atual, mantendo os resultados anteriores no histórico e no gráfico da banca.

### Fichas e distribuição

O herói começa com 100 fichas na mesa e 900 fichas de reserva. Reentrar transfere até 100 fichas da reserva, sem apagar perdas. Os bots abaixo de 1 ficha recompõem seus stacks entre mãos; esses acréscimos são registrados pelo motor e não entram na banca do herói. Não há rake.

O motor usa centésimos de ficha, conserva fichas por mão, devolve a parte não paga de uma aposta e distribui potes laterais somente entre elegíveis. Em empates, centésimos indivisíveis seguem a ordem a partir da esquerda do botão. Um all-in inferior ao aumento mínimo não reabre automaticamente o direito de aumentar para quem já agiu.

No Omaha, o aumento máximo é limitado ao pote após pagar. O intervalo legal também respeita o stack e o aumento mínimo; o botão de all-in só aparece se esse valor couber no limite do pote.

### Sorteio e bots

Todas as cartas vêm de um baralho completo embaralhado, sem filtro para favorecer o herói. O estado aleatório é persistido, evitando nova cobrança ou novo sorteio ao recarregar. Cinco bots usam as próprias cartas e a mesa revelada, com probabilidades próprias de pagar/aumentar/desistir. Não conhecem cartas do herói ou futuras comunitárias ao escolher ações.

Os climas Mesa mista, Pressão alta e Imprevisível mudam probabilidades e tamanhos. O motor limita a três aumentos dos bots por rodada como convenção de simulação, mas permite aumentos legais do herói. Nenhum bot é um solver ou reproduz um jogador real.

### Referência didática

Pré-flop: a abertura usa as faixas próprias por ordem de ação. UTG+1 usa a referência de UTG; MP usa a de HJ; as demais posições preservam sua faixa homônima. A defesa e a seleção de Omaha usam pontuação heurística de força inicial. A entrada pelo botão, stacks diferentes e ações anteriores alteram a estratégia; as faixas não foram resolvidas para cada contexto.

Pós-flop: 200 simulações em Hold’em e 120 em Omaha, com semente derivada somente das cartas próprias, board visível, modalidade e número de oponentes. Adversários recebem mãos uniformemente aleatórias sem cartas repetidas. As mãos ocultas reais e o runout futuro não entram no cálculo. Não há condicionamento por ação, posição, stack ou perfil. Portanto, equidade contra essas mãos aleatórias não é equidade contra uma faixa realista de call.

Para pagar, compara-se equidade com `call / (pote atual + call)`. Uma janela de 7 pontos percentuais aceita pagar ou desistir. Acima de 82%, um aumento legal também é aceito. Sem aposta a pagar, a referência sugere apostar com pelo menos um par e equidade acima de 65%; dentro de 10 pontos desse limiar, aceita check e aposta. São limiares próprios, não frequências GTO ou estimativas exatas de EV. Não são avaliadas realização de equidade, futuras apostas, tamanho ótimo da aposta ou rake.

### Diagnóstico

As dez primeiras mãos (9 Hold’em + 1 Omaha) são uma avaliação inicial. O diagnóstico se atualiza com o histórico da mesa. Hold’em e Omaha são separados. Dicas e consultas durante a decisão marcam assistência; a avaliação de qualidade considera as decisões sem ajuda.

Prioridades se baseiam nos desvios da referência em seleção, defesa, preço para pagar e apostas por valor. O painel mostra oportunidades e exemplos concretos, sem atribuir tendência a uma ação que nunca aconteceu. Exercícios direcionados reabrem essas decisões sem alterar a banca.

VPIP/PFR descrevem as mãos concluídas da modalidade. O HUD usa somente ações públicas pós-flop: apostas/(apostas+checks), separado por modalidade. Essa medida não é AF tradicional nem chance de blefe. O Gemini recebe contagens de Hold’em concluído, não perfis internos. O limiar de 12 oportunidades para comentar estilo é uma convenção prudente, sem significância estatística garantida.

## Avaliação exata das mãos

Hold’em escolhe as melhores cinco cartas, podendo usar zero, uma ou duas próprias. Omaha exige exatamente duas próprias e três comunitárias. No river são `C(4,2) × C(5,3) = 60` combinações por jogador; no flop e turn usam-se as combinações disponíveis. Somente as cinco cartas legais entram no desempate. Naipes não desempatam e não há sexta carta de kicker.

## Exercícios independentes preservados

A interface anterior permanece em Configurações, para manter históricos e exercícios. Nela, cada sessão reinicia stacks, o pós-flop é heads-up contra uma faixa ilustrativa fixa, usa 400 amostras no flop/turn e enumeração no river, sem raises pós-flop. A décima mão é um desafio de showdown Omaha. Essas premissas se aplicam somente aos exercícios anteriores, não à nova mesa cash.

Faixa ilustrativa antiga: `22+ A2s+ K9s+ Q9s+ J9s+ T8s+ 97s+ 86s+ 75s+ 65s 54s ATo+ KJo+ QJo`. O laboratório de EV desses exercícios supõe ausência de futuras apostas e usa hipóteses editáveis; não representa dinheiro ganho/perdido.

## Infraestrutura e IA

- [Modelo Gemini 3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite)
- [Preços e Free Tier](https://ai.google.dev/gemini-api/docs/pricing)
- [Chaves da API](https://ai.google.dev/gemini-api/docs/api-key)
- [Cotas](https://ai.google.dev/gemini-api/docs/rate-limits)
- [generateContent](https://ai.google.dev/api/generate-content)
- [Netlify Functions](https://docs.netlify.com/build/functions/api/)
- [Variáveis das Functions](https://docs.netlify.com/build/functions/environment-variables/)
- [Limitação de requisições](https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/)
- [Deploy por repositório](https://docs.netlify.com/start/quickstarts/deploy-from-repository/)

O modelo padrão tem Free Tier listado na data de revisão, sujeito à disponibilidade/cotas do projeto e a mudanças. Conteúdo do nível gratuito pode ser usado para melhorar produtos do Google. O app não ativa faturamento. O motor local funciona sem API, e a API não transforma as referências em uma solução de solver ou garante lucro.
