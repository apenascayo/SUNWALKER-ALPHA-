(() => {
  // Alpha 1.8: efeitos sonoros de combate, musica aleatoria, contador de onda e feedback visual das habilidades.
  document.title = "Sunwalker — Alpha 1.8";
  const EFFECTS = { shock: "assets/sfx/danoeletrico.mp3", bossSword: "assets/sfx/sowrdinimigo.mp3", arrow: "assets/sfx/arrow.mp3" };
  const SHOCK_DURATION = 9000;
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

  // O choque permanece marcado por 9 segundos.
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

  const originalReceiveDamage = window.receivePlayerDamage;
  if (typeof originalReceiveDamage === "function") {
    window.receivePlayerDamage = function(amount, enemy, now) {
      const before = player && player.hp;
      const result = originalReceiveDamage.apply(this, arguments);
      if (enemy && enemy.isBoss && player && player.hp < before) effect("bossSword", 0.75);
      return result;
    };
  }

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
      if (total === 1) {
        musicState.index = 0;
        return;
      }
      let next = Math.floor(Math.random() * total);
      if (next === lastMusicIndex) next = (next + 1 + Math.floor(Math.random() * (total - 1))) % total;
      lastMusicIndex = next;
      musicState.index = next;
    } catch (_) {}
  }

  // Mantem a proxima faixa aleatoria. O controlador de musica usa o indice escolhido quando a faixa termina.
  setInterval(() => {
    try {
      if (!musicState.audio || musicState.audio.paused || !musicState.audio.duration) return;
      if (musicState.audio.duration - musicState.audio.currentTime < 1.5) chooseRandomMusicIndex();
    } catch (_) {}
  }, 250);

  // Ao morrer: para imediatamente a musica atual, escolhe outra faixa e inicia a nova ordem.
  setInterval(() => {
    try {
      if (typeof player === "undefined") return;
      const dead = player.isDead();
      if (dead && !lastPlayerDead) {
        chooseRandomMusicIndex();
        if (musicState.audio) {
          musicState.audio.pause();
          musicState.audio.currentTime = 0;
          // Inicia imediatamente a nova faixa; nao espera o evento 'ended'.
          if (typeof playNextMusicTrack === "function") playNextMusicTrack();
        }
      }
      lastPlayerDead = dead;
    } catch (_) {}
  }, 100);

  // Feedback das habilidades compradas.
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

  // Restaura o contador no layout antigo do HUD. Nao altera position/z-index para nao disputar com a musica.
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
