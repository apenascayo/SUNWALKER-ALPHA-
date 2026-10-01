// Sunwalker protagonist sprite-sheet renderer.
// Optional assets: if the sheets are missing, the existing procedural renderer remains active.
const PLAYER_SPRITE_CONFIG = {
  frameWidth: 48,
  frameHeight: 48,
  renderWidth: 72,
  renderHeight: 72,
  directions: ["up", "upRight", "right", "downRight", "down", "downLeft", "left", "upLeft"],
  sheets: {
    sword: { src: "assets/player_sword.png", rows: 5 },
    sheath: { src: "assets/player_sheath.png", rows: 5 },
    trabuco: { src: "assets/player_trabuco.png", rows: 5 },
    idle: { src: "assets/player_idle.png", rows: 4 }
  }
};

const playerSpriteImages = {};
const playerSpriteState = {};

(function preloadPlayerSprites() {
  for (const [name, cfg] of Object.entries(PLAYER_SPRITE_CONFIG.sheets)) {
    const image = new Image();
    playerSpriteImages[name] = image;
    playerSpriteState[name] = "loading";
    image.onload = () => { playerSpriteState[name] = "ready"; };
    image.onerror = () => { playerSpriteState[name] = "missing"; };
    image.src = cfg.src;
  }
})();

function playerSpriteSheetFor(player) {
  if (player.attack && PLAYER_SPRITE_CONFIG.sheets[player.attack.type]) return player.attack.type;
  if (typeof weaponMode === "string" && weaponMode === "trabuco") return "trabuco";
  return "idle";
}

function playerSpriteFrame(sheetName, player, now) {
  const cfg = PLAYER_SPRITE_CONFIG.sheets[sheetName];
  if (!cfg) return 0;
  if (player.attack && player.attack.type === sheetName) {
    const duration = Math.max(1, player.attack.duration || 1);
    const progress = Math.max(0, Math.min(0.999, (now - player.attack.startedAt) / duration));
    return Math.min(cfg.rows - 1, Math.floor(progress * cfg.rows));
  }
  return Math.floor(now / 150) % cfg.rows;
}

function drawPlayerSprite(p) {
  const sheetName = playerSpriteSheetFor(p);
  const image = playerSpriteImages[sheetName];
  if (!image || playerSpriteState[sheetName] !== "ready") return false;

  const cfg = PLAYER_SPRITE_CONFIG.sheets[sheetName];
  const directionIndex = Math.max(0, PLAYER_SPRITE_CONFIG.directions.indexOf(p.direction));
  const now = performance.now();
  const row = playerSpriteFrame(sheetName, p, now);
  const sx = directionIndex * PLAYER_SPRITE_CONFIG.frameWidth;
  const sy = row * PLAYER_SPRITE_CONFIG.frameHeight;
  const s = Camera.worldToScreen(p.x, p.y);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const w = PLAYER_SPRITE_CONFIG.renderWidth * CONFIG.zoom;
  const h = PLAYER_SPRITE_CONFIG.renderHeight * CONFIG.zoom;
  ctx.globalAlpha = p.hitFlashUntil > now
    ? 0.48 + 0.5 * Math.abs(Math.sin(now / 45))
    : 1;

  ctx.drawImage(
    image,
    sx, sy, PLAYER_SPRITE_CONFIG.frameWidth, PLAYER_SPRITE_CONFIG.frameHeight,
    s.x - w / 2, s.y - h + 5 * CONFIG.zoom,
    w, h
  );
  ctx.restore();
  return true;
}
