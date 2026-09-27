
## Alpha 2.0 — Chão do Sertão Pernambucano

- Adicionada textura visual de chão inspirada no sertão pernambucano.
- O terreno agora utiliza uma arte de solo seco com rachaduras, folhas secas, galhos, pedras, vegetação resistente e cactos espalhados.
- A textura é carregada em cache para evitar recriação a cada frame.
- O jogo mantém um fallback simples enquanto a textura é carregada.

# SUNWALKER — ALPHA 2.0

## Alpha 2.0 — Atualizações

- Corrigido o travamento ao abrir a Árvore de Habilidades pelo modal de nível antes de melhorar os atributos. Quando o ponto de habilidade é gasto e a árvore é fechada, o modal de nível invisível não mantém mais o jogo pausado.
- Camisa preta corrigida para usar preto real, sem tom azulado.
- Área de dano da Bomba de Fogo aumentada em 25%, de 75 px para 94 px, mantendo a área circular.
- Contador de onda colocado acima do modal de música usando z-index superior, sem remover o modal de música.
- Ao morrer/reiniciar, a música é reiniciada e uma nova ordem aleatória de faixas é criada.
- Reforçada a recuperação do game loop: erros isolados de atualização/renderização não deixam o jogador e os NPCs congelados.

### Correções adicionais
- O player de música voltou a ficar visível; o contador de onda fica acima dele por z-index, sem remover nenhum dos dois.
- Ao morrer, a música reinicia imediatamente com um novo embaralhamento aleatório das faixas.
- A recuperação de travamentos foi reforçada para erros de frame e estados presos de jogador/NPC.

## Alpha 2.0 — Correções recentes

### Mercador
- Corrigida a imagem do mercador na cena: o jogo agora carrega `assets/mercador.png` em vez de um arquivo `.jpg` inexistente.

### Trabuco
- Inimigos que sobrevivem ao disparo do trabuco agora sofrem **recuo de 15px** para trás.
- O recuo é aplicado somente quando o alvo ainda precisa de mais tiros para ser derrotado.
- NPCs comuns continuam exigindo 1 tiro, arqueiros 2 tiros e chefes 5 tiros.

### Casa Segura
- A **Casa Segura está temporariamente desativada** para esta versão.
- Sua área visual, marcador e proteção contra inimigos permanecem desligados até nova ativação.

# Sunwalker — Alpha 2.0

Sunwalker é um jogo estático desenvolvido em HTML, CSS e JavaScript, executado diretamente no navegador e servido por um servidor HTTP nativo em Node.js. A Alpha 2.0 consolida os sistemas implementados e os sistemas temporariamente suspensos para os próximos testes.

## Alpha 2.0

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
A Alpha 2.0 possui uma tela de menu antes da partida com:
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
- `public/game/js/alpha185-systems.js`: controles da Alpha 2.0, sistemas suspensos, menu, ranking e HUD de habilidades.

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

## Alpha 2.0 — Atualizações recentes

### 🧑‍💼 Mercador
- Mercador no mapa ampliado para ter presença visual semelhante ao jogador.
- A imagem do mercador é recortada para remover a transparência excedente da arte e evitar que ele pareça pequeno.
- Compras no mercador agora reproduzem o **som de moedas**.
- Adicionada a aba **ROUPAS**.

### 👕 Roupas
- Adicionados chapéus: **Chapéu de Palha**, **Kasa de Palha** e **Chapéu de Guerreiro**.
- Adicionadas cores de camisa: **preta, vermelha, verde, azul e bege**.
- Ao comprar uma roupa, ela é automaticamente equipada e a aparência do personagem muda imediatamente.
- O visual dos chapéus e das roupas foi inspirado nas referências fornecidas para esta Alpha.

### 💣 Bomba de Fogo
- Área da bomba alterada de oval para **circular**.
- Raio aumentado para **75px**, aproximadamente 50% maior que a referência anterior de 50px.
- A detecção de dano agora usa o mesmo círculo visual, evitando diferença entre aparência e hitbox.

### 🧊 Estabilidade e desempenho
- Adicionado watchdog de estabilidade para jogador e NPCs.
- Estados de ataque, dano, atordoamento e perseguição presos são recuperados automaticamente.
- Coordenadas inválidas são corrigidas sem interromper o jogo.
- Erros isolados de renderização de um NPC não devem mais interromper a atualização de todos os personagens.
- NPCs que ficam presos em perseguição sem movimento são recuperados automaticamente.
- Otimizado o desenho do terreno para evitar criação e ordenação de centenas de objetos a cada frame.
- Reduzido trabalho periódico desnecessário de atualização do DOM.

### 🏡 Casa Segura
- Continua **desativada temporariamente** nesta versão.


## Alpha 2.0 — Ajustes de mapa, HUD e desempenho

### ⏱️ Contador de ondas e modais
- O contador da próxima onda continua correndo mesmo quando qualquer modal estiver aberto.
- Abrir a Árvore de Habilidades, inventário, mercador, configurações ou o modal de nível não congela mais o relógio da onda.
- O **player de música fica acima do contador de ondas**, sem ser removido.
- O contador foi reposicionado para ficar abaixo do player de música e não sobrepor seu conteúdo.

### ⚔️ Caminhos elementais da espada
- Os caminhos **Fogo** e **Raio** são exclusivos.
- Depois de escolher e evoluir um deles, o outro caminho fica bloqueado.
- A espada equipada na mão do personagem demonstra o elemento escolhido em tempo real.
- **Bainha:** espada marrom.
- **Fogo:** espada vermelha com animação de chamas.
- **Raio:** espada azul com efeito elétrico.

### 🗺️ Mapa
- A expansão de grama foi **removida** nesta versão.
- O mapa voltou para **100 unidades de largura**, mantendo somente a área desértica atual.
- A área de grama não aparece mais no cenário nem no minimapa.

### 🧊 Desempenho
- Otimizado o desenho do terreno para evitar criação e ordenação de centenas de objetos a cada frame.
- Reduzido o processamento periódico desnecessário de elementos da interface.
- Mantidos os mecanismos de recuperação para evitar travamentos do jogador e dos NPCs.

### 👘 Chapéus adicionais
- Adicionado **Chapéu Samurai** — 125 moedas.
- Adicionado **Chapéu Ronin** — 150 moedas.
- Ambos podem ser comprados e equipados pelo sistema de roupas do mercador.


### ⚔️ Efeitos elementais no impacto
- Restaurado e reforçado o visual de terreno desértico, com variações de areia mais evidentes, ondulações/dunas, grãos e detalhes secos no chão.
- A renderização do deserto foi integrada ao desenho principal do mapa sem voltar a criar/ordenar listas de tiles a cada frame.
- Corrigida a aplicação do efeito de **Raio** no impacto da espada: o alvo recebe o estado elétrico diretamente no golpe e passa a exibir o efeito visual e dano periódico.
- Mantido o caminho de **Fogo** e seus efeitos de queimadura.
- Fogo e Raio continuam sendo caminhos exclusivos da Árvore de Habilidades.

## Alpha 2.0 — Correção final do terreno e versão
- Restaurada uma textura de areia desértica em cache, com granulação, marcas de areia e dunas, aplicada diretamente ao piso do mapa.
- Mantida a renderização otimizada para evitar recriação pesada da textura a cada frame.
- Corrigido o título da página inicial para **Alpha 2.0**.
- Corrigidas referências residuais de versões antigas em documentação legada.

## Alpha 2.0 — Correção da textura do Sertão
- Corrigida a sobrescrita do renderizador do chão que fazia o jogo voltar ao piso cinza quadriculado.
- O piso do mapa usa uma textura procedural de deserto, sem depender de arquivo PNG externo.
- O carregamento da textura foi antecipado com preload para evitar o fallback visual no início da partida.


### Alpha 2.0 — Chão desértico procedural
- Removida a textura externa `desert-sertao.png`.
- O chão voltou a usar uma textura procedural de areia seca, com granulação, marcas de vento, folhas secas e pequenos gravetos.
- A textura é criada uma única vez e reutilizada para preservar o desempenho.

## Alpha 2.0 — Ajuste do chão do deserto

- Removida a aparência de piso quadriculado/grade do terreno.
- O chão agora usa uma textura procedural contínua de areia seca, sem reiniciar a textura em cada losango.
- Reduzida a quantidade de marcas, folhas e tufos para evitar poluição visual.
- Mantidas variações sutis de areia, marcas de vento e detalhes secos inspirados no sertão.
- A textura é criada uma vez e reutilizada para preservar o desempenho.
