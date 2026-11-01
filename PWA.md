# Mesa 10 no iPhone e Android

O PWA instala um ícone na tela inicial e abre o Mesa 10 em uma janela própria. Não precisa de App Store ou Play Store. Use o endereço **HTTPS** do site publicado, preferencialmente seu domínio final do Netlify.

## iPhone e iPad

1. Abra o endereço do Mesa 10 no **Safari**. Se o link abriu dentro de outro app, use a opção de abrir no Safari.
2. Toque em **Compartilhar**. Dependendo da versão/layout, primeiro abra o menu da página.
3. Selecione **Adicionar à Tela de Início**. Se não encontrar, use **Editar Ações** na lista de compartilhamento para habilitar essa opção.
4. Ative **Abrir como App da Web**, se a opção aparecer.
5. Confirme em **Adicionar** e abra pelo ícone **Mesa 10**.

## Android

1. Abra o endereço do Mesa 10 no **Chrome**.
2. Entre no menu **⋮ → Instalar aplicativo** ou **Adicionar à tela inicial**.
3. Confirme a instalação e abra pelo ícone **Mesa 10**.

Quando o navegador oferece a instalação pelo próprio site, o botão **Instalar Mesa 10** aparece nas configurações. No iPhone, o mesmo local mostra as instruções do Safari. A oferta automática depende do navegador; sua ausência não significa que o jogo deixou de funcionar.

## Preparar o modo offline

1. Abra o aplicativo instalado uma vez **com internet**.
2. Entre nas configurações (engrenagem).
3. Aguarde **Treino offline pronto neste aparelho**.
4. Depois disso, a mesa, as tabelas, o histórico salvo e o diagnóstico local funcionam sem rede. A revisão com Gemini continua exigindo internet.

O cache guarda somente arquivos públicos do aplicativo. Requisições `/api/` e `/.netlify/functions/`, POSTs e respostas da IA nunca entram nesse cache. O histórico da simulação fica separado, no armazenamento local do navegador.

## Atualizar sem interromper o treino

Depois de um novo deploy, o navegador verifica o service worker ao abrir ou voltar ao app com conexão. Uma versão nova é preparada em segundo plano. Quando disponível, aparece **Salvar e atualizar**. O clique salva a mão antes de recarregar; se o salvamento falhar, a atualização é adiada. Uma atualização ativada em outra aba também não força o recarregamento da mão atual.

Se o navegador for fechado completamente, a versão preparada poderá assumir na próxima abertura. A mão já salva é retomada normalmente. O cache antigo do app é removido quando a nova versão é ativada; o histórico local não é apagado.

## Progresso e armazenamento

Instale antes de começar seu histórico principal. Safari, outros navegadores e o app instalado podem usar armazenamentos diferentes, conforme o sistema. Não há sincronização entre aparelhos, navegadores ou domínios. Limpar dados do site remove o progresso; o sistema também pode liberar armazenamento por falta de espaço. Não use navegação privada para uma sequência que queira manter.

Ao trocar o endereço da prévia pelo Netlify, instale novamente pelo domínio final. Remover o ícone antigo não transfere dados. Neon e login ainda não estão implementados; nenhuma conta é necessária nesta versão.

## Verificação manual após publicar

- No iPhone/Safari e no Android/Chrome, instale pelo endereço HTTPS e confira o ícone e a janela própria.
- Abra com internet, espere o status offline, ative o modo avião e reabra pelo ícone. Faça uma decisão e confirme que o treino continua.
- Feche e reabra para conferir a recuperação da mão, do saldo e do histórico no mesmo app instalado.
- Depois de outro deploy, espere a oferta de atualização e confira que **Salvar e atualizar** retoma a mão sem repetir apostas.
- Desative o modo avião antes de solicitar a análise com Gemini.

Os testes automatizados simulam cache, lifecycle e restauração de partidas. Eles não substituem esta verificação em aparelhos reais; o comportamento de instalação depende do sistema e navegador.

## Referências oficiais

- [Apple: transformar um site em app no iPhone](https://support.apple.com/en-lamr/guide/iphone/iphea86e5236/ios)
- [MDN: tornar um PWA instalável](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [MDN: operação offline](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation)
