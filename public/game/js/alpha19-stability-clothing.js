(() => {
  // Alpha 2.0: estabilidade adicional. Um estado quebrado de um ator não pode parar o loop inteiro.
  const STUCK_PLAYER_MS = 900;
  const STUCK_ENEMY_MS = 1500;
  let deathMusicHandled = false;
  let lastPlayerX = null, lastPlayerY = null, playerStillSince = 0;
  const enemyStill = new Map();

  function movementInputActive() {
    return typeof Input !== "undefined" && (Input.down("w") || Input.down("a") || Input.down("s") || Input.down("d"));
  }

  function clampActor(entity, fallbackX, fallbackY) {
    if (!entity) return;
    if (!Number.isFinite(entity.x)) entity.x = fallbackX;
    if (!Number.isFinite(entity.y)) entity.y = fallbackY;
    entity.x = Math.max(0.15, Math.min(CONFIG.MAP_WIDTH - 0.15, entity.x));
    entity.y = Math.max(0.15, Math.min(CONFIG.MAP_HEIGHT - 0.15, entity.y));
  }

  function stabilityTick() {
    try {
      if (typeof player === "undefined" || !player || typeof performance === "undefined") return;
      const now = performance.now();
      if (player.isDead()) {
        if (!deathMusicHandled) {
          deathMusicHandled = true;
          if (typeof window.sunwalkerRestartMusicRandom === "function") window.sunwalkerRestartMusicRandom();
        }
      } else {
        deathMusicHandled = false;
      }
      const gameBlocked = typeof paused !== "undefined" && (paused || merchantOpen || inventoryOpen || levelUpOpen || settingsOpen);
      if (!gameBlocked && !player.isDead()) {
        if (lastPlayerX === null) { lastPlayerX = player.x; lastPlayerY = player.y; playerStillSince = now; }
        const moved = Math.hypot(player.x - lastPlayerX, player.y - lastPlayerY);
        if (moved > 0.01) playerStillSince = now;
        lastPlayerX = player.x; lastPlayerY = player.y;

        if (movementInputActive() && !player.attack && !player.isDefending() && now - playerStillSince > STUCK_PLAYER_MS) {
          player.state = "idle";
          player.attack = null;
          player.attackCooldownUntil = Math.min(player.attackCooldownUntil || 0, now);
          player.dashUntil = 0;
          playerStillSince = now;
        }
      }

      if (!Array.isArray(enemies)) return;
      for (const enemy of enemies) {
        if (!enemy || enemy.isDead()) continue;
        try {
          clampActor(enemy, Number.isFinite(enemy.spawnX) ? enemy.spawnX : 50, Number.isFinite(enemy.spawnY) ? enemy.spawnY : 50);
          if (!enemyStill.has(enemy.id)) enemyStill.set(enemy.id, { x: enemy.x, y: enemy.y, at: now });
          const watch = enemyStill.get(enemy.id);
          const moved = Math.hypot(enemy.x - watch.x, enemy.y - watch.y);
          if (moved > 0.01) { watch.x = enemy.x; watch.y = enemy.y; watch.at = now; }
          if (!gameBlocked && enemy.state === "chasing" && !enemy.attackPhase && now - watch.at > STUCK_ENEMY_MS) {
            enemy.state = "chasing";
            enemy.attackPhase = null;
            enemy.hurtUntil = 0;
            enemy.stunnedUntil = 0;
            const dx = player.x - enemy.x, dy = player.y - enemy.y;
            const dist = Math.hypot(dx, dy) || 1;
            enemy.x += (dx / dist) * 0.04;
            enemy.y += (dy / dist) * 0.04;
            watch.at = now;
            watch.x = enemy.x;
            watch.y = enemy.y;
          }
        } catch (error) {
          console.warn("[stability] NPC recuperado", error);
          enemy.attackPhase = null;
          enemy.hurtUntil = 0;
          enemy.stunnedUntil = 0;
          enemy.state = "chasing";
        }
      }
    } catch (error) {
      console.warn("[stability] watchdog ignorou erro", error);
    }
  }

  setInterval(stabilityTick, 250);
  window.sunwalkerAlpha19Stability = stabilityTick;
})();
