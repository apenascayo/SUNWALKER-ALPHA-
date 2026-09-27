SUNWALKER — ALPHA 1.9
Atualizações da Alpha 1.9

🌳 Árvore de Habilidades
Alterada de Árvore da Espada para Árvore de Habilidades.
O botão da HUD agora apresenta somente o símbolo da árvore.
Ao abrir a árvore de habilidades, o jogo é pausado.
Ao fechar a árvore, o jogo retorna ao estado normal.
Corrigidas as habilidades da bainha, que não estavam sendo aplicadas.
No nível máximo da bainha, inimigos comuns podem ter a possibilidade de mudar de lado e se tornar aliados.

⭐ Sistema de XP e Níveis
XP agora é acumulativo.
XP excedente não é perdido ao subir de nível.
O jogador continua recebendo XP mesmo quando ainda possui XP suficiente para progressões adicionais.
Corrigido o processamento de múltiplos níveis.

🔫 Trabuco
Adicionado sistema de munição com 15 balas.
Adicionado cooldown após o disparo.
Adicionado som de recarga.
Adicionada mira para indicar o local do disparo.
Adicionado painel indicando a arma atualmente equipada.
NPC comum: 1 tiro.
Arqueiros: 2 tiros.
Chefes: 5 tiros.
Corrigido o dano contra chefes para que cada tiro reduza corretamente sua barra de vida.

📦 Caixa de Balas
Adicionada a Caixa de Balas ao mercador.
Cada caixa fornece 30 balas.
Adicionado efeito visual amarelo ao utilizar a caixa.
Adicionado som de uso da caixa.
A quantidade de munição é atualizada corretamente após o uso.

🧲 Imã
Adicionado o item Imã, com três níveis:

Nível	Área de atração	Preço
1	50 px	50 moedas
2	100 px	75 moedas
3	200 px	100 moedas
As moedas dentro da área de alcance são atraídas automaticamente para o jogador.
O nível máximo é o nível 3.

🏡 Casa Segura
Área de pesca desativada.
Criada uma nova área verde para funcionar como Casa Segura.
Inimigos não devem atacar ou perseguir o jogador dentro da área segura.
Corrigida a camada de renderização para que a área não fique sobre os personagens, NPCs e demais elementos da tela.

🏹 Arqueiros
Corrigido o som das flechas.
O áudio agora é executado durante o disparo do arqueiro.

🍯 Melador
Adicionado som de cura ao utilizar o item.
Adicionado efeito visual vermelho no personagem.
Adicionada animação para indicar que o efeito de cura foi aplicado.

🎵 Sistema de Áudio
Corrigido o som de recarga do trabuco.
Corrigido o som das flechas.
Adicionado som da Caixa de Balas.
Adicionado som do Melador.
Corrigida a reprodução da música Combaião Determinado.
Ajustado o carregamento dos arquivos de áudio para evitar problemas causados por nomes de arquivos.

💰 Modo Deus
Corrigido o contador de moedas após desativar o Modo Deus.
O valor original de moedas do jogador é preservado e restaurado corretamente.

🖥️ HUD e Informações
Informações de combate foram retiradas do centro da tela.
Mensagens como inimigos derrotados, XP, moedas e recarga agora aparecem no canto inferior da HUD.
Mantido o painel de informações da arma atual.

🧊 Correções de Travamentos
Corrigidos estados que poderiam deixar o jogador travado.
Corrigidos estados de NPCs que poderiam permanecer presos em combate.
Adicionado sistema de recuperação para estados de dano, atordoamento e ataques interrompidos.
Corrigida a recuperação de estados inválidos.
Adicionada proteção contra coordenadas inválidas (NaN/Infinity).

🏷️ Versão

SUNWALKER — Alpha 1.9

# Sunwalker — Alpha 1.8.5

Sunwalker é um jogo estático desenvolvido em HTML, CSS e JavaScript, executado diretamente no navegador e servido por um servidor HTTP nativo em Node.js. A Alpha 1.8.5 consolida os sistemas implementados e os sistemas temporariamente suspensos para os próximos testes.

## Alpha 1.8.5

### Controles e combate
- Movimento em 8 direções com WASD.
- DASH/teleporte de 50px com Shift.
- R alterna entre espada e bainha.
- Espaço é usado para interação/itens.
- Defesa e corrida permanecem desativadas.
- Espada possui dano letal; bainha possui uso não letal.
- Chefão Invocador introduzido a partir da Onda 4.
- Invocador possui invocação periódica de três servos.
- Chefão Invocador recebe identidade visual rosa, diferente dos demais inimigos.
- Sons de combate, dano, flechas e troca de arma.

### Playlist de combate
A playlist de combate possui sete faixas:
1. Sertão do Shakuhachi
2. Sertão do Shakuhachi 2
3. Combaião Determinado
4. Sertão de Lâmpadas 1
5. Sertão de Lâmpadas 2
6. Vaqueiro Entoada
7. Vaqueiro Entoada 2

As músicas são escolhidas por **embaralhamento em ciclos**: as sete faixas entram em uma fila aleatória e cada uma toca uma vez antes de qualquer repetição. Ao iniciar um novo ciclo, a primeira faixa também não pode ser igual à última faixa do ciclo anterior.

O nome da música fica oculto na interface.

### Mercador e habilidades
- Mercador utiliza `assets/mercador.png`.
- Interface de compra reformulada.
- Habilidades adquiridas recebem indicação visual de estado ativo.
- A janela do mercador possui rolagem vertical para exibir todos os itens.
- **ESPADA — RELÂMPAGO** está temporariamente desativada até segunda ordem: compra, ativação, dano elétrico, efeitos, HUD e demais referências relacionadas ficam bloqueados.
- **BAINHA — CONVERSÃO** permanece disponível para testes.

### Sistemas temporariamente desativados
- **Reputação:** congelada/desativada até segunda ordem, sem exibição no HUD.
- **Pescaria:** desativada até segunda ordem. Vara, peixes, área de pesca, interação, marcador e minijogo não ficam disponíveis.
- **Espada de Relâmpago:** desativada até segunda ordem, incluindo habilidade, compra, efeitos e dano elétrico.

### HUD e interface
- Status das habilidades ativas aparece somente ao pressionar **TAB**.
- O painel de habilidades aparece no **canto inferior esquerdo**.
- Nome das músicas permanece oculto.
- Contador de ondas preservado.
- Vida, stamina, moedas, XP e demais elementos de combate permanecem disponíveis.
- Modo Deus disponível nas configurações para testes.
- Configurações de volume de música e efeitos.
- Controle de zoom da câmera.

### Menu inicial
A Alpha 1.8.5 possui uma tela de menu antes da partida com:
- **INICIAR** — inicia a partida.
- **CONFIGURAÇÃO** — abre as configurações.
- **RANKING** — mostra o maior número de onda alcançado e a data do recorde.

O ranking é armazenado no `localStorage` e mantém somente o maior resultado alcançado pelo jogador, junto da data em que o recorde foi registrado.

### Ambientação
- Mapa isométrico de teste.
- Terreno com aparência seca do sertão.
- Cactos e ossos humanos espalhados pelo mapa.
- Estética inspirada no sertão nordestino, horror gótico e influência japonesa.

## Estrutura

- `server/index.js`: servidor HTTP nativo.
- `public/index.html`: página inicial/apresentação.
- `public/game/`: jogo completo, incluindo HTML, CSS, JavaScript e assets.
- `public/game/assets/music/`: trilhas musicais.
- `public/game/assets/sfx/`: efeitos sonoros.
- `public/game/js/alpha185-systems.js`: controles da Alpha 1.8.5, sistemas suspensos, menu, ranking e HUD de habilidades.

## Requisitos e comandos

É necessário apenas Node.js 18 ou superior. Não há dependências de runtime nem etapa de bundling.

```sh
npm install
npm start
```

Abra:

```text
http://localhost:3000
```

Para desenvolvimento com reinício automático:

```sh
npm run dev
```

`npm run check` valida a sintaxe do servidor e `npm run build` executa a mesma verificação, já que os arquivos do jogo são servidos sem compilação.
