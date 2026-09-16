# Sunwalker Alpha 1.5 — Movimentação + Combate + Progressão

## Controles
- WASD: movimento em 8 dire??es.
- Modo Mouse: bot?o esquerdo = espada; bot?o direito = bainha.
- Modo Teclado: K = espada; L = bainha.
- Espa?o: defesa nos dois modos.
- ESC: pausar/despausar.
- F3: Debug Mode.
- I: abre o inventário; F: usa o item selecionado (Melador ou Bomba de Fogo).

## Configura??es
O bot?o Configura??es permite escolher entre ataque por Mouse e por Teclado. A escolha ? salva no LocalStorage.
Al?m disso, o zoom da c?mera e o volume da m?sica tamb?m persistem no LocalStorage.

## Chef?o e perigo
A ?rea de perigo do chefe usa um quadrado de 15px de lado, centrado no alvo do boss na tela. Isso foi interpretado como 15px no espa?o do canvas (em pixel do jogo), n?o como uma unidade do mapa.
O jogador tem 3 segundos de aviso para sair da zona antes que o dano de fogo passe a ser aplicado; se permanecer ou entrar depois do aviso, sofre dano por fogo por 5 segundos, com o mesmo c?lculo percentual por segundo da habilidade de espada (CONFIG.fireBurnPercentPerSecond).

## Combate
- Espada: efeito de corte, dano e inimigo fica parado por 500 ms.
- Bainha: causa dano e afasta o inimigo 10 px por golpe.
- 3 bainhadas: inimigo desmaia/morre.
- Reputa??o: m?ximo 100, come?a em 50.
- Morte por espada: -1 reputa??o.
- Desmaio por 3 bainhadas: +2 reputa??o.

## Progressão Alpha 1.5
- Cada morte concede 5 XP e cada desmaio 10 XP, sem duplicação; 100 XP abre a escolha de um upgrade de vida, ataque, velocidade ou stamina (até cinco níveis por atributo). Cada upgrade aumenta o atributo em 10%; stamina aumenta `maxStamina`, consumo e regeneração respeitam o novo máximo.
- O HUD exibe o nível atual do jogador e seu XP; ao escolher um upgrade, o nível aumenta. Inimigos exibem acima da cabeça o nível da wave (incluindo arqueiros e chefão).
- O intervalo de respawn é de 50s nas waves iniciais, 45s a partir da wave 5 e 30s a partir da wave 10.
- Inimigos recebem +2% de vida e velocidade por onda após a primeira; comuns começam 5% mais rápidos.
- O mercador vende o Melador por 50 moedas; ele cura 25% da vida máxima.
- O mercador vende a Bomba de Fogo por 75 moedas. Ela é armazenada no inventário, pode ser selecionada com I e é lançada a 15px na direção do jogador. A área circular completa tem 20x20px (raio de 10px), fica visível por 5s e aplica 15% da vida máxima do NPC uma vez por segundo, sem duplicar ticks por frame; o NPC também recebe o estado visual de queimando.
- Há cinco dashes por ciclo, com recarga de 30 segundos após o quinto.

Abra index.html diretamente no navegador.

## Bomba de fogo + efeitos sonoros
- A bomba de fogo usa hitbox oval/retangular de 50x150px centrada no impacto, com dano cont?nuo de 15% por segundo e status burning.
- A explos?o visual em tela dura ~300-500ms com anel expandindo e part?culas leves para feedback sem travar o loop.
- Os efeitos de ?udio do invent?rio, wave, coins, level-up, bomba e upgrade est?o integrados ao gameplay e usam volume de efeitos configur?vel.
