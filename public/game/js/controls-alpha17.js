(function installSunwalkerRollControls() {
  const originalUpdatePlayer = window.updatePlayer;
  const originalUpdatePlayerCombat = window.updatePlayerCombat;
  const originalDrawGame = window.drawGame;
  const originalUpdateHUD = window.updateHUD;
  const originalDrawCharacterBody = window.drawCharacterBody;
  const originalInputConsume = Input.consume.bind(Input);
  const originalInputDown = Input.down.bind(Input);

  let rollRequested = false;
  let spaceActionPressed = false;
  const ROLL_DURATION = 260;
  const ROLL_DISTANCE = () => (CONFIG.dashDistance || 1.6) * 1.20;

  window.addEventListener("keydown", event => {
    const key = event.key.toLowerCase();
    if (key === "shift" && !event.repeat) {
      rollRequested = true;
      event.preventDefault();
    }
    if (event.key === " ") spaceActionPressed = true;
  }, { capture: true });

  Input.down = function(k) {
    if (k === "shift" || k === " ") return false;
    return originalInputDown(k);
  };

  Input.consume = function(k) {
    if (k === "shift") return false;
    if (k === "f") {
      if (spaceActionPressed) {
        spaceActionPressed = false;
        return true;
      }
      return false;
    }
    return originalInputConsume(k);
  };

  Player.prototype.isDefending = function() { return false; };
  Player.prototype.canRun = function() { return false; };

  function beginRoll(now) {
    if (player.isDead() || player.attack || player.roll) return false;
    if (player.dashCount >= 5) {
      showMessage(`ROLAGENS BLOQUEADAS — ${Math.ceil(Math.max(0, player.dashRegenAt - now) / 1000)}s`);
      return false;
    }
    if (now < player.dashCooldownUntil) return false;

    let direction = directionVector(player.direction);
    if (typeof isAiming !== "undefined" && isAiming && typeof mouseDirection === "function") {
      player.direction = mouseDirection();
      direction = directionVector(player.direction);
    }
    const length = Math.hypot(direction.x, direction.y) || 1;
    direction = { x: direction.x / length, y: direction.y / length };

    player.roll = {
      startedAt: now,
      until: now + ROLL_DURATION,
      elapsed: 0,
      distance: ROLL_DISTANCE(),
      moved: 0,
      dirX: direction.x,
      dirY: direction.y
    };
    player.state = "rolling";
    player.isRunning = false;
    player.dashCount++;
    player.dashRegenAt = player.dashCount >= 5 ? now + 30000 : 0;
    player.dashCooldownUntil = now + CONFIG.dashCooldown;
    player.stamina = Math.max(0, player.stamina - (CONFIG.dashStaminaCost || 12));
    player.staminaRegenBlockedUntil = now + CONFIG.staminaRegenDelay;
    player.dashTrail = [];
    playSound("dash");
    return true;
  }

  window.updatePlayer = function(dt, now) {
    if (player.roll) {
      const savedDown = Input.down;
      Input.down = function(k) {
        if (["w", "a", "s", "d", "shift", " "].includes(k)) return false;
        return savedDown(k);
      };
      try { originalUpdatePlayer(dt, now); }
      finally { Input.down = savedDown; }

      player.roll.elapsed = Math.min(ROLL_DURATION, now - player.roll.startedAt);
      const targetMoved = player.roll.distance * (player.roll.elapsed / ROLL_DURATION);
      const step = Math.max(0, targetMoved - player.roll.moved);
      player.roll.moved += step;
      player.x += player.roll.dirX * step;
      player.y += player.roll.dirY * step;
      player.x = Math.max(0.15, Math.min(CONFIG.MAP_WIDTH - 0.15, player.x));
      player.y = Math.max(0.15, Math.min(CONFIG.MAP_HEIGHT - 0.15, player.y));

      if (now >= player.roll.until) {
        player.roll = null;
        player.state = "idle";
      }
      return;
    }

    if (rollRequested) {
      rollRequested = false;
      beginRoll(now);
    }
    originalUpdatePlayer(dt, now);
  };

  window.updatePlayerCombat = function(now, dt) {
    if (player.roll) return;
    originalUpdatePlayerCombat(now, dt);
  };

  window.updateHUD = function() {
    originalUpdateHUD();
    const el = document.getElementById("dashStatus");
    if (!el) return;
    const now = performance.now();
    if (player.roll) el.textContent = "ROLANDO...";
    else if (player.dashCount >= 5) el.textContent = `ROLAGENS: RECARGA ${Math.ceil(Math.max(0, player.dashRegenAt - now) / 1000)}s`;
    else el.textContent = `ROLAGENS: ${5 - player.dashCount}/5`;
  };

  window.drawGame = function() {
    originalDrawGame();
    if (!player.roll) return;
    const now = performance.now();
    const progress = Math.min(1, Math.max(0, (now - player.roll.startedAt) / ROLL_DURATION));
    const s = Camera.worldToScreen(player.x, player.y);
    const angle = Math.atan2(player.roll.dirY + player.roll.dirX, player.roll.dirX - player.roll.dirY);
    const pulse = Math.sin(progress * Math.PI);
    ctx.save();
    ctx.translate(s.x, s.y - 12);
    ctx.rotate(angle);
    ctx.globalAlpha = 0.75 * pulse;
    ctx.strokeStyle = "rgba(210,235,255,.9)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 0, 25 + pulse * 8, 11 + pulse * 4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.35 * pulse;
    ctx.beginPath();
    ctx.moveTo(-28, 0); ctx.lineTo(-48, 0);
    ctx.moveTo(-24, 6); ctx.lineTo(-42, 10);
    ctx.stroke();
    ctx.restore();
  };

  window.drawCharacterBody = function(x, y, dir, baseScale, opts = {}) {
    return originalDrawCharacterBody(x, y, dir, baseScale, { ...opts, defending: false });
  };

  console.info("[Sunwalker] Alpha 1.7 controls: Shift=Rolagem, Espaco=Item, bloqueio removido.");
})();
