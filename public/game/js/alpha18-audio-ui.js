(() => {
  // Alpha 1.8: efeitos sonoros de combate, musica aleatoria e feedback visual das habilidades.
  document.title = "Sunwalker — Alpha 1.8";
  const EFFECTS = { shock: "assets/sfx/danoeletrico.mp3", bossSword: "assets/sfx/sowrdinimigo.mp3", arrow: "assets/sfx/arrow.mp3" };
  const SHOCK_DURATION = 9000;
  let shockTimers = new Map();
  let lastPlayerDead = false;
  let lastWave = null;

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

  // O efeito visual/dano de choque da habilidade e mantido por 9 segundos.
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
          // Renova em blocos de 1s para impedir que a duracao original de 3s encerre o efeito.
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

  // Proxima musica de batalha: indice aleatorio perto do final da faixa.
  setInterval(() => {
    try {
      if (!musicState.audio || musicState.audio.paused || !musicState.audio.duration) return;
      if (musicState.audio.duration - musicState.audio.currentTime < 1.2) {
        musicState.index = Math.floor(Math.random() * MUSIC_TRACKS.length);
      }
    } catch (_) {}
  }, 250);

  // Ao morrer, reinicia a musica e escolhe outro ponto da lista.
  setInterval(() => {
    try {
      if (typeof player === "undefined") return;
      const dead = player.isDead();
      if (dead && !lastPlayerDead) {
        musicState.index = Math.floor(Math.random() * MUSIC_TRACKS.length);
        if (musicState.audio) {
          musicState.audio.pause();
          musicState.audio.currentTime = 0;
        }
      }
      lastPlayerDead = dead;
    } catch (_) {}
  }, 150);

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

  function ensureWaveCounter() {
    let el = document.getElementById("waveStatus");
    if (!el) {
      el = document.createElement("div");
      el.id = "waveStatus";
      document.body.appendChild(el);
    }
    el.style.cssText = "position:fixed;right:18px;top:18px;z-index:10002;padding:8px 12px;background:rgba(10,10,10,.88);border:1px solid rgba(220,190,120,.8);border-radius:6px;color:#f4ead0;font:700 14px Arial;letter-spacing:.8px;pointer-events:none;";
    if (typeof waveCounter !== "undefined") el.textContent = `ONDA ${waveCounter}`;
    return el;
  }

  setInterval(() => {
    try {
      const el = ensureWaveCounter();
      if (typeof waveCounter !== "undefined" && waveCounter !== lastWave) {
        el.textContent = `ONDA ${waveCounter}`;
        lastWave = waveCounter;
      }
    } catch (_) {}
  }, 250);
  ensureWaveCounter();
})();
