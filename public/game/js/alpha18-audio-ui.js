(() => {
  // Alpha 1.8: efeitos sonoros, musica aleatoria, contador de onda, modo deus e ambientacao.
  document.title = "Sunwalker — Alpha 1.8";
  const EFFECTS = { shock: "assets/sfx/danoeletrico.mp3", bossSword: "assets/sfx/sowrdinimigo.mp3", arrow: "assets/sfx/arrow.mp3" };
  const SHOCK_DURATION = 9000;
  const GOD_KEY = "sunwalker_god_mode";
  let shockTimers = new Map();
  let lastPlayerDead = false;
  let lastWave = null;
  let lastMusicIndex = -1;

  function effect(name, volume = 0.7) {
    try {
      const a = new Audio(encodeURI(EFFECTS[name]));
      a.volume = Number(CONFIG.effectsVolume) || volume;
      a.currentTime = 0;
      a.play().catch(() => {});
    } catch (_) {}
  }

  const originalDamageEnemy = window.damageEnemy;
  if (typeof originalDamageEnemy === "function") {
    window.damageEnemy = function(enemy, damage, kx, ky, now, source) {
      const result = originalDamageEnemy.apply(this, arguments);
      if (source === "lightning" || (enemy && enemy.lightningUntil && enemy.lightningUntil > now)) {
        if (enemy && !enemy._alpha18ShockSound) {
          enemy._alpha18ShockSound = true;
          effect("shock", 0.65);
        }
        if (enemy) {
          enemy.lightningUntil = Math.max(enemy.lightningUntil || 0, now + SHOCK_DURATION);
          clearTimeout(shockTimers.get(enemy.id));
          shockTimers.set(enemy.id, setTimeout(() => { enemy._alpha18ShockSound = false; }, SHOCK_DURATION));
        }
      }
      return result;
    };
  }

  setInterval(() => {
    try {
      if (typeof enemies === "undefined") return;
      const now = performance.now();
      for (const enemy of enemies) {
        if (enemy.lightningUntil && enemy.lightningUntil > now) {
          if (!enemy._alpha18ShockSound) {
            enemy._alpha18ShockSound = true;
            effect("shock", 0.65);
          }
          enemy.lightningUntil = Math.max(enemy.lightningUntil, now + 1000);
          clearTimeout(shockTimers.get(enemy.id));
          shockTimers.set(enemy.id, setTimeout(() => { enemy._alpha18ShockSound = false; }, SHOCK_DURATION));
        }
      }
    } catch (_) {}
  }, 120);

  let damageHookInstalled = false;
  function installGodDamageHook() {
    if (damageHookInstalled || typeof window.receivePlayerDamage !== "function") return;
    const base = window.receivePlayerDamage;
    window.receivePlayerDamage = function(amount, enemy, now) {
      if (localStorage.getItem(GOD_KEY) === "true") {
        if (typeof player !== "undefined" && player) player.hp = player.maxHp;
        return;
      }
      const before = player && player.hp;
      const result = base.apply(this, arguments);
      if (enemy && enemy.isBoss && player && player.hp < before) effect("bossSword", 0.75);
      return result;
    };
    damageHookInstalled = true;
  }
  setInterval(installGodDamageHook, 200);
  installGodDamageHook();

  const originalUpdateEnemyCombat = window.updateEnemyCombat;
  if (typeof originalUpdateEnemyCombat === "function") {
    window.updateEnemyCombat = function(enemy, now) {
      const beforePhase = enemy && enemy.attackPhase;
      const result = originalUpdateEnemyCombat.apply(this, arguments);
      if (enemy && enemy.type === "archer" && beforePhase === "windup" && enemy.attackPhase === "strike") effect("arrow", 0.7);
      return result;
    };
  }

  function chooseRandomMusicIndex() {
    try {
      const total = Array.isArray(MUSIC_TRACKS) ? MUSIC_TRACKS.length : 0;
      if (!total) return;
      if (total === 1) { musicState.index = 0; lastMusicIndex = 0; return; }
      let next = Math.floor(Math.random() * total);
      if (next === lastMusicIndex) next = (next + 1 + Math.floor(Math.random() * (total - 1))) % total;
      lastMusicIndex = next;
      musicState.index = next;
    } catch (_) {}
  }

  setInterval(() => {
    try {
      if (!musicState.audio || musicState.audio.paused || !musicState.audio.duration) return;
      if (musicState.audio.duration - musicState.audio.currentTime < 1.5) chooseRandomMusicIndex();
    } catch (_) {}
  }, 250);

  setInterval(() => {
    try {
      if (typeof player === "undefined") return;
      const dead = player.isDead();
      if (dead && !lastPlayerDead) {
        chooseRandomMusicIndex();
        if (musicState.audio) {
          musicState.audio.pause();
          musicState.audio.currentTime = 0;
          if (typeof playNextMusicTrack === "function") playNextMusicTrack();
        }
      }
      lastPlayerDead = dead;
    } catch (_) {}
  }, 100);

  // Mantem o aviso da musica pequeno e fixo no canto inferior esquerdo.
  function styleMusicModal() {
    const el = document.getElementById("sunwalkerNowPlaying");
    if (!el) return;
    el.style.top = "auto";
    el.style.left = "18px";
    el.style.bottom = "18px";
    el.style.transform = "none";
    el.style.minWidth = "0";
    el.style.maxWidth = "260px";
    el.style.width = "auto";
    el.style.padding = "6px 10px";
    el.style.fontSize = "10px";
    el.style.letterSpacing = ".35px";
    el.style.textAlign = "left";
    el.style.borderRadius = "5px";
    el.style.opacity = el.style.opacity || "0";
  }
  setInterval(styleMusicModal, 250);

  // Status das habilidades compradas.
  function createSkillStatus() {
    if (document.getElementById("alpha18SkillStatus")) return;
    const el = document.createElement("div");
    el.id = "alpha18SkillStatus";
    el.style.cssText = "position:fixed;left:18px;top:18px;z-index:10004;display:flex;gap:7px;flex-direction:column;pointer-events:none;font:700 11px Arial;letter-spacing:.5px;";
    document.body.appendChild(el);
  }
  function refreshSkillStatus() {
    createSkillStatus();
    const el = document.getElementById("alpha18SkillStatus");
    if (!el) return;
    const lightning = localStorage.getItem("sunwalker_lightning_sword") === "true";
    const ally = localStorage.getItem("sunwalker_ally_sheath") === "true";
    const items = [];
    if (lightning) items.push("⚡ ESPADA RELÂMPAGO  • ATIVA");
    if (ally) items.push("🔵 BAINHA DE CONVERSÃO  • ATIVA");
    el.innerHTML = items.map(text => `<div style="padding:7px 10px;background:rgba(8,12,16,.88);border:1px solid rgba(200,220,235,.75);border-radius:6px;color:#f5ead0;box-shadow:0 3px 12px rgba(0,0,0,.4)">${text}</div>`).join("");
  }
  setInterval(refreshSkillStatus, 300);
  refreshSkillStatus();

  // Modo Deus para testes: vida e dinheiro infinitos, protegido por senha FTK.
  function isGodMode() { return localStorage.getItem(GOD_KEY) === "true"; }
  function refreshGodResources() {
    if (!isGodMode() || typeof player === "undefined" || !player) return;
    player.hp = player.maxHp;
    player.coins = 999999;
  }

  function ensureGodModeUI() {
    const settings = document.querySelector("#settingsOverlay .settings-modal");
    if (!settings || document.getElementById("godModeSetting")) return;
    const group = document.createElement("div");
    group.id = "godModeSetting";
    group.className = "setting-group";
    group.innerHTML = `
      <h3>MODO DEUS — TESTES</h3>
      <p style="margin:6px 0;color:#bdb7a8;font-size:12px">Vida infinita e dinheiro infinito para testes da Alpha.</p>
      <div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap">
        <input id="godModePassword" type="password" maxlength="3" placeholder="Senha" autocomplete="off" style="width:90px;padding:7px">
        <button id="godModeActivate" type="button">ATIVAR</button>
        <button id="godModeDeactivate" type="button" style="display:none">DESATIVAR</button>
      </div>
      <div id="godModeStatus" style="margin-top:7px;font-size:12px"></div>
    `;
    const debugGroup = [...settings.querySelectorAll(".setting-group")].find(el => /DEBUG/i.test(el.textContent));
    if (debugGroup) settings.insertBefore(group, debugGroup);
    else settings.insertBefore(group, settings.lastElementChild);

    const password = group.querySelector("#godModePassword");
    const activate = group.querySelector("#godModeActivate");
    const deactivate = group.querySelector("#godModeDeactivate");
    const status = group.querySelector("#godModeStatus");

    function updateUI() {
      const active = isGodMode();
      status.textContent = active ? "MODO DEUS: ATIVO" : "MODO DEUS: DESATIVADO";
      status.style.color = active ? "#7ee787" : "#bdb7a8";
      activate.style.display = active ? "none" : "inline-block";
      password.style.display = active ? "none" : "inline-block";
      deactivate.style.display = active ? "inline-block" : "none";
    }
    activate.addEventListener("click", () => {
      if (password.value.trim().toUpperCase() !== "FTK") {
        status.textContent = "SENHA INCORRETA";
        status.style.color = "#e06c75";
        password.focus();
        return;
      }
      localStorage.setItem(GOD_KEY, "true");
      password.value = "";
      refreshGodResources();
      updateUI();
    });
    password.addEventListener("keydown", e => { if (e.key === "Enter") activate.click(); });
    deactivate.addEventListener("click", () => {
      localStorage.removeItem(GOD_KEY);
      updateUI();
    });
    updateUI();
  }

  setInterval(() => { ensureGodModeUI(); refreshGodResources(); }, 250);
  ensureGodModeUI();

  // Vegetacao seca e ossos humanos: desenhados depois do piso e antes das entidades.
  const scenery = [
    { type: "cactus", x: 9, y: 13, scale: 1.0 }, { type: "cactus", x: 22, y: 78, scale: .82 },
    { type: "cactus", x: 36, y: 20, scale: 1.15 }, { type: "cactus", x: 67, y: 13, scale: .9 },
    { type: "cactus", x: 87, y: 34, scale: 1.0 }, { type: "cactus", x: 91, y: 70, scale: .75 },
    { type: "cactus", x: 61, y: 88, scale: 1.08 }, { type: "cactus", x: 13, y: 55, scale: .72 },
    { type: "bone", x: 16, y: 27, rot: .25, scale: 1.0 }, { type: "bone", x: 31, y: 66, rot: -.5, scale: .8 },
    { type: "bone", x: 47, y: 11, rot: .8, scale: .9 }, { type: "bone", x: 55, y: 57, rot: -.2, scale: 1.05 },
    { type: "bone", x: 73, y: 76, rot: .45, scale: .85 }, { type: "bone", x: 82, y: 17, rot: -1.0, scale: .75 },
    { type: "bone", x: 94, y: 53, rot: .15, scale: 1.0 }, { type: "bone", x: 40, y: 91, rot: -.75, scale: .9 }
  ];

  function drawScenery() {
    if (typeof ctx === "undefined" || typeof Camera === "undefined") return;
    const now = performance.now();
    for (const obj of scenery) {
      const s = Camera.worldToScreen(obj.x, obj.y);
      if (s.x < -80 || s.x > canvas.width + 80 || s.y < -100 || s.y > canvas.height + 100) continue;
      const sc = (obj.scale || 1) * (Number(CONFIG.zoom) || 1);
      ctx.save();
      ctx.translate(s.x, s.y);
      if (obj.type === "cactus") {
        ctx.fillStyle = "#31563a";
        ctx.strokeStyle = "#182c1d";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-5 * sc, -38 * sc, 10 * sc, 40 * sc, 5 * sc);
        ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.roundRect(-19 * sc, -28 * sc, 10 * sc, 6 * sc, 3 * sc);
        ctx.roundRect(9 * sc, -20 * sc, 10 * sc, 6 * sc, 3 * sc);
        ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-14 * sc, -28 * sc); ctx.lineTo(-14 * sc, -17 * sc);
        ctx.moveTo(14 * sc, -20 * sc); ctx.lineTo(14 * sc, -8 * sc);
        ctx.stroke();
        ctx.strokeStyle = "rgba(205,220,170,.5)";
        ctx.lineWidth = 1;
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath(); ctx.moveTo(-2 * sc, (-32 + i * 6) * sc); ctx.lineTo(2 * sc, (-30 + i * 6) * sc); ctx.stroke();
        }
      } else {
        ctx.rotate(obj.rot || 0);
        ctx.strokeStyle = "#d7c7a5";
        ctx.fillStyle = "#c7b894";
        ctx.lineWidth = 3 * sc;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-18 * sc, 0); ctx.lineTo(15 * sc, 0);
        ctx.moveTo(-7 * sc, -1 * sc); ctx.lineTo(-12 * sc, -8 * sc);
        ctx.moveTo(3 * sc, 1 * sc); ctx.lineTo(8 * sc, 8 * sc);
        ctx.stroke();
        ctx.lineWidth = 2 * sc;
        ctx.beginPath();
        ctx.arc(-18 * sc, 0, 3 * sc, 0, Math.PI * 2);
        ctx.arc(15 * sc, 0, 3 * sc, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  let mapWrapped = false;
  function installSceneryHook() {
    if (mapWrapped || typeof window.drawMap !== "function") return;
    const baseMap = window.drawMap;
    window.drawMap = function() {
      baseMap.apply(this, arguments);
      drawScenery();
    };
    mapWrapped = true;
  }
  setInterval(installSceneryHook, 100);
  installSceneryHook();

  // Restaura o contador no layout antigo do HUD.
  function ensureWaveCounter() {
    const el = document.getElementById("waveStatus");
    if (!el) return null;
    const number = document.getElementById("nextWaveNumber");
    const countdown = document.getElementById("waveCountdown");
    if (typeof waveCounter !== "undefined" && number) number.textContent = String(waveCounter + 1);
    if (typeof waveCounter !== "undefined" && countdown && typeof nextRespawnAt !== "undefined") {
      const seconds = Math.max(0, Math.ceil((nextRespawnAt - performance.now()) / 1000));
      countdown.textContent = `${seconds}s`;
    }
    return el;
  }
  setInterval(() => {
    try {
      const el = ensureWaveCounter();
      if (!el) return;
      if (typeof waveCounter !== "undefined" && waveCounter !== lastWave) {
        lastWave = waveCounter;
        const number = document.getElementById("nextWaveNumber");
        if (number) number.textContent = String(waveCounter + 1);
      }
    } catch (_) {}
  }, 250);
  ensureWaveCounter();
})();
