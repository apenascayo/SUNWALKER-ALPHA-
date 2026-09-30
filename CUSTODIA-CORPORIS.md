# SUN WALKER — Custodia Corporis

Esta é a cópia completa do projeto enviada pelo usuário, com a funcionalidade do Pergaminho Sagrado integrada ao jogo.

## Implementação

- Item do Mercador: **PERGAMINHO SAGRADO**
- Preço configurado: **150 moedas**
- Compra: equipa automaticamente o pergaminho
- Tecla `R`: inclui o pergaminho no ciclo de armas quando comprado
- Ataque: segue o modo de ataque do jogo (mouse ou `K`, conforme a configuração)
- Ao acertar um inimigo: ativa **CUSTODIA CORPORIS**
- Área visual: **200 × 200 px**
- Duração: **5 segundos**
- Inimigos dentro da área: ficam paralisados enquanto permanecerem dentro dela
- Dano: fogo comum, **7% da vida máxima por segundo**
- Área animada com anéis, runas, brilho, brasas e símbolo central
- O pergaminho também possui representação visual na mão do personagem
- A lógica foi integrada aos arquivos existentes de combate, renderização, configuração, entidade, HUD e mercador.

## Arquivos alterados

- `public/game/index.html`
- `public/game/js/config.js`
- `public/game/js/entities.js`
- `public/game/js/combat.js`
- `public/game/js/game.js`
- `public/game/js/render.js`
- `public/game/js/merchant-skill-ui-alpha18.js`

O servidor existente em `server/index.js` foi preservado.

## Execução local

Na raiz do projeto:

```bash
npm start
```

Depois abra:

`http://localhost:3000/game/`

Nenhum commit, push, merge ou alteração no repositório remoto foi realizado.
