function getViewportSize() {
  const rect = canvas.getBoundingClientRect();
  return {
    width: rect.width || canvas.clientWidth || window.innerWidth,
    height: rect.height || canvas.clientHeight || window.innerHeight
  };
}

function drawGame() {
  const { width: viewportWidth, height: viewportHeight } = getViewportSize();
  const scaleX = canvas.width / viewportWidth;
  const scaleY = canvas.height / viewportHeight;
  ctx.save();
  ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
  ctx.clearRect(0, 0, viewportWidth, viewportHeight);
  ctx.fillStyle = "#101214";
  ctx.fillRect(0, 0, viewportWidth, viewportHeight);

  drawMap();
  // Casa segura: desenhada como terreno, antes de moedas, NPCs, efeitos e minimapa.
  // Casa Segura temporariamente desativada.
  drawCoins();
  drawBossDangerZones();
  drawFireBombZones();
  drawRadiiDiviniZones();
  drawFireBombImpacts();
  drawCorpusCustodiaCircles();
  drawEntities();
  drawRadiiDiviniStrikes();
  drawBlunderbussTargetHighlight();
  drawAttackFX();
  drawHitSparks();
  if (CONFIG.debug) drawDebug();
  drawMinimap();
  ctx.restore();
}

function drawFireBombImpacts() {
  const now = performance.now();
  for (const impact of fireBombImpacts) {
    const progress = clamp((now - impact.start) / (impact.end - impact.start || 1), 0, 1);
    const s = Camera.worldToScreen(impact.x, impact.y);
    const ringRadius = ((CONFIG.fireBombRadiusPixels || 75) * (0.35 + progress * 0.65)) * CONFIG.zoom;
    const alpha = 1 - progress;
    ctx.save();
    ctx.translate(s.x, s.y - 12);
    ctx.strokeStyle = "rgba(255, 180, 90, " + alpha + ")";
    ctx.fillStyle = "rgba(255, 110, 55, " + (alpha * 0.3) + ")";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + progress * Math.PI * 2;
      const px = Math.cos(angle) * (ringRadius * 0.72 + i * 1.5);
      const py = Math.sin(angle) * (ringRadius * 0.72 + i * 1.5);
      ctx.fillStyle = "rgba(255, 220, 130, " + alpha + ")";
      ctx.fillRect(px, py, 3, 3);
    }
    ctx.restore();
  }
}

function drawFireBombZones() {
  const now = performance.now();
  for (const zone of fireBombZones) {
    const s = Camera.worldToScreen(zone.x, zone.y);
    const radius = (zone.radius || ((CONFIG.fireBombRadiusPixels || 75) / (CONFIG.TILE_WIDTH / 2))) * CONFIG.TILE_WIDTH / 2;
    const pulse = 0.8 + Math.sin(now / 120) * 0.2;
    ctx.save();
    ctx.translate(s.x, s.y - 12);
    ctx.fillStyle = "rgba(255,45,25,0.42)";
    ctx.strokeStyle = "rgba(255,190,55," + pulse + ")";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#ff3020";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function drawRadiiDiviniZones() {
  const now = performance.now();
  for (const zone of radiiDiviniZones) {
    const s = Camera.worldToScreen(zone.x, zone.y);
    const progress = clamp((now - zone.start) / (zone.end - zone.start || 1), 0, 1);
    const pulse = 0.72 + Math.sin(now / 130) * 0.18;
    const radius = zone.radius * CONFIG.TILE_WIDTH / 2;
    ctx.save();
    ctx.translate(s.x, s.y - 10);
    ctx.globalAlpha = 0.92 - progress * 0.18;
    ctx.shadowColor = "#72cfff";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "rgba(45,135,220,0.13)";
    ctx.strokeStyle = `rgba(142,220,255,${pulse})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([7, 9]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(225,247,255,0.7)";
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.78, -now / 750, Math.PI * 2 - now / 750);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4 + now / 1000;
      ctx.fillStyle = `rgba(225,247,255,${0.5 + pulse * 0.4})`;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * radius * 0.86, Math.sin(angle) * radius * 0.86, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawRadiiDiviniStrikes() {
  const now = performance.now();
  for (const strike of radiiDiviniStrikes) {
    const life = clamp((strike.until - now) / (strike.until - strike.start), 0, 1);
    const target = Camera.worldToScreen(strike.x, strike.y);
    const topY = target.y - 190;
    const points = [{ x: target.x + Math.sin(strike.seed) * 12, y: topY }];
    for (let i = 1; i < 9; i++) {
      const fraction = i / 9;
      const noise = Math.sin(strike.seed * 0.01 + i * 12.9898) * 17;
      points.push({
        x: target.x + Math.sin(strike.seed) * 12 + noise * (1 - fraction),
        y: topY + (target.y - 18 - topY) * fraction
      });
    }
    points.push({ x: target.x, y: target.y - 18 });
    ctx.save();
    ctx.globalAlpha = Math.min(1, life * 2.5);
    ctx.shadowColor = "#65cfff";
    ctx.shadowBlur = 20;
    ctx.strokeStyle = "rgba(75,185,255,0.95)";
    ctx.lineWidth = 9;
    ctx.beginPath();
    points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
    ctx.stroke();
    ctx.strokeStyle = "#f1fcff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
    ctx.stroke();
    ctx.fillStyle = "rgba(130,220,255,0.85)";
    ctx.beginPath();
    ctx.arc(target.x, target.y - 14, 10 + (1 - life) * 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawCorpusCustodiaCircles() {
  const now = performance.now();
  for (const circle of corpusCustodiaCircles) {
    const center = Camera.worldToScreen(circle.x, circle.y);
    const active = now >= circle.armedAt;
    const remaining = active ? circle.end - now : circle.armedAt - now;
    const radius = circle.radius * CONFIG.TILE_WIDTH / 2;
    const pulse = 0.7 + Math.sin(now / 90) * 0.2;
    ctx.save();
    ctx.translate(center.x, center.y - 8);
    ctx.globalAlpha = active ? 0.9 : 0.38 + pulse * 0.25;
    ctx.shadowColor = active ? "#d3a8ff" : "#8d6bba";
    ctx.shadowBlur = active ? 15 : 5;
    ctx.fillStyle = active ? "rgba(124,74,176,0.16)" : "rgba(124,74,176,0.07)";
    ctx.strokeStyle = active ? `rgba(218,185,255,${pulse})` : "rgba(190,160,220,0.65)";
    ctx.lineWidth = active ? 3 : 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash(active ? [4, 6] : [2, 9]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.72, now / 500, Math.PI * 2 + now / 500);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3 - now / 800;
      const x = Math.cos(angle) * radius * 0.86;
      const y = Math.sin(angle) * radius * 0.86;
      ctx.fillStyle = active ? "#eaddff" : "#bb9bd7";
      ctx.font = "bold 13px Arial";
      ctx.textAlign = "center";
      ctx.fillText("✦", x, y + 4);
    }
    if (!active) {
      ctx.fillStyle = "#eee1ff";
      ctx.font = "bold 13px Arial";
      ctx.textAlign = "center";
      ctx.fillText((remaining / 1000).toFixed(1), 0, 4);
    }
    ctx.restore();
  }
}

function drawBossDangerZones() {
  const now = performance.now();
  for (const enemy of enemies) {
    if (!enemy.isBoss || enemy.isDead() || !enemy.bossDanger) continue;
    const danger = enemy.bossDanger;
    const warning = now >= danger.start && now < danger.warningUntil;
    const active = now >= danger.warningUntil && now <= danger.end;
    const bossScreen = Camera.worldToScreen(enemy.x, enemy.y);
    const radius = CONFIG.bossDangerRadiusWorld * CONFIG.TILE_WIDTH / 2;

    ctx.save();
    ctx.translate(0, 0);
    const pulse = 0.65 + Math.sin(now / 100) * 0.35;
    ctx.strokeStyle = warning ? "rgba(255, 200, 90, 0.92)" : `rgba(255, 45, 35, ${pulse})`;
    ctx.lineWidth = active ? 3 + pulse * 2 : 2;
    ctx.shadowColor = "#ff3028";
    ctx.shadowBlur = active ? 12 : 5;
    ctx.fillStyle = warning ? "rgba(255, 180, 60, 0.12)" : "rgba(255, 90, 50, 0.15)";
    ctx.beginPath();
    ctx.arc(bossScreen.x, bossScreen.y - 12, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (warning) {
      const secs = Math.max(0, (danger.warningUntil - now) / 1000).toFixed(1);
      ctx.fillStyle = "rgba(255, 220, 130, 0.95)";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`! ${secs}s`, bossScreen.x, bossScreen.y - 12 - radius - 10);
    } else if (active) {
      ctx.fillStyle = "rgba(255, 240, 140, 0.9)";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.fillText("FOGO", bossScreen.x, bossScreen.y - 12 - radius - 10);
    }
    ctx.restore();
  }
}

function drawCoins() {
  const now = performance.now();
  for (const c of coins) {
    const s = Camera.worldToScreen(c.x, c.y);
    const bob = Math.sin(now / 200 + c.x) * 3;
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, 7 * CONFIG.zoom, 3 * CONFIG.zoom, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#f5c542";
    ctx.strokeStyle = "#8a6512";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(s.x, s.y - 8 + bob, 7 * CONFIG.zoom, 8 * CONFIG.zoom, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function drawMinimap() {
  const size = 170, pad = 16;
  const { height: viewportHeight } = getViewportSize();
  const x0 = pad, y0 = viewportHeight - size - pad - 44;
  const scale = size / CONFIG.MAP_WIDTH;
  const mapPoint = (wx, wy) => ({ x: x0 + wx * scale, y: y0 + wy * scale });

  ctx.save();
  ctx.fillStyle = "rgba(10,10,12,.82)";
  ctx.strokeStyle = "rgba(255,255,255,.2)";
  ctx.lineWidth = 1;
  ctx.fillRect(x0, y0, size, size);
  ctx.strokeRect(x0, y0, size, size);

  const mp = mapPoint(merchant.x, merchant.y);
  ctx.fillStyle = "#e8b43b";
  ctx.beginPath();
  ctx.arc(mp.x, mp.y, 4, 0, Math.PI * 2);
  ctx.fill();
  const np = mapPoint(nunMerchant.x, nunMerchant.y);
  ctx.fillStyle = "#9c83ff";
  ctx.beginPath();
  ctx.arc(np.x, np.y, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f5c542";
  for (const c of coins) {
    const p = mapPoint(c.x, c.y);
    ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
  }

  for (const e of enemies) {
    if (e.isDead()) continue;
    const p = mapPoint(e.x, e.y);
    ctx.fillStyle = e.isBoss ? "#ff3b3b" : "#d16a6a";
    ctx.beginPath();
    ctx.arc(p.x, p.y, e.isBoss ? 4.5 : 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const pp = mapPoint(player.x, player.y);
  ctx.fillStyle = "#7fe0ff";
  ctx.beginPath();
  ctx.arc(pp.x, pp.y, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#aaa";
  ctx.font = "bold 10px Arial";
  ctx.textAlign = "left";
  ctx.fillText("MAPA", x0 + 6, y0 + 13);
  ctx.restore();
}

function visibleWorldBounds() {
  const { width: viewportWidth, height: viewportHeight } = getViewportSize();
  const radius = Math.ceil(Math.max(viewportWidth / tileW(), viewportHeight / tileH()) * 1.3);
  return {
    minX: Math.max(0, Math.floor(Camera.x - radius)),
    maxX: Math.min(CONFIG.MAP_WIDTH - 1, Math.ceil(Camera.x + radius)),
    minY: Math.max(0, Math.floor(Camera.y - radius)),
    maxY: Math.min(CONFIG.MAP_HEIGHT - 1, Math.ceil(Camera.y + radius))
  };
}

function terrainNoise(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

let desertTextureCanvas = null;
let desertTexturePattern = null;

// Textura procedural do deserto: substitui a antiga imagem PNG.
// É criada uma única vez e reutilizada em todos os tiles para manter o desempenho.
function getDesertTexturePattern() {
  if (desertTexturePattern) return desertTexturePattern;

  desertTextureCanvas = document.createElement('canvas');
  desertTextureCanvas.width = 512;
  desertTextureCanvas.height = 512;
  const t = desertTextureCanvas.getContext('2d');
  if (!t) return null;

  // Sertão: base quente e seca, sem aparência de piso quadriculado.
  t.fillStyle = '#b99562';
  t.fillRect(0, 0, 512, 512);

  let seed = 9137;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  // Variação orgânica de areia: manchas grandes e muito suaves.
  for (let i = 0; i < 110; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const r = 14 + rand() * 42;
    const g = t.createRadialGradient(x, y, 0, x, y, r);
    const warm = rand() > 0.5;
    g.addColorStop(0, warm ? 'rgba(222,181,117,.09)' : 'rgba(116,79,43,.055)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    t.fillStyle = g;
    t.beginPath();
    t.arc(x, y, r, 0, Math.PI * 2);
    t.fill();
  }

  // Grãos discretos, sem poluir o terreno.
  for (let i = 0; i < 850; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const r = 0.25 + rand() * 0.75;
    t.fillStyle = rand() > 0.48 ? 'rgba(245,214,158,.12)' : 'rgba(75,52,31,.08)';
    t.beginPath();
    t.arc(x, y, r, 0, Math.PI * 2);
    t.fill();
  }

  // Marcas de vento suaves e quebradas, mais naturais que linhas repetidas.
  for (let i = 0; i < 18; i++) {
    const x = rand() * 480 - 20;
    const y = rand() * 512;
    const len = 35 + rand() * 90;
    t.strokeStyle = rand() > 0.5 ? 'rgba(239,207,151,.10)' : 'rgba(83,57,34,.07)';
    t.lineWidth = 0.7 + rand() * 0.8;
    t.beginPath();
    t.moveTo(x, y);
    t.quadraticCurveTo(x + len * .45, y - 4 - rand() * 5, x + len, y + rand() * 4 - 2);
    t.stroke();
  }

  // Poucas folhas/gravetos secos, espalhados de forma discreta.
  for (let i = 0; i < 12; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const len = 4 + rand() * 7;
    const a = rand() * Math.PI * 2;
    t.save();
    t.translate(x, y);
    t.rotate(a);
    t.strokeStyle = 'rgba(74,53,33,.28)';
    t.lineWidth = 0.8;
    t.beginPath();
    t.moveTo(-len * .5, 0);
    t.lineTo(len * .5, 0);
    t.stroke();
    t.restore();
  }

  desertTexturePattern = ctx.createPattern(desertTextureCanvas, 'repeat');
  return desertTexturePattern;
}

function drawMap() {
  const b = visibleWorldBounds();
  const viewport = getViewportSize();
  const w = tileW() / 2;
  const h = tileH() / 2;
  const desertPattern = getDesertTexturePattern();

  // Preenche o mundo com uma textura contínua. O antigo contorno de cada losango
  // fazia o chão parecer um tabuleiro; o relevo agora vem da textura e dos detalhes.
  if (desertPattern) {
    ctx.fillStyle = desertPattern;
    ctx.fillRect(0, 0, viewport.width, viewport.height);
  } else {
    ctx.fillStyle = '#b99562';
    ctx.fillRect(0, 0, viewport.width, viewport.height);
  }

  // Pequenas marcas de terreno são desenhadas somente uma vez por célula visível,
  // sem bordas, mantendo a leitura isométrica e evitando o excesso de linhas.
  for (let y = b.minY; y <= b.maxY; y++) {
    for (let x = b.minX; x <= b.maxX; x++) {
      const s = Camera.worldToScreen(x, y);
      if (s.x < -CONFIG.TILE_WIDTH || s.x > viewport.width + CONFIG.TILE_WIDTH ||
          s.y < -CONFIG.TILE_HEIGHT || s.y > viewport.height + CONFIG.TILE_HEIGHT) continue;

      const n = terrainNoise(x * 1.73, y * 2.11);
      if (n < 0.075) {
        const px = s.x + (terrainNoise(x + 4, y + 8) - .5) * w * .8;
        const py = s.y + (terrainNoise(x - 7, y + 3) - .5) * h * .7;
        ctx.save();
        ctx.strokeStyle = 'rgba(61,46,31,.42)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(px, py + 5); ctx.lineTo(px - 3, py - 4);
        ctx.moveTo(px, py + 3); ctx.lineTo(px + 4, py - 2);
        ctx.stroke();
        ctx.restore();
      } else if (n > 0.965) {
        // Pequeno tufo seco raro.
        const px = s.x + (terrainNoise(x + 12, y + 4) - .5) * w;
        const py = s.y + (terrainNoise(x + 2, y + 15) - .5) * h;
        ctx.save();
        ctx.strokeStyle = 'rgba(74,58,37,.48)';
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(px, py + 5); ctx.lineTo(px - 2, py - 5);
        ctx.moveTo(px, py + 5); ctx.lineTo(px + 3, py - 4);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}

function drawEntities() {
  const list = [...enemies.filter(e => !e.isDead()), player, merchant, nunMerchant];
  list.sort((a,b) => (a.x+a.y) - (b.x+b.y));

  for (const entity of list) {
    try {
      if (entity === player) drawPlayer(entity);
      else if (entity === merchant) drawMerchant(entity);
      else if (entity === nunMerchant) drawNunMerchant(entity);
      else drawEnemy(entity);
    } catch (error) {
      console.warn("[render] entidade recuperada após erro", error);
      if (entity && entity !== player && entity !== merchant && entity !== nunMerchant) {
        entity.attackPhase = null;
        entity.state = entity.isDead?.() ? "dead" : "idle";
      }
    }
  }
}

function drawNunMerchant(nun) {
  const s = Camera.worldToScreen(nun.x, nun.y);
  const now = performance.now();
  ctx.save();
  ctx.globalAlpha = 0.48;
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + 6, 21, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (nunMerchantSprite.complete && nunMerchantSprite.naturalWidth) {
    const width = 66, height = 87;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(nunMerchantSprite, s.x - width / 2, s.y - height + 8, width, height);
    ctx.restore();
  }

  ctx.font = "bold 12px Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = "#d4c5ff";
  ctx.fillText("FREIRA", s.x, s.y - 67);
  if (isNearNunMerchant() && !nunShopOpen) {
    const by = s.y - 88 + Math.sin(now / 220) * 3;
    ctx.fillStyle = "rgba(12,12,14,.88)";
    ctx.strokeStyle = "#a78bfa";
    ctx.lineWidth = 2;
    ctx.fillRect(s.x - 65, by - 16, 130, 26);
    ctx.strokeRect(s.x - 65, by - 16, 130, 26);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px Arial";
    ctx.fillText("[E] MAGIAS", s.x, by + 2);
  }
}

function drawMerchant(m) {
  const s = Camera.worldToScreen(m.x, m.y);
  const now = performance.now();

  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + 6, 20, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // A imagem possui bastante transparência nas bordas. Recortamos somente o personagem
  // para que o mercador tenha presença visual semelhante ao player no mundo.
  const sx = 230, sy = 16, sw = 235, sh = 338;
  const w = 58, h = 84;
  if (merchantSprite.complete && merchantSprite.naturalWidth) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(merchantSprite, sx, sy, sw, sh, s.x - w / 2, s.y - h + 7, w, h);
    ctx.imageSmoothingEnabled = true;
  } else {
    ctx.fillStyle = "#3d6b3d";
    ctx.fillRect(s.x - 16, s.y - 44, 32, 46);
  }

  ctx.font = "bold 12px Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffe9a8";
  ctx.fillText("MERCANTE", s.x, s.y - h + 2);

  if (isNearMerchant() && !merchantOpen) {
    const bob = Math.sin(now / 220) * 3;
    const by = s.y - h - 16 + bob;
    ctx.fillStyle = "rgba(12,12,14,.88)";
    ctx.strokeStyle = "#e8b43b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const rx = s.x - 62, ry = by - 16, rw = 124, rh = 26, rr = 6;
    ctx.moveTo(rx + rr, ry);
    ctx.lineTo(rx + rw - rr, ry);
    ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rr);
    ctx.lineTo(rx + rw, ry + rh - rr);
    ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rr, ry + rh);
    ctx.lineTo(rx + rr, ry + rh);
    ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rr);
    ctx.lineTo(rx, ry + rr);
    ctx.quadraticCurveTo(rx, ry, rx + rr, ry);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px Arial";
    ctx.fillText("[E] CONVERSAR", s.x, by + 2);
  }
}

function drawArm(x, y, dir, side, opts = {}) {
  const now = performance.now();
  const swing = opts.attacking ? Math.sin(now / 90 + side * 0.8) * 0.18 : 0;
  const armColor = opts.enemy ? "#8f4841" : (opts.skin ? "#c08a5c" : "#d7e2f5");
  const vectors = {
    up: { x: 0, y: -1 }, upRight: { x: 0.7, y: -0.7 },
    right: { x: 1, y: 0 }, downRight: { x: 0.7, y: 0.7 },
    down: { x: 0, y: 1 }, downLeft: { x: -0.7, y: 0.7 },
    left: { x: -1, y: 0 }, upLeft: { x: -0.7, y: -0.7 }
  };
  const v = vectors[dir] || vectors.down;
  const sideOffset = side === 0 ? -5 : 5;
  const ax = x - v.y * sideOffset;
  const ay = y + v.x * sideOffset - 4;
  const armLength = 12;
  const ex = ax + (v.x * Math.cos(swing) - v.y * Math.sin(swing)) * armLength;
  const ey = ay + (v.x * Math.sin(swing) + v.y * Math.cos(swing)) * armLength;

  ctx.strokeStyle = armColor;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(ex, ey);
  ctx.stroke();
}

function drawCharacterBody(x, y, dir, baseScale, opts = {}) {
  const scale = baseScale * CONFIG.zoom;
  const s = Camera.worldToScreen(x, y);
  const flash = opts.flash;
  const defending = opts.defending;
  const attacking = opts.attacking;
  const running = opts.running;
  const blunderbuss = !!opts.blunderbuss;
  const corpusCustodia = !!opts.corpusCustodia;
  const clothing = opts.clothing || {};

  ctx.save();
  ctx.translate(s.x, s.y - 12 * scale);
  ctx.scale(scale, scale);

  if (running && baseScale === 1.0) {
    ctx.fillStyle = "rgba(255,200,100,.15)";
    ctx.beginPath();
    ctx.ellipse(0, 18, 30, 15, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (flash) ctx.globalAlpha = 0.48 + 0.5 * Math.abs(Math.sin(performance.now() / 45));

  ctx.globalAlpha *= 0.55;
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.ellipse(0, 18, 18, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#1a1a22";
  ctx.fillRect(-9, 3, 7, 17);
  ctx.fillRect(2, 3, 7, 17);
  ctx.fillStyle = "#5a3119";
  ctx.fillRect(-9, 15, 7, 5);
  ctx.fillRect(2, 15, 7, 5);

  const shirtBase = opts.boss ? "#111214" : (opts.archer ? "#542b72" : (opts.enemy ? "#6f2f2f" : (clothing.shirtColor || "#1c2835")));
  const shirtDetail = opts.boss ? "#050506" : (opts.archer ? "#75409a" : (opts.enemy ? "#a14c3d" : (clothing.shirtDetail || "#344c63")));
  ctx.fillStyle = shirtBase;
  ctx.fillRect(-13, -12, 26, 23);
  ctx.fillStyle = shirtDetail;
  ctx.fillRect(-9, -8, 18, 15);

  if (flash) {
    ctx.globalAlpha = 0.42 + 0.45 * Math.abs(Math.sin(performance.now() / 45));
    ctx.fillStyle = "#ff2020";
    ctx.fillRect(-15, -14, 30, 29);
    ctx.globalAlpha = 1;
  }

  drawArm(0, -4, dir, 0, { attacking, enemy: !!opts.enemy, skin: !opts.enemy && !opts.boss && !opts.archer });
  drawArm(0, -4, dir, 1, { attacking, enemy: !!opts.enemy, skin: !opts.enemy && !opts.boss && !opts.archer });

  ctx.fillStyle = "#a9703f";
  ctx.beginPath();
  ctx.arc(0, -18, 10, 0, Math.PI * 2);
  ctx.fill();

  const hat = clothing.hat || "none";
  if (hat === "straw" || hat === "none") {
    ctx.fillStyle = "#6c4327";
    ctx.beginPath(); ctx.ellipse(0, -25, 24, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#c9a05c";
    ctx.beginPath(); ctx.ellipse(0, -27, 23, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#a87940";
    ctx.beginPath(); ctx.moveTo(-11, -27); ctx.lineTo(0, -40); ctx.lineTo(11, -27); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#6e5736"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-8,-29); ctx.lineTo(8,-29); ctx.stroke();
  } else if (hat === "kasa") {
    ctx.fillStyle = "#6b675b";
    ctx.beginPath(); ctx.ellipse(0, -27, 25, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-8,-27); ctx.quadraticCurveTo(-5,-43,0,-47); ctx.quadraticCurveTo(6,-43,9,-27); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#34332f"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0,-27,16,0,Math.PI); ctx.stroke();
  } else if (hat === "warrior") {
    ctx.fillStyle = "#3d4148";
    ctx.beginPath(); ctx.ellipse(0, -27, 22, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-9,-27); ctx.lineTo(0,-40); ctx.lineTo(10,-27); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#aeb5bd"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0,-40); ctx.lineTo(0,-25); ctx.stroke();
  } else if (hat === "samurai") {
    ctx.fillStyle = "#25272b";
    ctx.beginPath(); ctx.ellipse(0, -29, 24, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#17191d";
    ctx.beginPath(); ctx.moveTo(-12,-28); ctx.quadraticCurveTo(-8,-46,0,-50); ctx.quadraticCurveTo(8,-46,12,-28); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#c4a45a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-18,-29); ctx.lineTo(18,-29); ctx.stroke();
    ctx.fillStyle = "#b42e2e"; ctx.fillRect(-2,-29,4,11);
  } else if (hat === "ronin") {
    ctx.fillStyle = "#4b4036";
    ctx.beginPath(); ctx.ellipse(0, -28, 28, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#2c2724";
    ctx.beginPath(); ctx.moveTo(-10,-28); ctx.quadraticCurveTo(-7,-43,0,-47); ctx.quadraticCurveTo(7,-43,10,-28); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#8d6b43"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0,-28,19,Math.PI,Math.PI*2); ctx.stroke();
  } else {
    ctx.fillStyle = "#c6a15a";
    ctx.beginPath(); ctx.ellipse(0, -27, 22, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-10, -27); ctx.lineTo(0, -38); ctx.lineTo(11, -27); ctx.closePath(); ctx.fill();
  }

  ctx.fillStyle = "#111";
  if (dir === "left") ctx.fillRect(-11, -20, 4, 3);
  else if (dir === "right") ctx.fillRect(7, -20, 4, 3);
  else if (dir === "up") ctx.fillRect(-3, -25, 6, 3);
  else ctx.fillRect(-3, -15, 6, 3);

  if (blunderbuss) {
    // Arma de fogo visualmente distinta da espada: coronha escura + cano metálico largo.
    const side = dir === "left" ? -1 : 1;
    const angle = ({up:-Math.PI/2, upRight:-Math.PI/4, right:0, downRight:Math.PI/4, down:Math.PI/2, downLeft:3*Math.PI/4, left:Math.PI, upLeft:-3*Math.PI/4})[dir] ?? 0;
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = "#5b351d";
    ctx.fillRect(5, -3, 19, 6);
    ctx.fillStyle = "#25282c";
    ctx.fillRect(18, -4, 15, 8);
    ctx.fillStyle = "#8b6a3c";
    ctx.fillRect(3, -2, 7, 4);
    ctx.strokeStyle = "#b7b9b9";
    ctx.lineWidth = 2;
    ctx.strokeRect(29, -5, 7, 10);
    ctx.restore();
  } else if (corpusCustodia) {
    const angle = ({up:-Math.PI/2, upRight:-Math.PI/4, right:0, downRight:Math.PI/4, down:Math.PI/2, downLeft:3*Math.PI/4, left:Math.PI, upLeft:-3*Math.PI/4})[dir] ?? 0;
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = "#ead9ad";
    ctx.strokeStyle = "#8b6742";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(8, -6, 18, 12, 3);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#8b6742";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(12, -2); ctx.lineTo(22, -2);
    ctx.moveTo(13, 2); ctx.lineTo(21, 2);
    ctx.stroke();
    ctx.restore();
  } else {
    // Espada equipada: a cor e os efeitos seguem o caminho elemental da árvore.
    const fireStage = typeof getSwordElementStage === "function" ? getSwordElementStage("fire") : 0;
    const lightningStage = typeof getSwordElementStage === "function" ? getSwordElementStage("lightning") : 0;
    const activeElement = weaponMode === "sheath" ? "sheath" : (fireStage > 0 ? "fire" : lightningStage > 0 ? "lightning" : "normal");
    const swordColors = { normal: "#cfd7df", sheath: "#7a4b25", fire: "#d83a32", lightning: "#54a9ff" };
    const bladeColor = swordColors[activeElement];
    const sx = dir === "left" ? -10 : dir === "right" ? 10 : 7;
    const ex = dir === "left" ? -23 : dir === "right" ? 23 : 7;
    const ey = dir === "up" ? -20 : dir === "down" ? 20 : 0;
    ctx.strokeStyle = bladeColor;
    ctx.lineWidth = activeElement === "sheath" ? 4 : 3;
    ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.strokeStyle = activeElement === "sheath" ? "#4d2c18" : "#6f4a2a";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(sx - 2, 1); ctx.lineTo(sx + 3, 1); ctx.stroke();

    if (activeElement === "fire" && fireStage >= 2) {
      const pulse = 0.55 + Math.sin(performance.now() / 80) * 0.2;
      ctx.save();
      ctx.strokeStyle = `rgba(255,80,25,${pulse})`; ctx.lineWidth = 3; ctx.shadowColor = "#ff3b1f"; ctx.shadowBlur = 9;
      ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(ex, ey); ctx.stroke();
      for (let i=0;i<3;i++) {
        const fx = sx + (ex-sx)*(i/3) + Math.sin(performance.now()/70+i)*2;
        const fy = (ey)*(i/3) - Math.abs(Math.sin(performance.now()/90+i))*5;
        ctx.fillStyle = `rgba(255,150,35,${pulse})`; ctx.beginPath(); ctx.arc(fx,fy,1.8,0,Math.PI*2); ctx.fill();
      }
      ctx.restore();
    } else if (activeElement === "lightning" && lightningStage >= 2) {
      ctx.save();
      ctx.strokeStyle = "rgba(90,190,255,.95)"; ctx.lineWidth = 2; ctx.shadowColor = "#45b7ff"; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.moveTo(sx,0);
      const mx = sx + (ex-sx)*0.5 + Math.sin(performance.now()/75)*3;
      const my = ey*0.5 + Math.cos(performance.now()/90)*3;
      ctx.lineTo(mx,my); ctx.lineTo(ex,ey); ctx.stroke();
      for (let i=0;i<2;i++) {
        ctx.fillStyle = "rgba(150,230,255,.95)"; ctx.beginPath(); ctx.arc(ex + Math.sin(performance.now()/65+i)*3, ey + Math.cos(performance.now()/80+i)*3, 1.6, 0, Math.PI*2); ctx.fill();
      }
      ctx.restore();
    }
  }

  if (defending) {
    ctx.strokeStyle = "#8dd7ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -4, 25, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (attacking) {
    ctx.strokeStyle = opts.sheath ? "#d4c09a" : "#e8eef7";
    ctx.lineWidth = 5;
    ctx.beginPath();
    const angleMap = {up:-Math.PI/2,down:Math.PI/2,left:Math.PI,right:0};
    const angle = angleMap[dir] || 0;
    ctx.arc(0, -4, 28, angle - 0.75, angle + 0.75);
    ctx.stroke();
  }

  ctx.restore();
}

function drawAimRing(p) {
  if (getAttackControlMode() !== "mouse" || p.isDead()) return;
  const active = isAiming || !!p.attack;
  const s = Camera.worldToScreen(p.x, p.y);
  const cy = s.y - 12;
  const radius = CONFIG.attackCircleRadius * (tileW() / 2) * Math.SQRT2;
  const ang = Math.atan2(Input.mouseY - cy, Input.mouseX - s.x);

  ctx.save();
  ctx.strokeStyle = active ? "rgba(200,220,255,.4)" : "rgba(200,220,255,.18)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(s.x, cy, radius, radius * 0.5, 0, 0, Math.PI * 2);
  ctx.stroke();
  if (!active) { ctx.restore(); return; }

  const attackType = p.attack ? p.attack.type : weaponMode;
  ctx.strokeStyle = attackType === "sheath" ? "rgba(230,200,140,.95)" : "rgba(150,220,255,.95)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(s.x, cy, radius, radius * 0.55, 0, ang - 0.45, ang + 0.45);
  ctx.stroke();

  const mx = Input.mouseX;
  const my = Input.mouseY;
  const isGun = attackType === "blunderbuss";
  if (isGun) {
    const target = typeof getBlunderbussTarget === "function" ? getBlunderbussTarget(mouseDirection()) : null;
    const aimColor = target ? "rgba(255,85,65,.98)" : "rgba(255,235,145,.98)";
    ctx.strokeStyle = aimColor;
    ctx.lineWidth = target ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(mx - 13, my); ctx.lineTo(mx - 4, my);
    ctx.moveTo(mx + 4, my); ctx.lineTo(mx + 13, my);
    ctx.moveTo(mx, my - 13); ctx.lineTo(mx, my - 4);
    ctx.moveTo(mx, my + 4); ctx.lineTo(mx, my + 13);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(mx, my, target ? 9 : 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = aimColor;
    ctx.beginPath(); ctx.arc(mx, my, 2.5, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = "rgba(255,255,255,.9)";
    ctx.beginPath();
    ctx.arc(s.x + Math.cos(ang) * radius, cy + Math.sin(ang) * radius * 0.55, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBlunderbussTargetHighlight() {
  if (weaponMode !== "blunderbuss" || !isAiming || !player || player.isDead()) return;
  const target = typeof getBlunderbussTarget === "function" ? getBlunderbussTarget(mouseDirection()) : null;
  if (!target) return;
  const now = performance.now();
  const s = Camera.worldToScreen(target.x, target.y);
  const pulse = 1 + Math.sin(now / 90) * 0.12;
  ctx.save();
  ctx.strokeStyle = "rgba(255,70,55,.95)";
  ctx.lineWidth = 3;
  ctx.shadowColor = "#ff4035";
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.ellipse(s.x, s.y - 14, 24 * pulse, 31 * pulse, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,55,45,.12)";
  ctx.fill();
  ctx.restore();
}

function drawBurningEffect(x, y) {
  const s = Camera.worldToScreen(x, y);
  const now = performance.now();
  ctx.save();
  for (let i = 0; i < 7; i++) {
    const t = now / 90 + i * 1.7;
    const fx = s.x + Math.sin(t) * 12;
    const fy = s.y - 12 - ((t * 9) % 38);
    const r = 7 - ((t * 9) % 38) / 9;
    ctx.fillStyle = i % 2 ? "rgba(255,170,40,.82)" : "rgba(255,70,20,.78)";
    ctx.beginPath();
    ctx.arc(fx, fy, Math.max(1.5, r), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(255,100,25,.18)";
  ctx.beginPath();
  ctx.ellipse(s.x, s.y - 16, 20, 27, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPlayer(p) {
  drawAimRing(p);
  drawCharacterBody(p.x, p.y, p.direction, 1.0, {
    flash: p.hitFlashUntil > performance.now(),
    defending: p.isDefending(),
    attacking: !!p.attack,
    sheath: p.attack && p.attack.type === "sheath",
    blunderbuss: weaponMode === "blunderbuss",
    corpusCustodia: weaponMode === "corpusCustodia",
    running: p.isRunning,
    clothing: {
      hat: p.clothing?.hat || "none",
      shirtColor: ({black:"#e8e1d2", red:"#7d2f2f", green:"#315b3b", blue:"#2e4f78", beige:"#9a805f"}[p.clothing?.shirt] || "#e8e1d2"),
      shirtDetail: ({black:"#d3c9b3", red:"#a14c4c", green:"#4d7d59", blue:"#4c73a0", beige:"#c0a57a"}[p.clothing?.shirt] || "#d3c9b3")
    }
  });
  if (p.fireBurnUntil > performance.now()) drawBurningEffect(p.x, p.y);

  if (itemEffect && itemEffect.until > performance.now()) {
    const now = performance.now();
    const progress = Math.min(1, Math.max(0, (now - itemEffect.startedAt) / (itemEffect.until - itemEffect.startedAt)));
    const sfx = Camera.worldToScreen(p.x, p.y);
    const isAmmo = itemEffect.type === "ammo";
    const color = isAmmo ? "255,215,45" : "255,70,70";
    ctx.save();
    ctx.globalAlpha = (1 - progress) * 0.85;
    ctx.strokeStyle = `rgba(${color},${(1-progress)*0.9})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(sfx.x, sfx.y - 18, 20 + progress * 34, 0, Math.PI * 2);
    ctx.stroke();
    for (let i=0;i<8;i++) {
      const a = i * Math.PI / 4 + progress * 1.5;
      const r = 22 + progress * 30;
      ctx.fillStyle = `rgba(${color},${(1-progress)*0.9})`;
      ctx.beginPath(); ctx.arc(sfx.x + Math.cos(a)*r, sfx.y-18 + Math.sin(a)*r, 3.5*(1-progress)+1, 0, Math.PI*2); ctx.fill();
    }
    ctx.font = "bold 13px Arial"; ctx.textAlign = "center";
    ctx.fillStyle = `rgba(${color},${(1-progress)*0.95})`;
    ctx.fillText(itemEffect.label, sfx.x, sfx.y - 52 - progress*10);
    ctx.restore();
  } else if (itemEffect) { itemEffect = null; }

  if (p.dashTrail && p.dashTrail.length) {
    const now = performance.now();
    for (const trail of p.dashTrail) {
      const alpha = Math.max(0, trail.life / trail.maxLife);
      const s = Camera.worldToScreen(trail.x, trail.y);
      ctx.save();
      ctx.globalAlpha = alpha * 0.55;
      ctx.fillStyle = "rgba(135,220,255,.9)";
      ctx.beginPath();
      ctx.ellipse(s.x, s.y - 12, 18, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

  }

  if (p.blunderbussFlashUntil && p.blunderbussFlashUntil > performance.now()) {
    const s = Camera.worldToScreen(p.x, p.y);
    const d = directionVector(p.direction);
    const a = Math.atan2(d.y + d.x, d.x - d.y);
    ctx.save(); ctx.translate(s.x, s.y - 18); ctx.rotate(a);
    ctx.fillStyle = "rgba(255,220,120,.9)";
    ctx.beginPath(); ctx.arc(28, 0, 12, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  if (p.attack) {
    const s = Camera.worldToScreen(p.x, p.y);
    const isSword = p.attack.type === "sword";
    ctx.fillStyle = isSword ? "rgba(220,235,255,.22)" : "rgba(220,190,130,.20)";
    ctx.beginPath();
    ctx.arc(s.x, s.y - 12, isSword ? 65 : 55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isSword ? "rgba(220,235,255,.12)" : "rgba(220,190,130,.10)";
    ctx.beginPath();
    ctx.arc(s.x, s.y - 12, isSword ? 85 : 75, 0, Math.PI * 2);
    ctx.fill();
    const now = performance.now();
    const pulse = Math.sin(now / 100) * 0.3 + 0.7;
    ctx.strokeStyle = isSword ? `rgba(220,235,255,${0.4 * pulse})` : `rgba(220,190,130,${0.4 * pulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(s.x, s.y - 12, isSword ? 70 : 60, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  if (p.isRunning) {
    const s = Camera.worldToScreen(p.x, p.y);
    ctx.strokeStyle = "rgba(255,200,100,.3)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(s.x, s.y - 12, 45, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawEnemy(e) {
  const nowT = performance.now();
  const stunned = e.state === "stunned" && nowT < e.stunnedUntil;

  if (stunned) {
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(nowT / 120));
  }

  drawCharacterBody(e.x, e.y, e.facing, e.isBoss ? 0.82 + CONFIG.bossExtraPixels / 60 : 0.82, {
    enemy: true,
    boss: e.isBoss,
    archer: e.type === "archer",
    flash: e.hitFlashUntil > nowT,
    attacking: e.attackPhase === "windup" || e.attackPhase === "strike"
  });

  const s = Camera.worldToScreen(e.x, e.y);

  ctx.save();
  ctx.fillStyle = e.isBoss ? "#ffd37a" : "#f5e6c8";
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 3;
  ctx.font = "bold 12px Arial";
  ctx.textAlign = "center";
  ctx.strokeText(`NÍVEL ${e.waveLevel}`, s.x, s.y - (e.isBoss ? 84 : 64));
  ctx.fillText(`NÍVEL ${e.waveLevel}`, s.x, s.y - (e.isBoss ? 84 : 64));
  ctx.restore();

  if (e.type === "archer" && e.attackPhase === "windup") {
    const d = directionVector(e.archerTelegraphDirection);
    const angle = Math.atan2(d.y + d.x, d.x - d.y);
    const charge = Math.min(1, (nowT - e.attackStartedAt) / CONFIG.archerChargeMs);
    ctx.save();
    ctx.translate(s.x, s.y - 12);
    ctx.rotate(angle);
    ctx.fillStyle = `rgba(220, 55, 55, ${0.12 + charge * 0.18})`;
    ctx.strokeStyle = `rgba(255, 80, 70, ${0.55 + charge * 0.4})`;
    ctx.lineWidth = 2 + charge * 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(CONFIG.archerRange * CONFIG.TILE_WIDTH / 2, -CONFIG.archerRange * CONFIG.TILE_WIDTH * 0.18);
    ctx.lineTo(CONFIG.archerRange * CONFIG.TILE_WIDTH / 2, CONFIG.archerRange * CONFIG.TILE_WIDTH * 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  if (stunned) {
    ctx.fillStyle = "rgba(90,170,255,.45)";
    ctx.beginPath();
    ctx.ellipse(s.x, s.y - 18, 20, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#8dd7ff";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("ATORDOADO", s.x, s.y - 58);
  }

  if (e.burnUntil > nowT) {
    const fireStage = e.swordElement === "fire" ? (e.swordElementStage || 2) : 2;
    const fireScale = [1, 1, 1.25, 1.55, 1.9, 2.5][fireStage] || 1;
    for (let i = 0; i < 5; i++) {
      const t = nowT / 90 + i * 1.7;
      const fx = s.x + Math.sin(t) * 10 * fireScale;
      const fy = s.y - 12 - ((t * 9) % (34 * fireScale));
      const r = (7 - ((t * 9) % (34 * fireScale)) / 8) * fireScale;
      ctx.beginPath();
      ctx.fillStyle = i % 2 ? "rgba(255,170,40,.75)" : "rgba(255,90,30,.7)";
      ctx.arc(fx, fy, Math.max(1.5, r), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.fillStyle = "rgba(255,120,40,.18)";
    ctx.ellipse(s.x, s.y - 16, 18 * fireScale, 24 * fireScale, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const hpW = e.isBoss ? 58 : 38;
  const hpY = e.isBoss ? s.y - 66 : s.y - 51;
  ctx.fillStyle = "#111";
  ctx.fillRect(s.x - hpW / 2, hpY, hpW, 5);
  ctx.fillStyle = e.isBoss ? "#ff4d4d" : "#b83e3e";
  ctx.fillRect(s.x - hpW / 2, hpY, hpW * Math.max(0, e.hp / e.maxHp), 5);
  if (e.isBoss) {
    ctx.fillStyle = "#ff8a8a";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("CHEFÃO", s.x, hpY - 6);
  }
  if (e.type === "archer") {
    ctx.fillStyle = "#ff9a76";
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "center";
    ctx.fillText("ARQUEIRO", s.x, hpY - 6);
  }

  if (e.attackPhase === "windup" && e.type !== "archer") {
    ctx.strokeStyle = "#e8b43b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(s.x, s.y - 15, 28, -Math.PI / 2, Math.PI * 1.5);
    ctx.stroke();
    ctx.fillStyle = "#ffe18b";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("!", s.x, s.y - 61);
  }

  for (const d of e.damageNumbers) {
    const life = Math.max(0, d.until - performance.now());
    const yy = Camera.worldToScreen(d.x, d.y).y - (650 - life) * 0.035;
    ctx.globalAlpha = Math.min(1, life / 180);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("-" + d.value, Camera.worldToScreen(d.x, d.y).x, yy);
    ctx.globalAlpha = 1;
  }
}

function drawAttackFX() {
  if (!player.attack) return;
  const s = Camera.worldToScreen(player.x, player.y);
  const dir = directionVector(player.attack.direction);
  const angle = Math.atan2(dir.y + dir.x, dir.x - dir.y);
  const isSword = player.attack.type === "sword";
  const now = performance.now();
  const t = Math.min(1, (now - player.attack.startedAt) / player.attack.duration);
  const fade = 1 - t * 0.65;
  const fireStage = typeof getSwordElementStage === "function" ? getSwordElementStage("fire") : 0;
  const lightningStage = typeof getSwordElementStage === "function" ? getSwordElementStage("lightning") : 0;
  const magicElement = isSword && fireStage >= 2 ? "fire" : isSword && lightningStage >= 2 ? "lightning" : null;
  const magicColor = magicElement === "fire" ? "255,105,25" : "95,200,255";
  const magicCoreColor = magicElement === "fire" ? "255,230,135" : "225,250,255";

  ctx.save();
  ctx.translate(s.x, s.y - 12);
  ctx.rotate(angle);

  if (isSword) {
    const sweepFrom = -1.15;
    const sweepTo = 1.15;
    const head = sweepFrom + (sweepTo - sweepFrom) * t;
    const radius = 70;
    if (magicElement) {
      ctx.shadowColor = magicElement === "fire" ? "#ff4a16" : "#4bc7ff";
      ctx.shadowBlur = 18 + Math.sin(now / 35) * 5;
    }
    for (let i = 0; i < 7; i++) {
      const a0 = Math.max(sweepFrom, head - 0.16 * (i + 1));
      const a1 = Math.max(sweepFrom, head - 0.16 * i);
      if (a1 <= a0) continue;
      ctx.strokeStyle = magicElement
        ? `rgba(${magicColor},${(0.88 - i * 0.10) * fade})`
        : `rgba(210,240,255,${(0.85 - i * 0.11) * fade})`;
      ctx.lineWidth = 16 - i * 1.8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(0, 0, radius - i * 2.2, a0, a1);
      ctx.stroke();
    }

    ctx.strokeStyle = magicElement
      ? `rgba(${magicCoreColor},${0.98 * fade})`
      : `rgba(255,255,255,${0.95 * fade})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, radius, Math.max(sweepFrom, head - 0.5), head);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255,255,255,${0.9 * fade})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(head) * 18, Math.sin(head) * 18);
    ctx.lineTo(Math.cos(head) * (radius + 16), Math.sin(head) * (radius + 16));
    ctx.stroke();

    for (let i = 0; i < 6; i++) {
      const a = sweepFrom + (head - sweepFrom) * (i / 5);
      const r = radius + Math.sin(now / 60 + i) * 8;
      ctx.fillStyle = magicElement
        ? `rgba(${magicCoreColor},${0.86 * fade})`
        : `rgba(230,248,255,${0.75 * fade})`;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 2 + Math.sin(now / 90 + i) * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    if (magicElement) {
      for (let i = 0; i < 10; i++) {
        const progress = ((i / 10) + t * 1.4) % 1;
        const a = sweepFrom + (sweepTo - sweepFrom) * progress;
        const r = radius + Math.sin(now / 45 + i * 2) * (magicElement === "fire" ? 13 : 9);
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        ctx.globalAlpha = fade * (0.55 + 0.4 * Math.sin(now / 50 + i));
        ctx.fillStyle = i % 3 === 0 ? `rgba(${magicCoreColor},1)` : `rgba(${magicColor},1)`;
        ctx.beginPath();
        ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }
  } else if (player.attack && player.attack.type === "blunderbuss") {
    const wave = 28 + t * 70;
    ctx.strokeStyle = `rgba(255,220,150,${0.9 * fade})`;
    ctx.lineWidth = 10 - t * 6;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(wave, -12);
    ctx.moveTo(12, 0);
    ctx.lineTo(wave, 12);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = -0.28 + i * 0.08;
      const r = wave * (0.55 + (i % 3) * 0.12);
      ctx.fillStyle = `rgba(255,190,90,${0.75 * fade})`;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 2 + (i % 2), 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    const sheathScale = typeof getSheathVisualScale === "function" ? getSheathVisualScale() : 1;
    const wave = (34 + t * 46) * sheathScale;
    ctx.strokeStyle = `rgba(240,215,160,${0.9 * fade})`;
    ctx.lineWidth = 12 - t * 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, 0, wave, -0.85, 0.85);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255,240,200,${0.45 * fade})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, wave + 18, -0.7, 0.7);
    ctx.stroke();

    for (let i = -1; i <= 1; i++) {
      const a = i * 0.45;
      const bx = Math.cos(a) * (wave + 6), by = Math.sin(a) * (wave + 6);
      ctx.strokeStyle = `rgba(255,235,180,${0.8 * fade})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bx - Math.cos(a) * 14, by - Math.sin(a) * 14);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawHitSparks() {
  const now = performance.now();
  for (const fx of hitSparks) {
    const life = (fx.until - now) / (fx.until - fx.start);
    if (life <= 0) continue;
    const p = Camera.worldToScreen(fx.x, fx.y);
    const sword = fx.type === "sword";
    const gun = fx.type === "blunderbuss";
    const fire = fx.type === "fire";
    const lightning = fx.type === "lightning";
    if (fire || lightning) {
      const elapsed = (now - fx.start) / (fx.until - fx.start);
      const color = fire ? "255,105,25" : "105,210,255";
      const core = fire ? "255,238,145" : "235,252,255";
      const radius = (10 + (1 - life) * 34) * (fire ? 1.15 : 1);
      ctx.save();
      ctx.globalAlpha = life;
      ctx.translate(p.x, p.y - 14);
      ctx.shadowColor = fire ? "#ff4a16" : "#4bc7ff";
      ctx.shadowBlur = 14 * life;
      ctx.strokeStyle = `rgba(${color},${0.9 * life})`;
      ctx.lineWidth = fire ? 4 : 3;
      ctx.beginPath();
      ctx.arc(0, 0, radius, elapsed * 2, elapsed * 2 + Math.PI * 1.65);
      ctx.stroke();
      ctx.strokeStyle = `rgba(${core},${0.9 * life})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.55, -elapsed * 2, -elapsed * 2 + Math.PI * 1.3);
      ctx.stroke();
      for (let i = 0; i < 9; i++) {
        const angle = (Math.PI * 2 * i) / 9 + elapsed * (fire ? 5 : -4);
        const distance = radius * (0.78 + (i % 3) * 0.18);
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        if (lightning && i % 3 === 0) {
          ctx.strokeStyle = `rgba(${core},${0.9 * life})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.cos(angle + 0.55) * 6, y + Math.sin(angle + 0.55) * 6);
          ctx.lineTo(x + Math.cos(angle - 0.2) * 11, y + Math.sin(angle - 0.2) * 11);
          ctx.stroke();
        } else {
          ctx.fillStyle = i % 2 ? `rgba(${color},${life})` : `rgba(${core},${life})`;
          ctx.beginPath();
          ctx.arc(x, y, fire ? 2 + (i % 3) : 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
      continue;
    }
    ctx.save();
    ctx.globalAlpha = life;
    ctx.strokeStyle = gun ? "rgba(255,180,70,.98)" : sword ? "rgba(255,255,255,.95)" : "rgba(255,225,160,.95)";
    ctx.lineWidth = gun ? 5 : sword ? 4 : 3;
    const r = (sword ? 16 : 20) + (1 - life) * (sword ? 26 : 40);
    ctx.beginPath();
    ctx.arc(p.x, p.y - 14, r, 0, Math.PI * 2);
    ctx.stroke();
    if (sword) {
      for (let i = 0; i < 4; i++) {
        const a = (Math.PI / 2) * i + 0.6;
        ctx.beginPath();
        ctx.moveTo(p.x + Math.cos(a) * r * 0.6, p.y - 14 + Math.sin(a) * r * 0.4);
        ctx.lineTo(p.x + Math.cos(a) * r * 1.3, p.y - 14 + Math.sin(a) * r * 0.9);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

function drawDebug() {
  ctx.save();
  ctx.font = "12px monospace";
  ctx.fillStyle = "#7ff0ff";
  ctx.fillRect(10, 82, 210, 88);
  ctx.fillStyle = "#071015";
  ctx.fillText("DEBUG MODE", 18, 98);
  ctx.fillText("HP: " + Math.round(player.hp), 18, 114);
  ctx.fillText("STAMINA: " + Math.round(player.stamina), 18, 130);
  ctx.fillText("DIR: " + player.direction.toUpperCase(), 18, 146);
  ctx.fillText("STATE: " + player.state.toUpperCase(), 18, 162);

  for (const e of enemies) {
    if (e.isDead()) continue;
    const p = Camera.worldToScreen(e.x, e.y);
    ctx.strokeStyle = "#ff6b6b";
    ctx.strokeRect(p.x - 14, p.y - 28, 28, 28);
    ctx.strokeStyle = "rgba(255,210,70,.7)";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 12, CONFIG.enemyAttackRange * CONFIG.TILE_WIDTH / 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (player.attack) {
    const d = directionVector(player.attack.direction);
    const center = Camera.worldToScreen(
      player.x + d.x * (player.attack.type === "sword" ? CONFIG.swordRange / 2 : CONFIG.sheathRange / 2),
      player.y + d.y * (player.attack.type === "sword" ? CONFIG.swordRange / 2 : CONFIG.sheathRange / 2)
    );
    ctx.strokeStyle = "#fff";
    ctx.strokeRect(center.x - 35, center.y - 25, 70, 50);
  }

  ctx.restore();
}
