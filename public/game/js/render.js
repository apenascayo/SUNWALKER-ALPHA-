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
  drawCoins();
  drawBossDangerZones();
  drawFireBombZones();
  drawFireBombImpacts();
  drawEntities();
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
    const ringRadius = (18 + progress * 90) * CONFIG.zoom;
    const alpha = 1 - progress;
    ctx.save();
    ctx.translate(s.x, s.y - 12);
    ctx.strokeStyle = "rgba(255, 180, 90, " + alpha + ")";
    ctx.fillStyle = "rgba(255, 110, 55, " + (alpha * 0.3) + ")";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, ringRadius, ringRadius * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + progress * Math.PI * 2;
      const px = Math.cos(angle) * (ringRadius * 0.45 + i * 4);
      const py = Math.sin(angle) * (ringRadius * 0.22 + i * 2.5);
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
    const halfLength = (zone.halfLength || 2.1) * CONFIG.TILE_WIDTH / 2;
    const halfWidth = (zone.halfWidth || 0.7) * CONFIG.TILE_WIDTH / 2;
    const pulse = 0.8 + Math.sin(now / 120) * 0.2;
    ctx.save();
    ctx.translate(s.x, s.y - 12);
    ctx.rotate(Math.atan2(zone.dirY, zone.dirX));
    ctx.fillStyle = "rgba(255,45,25,0.42)";
    ctx.strokeStyle = "rgba(255,190,55," + pulse + ")";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#ff3020";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(0, 0, halfLength, halfWidth, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
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

function drawMap() {
  const b = visibleWorldBounds();
  const { width: viewportWidth, height: viewportHeight } = getViewportSize();
  const tiles = [];
  for (let y = b.minY; y <= b.maxY; y++) {
    for (let x = b.minX; x <= b.maxX; x++) {
      const s = Camera.worldToScreen(x, y);
      if (s.x < -CONFIG.TILE_WIDTH || s.x > viewportWidth + CONFIG.TILE_WIDTH ||
          s.y < -CONFIG.TILE_HEIGHT || s.y > viewportHeight + CONFIG.TILE_HEIGHT) continue;
      tiles.push({ x, y, s });
    }
  }
  tiles.sort((a,b) => (a.x+a.y) - (b.x+b.y));
  for (const t of tiles) {
    const w = tileW() / 2;
    const h = tileH() / 2;
    ctx.beginPath();
    ctx.moveTo(t.s.x, t.s.y - h);
    ctx.lineTo(t.s.x + w, t.s.y);
    ctx.lineTo(t.s.x, t.s.y + h);
    ctx.lineTo(t.s.x - w, t.s.y);
    ctx.closePath();
    ctx.fillStyle = ((t.x + t.y) & 1) ? CONFIG.TILE_COLOR : CONFIG.TILE_ALT_COLOR;
    ctx.fill();
    ctx.strokeStyle = CONFIG.TILE_LINE;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawEntities() {
  const list = [...enemies.filter(e => !e.isDead()), player, merchant];
  list.sort((a,b) => (a.x+a.y) - (b.x+b.y));

  for (const entity of list) {
    if (entity === player) drawPlayer(entity);
    else if (entity === merchant) drawMerchant(entity);
    else drawEnemy(entity);
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

  const w = 76, h = 76;
  if (merchantSprite.complete && merchantSprite.naturalWidth) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(merchantSprite, s.x - w / 2, s.y - h + 8, w, h);
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
  const armColor = opts.enemy ? "#8f4841" : "#d7e2f5";
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

  ctx.fillStyle = "#17181b";
  ctx.fillRect(-9, 3, 7, 17);
  ctx.fillRect(2, 3, 7, 17);

  const shirtBase = opts.boss ? "#111214" : (opts.archer ? "#542b72" : (opts.enemy ? "#6f2f2f" : "#1c2835"));
  const shirtDetail = opts.boss ? "#050506" : (opts.archer ? "#75409a" : (opts.enemy ? "#a14c3d" : "#344c63"));
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

  drawArm(0, -4, dir, 0, { attacking, enemy: !!opts.enemy });
  drawArm(0, -4, dir, 1, { attacking, enemy: !!opts.enemy });

  ctx.fillStyle = "#b58a58";
  ctx.beginPath();
  ctx.arc(0, -18, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#c6a15a";
  ctx.beginPath();
  ctx.ellipse(0, -27, 22, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-10, -27); ctx.lineTo(0, -38); ctx.lineTo(11, -27);
  ctx.closePath(); ctx.fill();

  ctx.fillStyle = "#111";
  if (dir === "left") ctx.fillRect(-11, -20, 4, 3);
  else if (dir === "right") ctx.fillRect(7, -20, 4, 3);
  else if (dir === "up") ctx.fillRect(-3, -25, 6, 3);
  else ctx.fillRect(-3, -15, 6, 3);

  ctx.strokeStyle = "#cfd7df";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(dir === "left" ? -10 : dir === "right" ? 10 : 7, 0);
  ctx.lineTo(dir === "left" ? -23 : dir === "right" ? 23 : 7, dir === "up" ? -20 : dir === "down" ? 20 : 0);
  ctx.stroke();

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

  const mx = s.x + Math.cos(ang) * radius;
  const my = cy + Math.sin(ang) * radius * 0.55;
  ctx.fillStyle = "rgba(255,255,255,.9)";
  ctx.beginPath();
  ctx.arc(mx, my, 3.5, 0, Math.PI * 2);
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
    running: p.isRunning
  });
  if (p.fireBurnUntil > performance.now()) drawBurningEffect(p.x, p.y);

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
    for (let i = 0; i < 5; i++) {
      const t = nowT / 90 + i * 1.7;
      const fx = s.x + Math.sin(t) * 10;
      const fy = s.y - 12 - ((t * 9) % 34);
      const r = 7 - ((t * 9) % 34) / 8;
      ctx.beginPath();
      ctx.fillStyle = i % 2 ? "rgba(255,170,40,.75)" : "rgba(255,90,30,.7)";
      ctx.arc(fx, fy, Math.max(1.5, r), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.fillStyle = "rgba(255,120,40,.18)";
    ctx.ellipse(s.x, s.y - 16, 18, 24, 0, 0, Math.PI * 2);
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

  ctx.save();
  ctx.translate(s.x, s.y - 12);
  ctx.rotate(angle);

  if (isSword) {
    const sweepFrom = -1.15;
    const sweepTo = 1.15;
    const head = sweepFrom + (sweepTo - sweepFrom) * t;
    const radius = 70;
    for (let i = 0; i < 7; i++) {
      const a0 = Math.max(sweepFrom, head - 0.16 * (i + 1));
      const a1 = Math.max(sweepFrom, head - 0.16 * i);
      if (a1 <= a0) continue;
      ctx.strokeStyle = `rgba(210,240,255,${(0.85 - i * 0.11) * fade})`;
      ctx.lineWidth = 16 - i * 1.8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(0, 0, radius - i * 2.2, a0, a1);
      ctx.stroke();
    }

    ctx.strokeStyle = `rgba(255,255,255,${0.95 * fade})`;
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
      ctx.fillStyle = `rgba(230,248,255,${0.75 * fade})`;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 2 + Math.sin(now / 90 + i) * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    const wave = 34 + t * 46;
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
    ctx.save();
    ctx.globalAlpha = life;
    ctx.strokeStyle = sword ? "rgba(255,255,255,.95)" : "rgba(255,225,160,.95)";
    ctx.lineWidth = sword ? 4 : 3;
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
