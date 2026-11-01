# Segurança e privacidade

O frontend é público. Configure `GEMINI_API_KEY` apenas nas variáveis de ambiente do Netlify com acesso pelas Functions. `.env.example` não contém valores reais; `.env` e variantes estão no `.gitignore`. Se uma chave for publicada por engano, revogue-a no provedor e gere outra: remover o arquivo não revoga a chave nem apaga o histórico do Git.

As Functions validam origem, tamanho e campos, descartam entradas desconhecidas e impõem limites por IP/domínio. Não existe autenticação nesta versão. Limite por IP não é um teto global de custos; configure cotas no provedor antes de divulgar o endpoint. As respostas da API não são armazenadas pelo service worker.

O progresso fica no navegador. Não há conta, pagamentos, dinheiro real, telemetria ou banco remoto. O Gemini recebe dados resumidos da simulação apenas quando o usuário pede a análise. As cartas reveladas ao final são armazenadas localmente para revisão, mas não fazem parte do payload de calibração.

## Relatar problemas

Se o repositório tiver **Security → Report a vulnerability** habilitado, envie o relato por esse canal privado. Caso não esteja habilitado, abra uma issue pedindo um canal de contato, sem publicar detalhes exploráveis ou credenciais. Inclua os passos mínimos e a versão afetada somente no canal privado.
