// Sunwalker protagonist sprite-sheet renderer.
// Optional assets: if the sheets are missing, the existing procedural renderer remains active.
const PLAYER_SPRITE_CONFIG = {
  frameWidth: 48,
  frameHeight: 48,
  renderWidth: 72,
  renderHeight: 72,
  directions: ["up", "upRight", "right", "downRight", "down", "downLeft", "left", "upLeft"],
  sheet: { src: "assets/player_sprites.png", frameWidth: 48, frameHeight: 48, columns: 8 },
  rows: { sword: 5, sheath: 5, trabuco: 5, idle: 4 },
  // Source layout: sword 0-4, sheath 0-4, trabuco 0-4, idle 0-3.
  // The four panels are extracted into a single 8-column runtime sheet.

const playerSpriteImage = new Image();
let playerSpriteReady = false;
playerSpriteImage.onload = () => { playerSpriteReady = true; };
playerSpriteImage.onerror = () => { playerSpriteReady = false; };
playerSpriteImage.src = PLAYER_SPRITE_CONFIG.sheet.src;

function playerSpriteSheetFor(player) {
  if (player.attack && PLAYER_SPRITE_CONFIG.rows[player.attack.type]) return player.attack.type;
  if (typeof weaponMode === "string" && weaponMode === "trabuco") return "trabuco";
  return "idle";
}

function playerSpriteFrame(sheetName, player, now) {
  const rows = PLAYER_SPRITE_CONFIG.rows[sheetName] || 1;
  if (player.attack && player.attack.type === sheetName) {
    const duration = Math.max(1, player.attack.duration || 1);
    const progress = Math.max(0, Math.min(0.999, (now - player.attack.startedAt) / duration));
    return Math.min(rows - 1, Math.floor(progress * rows));
  }
  return Math.floor(now / 150) % rows;
}

function drawPlayerSprite(p) {
  const sheetName = playerSpriteSheetFor(p);
  const image = playerSpriteImage;
  if (!image || !playerSpriteReady) return false;

  const cfg = PLAYER_SPRITE_CONFIG.sheet;
  const directionIndex = Math.max(0, PLAYER_SPRITE_CONFIG.directions.indexOf(p.direction));
  const now = performance.now();
  const row = playerSpriteFrame(sheetName, p, now);
  const sx = directionIndex * PLAYER_SPRITE_CONFIG.frameWidth;
  // The source image is the complete 1536x1024 reference sheet.
  // Panel offsets point at the four animation grids inside it.
  const panel = {
    sword: { x: 48, y: 114 },
    sheath: { x: 853, y: 114 },
    trabuco: { x: 48, y: 629 },
    idle: { x: 848, y: 635 }
  }[sheetName];
  const sx = panel.x + directionIndex * cfg.frameWidth;
  const sy = panel.y + row * cfg.frameHeight;
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
