# Changelog

## 2.3.4 — 2026-11-02
- Layout “jogo primeiro”: mesa e painel de decisão no topo; banca, calibração, rastro da mão e avisos abaixo.
- No celular, a navegação vira barra inferior fixa, liberando o topo para a mesa.
- Apenas reposicionamento: nenhum conteúdo, regra ou cálculo foi alterado.

## 2.3.3 — 2026-11-01
- Omaha a cada dez mãos (9 Hold’em + 1 Omaha), independente do giro dos nove assentos.
- Preserva integralmente mão aberta, saldo, histórico e estado salvo; só novas mãos usam a nova frequência.

## 2.3.2 — 2026-11-01
- Apostas e aumentos em múltiplos de R$ 0,25, incluindo bots e atalhos.
- Exceção explícita para all-in com saldo exato; rake permanece em centavos.

## 2.3.1 — 2026-11-01
- Reentrada de R$ 20,00 sem repetir a taxa inicial de R$ 2,00.
- Investimento acumulado cresce junto com as fichas; reentrada não altera lucro/prejuízo.
- Reentrada opcional entre mãos na aba Progresso.

## 2.3.0 — 2026-11-01
- Nove jogadores e ciclo de oito Hold’em + um Omaha.
- Blind do dealer: R$ 0,25 / R$ 1,00; entrada R$ 22 (20 em fichas + 2 de taxa).
- Rake de 5% em potes disputados acima de R$ 10, com centavos e potes laterais.
- Resultado líquido, reentradas e gráfico; sessões antigas arquivadas sem conversão.
- Vocabulário brasileiro, dicas GTO com fontes e limites; API atualizada para oito adversários.
- Roadmap de login/ranking; versionamento sincronizado.

# Alterações

## 2.2.0 · 2026-11-01

- Aba Publicar removida; GitHub, Netlify e Gemini documentados no repositório.
- PWA com manifesto, ícones próprios, suporte à tela inicial de iPhone/Android, áreas seguras e controles maiores para toque.
- Cache offline do aplicativo, atualização com confirmação e preservação da mão antes do recarregamento. API e conteúdos privados não entram no cache.
- Todas as cartas são reveladas ao encerrar cada mão, inclusive de jogadores que desistiram. Animação de revelação, identificação dos vencedores e melhores combinações disponíveis para revisão.
- Histórico das novas mãos inclui a revelação. Mãos encerradas por desistência preservam o resultado e não revelam um board futuro que não foi jogado.
- README atualizado para `valock/mesa-10`, guia de upload pelo GitHub, guia de PWA, contribuição, segurança e workflow de testes.

## 2.1.0 · 2026-11-01

- Entrada de 1 ficha do dealer passa a contar como aposta viva. Outros jogadores pagam, aumentam ou desistem antes do flop.
- Posições do cash sem SB/BB: UTG, UTG+1, MP, HJ, CO, BTN.
- Preservação de histórico e saldo; uma mão incompleta da regra anterior é cancelada e estornada antes da redistribuição. A calibração usa novas observações sob a regra corrigida.

## 2.0.0

- Cash contínuo, banca simulada, dez mãos iniciais de observação, Omaha a cada dez mãos, adversários com tendências, animações, histórico e revisão com Gemini opcional.
