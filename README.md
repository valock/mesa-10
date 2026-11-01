# Mesa 10 · versão 2.0

Treinador de cash game em português, com fichas fictícias. Mesa contínua de seis jogadores, calibração inicial de dez mãos e revisão baseada nas decisões registradas. Projeto estático, sem dependências de execução no navegador, preparado para GitHub e Netlify Functions.

## O que está implementado

- **Mesa contínua:** 100 BB iniciais na mesa, 900 BB de reserva, stacks mantidos entre mãos, reentrada pela reserva e histórico de resultados. Apostas, all-ins, potes laterais, empates e devoluções de apostas não pagas são contabilizados em centésimos de BB.
- **Cobrança no dealer:** por padrão, somente o botão paga 1 BB obrigatório por mão. É um ante do botão, uma regra própria, sem blinds obrigatórios. O botão gira a cada mão e a ação começa à sua esquerda. As apostas voluntárias são pagas por quem as faz. Em Configurações, há também cash tradicional com SB 0,5 BB e BB 1 BB.
- **Cartas e adversários:** baralho aleatório completo, sem favorecimento do herói; cinco bots com identidades e tendências persistentes, usando suas próprias cartas e a mesa revelada. Três ritmos: Mesa mista, Pressão alta e Imprevisível.
- **Todas as rodadas:** pré-flop, flop, turn e river, com apostas, aumentos e reaumentos legais. A mão pode terminar antes do showdown.
- **Omaha jogável:** a cada dez mãos, a décima é Omaha de quatro cartas, com limite de aumento pelo pote. Usa exatamente duas cartas próprias e três comunitárias. A análise de Omaha fica separada da de Hold’em.
- **Calibração inicial:** dez mãos geram uma primeira leitura. O painel Meu jogo apresenta frequências, oportunidades observadas, prioridades, evidências por mão e metas de estudo. Não significa treinar um modelo de IA nem determinar um estilo estável em dez mãos.
- **Treino direcionado:** refaça decisões que desviaram da referência, com o contexto disponível naquele momento. Os exercícios não mexem na banca e não contam outra vez para a calibração.
- **Animações:** cartas distribuídas e reveladas, fichas indo às apostas e ao pote, pagamentos aos vencedores e movimento do botão. Velocidades, pausa, pular até sua vez e respeito a movimento reduzido.
- **Banca e decisões separadas:** ganhar não prova que a escolha foi boa. Errar não gera multa artificial. O gráfico mostra o resultado das fichas fictícias, sem projeção de renda.
- **Gemini opcional:** análise das contagens e evidências mediante clique. Chave protegida no servidor. O jogo e o diagnóstico local funcionam sem API.
- **Continuidade:** a mão é salva durante o jogo. Mesas anteriores são arquivadas ao iniciar outra. Os exercícios e históricos da versão anterior foram preservados.

## Abrir e publicar

O `dist/mesa-10.html` é autônomo para treino local. No iPhone/Safari, prefira o endereço hospedado: o visualizador de arquivos pode não executar JavaScript. A API precisa do servidor Netlify; abrir o HTML local não ativa as Functions.

O passo a passo completo está em **[NETLIFY.md](NETLIFY.md)** e na aba **Publicar** do aplicativo. Extraia `dist/mesa-10-netlify.zip`, suba o projeto para seu GitHub e importe no Netlify. Configuração: build `npm run build`, publicação `dist`, funções `netlify/functions`, Node 22. O Drop de `dist` publica apenas a parte estática.

## Método e limites

As tabelas são próprias e didáticas, inspiradas em princípios públicos de seleção por posição; não são saídas certificadas de solver. O ante personalizado e os stacks variáveis alteram a estratégia: as referências são aproximações, não faixas resolvidas para cada situação.

No cash contínuo, a equidade pós-flop usa 200 amostras de Hold’em ou 120 de Omaha contra mãos uniformemente aleatórias dos adversários ativos. Não condiciona a faixa às apostas, ao perfil, à posição ou ao tamanho do stack. Não usa cartas adversárias ocultas ou comunitárias futuras para recomendar. O cálculo é ilustrativo: não estima realização de equidade, rake ou futuras apostas. Veja [FONTES.md](FONTES.md).

A qualidade da decisão é comparada com heurísticas próprias. Dicas e consulta às tabelas durante sua vez marcam a decisão como assistida. O diagnóstico de qualidade usa decisões sem ajuda; VPIP/PFR descrevem todas as mãos de Hold’em concluídas. VPIP exclui ante/blinds obrigatórios. A frequência do HUD é apostas ÷ (apostas + checks), separada por modalidade: não é AF, probabilidade de blefe ou certeza de estilo.

A IA sugere pontos de estudo. Nenhum resultado do simulador garante aumento de bankroll ou lucro em jogos reais.

## API e dados

- `GET /api/calibration` ou `/api/coach`: informa presença da configuração e modelo, sem revelar a chave. Não valida a chave no Google.
- `POST /api/calibration`: recebe somente contagens de Hold’em, número de mãos de Omaha, evidências enumeradas e ações públicas agregadas dos cinco adversários em Hold’em. Não envia cartas, perfil interno ou saldo.
- `POST /api/coach`: endpoint dos exercícios independentes anteriores, com contexto visível da mão e contagens; sem cartas ocultas ou futuras.
- Campos desconhecidos são descartados. Origem e tamanho do corpo são validados. Não há chat livre, chamadas automáticas a cada jogada ou repetição automática de tentativas.
- Respostas são estruturadas e escapadas na interface. Falha, timeout ou cota não impedem o treino local.
- Limites configurados: calibração 4 pedidos/minuto; coach anterior 6 pedidos/minuto, por IP/domínio. Corpo até 8 KiB e timeout do provedor de 18 segundos. Isso não é autenticação ou um teto global de custo.

Modelo padrão: `gemini-3.5-flash-lite`, alterável por `GEMINI_MODEL`. Em 01/11/2026, a documentação oficial lista Free Tier para esse modelo; disponibilidade e cotas dependem do projeto/região. Confira no AI Studio antes de publicar. No nível gratuito, os conteúdos podem ser usados para melhorar produtos do Google. O aplicativo não ativa faturamento. Nunca coloque uma chave real no Git, HTML, JavaScript público ou localStorage.

Progresso, histórico e bots ficam no `localStorage` do navegador. Trocar de dispositivo ou domínio não transfere os dados; limpar os dados remove o progresso. **Neon não é necessário nesta versão.** Uma evolução com sincronização deve incluir autenticação e isolamento por usuário antes de conectar o banco. `DATABASE_URL` deve ficar exclusivamente no servidor.

## Desenvolvimento e verificação

```sh
npm test
npm run build
python3 scripts/package-netlify.py
```

`npm run build` recompõe o HTML autônomo, sem compilação de bibliotecas. O script Python recria o ZIP de exportação; não é necessário para o deploy pelo Git.

| Arquivo | Responsabilidade |
| --- | --- |
| `dist/cash.js` | Mesa contínua, regras de ação, saldo, pagamentos e referência |
| `dist/cash-coach.js` | Métricas, evidências, prioridades e validação do resumo |
| `dist/cash-ui.js`, `dist/cash.css` | Interface da mesa, animações e diagnóstico |
| `dist/publish.js` | Guia de Git, Netlify e Gemini dentro do app |
| `dist/engine.js` | Baralho, avaliação exata das mãos e motor dos exercícios anteriores |
| `dist/coach.js`, `dist/app.js`, `dist/style.css` | Base da aplicação e exercícios preservados |
| `netlify/functions/` | Integração Gemini no servidor |
| `tests/` | Regras, conservação de fichas, privacidade e API com provedor simulado |

A chamada real ao Gemini e o deploy na conta Netlify do usuário dependem da chave e da conta. Os testes de API usam um provedor simulado; não comprovam disponibilidade de uma chave real.
