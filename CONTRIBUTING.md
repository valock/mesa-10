# Contribuir com o Mesa 10

Abra uma issue em [valock/mesa-10](https://github.com/valock/mesa-10/issues) descrevendo o comportamento esperado e observado, o dispositivo e os passos para reproduzir. Não inclua chaves de API nem dados de jogos reais.

Para alterar o código, use uma branch, mantenha o texto da interface em português e execute:

```sh
npm test
npm run build
```

Depois, abra um pull request explicando a mudança e sua verificação. O workflow de CI roda os mesmos checks sem credenciais externas.

## Organização

- Edite os arquivos em `dist/` diretamente, exceto `sw.js` e `mesa-10.html`, que são gerados pelo build.
- Edite o worker em `scripts/service-worker.template.js`. Alterações no app ou no template geram outra versão de cache automaticamente.
- Não coloque regras de poker apenas na interface. Ações e pagamentos pertencem a `dist/cash.js`; mãos são avaliadas por `dist/engine.js`.
- Preserve as fichas em cada ação, o limite PLO, os potes laterais e o crédito da entrada do dealer.
- Cartas dos adversários só podem ser mostradas quando as apostas da mão terminaram. A revisão posterior não pode alterar os dados usados na decisão original ou enviar cartas ao resumo Gemini.
- Teste o layout em 320 e 390 pixels, teclas/foco, movimento reduzido e retomada de uma mão após recarregar.
- Sempre execute o build antes de publicar; editar `dist/sw.js` manualmente perde a alteração no próximo build.

Para gerar o pacote portável: `npm run package` (Node + Python 3). O script usa uma lista de arquivos permitidos para excluir segredos e dados locais.
