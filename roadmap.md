# Roadmap · Mesa 10

Atualizado para v2.5.0. Itens futuros; sem prazo prometido.

## Entregue
- [x] Nove jogadores; ciclos de nove Hold’em e um Omaha.
- [x] Reais simulados, entrada de R$ 22, reentradas de R$ 20 sem nova taxa, blind R$ 0,25 / R$ 0,50 e rake de 5% acima de R$ 10.
- [x] Gráfico líquido, dicas com fundamentos GTO, PWA e revisão das cartas.

## Próxima etapa: contas
- [ ] Login e apelido, recuperação de acesso e exclusão da conta.
- [ ] Banco de dados e API autenticada para sincronizar dispositivos.
- [ ] Importação explícita do progresso local, com resolução de conflitos offline.

## Colaboração e ranking
- [ ] Grupos por convite e ligas entre amigos.
- [ ] Desafios equivalentes, pontuação validada no servidor e prevenção de manipulação.
- [ ] Ranking semanal de decisões, evolução e participação, separado do resultado em reais simulados.
- [ ] Amostra mínima, separação Hold’em/Omaha e sinalização de ajuda consultada.
- [ ] Privacidade: optar por exibir apelido e pontuação; histórico privado por padrão.

## Estudo
- [ ] Referências validadas para a estrutura própria de nove jogadores.
- [ ] Cálculo do preço específico do pote elegível em all-ins com potes laterais.

## Regra de manutenção
A cada entrega, atualizar README, package.json e CHANGELOG com a mesma versão e revisar este roadmap. Login e ranking online só estarão disponíveis após implementação e validação; o ranking local já funciona.

## Perfis compartilhados e WhatsApp (futuro)
- [ ] Login por telefone/WhatsApp via provedor oficial e verificação de posse, sem colocar tokens no cliente.
- [ ] Perfil privado por padrão; consentimento separado para usar decisões na criação de um adversário virtual compartilhado.
- [ ] Modelo comportamental por modalidade: seleção de mãos, posição, frequência de apostas, tamanhos e resposta à pressão; mínimo de amostra e incerteza visíveis.
- [ ] Começar com parâmetros estatísticos ajustados às decisões, sem anunciar treinamento de um modelo de IA que ainda não existe.
- [ ] Versões do perfil, desligar compartilhamento, excluir histórico/modelo e desvincular telefone do apelido público.
- [ ] Catálogo de adversários autorizados; telefones nunca expostos a outros jogadores.
- [ ] Ranking validado no servidor, desafios equivalentes e separação entre decisão didática e lucro simulado; detecção de manipulação.
- [x] Elenco fictício Casa do Gui com IDs estáveis, estilos persistentes por mesa e 19 personagens, oito assentos de bots e fila de substituição.

## Sessões e pontuação
- [x] 120 mãos por noite de cinco horas simuladas, fechamento idempotente e extrato final.
- [x] Ranking local de XP de mesa (participação + lucro líquido), independente do XP de estudo.
- [x] Identidade preservada nas trocas; rebuys e perdas acumuladas por participante.
- [ ] Ranking compartilhado persistido e validado pelo servidor; separar simulações locais de partidas elegíveis.
- [ ] Comparar XP de lucro por estruturas equivalentes e amostras mínimas, sem tratar sorte de uma sessão como habilidade.
