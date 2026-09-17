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
