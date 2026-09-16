(() => {
  // Correções e extensões finais da Alpha 1.7.
  // Este arquivo trabalha sobre os sistemas base, sem substituir o DASH original.

  const FISHING_AREA = { minX: 82, maxX: 94, minY: 80, maxY: 94 };
  const MUSIC_MODAL_ID = "sunwalkerNowPlaying";
  const LIGHTNING_RADIUS_PX = 20;
  const LIGHTNING_DURATION = 3000;
  const LIGHTNING_TICK = 1000;
  const ALLY_DURATION = 5000;
  const ALLY_CHANCE = 0.40;
  const LIGHTNING_COST = 80;
  const ALLY_COST = 100;

  let musicModal = null;
  let dashFx = null;

  function worldPixels(px) {
    return px / ((Number(CONFIG.TILE_WIDTH) || 72) / 2);
  }

  // DASH: volta ao teleporte do sistema base, mas fixa o deslocamento em 50px.
  CONFIG.dashDistance = worldPixels(50);

  function ensureMusicModal() {
    if (musicModal) return musicModal;
    musicModal = document.createElement("div");
    musicModal.id = MUSIC_MODAL_ID;
    musicModal.style.cssText = "position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:10001;min-width:300px;max-width:80vw;padding:10px 18px;background:rgba(12,14,15,.94);border:1px solid rgba(210,190,130,.8);border-radius:7px;color:#f4ead0;text-align:center;font:600 13px Arial;letter-spacing:.7px;box-shadow:0 8px 28px rgba(0,0,0,.5);opacity:0;transition:opacity .25s ease;pointer-events:none;";
    document.body.appendChild(musicModal);
    return musicModal;
  }

  function showNowPlaying() {
    if (typeof musicState === "undefined" || !musicState.audio || !musicState.audio.src) return;
    const name = decodeURIComponent(musicState.audio.src.split("/").pop() || "").replace(/\.[^.]+$/, "");
    const el = ensureMusicModal();
    el.textContent = `♫ TOCANDO AGORA — ${name}`;
    el.style.opacity = "1";
    clearTimeout(showNowPlaying.timer);
    showNowPlaying.timer = setTimeout(() => { el.style.opacity = "0"; }, 4200);
  }

  window.addEventListener("playing", showNowPlaying, true);
  setInterval(showNowPlaying, 700);

  // O contador da onda fica exatamente um nível acima do aviso da música.
  setInterval(() => {
    const wave = document.getElementById("waveStatus");
    if (wave) {
      wave.style.position = "relative";
      wave.style.zIndex = "10002";
    }
  }, 500);

  // Som da troca de espada/bainha.
  window.addEventListener("keydown", event => {
    if (event.key.toLowerCase() !== "r" || event.repeat) return;
    try {
      const audio = new Audio(encodeURI("assets/sfx/mudançaarma.mp3"));
      audio.volume = Number(CONFIG.effectsVolume) || 0.6;
      audio.play().catch(() => {});
    } catch (_) {}
  }, { capture: true });

  // Área de pesca sempre visível no mapa.
  function drawFishingMarker() {
    if (typeof ctx === "undefined" || typeof Camera === "undefined") return;
    const cx = (FISHING_AREA.minX + FISHING_AREA.maxX) / 2;
    const cy = (FISHING_AREA.minY + FISHING_AREA.maxY) / 2;
    const s = Camera.worldToScreen(cx, cy);
    const now = performance.now();
    const pulse = 0.78 + Math.sin(now / 280) * 0.22;
    const w = Math.max(120, (FISHING_AREA.maxX - FISHING_AREA.minX) * CONFIG.TILE_WIDTH * 0.62);
    const h = Math.max(60, (FISHING_AREA.maxY - FISHING_AREA.minY) * CONFIG.TILE_HEIGHT * 0.62);
    ctx.save();
    ctx.globalAlpha = 0.84;
    ctx.fillStyle = "rgba(47,105,115,.78)";
    ctx.strokeStyle = `rgba(204,232,216,${pulse})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 2;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(s.x - w * .72, s.y + i * 13 + Math.sin(now / 260 + i) * 3);
      ctx.quadraticCurveTo(s.x, s.y + i * 13 - 5, s.x + w * .72, s.y + i * 13);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#f5e4ad";
    ctx.font = "bold 15px Arial";
    ctx.textAlign = "center";
    ctx.fillText("ÁREA DE PESCA", s.x, s.y - h - 15);
    if (localStorage.getItem("sunwalker_fishing_rod") === "true") {
      ctx.font = "bold 11px Arial";
      ctx.fillText("ESPAÇO • PESCAR", s.x, s.y + h + 18);
    }
    ctx.restore();
  }

  // Terreno de areia/terra seca, com pequenas plantas mortas determinísticas.
  function terrainNoise(x, y) {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
  }

  function drawDryGround() {
    const rect = canvas.getBoundingClientRect();
    const viewportWidth = rect.width || canvas.clientWidth || window.innerWidth;
    const viewportHeight = rect.height || canvas.clientHeight || window.innerHeight;
    const radius = Math.ceil(Math.max(viewportWidth / tileW(), viewportHeight / tileH()) * 1.3);
    const minX = Math.max(0, Math.floor(Camera.x - radius));
    const maxX = Math.min(CONFIG.MAP_WIDTH - 1, Math.ceil(Camera.x + radius));
    const minY = Math.max(0, Math.floor(Camera.y - radius));
    const maxY = Math.min(CONFIG.MAP_HEIGHT - 1, Math.ceil(Camera.y + radius));
    const tiles = [];

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const s = Camera.worldToScreen(x, y);
        if (s.x < -CONFIG.TILE_WIDTH || s.x > viewportWidth + CONFIG.TILE_WIDTH || s.y < -CONFIG.TILE_HEIGHT || s.y > viewportHeight + CONFIG.TILE_HEIGHT) continue;
        tiles.push({ x, y, s });
      }
    }
    tiles.sort((a,b) => (a.x + a.y) - (b.x + b.y));

    for (const t of tiles) {
      const w = tileW() / 2;
      const h = tileH() / 2;
      ctx.beginPath();
      ctx.moveTo(t.s.x, t.s.y - h);
      ctx.lineTo(t.s.x + w, t.s.y);
      ctx.lineTo(t.s.x, t.s.y + h);
      ctx.lineTo(t.s.x - w, t.s.y);
      ctx.closePath();
      const n = terrainNoise(t.x, t.y);
      ctx.fillStyle = n > .72 ? "#a78357" : (n > .35 ? "#98764d" : "#8d6d47");
      ctx.fill();
      ctx.strokeStyle = "rgba(65,48,31,.28)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Pequenas rachaduras/manchas de terra seca.
      if (n > .55) {
        ctx.strokeStyle = "rgba(70,50,31,.24)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(t.s.x - w * .35, t.s.y + h * .05);
        ctx.lineTo(t.s.x - w * .1, t.s.y - h * .08);
        ctx.lineTo(t.s.x + w * .15, t.s.y + h * .03);
        ctx.stroke();
      }

      // Plantas mortas: poucos pontos, fixos no mapa.
      if (n < 0.075) {
        const px = t.s.x + (terrainNoise(t.x + 4, t.y + 8) - .5) * w * .8;
        const py = t.s.y - 2;
        ctx.save();
        ctx.strokeStyle = "rgba(55,48,35,.78)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px, py + 6);
        ctx.lineTo(px - 4, py - 7);
        ctx.moveTo(px, py + 5);
        ctx.lineTo(px + 5, py - 4);
        ctx.moveTo(px, py + 2);
        ctx.lineTo(px + 1, py - 9);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  const baseDrawGame = window.drawGame;
  window.drawGame = function() {
    baseDrawGame();
    // Reforça a área de pesca por cima do mapa sem esconder personagens.
    drawFishingMarker();
    drawElementalEffects();
    drawAllyEffects();
    drawSummonerEffects();
    drawDashEffect();
  };

  // Substitui somente o desenho do chão; entidades e HUD continuam no sistema existente.
  window.drawMap = drawDryGround;

  function drawDashEffect() {
    if (!dashFx) return;
    const now = performance.now();
    const p = Math.min(1, (now - dashFx.start) / 360);
    if (p >= 1) { dashFx = null; return; }
    const s = Camera.worldToScreen(dashFx.x, dashFx.y);
    const alpha = 1 - p;
    ctx.save();
    ctx.translate(s.x, s.y - 12);
    ctx.rotate(dashFx.angle);
    ctx.globalAlpha = alpha * .75;
    ctx.strokeStyle = "rgba(205,235,255,.95)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 0, 24 + p * 18, 10 + p * 7, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = alpha * .38;
    ctx.beginPath();
    ctx.moveTo(-20, 0); ctx.lineTo(-55, 0);
    ctx.moveTo(-17, 7); ctx.lineTo(-46, 12);
    ctx.stroke();
    ctx.restore();
  }

  // Captura o DASH base para registrar a posição e manter o teleporte de 50px.
  const baseUpdatePlayer = window.updatePlayer;
  window.updatePlayer = function(dt, now) {
    const beforeX = player.x;
    const beforeY = player.y;
    baseUpdatePlayer(dt, now);
    const moved = Math.hypot(player.x - beforeX, player.y - beforeY);
    if (moved > worldPixels(35) && !player.attack) {
      const dx = player.x - beforeX;
      const dy = player.y - beforeY;
      dashFx = { x: player.x, y: player.y, start: now, angle: Math.atan2(dy, dx) };
    }
  };

  // Novo boss: garante que o invocador e o boss tradicional existam simultaneamente na Wave 7+.
  function ensureWave7Bosses() {
    if (typeof enemies === "undefined" || typeof waveCounter === "undefined" || typeof Enemy !== "function") return;
    if (waveCounter < 7) return;

    let traditional = enemies.find(e => e.isBoss && e.type !== "summonerBoss" && !e.isDead());
    if (!traditional) {
      traditional = new Enemy(74, 74, ++enemyId, true, "common");
      traditional.waveLevel = waveCounter;
      traditional.reset();
      enemies.push(traditional);
    }

    let summoner = enemies.find(e => e.isBoss && e.type === "summonerBoss" && !e.isDead());
    if (!summoner) {
      summoner = new Enemy(78, 78, ++enemyId, true, "summonerBoss");
      summoner.waveLevel = waveCounter;
      summoner.reset();
      summoner.nextSummonAt = performance.now() + 1800;
      summoner.bossDanger = null;
      enemies.push(summoner);
      showMessage("ONDA 7+ — CHEFÃO INVOCADOR APARECEU!");
    }
  }

  function summonMinions(boss, now) {
    if (!boss || boss.isDead()) return;
    boss.summonFlashUntil = now + 900;
    for (let i = 0; i < 3; i++) {
      const a = i * Math.PI * 2 / 3;
      const m = new Enemy(boss.x + Math.cos(a) * 1.1, boss.y + Math.sin(a) * 1.1, ++enemyId, false, "common");
      m.isSummonedMinion = true;
      m.summonedBy = boss.id;
      m.summonBorn = now;
      m.summonScale = .70;
      m.speedMultiplier = (m.speedMultiplier || 1) * 1.40;
      enemies.push(m);
    }
    showMessage("INVOCADOR — 3 SERVOS!");
  }

  setInterval(() => {
    try {
      ensureWave7Bosses();
      if (typeof enemies === "undefined") return;
      const now = performance.now();
      const boss = enemies.find(e => e.isBoss && e.type === "summonerBoss" && !e.isDead());
      if (boss) {
        if (!boss.nextSummonAt) boss.nextSummonAt = now + 1800;
        if (now >= boss.nextSummonAt) {
          summonMinions(boss, now);
          boss.nextSummonAt = now + 9000;
        }
      }
    } catch (_) {}
  }, 200);

  // Remove a zona de fogo do novo boss, mantendo-a somente no boss tradicional.
  const baseBossDanger = window.updateBossDangerZones;
  window.updateBossDangerZones = function(now) {
    if (typeof enemies === "undefined") return;
    const originalBosses = enemies;
    const filtered = originalBosses.filter(e => e.type !== "summonerBoss");
    // A função original fecha sobre enemies; temporariamente usamos a lista filtrada.
    window.__sunwalkerBossFilter = filtered;
    try {
      // Replica a lógica original sem afetar o invocador.
      for (const enemy of filtered) {
        if (!enemy.isBoss || enemy.isDead()) continue;
        if (!enemy.bossDanger || now >= enemy.bossDanger.end) {
          enemy.bossDanger = { start: now, warningUntil: now + CONFIG.bossDangerWarningMs, end: now + CONFIG.bossDangerWarningMs + CONFIG.bossDangerBurnMs };
          showMessage("CHEFÃO: ZONA DE FOGO EM 3s");
          continue;
        }
        const zone = enemy.bossDanger;
        const inside = Math.hypot(player.x - enemy.x, player.y - enemy.y) <= CONFIG.bossDangerRadiusWorld;
        if (now >= zone.warningUntil && inside && !zone.burnApplied) {
          zone.burnApplied = true;
          player.fireBurnUntil = now + CONFIG.bossDangerBurnMs;
          player.fireBurnNextTick = now;
          showMessage("FOGO! SAIA DA ÁREA!");
        }
      }
    } finally {
      delete window.__sunwalkerBossFilter;
    }
  };

  // =========================
  // HABILIDADE: RELÂMPAGO
  // =========================
  function hasLightning() {
    return !!(player.skills && player.skills.lightningSword) || localStorage.getItem("sunwalker_lightning_sword") === "true";
  }

  function applyLightning(enemy, attackId, now) {
    if (!enemy || enemy.isDead() || enemy.lastLightningAttackId === attackId) return;
    enemy.lastLightningAttackId = attackId;
    enemy.lightningUntil = now + LIGHTNING_DURATION;
    enemy.lightningNextTick = now + LIGHTNING_TICK;
    enemy.lightningSourceAttack = attackId;
  }

  const baseDamageEnemy = window.damageEnemy;
  window.damageEnemy = function(enemy, damage, kx, ky, now, source) {
    baseDamageEnemy(enemy, damage, kx, ky, now, source);
    if (source !== "sword" || !hasLightning() || !enemy || enemy.isDead()) return;
    const attackId = player.attack ? player.attack.id : `${now}-${enemy.id}`;
    applyLightning(enemy, attackId, now);
    const radius = worldPixels(LIGHTNING_RADIUS_PX);
    for (const other of enemies) {
      if (other === enemy || other.isDead()) continue;
      if (Math.hypot(other.x - enemy.x, other.y - enemy.y) <= radius) applyLightning(other, attackId, now);
    }
  };

  function updateLightning(now) {
    if (typeof enemies === "undefined") return;
    for (const enemy of enemies) {
      if (!enemy.lightningUntil) continue;
      if (now >= enemy.lightningUntil) {
        enemy.lightningUntil = 0;
        continue;
      }
      if (now >= enemy.lightningNextTick) {
        const amount = Math.max(1, Math.round(enemy.maxHp * 0.10));
        enemy.hp = Math.max(0, enemy.hp - amount);
        enemy.damageNumbers.push({ value: amount, x: enemy.x, y: enemy.y - .8, until: now + 650 });
        enemy.hitFlashUntil = now + 120;
        enemy.lightningNextTick += LIGHTNING_TICK;
        if (enemy.hp <= 0) {
          enemy.state = "dead";
          enemy.attackPhase = null;
          rewardEnemy(enemy, "kill");
        }
      }
    }
  }

  function drawElementalEffects() {
    if (typeof enemies === "undefined") return;
    const now = performance.now();
    for (const enemy of enemies) {
      if (enemy.isDead() || !enemy.lightningUntil || now >= enemy.lightningUntil) continue;
      const s = Camera.worldToScreen(enemy.x, enemy.y);
      const pulse = 0.55 + Math.sin(now / 55 + enemy.id) * .35;
      ctx.save();
      ctx.strokeStyle = `rgba(80,180,255,${pulse})`;
      ctx.shadowColor = "#39aaff";
      ctx.shadowBlur = 14;
      ctx.lineWidth = 3;
      for (let i = 0; i < 5; i++) {
        const a = now / 90 + i * 1.25;
        const r = 8 + (i % 3) * 5;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y - 20);
        ctx.lineTo(s.x + Math.cos(a) * r, s.y - 20 + Math.sin(a) * r);
        ctx.lineTo(s.x + Math.cos(a + .45) * (r + 8), s.y - 20 + Math.sin(a + .45) * (r + 8));
        ctx.lineTo(s.x + Math.cos(a + .8) * r, s.y - 20 + Math.sin(a + .8) * r);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  setInterval(() => updateLightning(performance.now()), 50);

  // =========================
  // HABILIDADE: CONVERSÃO DA BAINHA
  // =========================
  function hasAllySkill() {
    return !!(player.skills && player.skills.allySheath) || localStorage.getItem("sunwalker_ally_sheath") === "true";
  }

  const damageWithConversion = window.damageEnemy;
  window.damageEnemy = function(enemy, damage, kx, ky, now, source) {
    damageWithConversion(enemy, damage, kx, ky, now, source);
    if (source !== "sheath" || !hasAllySkill() || !enemy || enemy.isDead() || enemy.isBoss) return;
    if (Math.random() <= ALLY_CHANCE) {
      enemy.allyUntil = now + ALLY_DURATION;
      enemy.allyNextAttack = now + 350;
      enemy.allyAttackCooldown = 0;
      enemy.state = "ally";
      enemy.attackPhase = null;
      enemy.staggerUntil = 0;
      showMessage("BAINHA — INIMIGO CONVERTIDO!");
    }
  };

  function updateAlly(enemy, now, dt) {
    if (!enemy.allyUntil) return false;
    if (now >= enemy.allyUntil) {
      enemy.allyUntil = 0;
      enemy.state = "idle";
      return false;
    }

    let target = null;
    let best = Infinity;
    for (const other of enemies) {
      if (other === enemy || other.isDead() || other.allyUntil > now) continue;
      const d = Math.hypot(other.x - enemy.x, other.y - enemy.y);
      if (d < best) { best = d; target = other; }
    }
    if (!target) return true;

    const dx = target.x - enemy.x, dy = target.y - enemy.y;
    const dist = Math.hypot(dx, dy) || 1;
    enemy.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");

    if (dist > CONFIG.enemyAttackRange) {
      const speed = CONFIG.enemySpeed * 1.05;
      enemy.x += dx / dist * speed * dt;
      enemy.y += dy / dist * speed * dt;
    } else if (now >= enemy.allyNextAttack) {
      const damage = Math.max(1, Math.round(CONFIG.enemyDamage * .8));
      damageEnemy(enemy === target ? null : target, damage, 0, 0, now, "ally");
      enemy.allyNextAttack = now + 900;
      if (target && !target.isDead()) {
        target.staggerUntil = now + 220;
        target.state = "hurt";
      }
    }
    return true;
  }

  const baseUpdateEnemyCombat = window.updateEnemyCombat;
  window.updateEnemyCombat = function(enemy, now) {
    if (enemy && enemy.allyUntil) {
      const dt = 1 / 60;
      if (updateAlly(enemy, now, dt)) return;
    }
    baseUpdateEnemyCombat(enemy, now);
  };

  function drawAllyEffects() {
    if (typeof enemies === "undefined") return;
    const now = performance.now();
    for (const enemy of enemies) {
      if (enemy.isDead() || !enemy.allyUntil || now >= enemy.allyUntil) continue;
      const s = Camera.worldToScreen(enemy.x, enemy.y);
      ctx.save();
      ctx.strokeStyle = "rgba(70,170,255,.95)";
      ctx.shadowColor = "#2d9cff";
      ctx.shadowBlur = 12;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(s.x, s.y - 20, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#79c8ff";
      ctx.font = "bold 10px Arial";
      ctx.textAlign = "center";
      ctx.fillText("ALIADO", s.x, s.y - 43);
      ctx.restore();
    }
  }

  // =========================
  // BOSS INVOCADOR / ANIMAÇÃO
  // =========================
  function drawSummonerEffects() {
    if (typeof enemies === "undefined") return;
    const now = performance.now();
    for (const e of enemies) {
      if (e.isDead()) continue;
      const s = Camera.worldToScreen(e.x, e.y);
      if (e.type === "summonerBoss") {
        ctx.save();
        ctx.fillStyle = "#ef6d9b";
        ctx.strokeStyle = "#ffd7e4";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(s.x, s.y - 27, 15 * CONFIG.zoom, 18 * CONFIG.zoom, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#ffe9f1";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.fillText("INVOCADOR", s.x, s.y - 53);
        if (e.summonFlashUntil && now < e.summonFlashUntil) {
          const p = 1 - (e.summonFlashUntil - now) / 900;
          ctx.strokeStyle = `rgba(255,140,190,${1 - p})`;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(s.x, s.y - 10, 18 + p * 55, 0, Math.PI * 2);
          ctx.stroke();
          for (let i = 0; i < 12; i++) {
            const a = i * Math.PI * 2 / 12 - p * 2;
            const r = 12 + p * 50;
            ctx.fillStyle = `rgba(255,190,215,${1 - p})`;
            ctx.fillRect(s.x + Math.cos(a) * r - 2, s.y - 10 + Math.sin(a) * r - 2, 4, 4);
          }
        }
      }
      if (e.isSummonedMinion && now - e.summonBorn < 700) {
        const p = Math.min(1, (now - e.summonBorn) / 700);
        ctx.save();
        ctx.strokeStyle = `rgba(255,190,215,${1 - p})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(s.x, s.y - 10, 8 + p * 22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // =========================
  // MERCANTE COM ABAS
  // =========================
  function buyPower(key, cost, label) {
    if (localStorage.getItem(key) === "true") { showMessage(`${label} JÁ ATIVADA`); return; }
    if (player.coins < cost) { showMessage(`MOEDAS INSUFICIENTES — ${cost} MOEDAS`); return; }
    player.coins -= cost;
    localStorage.setItem(key, "true");
    player.skills = player.skills || {};
    if (key === "sunwalker_lightning_sword") player.skills.lightningSword = true;
    if (key === "sunwalker_ally_sheath") player.skills.allySheath = true;
    showMessage(`${label} ATIVADA`);
    updatePowerCards();
    if (typeof refreshSkillUI === "function") refreshSkillUI();
  }

  function makePowerCard(id, title, price, description, key, label) {
    const card = document.createElement("div");
    card.className = "skill-card";
    card.id = id;
    card.innerHTML = `<h3>${title} <span class="skill-price">${price} moedas</span></h3><p>${description}</p><span class="skill-state"></span>`;
    card.addEventListener("click", () => buyPower(key, price, label));
    return card;
  }

  function updatePowerCards() {
    const lightning = document.querySelector("#skillLightning .skill-state");
    const ally = document.querySelector("#skillAlly .skill-state");
    if (lightning) lightning.textContent = localStorage.getItem("sunwalker_lightning_sword") === "true" ? "ATIVADA" : `COMPRAR — ${LIGHTNING_COST} MOEDAS`;
    if (ally) ally.textContent = localStorage.getItem("sunwalker_ally_sheath") === "true" ? "ATIVADA" : `COMPRAR — ${ALLY_COST} MOEDAS`;
    player.skills = player.skills || {};
    player.skills.lightningSword = localStorage.getItem("sunwalker_lightning_sword") === "true";
    player.skills.allySheath = localStorage.getItem("sunwalker_ally_sheath") === "true";
  }

  function setupMerchantTabs() {
    const modal = document.querySelector(".merchant-modal");
    if (!modal || modal.dataset.alpha17Tabs) return;
    modal.dataset.alpha17Tabs = "true";

    const close = document.getElementById("closeMerchantButton");
    const abilityIds = ["skillFire", "skillRepel"];
    const itemIds = ["itemMelador", "itemFireBomb"];
    const abilities = document.createElement("div");
    abilities.id = "merchantAbilitiesTab";
    const items = document.createElement("div");
    items.id = "merchantItemsTab";
    const nav = document.createElement("div");
    nav.style.cssText = "display:flex;gap:8px;margin:14px 0;";

    function tabButton(text, active) {
      const b = document.createElement("button");
      b.textContent = text;
      b.style.cssText = `flex:1;padding:10px;border:1px solid #8d7b55;border-radius:5px;background:${active ? "#806b49" : "#25292a"};color:#fff;cursor:pointer;font-weight:700;`;
      return b;
    }
    const ab = tabButton("HABILIDADES", true);
    const ib = tabButton("ITENS", false);
    nav.append(ab, ib);

    for (const id of abilityIds) {
      const el = document.getElementById(id);
      if (el) abilities.appendChild(el);
    }
    for (const id of itemIds) {
      const el = document.getElementById(id);
      if (el) items.appendChild(el);
    }

    const lightning = makePowerCard("skillLightning", "ESPADA — RELÂMPAGO", LIGHTNING_COST, "Ao acertar, aplica choque por 3s. Causa 10% da vida máxima do inimigo por segundo e alcança inimigos em até 20px.", "sunwalker_lightning_sword", "RELÂMPAGO");
    const ally = makePowerCard("skillAlly", "BAINHA — CONVERSÃO", ALLY_COST, "40% de chance de transformar um inimigo atingido em aliado por 5s. O aliado fica azul e ataca o inimigo mais próximo.", "sunwalker_ally_sheath", "CONVERSÃO");
    abilities.append(lightning, ally);

    modal.insertBefore(nav, close);
    modal.insertBefore(abilities, close);
    modal.insertBefore(items, close);
    items.style.display = "none";

    ab.addEventListener("click", () => {
      abilities.style.display = "block"; items.style.display = "none";
      ab.style.background = "#806b49"; ib.style.background = "#25292a";
    });
    ib.addEventListener("click", () => {
      abilities.style.display = "none"; items.style.display = "block";
      ib.style.background = "#806b49"; ab.style.background = "#25292a";
    });
    updatePowerCards();
  }

  setInterval(() => {
    try { setupMerchantTabs(); updatePowerCards(); } catch (_) {}
  }, 500);

  // Mantém as habilidades compradas após reset do jogador.
  setInterval(() => {
    if (!player || !player.skills) return;
    player.skills.lightningSword = localStorage.getItem("sunwalker_lightning_sword") === "true";
    player.skills.allySheath = localStorage.getItem("sunwalker_ally_sheath") === "true";
  }, 400);

  console.info("[Sunwalker] Alpha 1.7 final: dash 50px, terreno seco, boss invocador, relâmpago, conversão e abas do mercador.");
})();
