# Publicar o Mesa 10: GitHub → Netlify → Gemini

O ZIP contém o aplicativo completo, as duas Netlify Functions e os testes. Não precisa de Neon. A chave da API será cadastrada no painel do Netlify, como variável de ambiente disponível às Functions — não dentro do código da função.

## 1. Preparar o projeto no computador

1. Baixe `mesa-10-netlify.zip` na aba **Publicar** do app.
2. Extraia o ZIP. Abra a pasta `mesa-10`, onde ficam `package.json` e `netlify.toml`.
3. Instale [Git](https://git-scm.com/downloads) e [Node.js](https://nodejs.org/en/download) 22 ou superior.
4. Abra o Terminal nessa pasta. No Windows, pode usar o terminal do VS Code; no macOS, o Terminal.
5. Execute, uma linha por vez:

```sh
npm test
npm run build
```

Os testes devem terminar sem falhas. Não é necessário instalar pacotes do navegador. O build atualiza `dist/mesa-10.html`.

## 2. Criar o repositório no GitHub

1. Entre em [github.com](https://github.com) e escolha **New repository**.
2. Nome: `mesa-10`. Pode ser privado ou público, conforme sua preferência.
3. Crie o repositório **vazio**, sem adicionar README, licença ou `.gitignore`; o projeto já inclui seus próprios arquivos.
4. Na pasta local, execute:

```sh
git init -b main
git add .
git commit -m "Mesa 10: treino cash e calibração"
git remote add origin https://github.com/SEU_USUARIO/mesa-10.git
git push -u origin main
```

Substitua `SEU_USUARIO` pelo seu usuário do GitHub. Se o Git pedir sua identidade no primeiro commit, configure seu nome/e-mail seguindo a mensagem do terminal. Para autenticar, use a tela do GitHub/Git Credential Manager ou GitHub Desktop; não use a senha da conta como token de Git.

**Alternativa sem comandos de Git:** no GitHub Desktop, use **File → Add local repository**, selecione a pasta, crie o repositório se solicitado, faça o primeiro commit e escolha **Publish repository**. Confira os arquivos antes de publicar.

Devem subir: `dist/`, `netlify/`, `scripts/`, `tests/`, `package.json`, `netlify.toml`, `.gitignore`, `.env.example` e os guias. **Não suba `.env` com chaves reais.** O ZIP não inclui `.git` nem a identidade da hospedagem de prévia.

## 3. Importar no Netlify

1. Acesse [app.netlify.com](https://app.netlify.com).
2. Escolha **Add new project → Import an existing project**.
3. Selecione GitHub, autorize o acesso ao repositório `mesa-10` e escolha esse repositório.
4. Confira as configurações:

| Campo | Valor |
| --- | --- |
| Production branch | `main` |
| Base directory | vazio: raiz do repositório |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Functions directory | `netlify/functions`, definido em `netlify.toml` |
| Node | `22`, definido em `netlify.toml` |

5. Clique em **Publish** / **Deploy** e aguarde o status de conclusão.
6. No log do deploy ou lista de Functions, confirme o empacotamento de **coach** e **calibration**. O Netlify faz esse empacotamento durante o deploy.
7. Abra o endereço HTTPS fornecido e jogue a primeira mão. O treino local funciona antes de cadastrar a API.

Arrastar somente `dist` no Netlify Drop publica o front-end, mas não as Functions. Para este projeto com IA, mantenha o fluxo pelo repositório. Confira a configuração de acesso do seu projeto antes de divulgar o link.

## 4. Obter a chave do Gemini

1. Abra [Google AI Studio → API keys](https://aistudio.google.com/apikey).
2. Entre na sua conta Google. Crie/selecione um projeto e gere uma chave para a Gemini API.
3. Confira se o projeto está no **Free Tier**, se o modelo está disponível e quais são suas cotas.
4. O padrão do código é **`gemini-3.5-flash-lite`**. Consulte o [modelo](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite) e os [preços atuais](https://ai.google.dev/gemini-api/docs/pricing).
5. Copie a chave diretamente para o painel do Netlify no próximo passo.

O Free Tier tem limites e não é uma chave gratuita ilimitada. O conteúdo enviado no nível gratuito pode ser usado para melhorar produtos do Google. O app usa somente dados da simulação e não ativa faturamento. Não envie a chave no chat, em screenshots ou no repositório.

## 5. Configurar as variáveis das Functions

No projeto do Netlify, abra **Project configuration → Environment variables → Add a variable**.

| Nome | Valor | Escopo/contexto |
| --- | --- | --- |
| `GEMINI_API_KEY` | Sua chave gerada no AI Studio | Incluir **Functions**, contexto **Production** |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` | Functions / Production; opcional, pois já é o padrão |

Se aparecer a opção de marcar o valor como segredo, use-a para a chave. Se seu plano não oferecer seleção individual de escopos, use o padrão que inclui Functions. Para testar uma Deploy Preview, configure também esse contexto deliberadamente.

Não use prefixos públicos como `VITE_` ou `NEXT_PUBLIC_`. Não cole a chave em `dist/`, `netlify.toml` ou no arquivo `.mjs`. O código já lê `process.env.GEMINI_API_KEY` no servidor. A variável `[build.environment]` do TOML é para o build e não substitui uma variável das Functions no painel.

Depois de salvar, vá a **Deploys → Trigger deploy → Deploy project** (o texto pode variar). Alterações de variáveis precisam de um novo deploy para entrar nas Functions.

## 6. Testar a integração

1. Abra seu endereço **Netlify** no Safari ou em outro navegador.
2. Complete as dez primeiras mãos: nove de Hold’em e uma de Omaha.
3. Entre em **Meu jogo → Analisar meu diagnóstico com Gemini**.
4. Confira se aparecem a leitura inicial, a leitura dos adversários, o ajuste e o exercício.
5. A consulta é feita apenas quando você clica. O progresso e o diagnóstico local continuam funcionando se a API falhar.

Para diagnóstico de configuração, abra `https://SEU_SITE.netlify.app/api/calibration`, substituindo pelo seu domínio real. O JSON `ready: true` indica apenas que a variável existe; a primeira análise é que valida a chave e o acesso ao modelo no Google. O endpoint não mostra a chave.

| Problema | Conferir |
| --- | --- |
| Página em branco ao abrir arquivo no iPhone | Use o endereço HTTPS hospedado; visualizadores de arquivos podem bloquear JavaScript. |
| `404` em `/api/calibration` | As Functions foram incluídas? Foi usado o repositório completo, com `netlify/functions`? |
| “A IA precisa da chave” / `not_configured` | Nome exato `GEMINI_API_KEY`, escopo Functions, Production e novo deploy. |
| `ready: true`, mas a análise falha | Validade/restrições da chave, modelo disponível e logs da função no Netlify. |
| Cota atingida / `429` | Limites do Google ou limite por IP da Function. Aguarde a renovação da cota; o app não repete automaticamente. |
| Timeout | A resposta excedeu o tempo limite. Continue pelo diagnóstico local e tente depois. |
| Histórico diferente no novo endereço | O progresso pertence ao navegador e domínio anteriores; esta versão não sincroniza dados. |

A prévia hospedada no ChatGPT é estática: a integração entregue neste pacote será executada no seu Netlify. A chamada real precisa da sua chave; não foi validada com credenciais suas.

## 7. Atualizar depois

Após editar arquivos:

```sh
npm test
npm run build
git add .
git commit -m "Melhorias no treino cash"
git push
```

O Netlify recebe o push e cria um novo deploy. Se também quiser atualizar o ZIP disponível para baixar no app, execute `python3 scripts/package-netlify.py` antes do `git add`. Python é necessário apenas para recriar esse pacote.

## 8. Dados, custos e evolução com Neon

Esta versão salva no navegador. Não há login ou banco remoto. Mesas arquivadas permanecem nesse armazenamento; limpar dados do site remove o progresso. Teste atualizações no mesmo domínio para continuar seu histórico.

As Functions configuram limite por IP/domínio: 4 análises de calibração por minuto e 6 do coach antigo. Isso não é um teto global de custo nem autenticação. Confira cotas, modelo, plano do Google e limites do Netlify na sua conta antes de divulgar amplamente.

Para sincronizar depois: adicionar login, criar tabelas de usuários/mãos/decisões, restringir cada usuário aos seus dados e acessar Neon somente pelas Functions. A futura `DATABASE_URL` deve ficar no servidor. Nenhuma configuração de Neon é necessária agora.

## Documentação oficial

- [GitHub: enviar código local](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)
- [Netlify: importar repositório](https://docs.netlify.com/start/quickstarts/deploy-from-repository/)
- [Netlify: variáveis das Functions](https://docs.netlify.com/build/functions/environment-variables/)
- [Netlify: API das Functions](https://docs.netlify.com/build/functions/api/)
- [Google: chave da API](https://ai.google.dev/gemini-api/docs/api-key)
- [Google: preços](https://ai.google.dev/gemini-api/docs/pricing)
- [Google: limites de uso](https://ai.google.dev/gemini-api/docs/rate-limits)

Revisado em 01/11/2026. Interfaces, disponibilidade e planos dos provedores podem mudar.
