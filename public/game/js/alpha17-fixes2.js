(() => {
  // Extensoes Alpha 1.7: area de pesca visivel, som de troca de arma,
  // chefe invocador a partir da onda 7 e modal da musica atual.
  const ROD_AREA = { minX: 82, maxX: 94, minY: 80, maxY: 94 };
  const SUMMON_BOSS_INTERVAL = 9000;
  const SUMMON_MINIONS = 3;
  let lastSummonBossWave = 0;
  let musicModal;

  function ensureMusicModal() {
    if (musicModal) return musicModal;
    musicModal = document.createElement('div');
    musicModal.id = 'sunwalkerNowPlaying';
    musicModal.style.cssText = 'position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:10001;min-width:280px;max-width:80vw;padding:10px 16px;background:rgba(12,14,15,.92);border:1px solid rgba(210,190,130,.75);border-radius:7px;color:#f4ead0;text-align:center;font:600 13px Arial;letter-spacing:.6px;box-shadow:0 8px 28px rgba(0,0,0,.45);opacity:0;transition:opacity .25s ease;pointer-events:none';
    document.body.appendChild(musicModal);
    return musicModal;
  }

  function showNowPlaying() {
    if (typeof musicState === 'undefined' || !musicState.audio || !musicState.audio.src) return;
    let name = decodeURIComponent(musicState.audio.src.split('/').pop() || '').replace(/\.[^.]+$/, '');
    const el = ensureMusicModal();
    el.textContent = `♫ TOCANDO AGORA — ${name}`;
    el.style.opacity = '1';
    clearTimeout(showNowPlaying.hideTimer);
    showNowPlaying.hideTimer = setTimeout(() => { el.style.opacity = '0'; }, 4200);
  }

  window.addEventListener('keydown', event => {
    if (event.key.toLowerCase() !== 'r' || event.repeat) return;
    try {
      const audio = new Audio(encodeURI('assets/sfx/mudançaarma.mp3'));
      audio.volume = typeof CONFIG !== 'undefined' ? (Number(CONFIG.effectsVolume) || 0.6) : 0.6;
      audio.play().catch(() => {});
    } catch (_) {}
  }, { capture: true });

  function drawFishingMarker() {
    if (typeof ctx === 'undefined' || typeof Camera === 'undefined') return;
    const cx = (ROD_AREA.minX + ROD_AREA.maxX) / 2;
    const cy = (ROD_AREA.minY + ROD_AREA.maxY) / 2;
    const s = Camera.worldToScreen(cx, cy);
    const now = performance.now();
    const pulse = 0.8 + Math.sin(now / 280) * 0.2;
    const tileW = Number(CONFIG.TILE_WIDTH) || 48;
    const tileH = Number(CONFIG.TILE_HEIGHT) || 24;
    const w = Math.abs(ROD_AREA.maxX - ROD_AREA.minX) * tileW * 0.62;
    const h = Math.abs(ROD_AREA.maxY - ROD_AREA.minY) * tileH * 0.62;
    ctx.save();
    ctx.globalAlpha = 0.86;
    ctx.fillStyle = 'rgba(42,103,116,.82)';
    ctx.strokeStyle = `rgba(190,231,218,${pulse})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, Math.max(110, w), Math.max(55, h), 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 0.5;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(s.x - w * .75, s.y + i * 13 + Math.sin(now / 250 + i) * 3);
      ctx.quadraticCurveTo(s.x, s.y + i * 13 - 5, s.x + w * .75, s.y + i * 13);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#f5e4ad';
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('AREA DE PESCA', s.x, s.y - Math.max(65, h) - 16);
    ctx.font = 'bold 11px Arial';
    ctx.fillText('ESPACO • PESCAR', s.x, s.y + Math.max(55, h) + 18);
    ctx.restore();
  }

  function spawnSummonerMinions(boss, now) {
    if (!boss || boss.isDead() || typeof Enemy !== 'function') return;
    boss.summonPulseEnd = now + 900;
    for (let i = 0; i < SUMMON_MINIONS; i++) {
      const angle = (Math.PI * 2 * i) / SUMMON_MINIONS;
      const m = new Enemy(boss.x + Math.cos(angle) * 1.1, boss.y + Math.sin(angle) * 1.1, ++enemyId, false, 'common');
      m.isSummonedMinion = true;
      m.summonedBy = boss.id;
      m.summonBorn = now;
      m.summonScale = 0.70;
      m.speedMultiplier = (m.speedMultiplier || 1) * 1.40;
      enemies.push(m);
    }
    if (typeof showMessage === 'function') showMessage('CHEFAO ROSA: 3 SERVOS INVOCADOS!');
  }

  function updateSummonerBoss() {
    if (typeof enemies === 'undefined' || typeof waveCounter === 'undefined' || waveCounter < 7) return;
    const boss = enemies.find(e => e.isBoss && e.type === 'summonerBoss' && !e.isDead());
    if (!boss) return;
    const now = performance.now();
    if (!boss.nextSummonAt) boss.nextSummonAt = now + 2500;
    if (now >= boss.nextSummonAt) {
      spawnSummonerMinions(boss, now);
      boss.nextSummonAt = now + SUMMON_BOSS_INTERVAL;
    }
  }

  function drawSummonerBossEffects() {
    if (typeof enemies === 'undefined' || typeof ctx === 'undefined' || typeof Camera === 'undefined') return;
    const now = performance.now();
    for (const e of enemies) {
      if (e.isDead()) continue;
      const s = Camera.worldToScreen(e.x, e.y);
      if (e.type === 'summonerBoss') {
        ctx.save();
        ctx.fillStyle = '#f06a9a';
        ctx.strokeStyle = '#ffd1df';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(s.x, s.y - 27, 14 * (Number(CONFIG.zoom) || 1), 18 * (Number(CONFIG.zoom) || 1), 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff0f5';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('INVOCADOR', s.x, s.y - 54);
        if (e.summonPulseEnd && now < e.summonPulseEnd) {
          const p = 1 - (e.summonPulseEnd - now) / 900;
          ctx.strokeStyle = `rgba(255,140,190,${1 - p})`;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(s.x, s.y - 10, 18 + p * 52, 0, Math.PI * 2);
          ctx.stroke();
          for (let i = 0; i < 10; i++) {
            const a = i * Math.PI * 2 / 10 - p * 2;
            const r = 12 + p * 48;
            ctx.fillStyle = `rgba(255,190,215,${1 - p})`;
            ctx.fillRect(s.x + Math.cos(a) * r - 2, s.y - 10 + Math.sin(a) * r - 2, 4, 4);
          }
        }
      }
      if (e.isSummonedMinion && now - e.summonBorn < 650) {
        const p = Math.min(1, (now - e.summonBorn) / 650);
        ctx.save();
        ctx.strokeStyle = `rgba(255,190,215,${1 - p})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(s.x, s.y - 10, 8 + p * 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  function ensureSummonerBoss() {
    if (typeof waveCounter === 'undefined' || typeof enemies === 'undefined' || typeof Enemy !== 'function') return;
    if (waveCounter < 7 || lastSummonBossWave === waveCounter) return;
    const existing = enemies.find(e => e.isBoss && e.type === 'summonerBoss' && !e.isDead());
    if (existing) { lastSummonBossWave = waveCounter; return; }
    const boss = new Enemy(76, 76, ++enemyId, true, 'summonerBoss');
    boss.waveLevel = waveCounter;
    boss.reset();
    // Este chefe nao possui a habilidade de fogo do chefe tradicional.
    boss.bossDanger = { start: Infinity, warningUntil: Infinity, end: Infinity };
    boss.nextSummonAt = performance.now() + 3000;
    enemies.push(boss);
    lastSummonBossWave = waveCounter;
    if (typeof showMessage === 'function') showMessage('ONDA 7+: NOVO CHEFAO INVOCADOR!');
  }

  const originalDrawGame = window.drawGame;
  window.drawGame = function() {
    originalDrawGame();
    drawFishingMarker();
    drawSummonerBossEffects();
  };

  setInterval(() => {
    try { ensureSummonerBoss(); updateSummonerBoss(); } catch (_) {}
  }, 120);

  window.addEventListener('playing', showNowPlaying, true);
  setInterval(showNowPlaying, 500);
})();
