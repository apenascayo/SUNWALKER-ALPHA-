# Sunwalker — Alpha 1.5

Jogo estático Sunwalker Alpha 1.5. O jogo jogável fica em `public/game`, com progressão de XP, ondas escaláveis, inventário e áudio de efeitos.

## Requisitos e comandos

É necessário apenas Node.js 18 ou superior. Não há dependências de runtime nem etapa de bundling.

```sh
npm install
npm start
```

Abra <http://localhost:3000>. Para desenvolvimento com reinício automático:

```sh
npm run dev
```

`npm run check` valida a sintaxe do servidor e `npm run build` executa a mesma verificação, já que os arquivos do jogo são servidos sem compilação.

## Arquitetura

- `server/index.js`: servidor HTTP nativo, com MIME types, `GET`/`HEAD`, fallback da página inicial e proteção contra path traversal.
- `public/index.html`: página estática de apresentação, com título, descrição e incorporação do jogo.
- `public/game/`: jogo independente (HTML, CSS, JavaScript e assets), preservado sem dependências externas.

O servidor aceita `PORT=xxxx` e serve somente arquivos dentro de `public`.
