// Câmera com Smooth Follow (interpolação lerp) sempre centralizada no jogador.
function tileW() { return CONFIG.TILE_WIDTH * CONFIG.zoom; }
function tileH() { return CONFIG.TILE_HEIGHT * CONFIG.zoom; }

const Camera = {
  x: 0,
  y: 0,

  snapToPlayer() {
    this.x = player.x;
    this.y = player.y;
  },

  update(dt) {
    const speed = CONFIG.cameraLerpSpeed || 8;
    // Lerp independente de framerate.
    const smooth = 1 - Math.pow(0.001, dt * (speed / 8));
    this.x += (player.x - this.x) * smooth;
    this.y += (player.y - this.y) * smooth;

    // Evita drift quando já está praticamente em cima do alvo.
    if (Math.abs(player.x - this.x) < 0.001) this.x = player.x;
    if (Math.abs(player.y - this.y) < 0.001) this.y = player.y;

    // Mantém a câmera dentro dos limites do mapa.
    this.x = Math.max(0, Math.min(CONFIG.MAP_WIDTH - 1, this.x));
    this.y = Math.max(0, Math.min(CONFIG.MAP_HEIGHT - 1, this.y));
  },

  worldToScreen(wx, wy) {
    const dx = wx - this.x;
    const dy = wy - this.y;
    const viewport = typeof getViewportSize === "function"
      ? getViewportSize()
      : { width: canvas.clientWidth, height: canvas.clientHeight };
    return {
      x: viewport.width / 2 + (dx - dy) * tileW() / 2,
      y: viewport.height / 2 + (dx + dy) * tileH() / 2
    };
  }
};
