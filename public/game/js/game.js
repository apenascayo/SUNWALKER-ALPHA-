const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let player = new Player();
let enemies = [];
let lastTime = 0;
let messageUntil = 0;
let enemyId = 0;
let paused = true;
let runtimeError = false;
let hitSparks = [];
let coins = [];
let fireBombZones = [];
let fireBombImpacts = [];
let nextRespawnAt = 0;
let waveCounter = 1;
let settingsOpen = false;
let merchantOpen = false;
let inventoryOpen = false;
let levelUpOpen = false;
let gameStarted = false;

function getWaveMultiplier() { return 1 + Math.max(0, waveCounter - 1) * 0.02; }
function getWaveInterval(wave) {
  if (wave >= 10) return 30000;
  if (wave >= 5) return 45000;
  return 50000;
}

const MUSIC_TRACKS = [
  "assets/music/Sertão do Shakuhachi.wav",
  "assets/music/Sertão do Shakuhachi 2.wav",
  "assets/music/Combaião Determinado.wav"
];

const musicState = {
  started: false,
  audio: null,
  playBlocked: false,
  index: 0,
  volume: 0.35
};

function spawnHitSpark(x, y, now, type) {
  const duration = type === "sword" ? 320 : 260;
  hitSparks.push({
    x,
    y,
    start: now,
    until: now + duration,
    type
  });
}

function addXp(amount, reason) {
  if (player.isDead() || levelUpOpen) return;
  player.xp = Math.min(100, player.xp + amount);
  showMessage(`+${amount} XP — ${reason}`);
  if (player.xp >= 100) {
    if (!levelUpOpen) playSound("level");
    player.xp = 100;
    levelUpOpen = true;
    toggleLevelUp(true);
  }
}

function rewardEnemy(enemy, kind) {
  if (!enemy || enemy.rewarded) return;
  enemy.rewarded = true;
  const base = enemy.isBoss ? CONFIG.coinsPerBoss : (kind === "kill" ? CONFIG.coinsPerKill : CONFIG.coinsPerStun);
  const multiplier = kind === "kill" ? 1.25 : 0.90;
  dropCoins(enemy.x, enemy.y, Math.max(1, Math.round(base * multiplier)));
  addXp(kind === "kill" ? 5 : 10, kind === "kill" ? "INIMIGO DERROTADO" : "DESMAIO");
}

const effectsVolumeSlider = document.getElementById("effectsVolumeRange");
if (effectsVolumeSlider) {
  effectsVolumeSlider.addEventListener("input", e => setEffectsVolume(e.target.value));
  effectsVolumeSlider.addEventListener("change", e => setEffectsVolume(e.target.value));
}

function dropCoins(x, y, amount) {
  const count = Math.max(1, Math.min(10, Math.round(amount / 2)));
  const value = Math.max(1, Math.floor(amount / count));
  for (let i = 0; i < count; i++) {
    const angle = Math.PI * 2 * i / count;
    coins.push({
      x: x + Math.cos(angle) * 0.35,
      y: y + Math.sin(angle) * 0.35,
      value: i === count - 1 ? amount - value * (count - 1) : value,
      born: performance.now()
    });
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getMusicVolume() {
  const raw = Number(localStorage.getItem("alpha_music_volume"));
  if (!Number.isFinite(raw)) return CONFIG.musicVolume;
  return clamp(raw, 0, 1);
}

function setMusicVolume(value) {
  const nextVolume = clamp(Number(value), 0, 1);
  musicState.volume = nextVolume;
  CONFIG.musicVolume = nextVolume;
  localStorage.setItem("alpha_music_volume", String(nextVolume));
  const slider = document.getElementById("musicVolumeRange");
  const label = document.getElementById("musicVolumeValue");
  if (slider) slider.value = String(nextVolume);
  if (label) label.textContent = `${Math.round(nextVolume * 100)}%`;
  if (musicState.audio) musicState.audio.volume = nextVolume;
}

function getEffectsVolume() {
  const raw = Number(localStorage.getItem("alpha_effects_volume"));
  if (!Number.isFinite(raw)) return CONFIG.effectsVolume;
  return clamp(raw, 0, 1);
}

function ensureEffectsVolume() {
  const saved = localStorage.getItem("alpha_effects_volume");
  if (saved === null || Number(saved) <= 0) setEffectsVolume(0.6);
}

function setEffectsVolume(value) {
  const nextVolume = clamp(Number(value), 0, 1);
  CONFIG.effectsVolume = nextVolume;
  localStorage.setItem("alpha_effects_volume", String(nextVolume));
  const slider = document.getElementById("effectsVolumeRange");
  const label = document.getElementById("effectsVolumeValue");
  if (slider) slider.value = String(nextVolume);
  if (label) label.textContent = `${Math.round(nextVolume * 100)}%`;
}

function setMusicStatus(text, isError) {
  const status = document.getElementById("musicStatus");
  if (status) {
    status.textContent = text;
    status.style.color = isError ? "#ff9b9b" : "#9be09b";
  }
}

function ensureMusicVolume() {
  const saved = localStorage.getItem("alpha_music_volume");
  if (saved === null || Number(saved) <= 0) setMusicVolume(0.35);
}

function playNextMusicTrack() {
  if (!musicState.audio) return;
  const src = MUSIC_TRACKS[musicState.index % MUSIC_TRACKS.length];
  musicState.audio.src = encodeURI(src);
  musicState.audio.volume = musicState.volume;
  const playPromise = musicState.audio.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.then(() => { musicState.playBlocked = false; })
      .catch(() => {
        musicState.playBlocked = true;
        setMusicStatus("Música bloqueada pelo navegador. Clique PLAY novamente.", true);
      });
  }
  musicState.index = (musicState.index + 1) % MUSIC_TRACKS.length;
}

function startMusic() {
  if (musicState.started) return;
  ensureMusicVolume();
  musicState.started = true;
  musicState.audio = new Audio();
  musicState.audio.preload = "auto";
  musicState.audio.loop = false;
  musicState.audio.volume = getMusicVolume();
  musicState.volume = musicState.audio.volume;
  musicState.audio.addEventListener("ended", () => playNextMusicTrack());
  musicState.audio.addEventListener("error", () => {
    musicState.playBlocked = true;
    setMusicStatus("Erro ao carregar a música.", true);
    showMessage("NÃO FOI POSSÍVEL CARREGAR A MÚSICA");
  });
  musicState.audio.addEventListener("playing", () => {
    musicState.playBlocked = false;
    setMusicStatus("Música: tocando", false);
    showMessage("MÚSICA: TOCANDO");
  });
}

function unlockMusic() {
  if (!musicState.started) {
    startMusic();
    return;
  }
  if (musicState.audio && (musicState.playBlocked || musicState.audio.paused)) {
    const playPromise = musicState.audio.play();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise.then(() => { musicState.playBlocked = false; }).catch(() => {});
    }
  }
}

function getZoom() {
  const savedValue = Number(localStorage.getItem("alpha_zoom"));
  if (!Number.isFinite(savedValue)) return CONFIG.zoom;
  return clamp(savedValue, CONFIG.zoomMin, CONFIG.zoomMax);
}

function setZoom(value) {
  const nextZoom = Number(value);
  if (!Number.isFinite(nextZoom)) return;
  CONFIG.zoom = clamp(nextZoom, CONFIG.zoomMin, CONFIG.zoomMax);
  localStorage.setItem("alpha_zoom", String(CONFIG.zoom));
  const label = document.getElementById("zoomValue");
  if (label) label.textContent = `${Math.round(CONFIG.zoom * 100)}%`;
  const slider = document.getElementById("zoomRange");
  if (slider) slider.value = String(Math.round(CONFIG.zoom * 100));
  if (typeof drawGame === "function") drawGame();
}

function getDebug() {
  return localStorage.getItem("alpha_debug") === "true";
}

function setDebug(enabled) {
  CONFIG.debug = Boolean(enabled);
  localStorage.setItem("alpha_debug", String(CONFIG.debug));
  document.body.classList.toggle("debug-mode", CONFIG.debug);
  const toggle = document.getElementById("debugToggle");
  if (toggle) toggle.checked = CONFIG.debug;
}

function syncSettingsUI() {
  const debugToggle = document.getElementById("debugToggle");
  if (debugToggle) debugToggle.checked = CONFIG.debug;

  const z = document.getElementById("zoomRange");
  if (z) z.value = String(Math.round(CONFIG.zoom * 100));

  const zoomLabel = document.getElementById("zoomValue");
  if (zoomLabel) zoomLabel.textContent = `${Math.round(CONFIG.zoom * 100)}%`;

  const musicSlider = document.getElementById("musicVolumeRange");
  const musicLabel = document.getElementById("musicVolumeValue");
  const musicVol = getMusicVolume();
  if (musicSlider) musicSlider.value = String(musicVol);
  if (musicLabel) musicLabel.textContent = `${Math.round(musicVol * 100)}%`;
  const effectsSlider = document.getElementById("effectsVolumeRange");
  const effectsLabel = document.getElementById("effectsVolumeValue");
  const effectsVol = getEffectsVolume();
  if (effectsSlider) effectsSlider.value = String(effectsVol);
  if (effectsLabel) effectsLabel.textContent = `${Math.round(effectsVol * 100)}%`;
}

function updateControlText() {
  const mode = getAttackControlMode();
  const el = document.getElementById("controlModeText");
  if (el) el.textContent = mode === "mouse" ? "MOUSE" : "TECLADO";
}

function showMessage(text) {
  const el = document.getElementById("combatMessage");
  if (!el) return;
  el.textContent = text;
  el.style.opacity = "1";
  messageUntil = performance.now() + 550;
}

function updateMessage(now) {
  const el = document.getElementById("combatMessage");
  if (!el) return;
  if (now >= messageUntil) el.style.opacity = "0";
}

function getAttackControlMode() {
  return localStorage.getItem("alpha_attack_control_mode") || CONFIG.attackControlMode;
}

function setAttackControlMode(mode) {
  CONFIG.attackControlMode = mode === "keyboard" ? "keyboard" : "mouse";
  localStorage.setItem("alpha_attack_control_mode", CONFIG.attackControlMode);
  updateControlText();
}

function togglePause(force) {
  paused = typeof force === "boolean" ? force : !paused;
  const overlay = document.getElementById("pauseOverlay");
  if (overlay) overlay.classList.toggle("hidden", !paused);
}

function toggleSettings(show) {
  const overlay = document.getElementById("settingsOverlay");
  if (!overlay) return;
  const next = typeof show === "boolean" ? show : overlay.classList.contains("hidden");
  overlay.classList.toggle("hidden", !next);
  settingsOpen = next;
  if (next) {
    const inputs = document.querySelectorAll('input[name="attackMode"]');
    inputs.forEach(r => r.checked = r.value === getAttackControlMode());
    syncSettingsUI();
  }
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, window.innerWidth);
  const h = Math.max(1, window.innerHeight);
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
}

window.addEventListener("resize", resize);

function createEnemies() {
  enemies = [];
  const spots = [
    [43,46],[57,46],[43,54],[57,54],
    [38,50],[62,50],[47,40],[53,40],
    [47,60],[53,60],[35,43],[65,57],
    [60,42],[40,58],
    [30,35],[70,35],[30,65],[70,65],[25,45],[75,45],[25,55],[75,55],
    [35,30],[65,30],[35,70],[65,70],[45,25],[55,25],[45,75],[55,75],
    [20,40],[80,40],[20,60],[80,60]
  ];
  for (const [x,y] of spots) enemies.push(new Enemy(x,y,++enemyId, false, "common"));
}

function resetGame() {
  player = new Player();
  waveCounter = 1;
  createEnemies();
  Camera.snapToPlayer();
  hitSparks = [];
  coins = [];
  fireBombZones = [];
  fireBombImpacts = [];
  nextRespawnAt = performance.now() + getWaveInterval(waveCounter);
  inventoryOpen = false;
  levelUpOpen = false;
  toggleInventory(false);
  toggleLevelUp(false);
  const over = document.getElementById("gameOver");
  if (over) over.classList.add("hidden");
}

function beginBossDangerZone(enemy, now) {
  if (!enemy || !enemy.isBoss || enemy.isDead()) return;
  enemy.bossDanger = {
    start: now,
    warningUntil: now + CONFIG.bossDangerWarningMs,
    end: now + CONFIG.bossDangerWarningMs + CONFIG.bossDangerBurnMs
  };
  showMessage("CHEFÃO: ZONA DE FOGO EM 3s");
}

function updateBossDangerZones(now) {
  for (const enemy of enemies) {
    if (!enemy.isBoss || enemy.isDead()) continue;
    if (!enemy.bossDanger || now >= enemy.bossDanger.end) {
      beginBossDangerZone(enemy, now);
      continue;
    }

    const zone = enemy.bossDanger;
    const bossScreen = Camera.worldToScreen(enemy.x, enemy.y);
    const playerScreen = Camera.worldToScreen(player.x, player.y);
    const radius = CONFIG.bossDangerRadiusWorld;
    const inside = Math.hypot(player.x - enemy.x, player.y - enemy.y) <= radius;

    if (now >= zone.warningUntil && inside && !zone.burnApplied) {
      zone.burnApplied = true;
      player.fireBurnUntil = now + CONFIG.bossDangerBurnMs;
      player.fireBurnNextTick = now;
      showMessage("FOGO! SAIA DA ÁREA!");
    }
  }
}

function respawnWave(now) {
  const dead = enemies.filter(e => e.isDead());
  if (!dead.length) return;
  const hasBoss = enemies.some(e => e.isBoss && !e.isDead());
  const bossIndex = hasBoss ? -1 : 0;
  waveCounter++;
  dead.forEach((e, i) => {
    e.isBoss = i === bossIndex;
    e.type = waveCounter >= 2 && i < Math.min(6, dead.length) ? "archer" : "common";
    e.waveLevel = waveCounter;
    e.reset();
  });
  enemies.filter(e => !e.isDead()).forEach(e => e.applyWaveScaling());
  playSound("waveup");
  showMessage(bossIndex >= 0 ? "NOVA ONDA — CHEFÃO E ARQUEIROS!" : "NOVA ONDA DE INIMIGOS");
}

function updateCoins() {
  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    if (Math.hypot(player.x - c.x, player.y - c.y) <= CONFIG.coinPickupRange) {
      const volume = clamp(0.7 + c.value / 20, 0.7, 1.5) * getEffectsVolume();
      player.coins += c.value;
      coins.splice(i, 1);
      playSound("coins", { volume });
      showMessage(`+${c.value} MOEDAS`);
      refreshSkillUI();
    }
  }
}

function updatePlayer(dt, now) {
  if (player.isDead()) return;
  player.burning = player.fireBurnUntil > now;

  const movement = { x: 0, y: 0 };
  if (Input.down("w")) movement.y -= 1;
  if (Input.down("s")) movement.y += 1;
  if (Input.down("a")) movement.x -= 1;
  if (Input.down("d")) movement.x += 1;

  if (player.dashTrail && player.dashTrail.length) {
    for (const trail of player.dashTrail) trail.life -= dt * 1000;
    player.dashTrail = player.dashTrail.filter(trail => trail.life > 0);
  }

  if (player.dashCount >= 5 && now >= player.dashRegenAt) {
    player.dashCount = 0;
    showMessage("DASHES RECARREGADOS");
  }
  if (Input.consume("shift") && player.dashCount < 5 && now >= player.dashCooldownUntil && !player.isDefending() && !player.attack) {
    let dashDir;
    if (movement.x || movement.y) {
      const len = Math.hypot(movement.x, movement.y);
      dashDir = { x: movement.x / len, y: movement.y / len };
    } else {
      dashDir = directionVector(player.direction);
      const dl = Math.hypot(dashDir.x, dashDir.y) || 1;
      dashDir = { x: dashDir.x / dl, y: dashDir.y / dl };
    }
    player.x += dashDir.x * CONFIG.dashDistance;
    player.y += dashDir.y * CONFIG.dashDistance;
    player.dashTrail.push({ x: player.x, y: player.y, life: 180, maxLife: 180 });
    player.stamina = Math.max(0, player.stamina - CONFIG.dashStaminaCost);
    player.staminaRegenBlockedUntil = now + CONFIG.staminaRegenDelay;
    player.dashCount++;
    player.dashRegenAt = player.dashCount >= 5 ? now + 30000 : 0;
    player.dashCooldownUntil = now + CONFIG.dashCooldown;
    player.dashUntil = now + 160;
    playSound("dash");
  } else if (Input.consume("shift") && player.dashCount >= 5) {
    showMessage(`DASH BLOQUEADO — ${Math.ceil(Math.max(0, player.dashRegenAt - now) / 1000)}s`);
  }

  if (player.fireBurnUntil > now) {
    if (player.fireBurnNextTick <= now) {
      const burnAmount = Math.max(1, Math.round(player.maxHp * CONFIG.fireBurnPercentPerSecond));
      player.hp = Math.max(0, player.hp - burnAmount);
      player.damageFlashUntil = Math.max(player.damageFlashUntil, now + 500);
      playSound("damage");
      player.fireBurnNextTick = now + CONFIG.fireBurnTickMs;
      if (player.hp <= 0) {
        player.state = "dead";
        const over = document.getElementById("gameOver");
        if (over) over.classList.remove("hidden");
      }
    }
  } else {
    player.fireBurnNextTick = 0;
  }

  if (movement.x || movement.y) {
    const len = Math.hypot(movement.x, movement.y);
    movement.x /= len; movement.y /= len;
    if (!isAiming) player.direction = normalizedDirection(movement.x, movement.y);

    let speed = CONFIG.playerSpeed * player.statMultipliers.speed;
    if (player.isDefending()) speed *= CONFIG.defenseSpeedMultiplier;
    if (player.attack) speed *= CONFIG.attackMoveMultiplier;
    player.isRunning = player.canRun() && player.stamina > 0;

    if (player.isRunning) {
      speed *= CONFIG.runMultiplier;
      player.stamina = Math.max(0, player.stamina - CONFIG.runStaminaCost * dt);
      player.staminaRegenBlockedUntil = now + CONFIG.staminaRegenDelay;
    }

    player.x += movement.x * speed * dt;
    player.y += movement.y * speed * dt;
    player.moveBlend = Math.min(1, player.moveBlend + dt * 10);
  } else {
    player.moveBlend = Math.max(0, player.moveBlend - dt * 10);
    player.isRunning = false;
  }

  player.x = Math.max(0.15, Math.min(CONFIG.MAP_WIDTH - 0.15, player.x));
  player.y = Math.max(0.15, Math.min(CONFIG.MAP_HEIGHT - 0.15, player.y));
}

function updateEnemies(dt, now) {
  // Atualiza cada zona uma vez por frame, fora do loop de inimigos.
  updateBossDangerZones(now);
  for (const enemy of enemies) {
    enemy.damageNumbers = enemy.damageNumbers.filter(d => d.until > now);

    if (enemy.isDead()) continue;
    if (enemy.burnUntil > now) {
      if (now >= enemy.burnNextTick) {
        const burn = Math.max(1, Math.round(enemy.maxHp * CONFIG.fireBurnPercentPerSecond));
        enemy.hp = Math.max(0, enemy.hp - burn);
        enemy.damageNumbers.push({ value: burn, x: enemy.x, y: enemy.y - 0.7, until: now + 650 });
        enemy.burnNextTick = now + 1000;
        if (enemy.hp <= 0) {
          enemy.state = "dead";
          enemy.attackPhase = null;
          rewardEnemy(enemy, "kill");
          continue;
        }
      }
    }

    if (enemy.state === "stunned" && now >= enemy.stunnedUntil) enemy.state = "chasing";
    updateEnemyCombat(enemy, now);
    if (enemy.isBoss && !enemy.attackPhase && enemy.state === "idle") enemy.state = "chasing";

    if (enemy.state === "stunned" || enemy.state === "dead" || enemy.state === "attacking") {
      enemy.x += enemy.knockbackX * dt;
      enemy.y += enemy.knockbackY * dt;
      enemy.knockbackX *= Math.max(0, 1 - dt * 8);
      enemy.knockbackY *= Math.max(0, 1 - dt * 8);
      continue;
    }

    if (enemy.state === "hurt") {
      if (now >= enemy.hurtUntil) enemy.state = "chasing";
      enemy.x += enemy.knockbackX * dt;
      enemy.y += enemy.knockbackY * dt;
      enemy.knockbackX *= Math.max(0, 1 - dt * 9);
      enemy.knockbackY *= Math.max(0, 1 - dt * 9);
      continue;
    }

    if (enemy.state === "chasing") {
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.hypot(dx, dy) || 1;
      const dirX = dx / dist;
      const dirY = dy / dist;
      const speed = CONFIG.enemySpeed * enemy.speedMultiplier * (enemy.type === "archer" ? CONFIG.archerSpeedMultiplier : 1);
      enemy.x += dirX * speed * dt;
      enemy.y += dirY * speed * dt;
      enemy.facing = Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? "right" : "left")
        : (dy > 0 ? "down" : "up");
    }
  }
  updateFireBombZones(now);
}

function createFireBombZone(now) {
  const direction = directionVector(player.direction);
  const pixelsPerWorldUnit = CONFIG.TILE_WIDTH / 2;
  const distance = CONFIG.fireBombOffsetPixels / pixelsPerWorldUnit;
  const impactX = player.x + direction.x * distance;
  const impactY = player.y + direction.y * distance;
  const halfLength = (CONFIG.fireBombHitboxLengthPixels || 150) / pixelsPerWorldUnit / 2;
  const halfWidth = (CONFIG.fireBombHitboxWidthPixels || 50) / pixelsPerWorldUnit / 2;
  fireBombZones.push({
    x: impactX,
    y: impactY,
    dirX: direction.x,
    dirY: direction.y,
    halfLength,
    halfWidth,
    start: now,
    end: now + CONFIG.fireBombDuration,
    nextTicks: {}
  });
  fireBombImpacts.push({
    x: impactX,
    y: impactY,
    start: now,
    end: now + 450,
    ring: 0
  });
}

function updateFireBombZones(now) {
  fireBombZones = fireBombZones.filter(zone => zone.end > now);
  fireBombImpacts = fireBombImpacts.filter(impact => impact.end > now);
  for (const zone of fireBombZones) {
    for (const enemy of enemies) {
      if (enemy.isDead()) continue;
      const dx = enemy.x - zone.x;
      const dy = enemy.y - zone.y;
      const localX = dx * zone.dirX + dy * zone.dirY;
      const localY = dx * (-zone.dirY) + dy * zone.dirX;
      const inside = (localX * localX) / (zone.halfLength * zone.halfLength) + (localY * localY) / (zone.halfWidth * zone.halfWidth) <= 1;
      if (!inside) continue;
      const next = zone.nextTicks[enemy.id] || zone.start;
      if (now < next) continue;
      zone.nextTicks[enemy.id] = now + CONFIG.fireBurnTickMs;
      const damage = Math.max(1, Math.round(enemy.maxHp * CONFIG.fireBombDamagePercentPerSecond));
      damageEnemy(enemy, damage, 0, 0, now, "fireBomb");
      enemy.burnUntil = Math.max(enemy.burnUntil, zone.end);
      enemy.burnNextTick = zone.end;
      spawnHitSpark(enemy.x, enemy.y, now, "sword");
    }
  }
}

function updateHUD() {
  const hp = Math.max(0, Math.round(player.hp));
  const st = Math.max(0, Math.round(player.stamina));
  const now = performance.now();
  player.burning = player.fireBurnUntil > now;
  const lowHealth = hp <= player.maxHp * 0.15;
  const damageOverlay = document.getElementById("screenDamageOverlay");
  if (damageOverlay) {
    damageOverlay.classList.toggle("active", player.damageFlashUntil > now);
    damageOverlay.classList.toggle("alert", lowHealth);
  }

  const hpText = document.getElementById("hpText");
  const staminaText = document.getElementById("staminaText");
  const hpBar = document.getElementById("hpBar");
  const staminaBar = document.getElementById("staminaBar");
  const coordX = document.getElementById("coordX");
  const coordY = document.getElementById("coordY");
  const direction = document.getElementById("direction");
  const state = document.getElementById("state");
  const reputationText = document.getElementById("reputationText");
  const reputationBar = document.getElementById("reputationBar");
  const weaponText = document.getElementById("weaponText");
  const coinText = document.getElementById("coinText");
  const coinCounterText = document.getElementById("coinCounterText");
  const waveText = document.getElementById("waveText");
  const nextWaveNumber = document.getElementById("nextWaveNumber");
  const waveCountdown = document.getElementById("waveCountdown");
  const xpText = document.getElementById("xpText");
  const xpBar = document.getElementById("xpBar");
  const dashStatus = document.getElementById("dashStatus");

  if (hpText) hpText.textContent = `${hp}/${Math.round(player.maxHp)}`;
  if (staminaText) staminaText.textContent = `${st}/${Math.round(player.maxStamina)}`;
  if (hpBar) hpBar.style.width = `${hp / player.maxHp * 100}%`;
  if (staminaBar) staminaBar.style.width = `${st / player.maxStamina * 100}%`;
  if (coordX) coordX.textContent = player.x.toFixed(1);
  if (coordY) coordY.textContent = player.y.toFixed(1);
  if (direction) direction.textContent = player.direction.toUpperCase();

  let stateText = player.state.toUpperCase();
  if (player.burning) stateText = "QUEIMANDO";
  if (player.isRunning) stateText = "CORRENDO";
  if (state) state.textContent = stateText;

  if (reputationText) reputationText.textContent = `${Math.round(player.reputation)}/${CONFIG.reputationMax}`;
  if (reputationBar) reputationBar.style.width = `${player.reputation / CONFIG.reputationMax * 100}%`;
  if (weaponText) weaponText.textContent = (weaponMode === "sword" ? "ESPADA" : "BAINHA") + (isAiming ? " (MIRANDO)" : "");
  if (coinText) coinText.textContent = String(player.coins);
  if (coinCounterText) coinCounterText.textContent = String(player.coins);
  const waveSeconds = Math.max(0, Math.ceil((nextRespawnAt - now) / 1000));
  if (waveText) waveText.textContent = waveSeconds + "s";
  if (nextWaveNumber) nextWaveNumber.textContent = String(waveCounter + 1);
  if (waveCountdown) waveCountdown.textContent = waveSeconds + "s";
  if (xpText) xpText.textContent = `NÍVEL ${player.level} — XP ${Math.round(player.xp)}/100`;
  if (xpBar) xpBar.style.width = `${player.xp}%`;
  if (dashStatus) dashStatus.textContent = player.dashCount >= 5
    ? `DASH: RECARGA ${Math.ceil(Math.max(0, player.dashRegenAt - now) / 1000)}s`
    : `DASHES: ${5 - player.dashCount}/5`;
  updateControlText();
}

function update(dt, now) {
  if (Input.consume("f3")) setDebug(!CONFIG.debug);
  if (Input.consume("escape")) {
    if (merchantOpen) toggleMerchant(false);
    else if (!settingsOpen) togglePause();
  }

  if (Input.consume("i") && !paused && !settingsOpen && !merchantOpen) toggleInventory();
  if (Input.consume("f") && !paused && !settingsOpen && !merchantOpen && !levelUpOpen) useSelectedItem();
  if (Input.consume("e") && !paused && !settingsOpen && !inventoryOpen) {
    if (merchantOpen) toggleMerchant(false);
    else if (isNearMerchant()) toggleMerchant(true);
  }

  if (paused || settingsOpen || merchantOpen || inventoryOpen || levelUpOpen) {
    updateHUD();
    updateMessage(now);
    return;
  }

  updatePlayer(dt, now);
  updatePlayerCombat(now, dt);
  updateEnemies(dt, now);
  updateCoins();
  if (now >= nextRespawnAt) {
    respawnWave(now);
    nextRespawnAt = now + getWaveInterval(waveCounter);
  }
  hitSparks = hitSparks.filter(s => s.until > now);
  Camera.update(dt);
  updateHUD();
  updateMessage(now);
}

function calculateDeltaTime(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = Math.min(0.033, (timestamp - lastTime) / 1000);
  lastTime = timestamp;
  return dt;
}

function showRuntimeError(error) {
  if (runtimeError) return;
  runtimeError = true;
  paused = true;
  const overlay = document.getElementById("runtimeErrorOverlay");
  const message = document.getElementById("runtimeErrorMessage");
  if (message) {
    const detail = error && error.message ? ` (${error.message})` : "";
    message.textContent = `O jogo foi pausado para evitar perda de dados${detail}.`;
  }
  if (overlay) overlay.classList.remove("hidden");
}

function gameLoop(timestamp) {
  try {
    const dt = calculateDeltaTime(timestamp);
    if (!runtimeError) update(dt, timestamp);
    if (!runtimeError) drawGame();
  } catch (error) {
    showRuntimeError(error);
    console.error("Game loop error", error);
  } finally {
    try { Input.endFrame(); } catch (error) { showRuntimeError(error); }
    requestAnimationFrame(gameLoop);
  }
}

const merchantSprite = new Image();
merchantSprite.src = "assets/merchant.jpg";

const SOUNDS = {
  sword: "assets/sword.mp3",
  shield: "assets/shield.mp3",
  merchant: "assets/merchant.mp3",
  damage: "assets/sfx/somdor.mp3",
  dash: "assets/sfx/dash.mp3",
  sheath: "assets/sfx/bainha.mp3",
  npcHurt: "assets/sfx/hurtnpc.mp3",
  openbag: "assets/sfx/openbag.mp3",
  swordnpc: "assets/sfx/swordnpc.mp3",
  waveup: "assets/sfx/waveup.mp3",
  level: "assets/sfx/level.mp3",
  coins: "assets/sfx/coins.mp3",
  bomba: "assets/sfx/bomba.mp3",
  xp: "assets/sfx/xp.mp3"
};

const soundCache = {};
function playSound(name, options = {}) {
  const src = SOUNDS[name];
  if (!src) { console.warn("[audio] som desconhecido", name); return null; }
  try {
    const a = new Audio(encodeURI(src));
    a.preload = "auto";
    const rawVolume = Number(options.volume ?? getEffectsVolume());
    a.volume = clamp(Number.isFinite(rawVolume) ? rawVolume : getEffectsVolume(), 0, 2.5);
    a.currentTime = 0;
    const result = a.play();
    if (result && typeof result.catch === "function") {
      result.catch(error => {
        console.warn("[audio] falha ao tocar", name, src, error);
        showMessage("SOM INDISPONIVEL: " + name);
      });
    }
    soundCache[name] = a;
    return a;
  } catch (error) {
    console.error("[audio] erro ao tocar", name, src, error);
    return null;
  }
}

function preloadSounds() {
  Object.keys(SOUNDS).forEach(name => {
    try {
      const a = new Audio(encodeURI(SOUNDS[name]));
      a.preload = "auto";
      a.volume = getEffectsVolume();
      soundCache[name] = a;
      a.addEventListener("error", () => console.warn("[audio] erro carregando", name, SOUNDS[name]));
    } catch (error) {
      console.warn("[audio] nao foi possivel precarregar", name, SOUNDS[name], error);
    }
  });
}

const merchant = { x: CONFIG.merchantX, y: CONFIG.merchantY, name: "MERCANTE" };
function merchantDistance() { return Math.hypot(player.x - merchant.x, player.y - merchant.y); }
function isNearMerchant() { return merchantDistance() <= CONFIG.merchantInteractRange; }

function refreshSkillUI() {
  const f = document.getElementById("skillFire");
  const r = document.getElementById("skillRepel");
  if (f) f.classList.toggle("active", !!player.owned.fireSword);
  if (r) r.classList.toggle("active", !!player.owned.repelSheath);
  const fs = document.getElementById("skillFireState");
  const rs = document.getElementById("skillRepelState");
  if (fs) fs.textContent = player.owned.fireSword ? (player.skills.fireSword ? "EQUIPADA" : "EQUIPAR") : `COMPRAR — ${CONFIG.skillFireCost} MOEDAS`;
  if (rs) rs.textContent = player.owned.repelSheath ? (player.skills.repelSheath ? "EQUIPADA" : "EQUIPAR") : `COMPRAR — ${CONFIG.skillRepelCost} MOEDAS`;
  const item = document.getElementById("itemMelador");
  const itemState = document.getElementById("itemMeladorState");
  if (item) item.classList.toggle("active", player.inventory.melador > 0);
  if (itemState) itemState.textContent = player.inventory.melador > 0
    ? `NO INVENTÁRIO: ${player.inventory.melador}` : `COMPRAR — ${CONFIG.meladorCost} MOEDAS`;
  const bomb = document.getElementById("itemFireBomb");
  const bombState = document.getElementById("itemFireBombState");
  if (bomb) bomb.classList.toggle("active", player.inventory.fireBomb > 0);
  if (bombState) bombState.textContent = player.inventory.fireBomb > 0
    ? `NO INVENTÁRIO: ${player.inventory.fireBomb}` : `COMPRAR — ${CONFIG.fireBombCost} MOEDAS`;
  const mc = document.getElementById("merchantCoins");
  if (mc) mc.textContent = String(player.coins);
}

function toggleInventory(show) {
  const shouldOpen = typeof show === "boolean" ? show : !inventoryOpen;
  const wasOpen = inventoryOpen;
  inventoryOpen = shouldOpen;
  const overlay = document.getElementById("inventoryOverlay");
  if (overlay) overlay.classList.toggle("hidden", !inventoryOpen);
  if (inventoryOpen && !wasOpen) playSound("openbag");
  if (inventoryOpen) refreshInventoryUI();
}

function refreshInventoryUI() {
  const list = document.getElementById("inventoryList");
  const message = document.getElementById("inventoryMessage");
  if (!list) return;
  list.innerHTML = "";
  [
    { key: "melador", label: "MELADOR", count: player.inventory.melador },
    { key: "fireBomb", label: "BOMBA DE FOGO", count: player.inventory.fireBomb }
  ].forEach(entry => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "inventory-item" + (player.selectedItem === entry.key ? " active" : "") + (entry.count ? "" : " disabled");
    item.textContent = `${entry.label} × ${entry.count}${player.selectedItem === entry.key ? " — ATIVO" : ""}`;
    item.addEventListener("click", () => { if (entry.count) { player.selectedItem = entry.key; refreshInventoryUI(); } });
    list.appendChild(item);
  });
  if (message) message.textContent = "Selecione um item ativo e pressione F para usar.";
}

function useSelectedItem() {
  if (player.selectedItem === "fireBomb" && player.inventory.fireBomb) {
    playSound("bomba");
    createFireBombZone(performance.now());
    player.inventory.fireBomb--;
    showMessage("BOMBA DE FOGO LANÇADA");
    refreshInventoryUI();
    refreshSkillUI();
    return;
  }
  if (player.selectedItem !== "melador" || !player.inventory.melador) {
    showMessage("NENHUM ITEM DISPONÍVEL");
    return;
  }
  if (player.hp >= player.maxHp) { showMessage("VIDA JÁ ESTÁ CHEIA"); return; }
  player.hp = Math.min(player.maxHp, player.hp + player.maxHp * CONFIG.meladorHealPercent);
  player.inventory.melador--;
  showMessage("MELADOR USADO: +25% VIDA");
  refreshInventoryUI();
  refreshSkillUI();
}

function buyMelador() {
  if (player.coins < CONFIG.meladorCost) { showMessage(`MOEDAS INSUFICIENTES (${CONFIG.meladorCost})`); return; }
  player.coins -= CONFIG.meladorCost;
  player.inventory.melador++;
  player.selectedItem = "melador";
  showMessage("MELADOR COMPRADO");
  refreshSkillUI();
}

function buyFireBomb() {
  if (player.coins < CONFIG.fireBombCost) { showMessage(`MOEDAS INSUFICIENTES (${CONFIG.fireBombCost})`); return; }
  player.coins -= CONFIG.fireBombCost;
  player.inventory.fireBomb++;
  player.selectedItem = "fireBomb";
  showMessage("BOMBA DE FOGO COMPRADA");
  refreshSkillUI();
}

function toggleLevelUp(show) {
  const overlay = document.getElementById("levelUpOverlay");
  if (overlay) overlay.classList.toggle("hidden", !show);
  if (show) {
    ["health", "attack", "speed", "stamina"].forEach(key => {
      const el = document.getElementById(`upgrade${key[0].toUpperCase()}${key.slice(1)}Squares`);
      if (el) el.textContent = "■".repeat(player.upgrades[key]) + "□".repeat(5 - player.upgrades[key]);
    });
  }
}

function chooseUpgrade(key) {
  if (player.upgrades[key] >= 5) { showMessage("LIMITE DESTE ATRIBUTO ATINGIDO"); return; }
  player.upgrades[key]++;
  player.statMultipliers[key] *= 1.1;
  if (key === "health") {
    player.maxHp = CONFIG.maxHp * player.statMultipliers.health;
    player.hp = Math.min(player.maxHp, player.hp + CONFIG.maxHp * 0.1);
  }
  if (key === "stamina") {
    const oldMax = player.maxStamina;
    player.maxStamina = CONFIG.maxStamina * player.statMultipliers.stamina;
    player.stamina = Math.min(player.maxStamina, player.stamina + (player.maxStamina - oldMax));
  }
  playSound("xp");
  player.level++;
  player.xp = 0;
  levelUpOpen = false;
  toggleLevelUp(false);
  showMessage(`${key.toUpperCase()} +10%`);
}

function skillStateText(key, cost) {
  if (!player.owned[key]) return `COMPRAR — ${cost} MOEDAS`;
  return player.skills[key] ? "EQUIPADA" : "EQUIPAR";
}

function buyOrToggleSkill(key, cost, name) {
  if (!player.owned[key]) {
    if (player.coins < cost) { showMessage(`MOEDAS INSUFICIENTES (${cost})`); refreshSkillUI(); return; }
    player.coins -= cost;
    player.owned[key] = true;
    player.skills[key] = true;
    showMessage(`${name} COMPRADA!`);
  } else {
    player.skills[key] = !player.skills[key];
    showMessage(player.skills[key] ? `${name} EQUIPADA` : `${name} REMOVIDA`);
  }
  refreshSkillUI();
}

function toggleMerchant(show) {
  merchantOpen = typeof show === "boolean" ? show : !merchantOpen;
  const overlay = document.getElementById("merchantOverlay");
  if (overlay) overlay.classList.toggle("hidden", !merchantOpen);
  if (merchantOpen) { playSound("merchant"); refreshSkillUI(); }
}

document.getElementById("restartButton").addEventListener("click", resetGame);
document.getElementById("pauseButton").addEventListener("click", () => togglePause());
document.getElementById("settingsButton").addEventListener("click", () => { if (!paused) toggleSettings(); });
document.getElementById("resumeButton").addEventListener("click", () => togglePause(false));
document.getElementById("pauseSettingsButton").addEventListener("click", () => { togglePause(false); toggleSettings(true); });
document.getElementById("closeSettingsButton").addEventListener("click", () => toggleSettings(false));
document.querySelectorAll('input[name="attackMode"]').forEach(r => r.addEventListener("change", e => setAttackControlMode(e.target.value)));
document.getElementById("debugToggle").addEventListener("change", e => setDebug(e.target.checked));
document.getElementById("closeMerchantButton").addEventListener("click", () => toggleMerchant(false));
document.getElementById("skillFire").addEventListener("click", () => buyOrToggleSkill("fireSword", CONFIG.skillFireCost, "ESPADA DE FOGO"));
document.getElementById("skillRepel").addEventListener("click", () => buyOrToggleSkill("repelSheath", CONFIG.skillRepelCost, "REPULSÃO APRIMORADA"));
document.getElementById("itemMelador").addEventListener("click", buyMelador);
document.getElementById("itemFireBomb").addEventListener("click", buyFireBomb);
document.getElementById("closeInventoryButton").addEventListener("click", () => toggleInventory(false));
document.querySelectorAll("[data-upgrade]").forEach(button => button.addEventListener("click", () => chooseUpgrade(button.getAttribute("data-upgrade"))));

const zoomSlider = document.getElementById("zoomRange");
if (zoomSlider) {
  zoomSlider.min = String(Math.round(CONFIG.zoomMin * 100));
  zoomSlider.max = String(Math.round(CONFIG.zoomMax * 100));
  zoomSlider.step = "5";
  zoomSlider.addEventListener("input", e => setZoom(Number(e.target.value) / 100));
  zoomSlider.addEventListener("change", e => setZoom(Number(e.target.value) / 100));
}

const musicVolumeSlider = document.getElementById("musicVolumeRange");
if (musicVolumeSlider) {
  musicVolumeSlider.addEventListener("input", e => setMusicVolume(e.target.value));
  musicVolumeSlider.addEventListener("change", e => setMusicVolume(e.target.value));
}

Input.init();
CONFIG.attackControlMode = getAttackControlMode();
setDebug(getDebug());
CONFIG.zoom = getZoom();
CONFIG.musicVolume = getMusicVolume();
CONFIG.effectsVolume = getEffectsVolume();
setZoom(CONFIG.zoom);
setMusicVolume(CONFIG.musicVolume);
ensureEffectsVolume();
setEffectsVolume(CONFIG.effectsVolume);
preloadSounds();
syncSettingsUI();
updateControlText();
resize();
resetGame();

function startGame() {
  if (gameStarted) return;
  gameStarted = true;
  const overlay = document.getElementById("startOverlay");
  if (overlay) overlay.classList.add("hidden");
  paused = false;
  lastTime = 0;
  startMusic();
  // Keep the first play() in the PLAY click handler for autoplay policies.
  musicState.audio.src = encodeURI(MUSIC_TRACKS[0]);
  musicState.audio.volume = musicState.volume;
  const playPromise = musicState.audio.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.then(() => { musicState.playBlocked = false; })
      .catch(() => {
        musicState.playBlocked = true;
        setMusicStatus("Música bloqueada pelo navegador. Clique PLAY novamente.", true);
      });
  }
  musicState.index = 1;
}

document.getElementById("playButton").addEventListener("click", startGame);
document.getElementById("runtimeErrorDismissButton").addEventListener("click", () => {
  const overlay = document.getElementById("runtimeErrorOverlay");
  if (overlay) overlay.classList.add("hidden");
});
requestAnimationFrame(gameLoop);
