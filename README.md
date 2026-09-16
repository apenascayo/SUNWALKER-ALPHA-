# Sunwalker — Alpha 1.8.5

Sunwalker é um jogo estático desenvolvido em HTML, CSS e JavaScript, executado diretamente no navegador e servido por um servidor HTTP nativo em Node.js. Esta versão consolida os sistemas implementados até a Alpha 1.8.5.

## Alpha 1.8.5

### Controles e combate
- Movimento em 8 direções com WASD.
- DASH/teleporte de 50px com Shift.
- R alterna entre espada e bainha.
- Espaço é usado para interação/itens.
- Defesa e corrida permanecem desativadas.
- Sistema de combate corpo a corpo com espada letal e bainha não letal.
- Chefão Invocador introduzido a partir da Onda 4.
- Invocador possui invocação periódica de três servos.
- Chefão Invocador possui identidade visual rosa.
- Sons de combate, dano, flechas e troca de arma.

### Música
A playlist de combate possui sete faixas:
1. Sertão do Shakuhachi
2. Sertão do Shakuhachi 2
3. Combaião Determinado
4. Sertão de Lâmpadas 1
5. Sertão de Lâmpadas 2
6. Vaqueiro Entoada
7. Vaqueiro Entoada 2

As faixas usam embaralhamento por ciclo: todas as músicas são tocadas antes de uma repetição, e o primeiro item do novo ciclo não repete imediatamente a última faixa anterior.

O nome da música não é exibido na interface.

### Mercador e habilidades
- Mercador com imagem `assets/mercador.png`.
- Interface de compra reformulada.
- Habilidades adquiridas recebem indicação visual de estado ativo.
- BAINHA — CONVERSÃO continua disponível.
- ESPADA — RELÂMPAGO está temporariamente desativada até segunda ordem, incluindo compra, ativação e efeitos relacionados.
- A janela do mercador possui rolagem vertical para exibir todos os itens.

### Sistemas temporariamente desativados
- **Reputação:** desativada/congelada até segunda ordem.
- **Pescaria:** desativada até segunda ordem, incluindo vara de pescar, peixes, área de pesca, interação e minijogo.
- **Espada de Relâmpago:** desativada até segunda ordem, incluindo habilidade, efeitos, dano elétrico e elementos de interface relacionados.

### HUD e interface
- Status das habilidades ativas aparece somente quando o jogador pressiona **TAB**.
- Status das habilidades fica no **canto inferior esquerdo**.
- Nome das músicas permanece oculto.
- Contador de ondas preservado.
- Vida, stamina, moedas, XP e demais elementos de combate permanecem disponíveis.
- Modo Deus disponível nas configurações para testes.
- Configurações de volume de música e efeitos.
- Controle de zoom da câmera.

### Menu inicial
A Alpha 1.8.5 possui menu inicial com:
- **INICIAR** — inicia a partida.
- **CONFIGURAÇÃO** — abre as configurações.
- **RANKING** — exibe o maior número de onda alcançado e a data do recorde.

O ranking é armazenado no `localStorage` do navegador e mantém o maior resultado alcançado pelo jogador.

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
