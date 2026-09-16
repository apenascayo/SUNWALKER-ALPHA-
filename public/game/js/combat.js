let attackSequence = 0;
let weaponMode = "sword"; // "sword" | "sheath" — alternado com a tecla R
let isAiming = false;     // botao direito segurado

const DIRECTION_VECTORS = {
  up: {x:0,y:-1}, upRight:{x:1,y:-1}, right:{x:1,y:0}, downRight:{x:1,y:1},
  down:{x:0,y:1}, downLeft:{x:-1,y:1}, left:{x:-1,y:0}, upLeft:{x:-1,y:-1}
};

function directionVector(direction) { return DIRECTION_VECTORS[direction] || DIRECTION_VECTORS.down; }

function normalizedDirection(x, y) {
  const nx = x === 0 ? 0 : (x > 0 ? 1 : -1);
  const ny = y === 0 ? 0 : (y > 0 ? 1 : -1);
  return {
    "0,-1":"up", "1,-1":"upRight", "1,0":"right", "1,1":"downRight",
    "0,1":"down", "-1,1":"downLeft", "-1,0":"left", "-1,-1":"upLeft"
  }[`${nx},${ny}`] || player.direction;
}

function mouseDirection() {
  const p = Camera.worldToScreen(player.x, player.y);
  const sx = Input.mouseX - p.x;
  const sy = Input.mouseY - (p.y - 12);
  if (Math.hypot(sx, sy) < 4) return player.direction;
  // Inverse of the isometric projection: sx=dx-dy, sy=(dx+dy)/2.
  const wx = sx / 2 + sy;
  const wy = sy - sx / 2;
  return normalizedDirection(wx, wy);
}

function addReputation(amount, reason) {
  const before = player.reputation;
  player.reputation = Math.max(0, Math.min(CONFIG.reputationMax, player.reputation + amount));
  const delta = player.reputation - before;
  if (delta) showMessage(`${reason} ${delta > 0 ? "+" : ""}${delta} REPUTAÇÃO`);
}

function tryPlayerAttack(type, now, directionOverride = null) {
  if (player.isDead() || player.isDefending()) return;
  if (player.attack || now < player.attackCooldownUntil) return;
  const isSword = type === "sword";
  const cost = isSword ? CONFIG.swordStaminaCost : CONFIG.sheathStaminaCost;
  if (player.stamina < cost) { showMessage("SEM STAMINA"); return; }

  player.stamina -= cost;
  player.staminaRegenBlockedUntil = now + CONFIG.staminaRegenDelay;
  player.attack = {
    type, startedAt: now,
    duration: isSword ? CONFIG.swordDuration : CONFIG.sheathDuration,
    hitApplied: false, id: ++attackSequence,
    direction: directionOverride || player.direction
  };
  player.direction = player.attack.direction;
  player.attackCooldownUntil = now + (isSword ? CONFIG.swordCooldown : CONFIG.sheathCooldown);
  player.state = "attacking";
  playSound(isSword ? "sword" : "sheath");
}

function playerAttackHit(now) {
  if (!player.attack || player.attack.hitApplied) return;
  const attack = player.attack;
  if (now - attack.startedAt < attack.duration * 0.42) return;
  attack.hitApplied = true;
  const sword = attack.type === "sword";
  const range = Math.max(CONFIG.attackCircleRadius, sword ? CONFIG.swordRange : CONFIG.sheathRange);
  const damage = (sword ? CONFIG.swordDamage : CONFIG.sheathDamage) * player.statMultipliers.attack;
  const dir = directionVector(attack.direction);

  for (const enemy of enemies) {
    if (enemy.isDead() || enemy.lastDamageId === attack.id) continue;
    const dx = enemy.x - player.x, dy = enemy.y - player.y;
    // Campo circular: assim que o inimigo entra no círculo ao redor do player, ele pode ser atingido.
    const dist = Math.hypot(dx, dy);
    if (dist <= range) {
      enemy.lastDamageId = attack.id;
      if (sword) {
        damageEnemy(enemy, damage, dir.x * CONFIG.knockbackForce, dir.y * CONFIG.knockbackForce, now, "sword");
        enemy.staggerUntil = now + CONFIG.swordStaggerDuration;
        enemy.state = "hurt";
        enemy.hurtUntil = enemy.staggerUntil;
        enemy.attackPhase = null;
        spawnHitSpark(enemy.x, enemy.y, now, "sword");
        if (player.skills && player.skills.fireSword && !enemy.isDead()) {
          enemy.burnUntil = now + CONFIG.fireBurnDuration;
          enemy.burnNextTick = now + 1000;
          showMessage(`CORTE DE FOGO  -${damage}`);
        } else {
          showMessage(`CORTE  -${damage}`);
        }
      } else {
        // BAINHA: foco em repulsão (knockback forte na direção oposta ao jogador).
        damageEnemy(enemy, damage, 0, 0, now, "sheath");
        const skill = !!(player.skills && player.skills.repelSheath);
        const pushX = dx, pushY = dy;
        const len = Math.hypot(pushX, pushY) || 1;
        const ax = (pushX / len) * 0.65 + dir.x * 0.35;
        const ay = (pushY / len) * 0.65 + dir.y * 0.35;
        const alen = Math.hypot(ax, ay) || 1;
        const nx = ax / alen, ny = ay / alen;
        enemy.knockbackX = nx * CONFIG.sheathKnockbackForce;
        enemy.knockbackY = ny * CONFIG.sheathKnockbackForce;
        if (skill) {
          // Empurrão instantâneo de 20px convertidos para unidades do mundo.
          const units = CONFIG.skillSheathPushPixels / (CONFIG.TILE_WIDTH / 2);
          enemy.x += nx * units;
          enemy.y += ny * units;
        }
        enemy.attackPhase = null;
        enemy.staggerUntil = now + CONFIG.sheathKnockbackDuration;
        enemy.stunHits++;
        const needed = skill ? CONFIG.skillSheathStunHits : CONFIG.sheathStunHitsRequired;
        if (enemy.stunHits >= needed) {
          enemy.stunHits = 0;
          if (skill) {
            enemy.state = "stunned";
            enemy.stunnedUntil = now + CONFIG.skillSheathStunDuration;
            enemy.staggerUntil = enemy.stunnedUntil;
            enemy.knockbackX = 0; enemy.knockbackY = 0;
            rewardEnemy(enemy, "knockout");
          } else {
            enemy.hp = 0;
            enemy.state = "dead";
            rewardEnemy(enemy, "knockout");
          }
          addReputation(CONFIG.reputationSheathStunGain, "DESMAIO");
          showMessage("INIMIGO DESMAIOU");
        } else {
          enemy.state = "hurt";
          enemy.hurtUntil = enemy.staggerUntil;
          spawnHitSpark(enemy.x, enemy.y, now, "sheath");
          showMessage("REPULSÃO!");
        }
      }
    }
  }
}

function damageEnemy(enemy, damage, kx, ky, now, source) {
  enemy.hp = Math.max(0, enemy.hp - damage);
  playSound("npcHurt");
  enemy.hitFlashUntil = now + 130;
  enemy.knockbackX = kx; enemy.knockbackY = ky;
  enemy.damageNumbers.push({value:damage,x:enemy.x,y:enemy.y-0.7,until:now+650});
  if (enemy.hp <= 0) {
    enemy.state = "dead"; enemy.attackPhase = null;
    rewardEnemy(enemy, "kill");
    if (source === "sword") addReputation(-CONFIG.reputationSwordKillPenalty, "EXECUÇÃO");
  } else if (source === "sword") {
    enemy.state = "hurt"; enemy.hurtUntil = now + CONFIG.swordStaggerDuration;
  } else {
    enemy.state = "hurt"; enemy.hurtUntil = now + 180;
  }
}

function receivePlayerDamage(amount, enemy, now) {
  if (player.isDead() || now < player.invulnerableUntil) return;
  if (player.isDefending() && now - enemy.attackStartedAt >= CONFIG.enemyAttackWindup - CONFIG.perfectBlockWindow) {
    // PERFECT BLOCK / PARRY!
    player.invulnerableUntil = now + 180;
    player.lastParryTime = now;
    
    // Aplicar dano ao inimigo como contra-ataque
    const parryDamage = CONFIG.perfectBlockDamage;
    enemy.hp = Math.max(0, enemy.hp - parryDamage * player.statMultipliers.attack);
    enemy.hitFlashUntil = now + 150;
    
    // Knockback forte no inimigo
    const d = directionVector(enemy.facing);
    enemy.knockbackX = -d.x * CONFIG.perfectBlockKnockback;
    enemy.knockbackY = -d.y * CONFIG.perfectBlockKnockback;
    
    // Estado e stun
    enemy.attackPhase = null;
    enemy.state = "hurt";
    enemy.hurtUntil = now + CONFIG.perfectBlockStun;
    enemy.attackCooldownUntil = now + CONFIG.enemyAttackCooldown;
    
    // Mostrar mensagem de parry com dano
    showMessage(`PARRY! -${parryDamage}`);
    
    // Feedback visual - adicionar número de dano
    enemy.damageNumbers.push({value: parryDamage, x: enemy.x, y: enemy.y - 0.7, until: now + 650});
    if (enemy.hp <= 0) {
      enemy.state = "dead";
      rewardEnemy(enemy, "kill");
    }
    
    return;
  }
  const blocking = player.isDefending();
  if (blocking) {
    // Bloqueio sem parry consome stamina.
    player.stamina = Math.max(0, player.stamina - CONFIG.blockStaminaCost);
    player.staminaRegenBlockedUntil = now + CONFIG.staminaRegenDelay;
    showMessage(`BLOQUEIO  -${CONFIG.blockStaminaCost} STAMINA`);
  }
  const finalDamage = blocking ? Math.max(1, Math.round(amount * (1 - CONFIG.defenseReduction))) : amount;
  player.hp = Math.max(0, player.hp - finalDamage);
  player.invulnerableUntil = now + CONFIG.damageInvulnerability;
  player.damageFlashUntil = now + 500;
  if (enemy && (enemy.isBoss || enemy.type)) {
    playSound("swordnpc");
  }
  if (enemy && enemy.isBoss) {
    player.fireBurnUntil = Math.max(player.fireBurnUntil, now + CONFIG.bossDangerBurnMs);
    player.fireBurnNextTick = Math.min(player.fireBurnNextTick || now, now);
  }
  playSound("damage");
  if (player.hp <= 0) { player.state = "dead"; document.getElementById("gameOver").classList.remove("hidden"); }
}

function updatePlayerCombat(now, dt) {
  if (player.isDead()) return;
  const mode = getAttackControlMode();

  // R alterna entre espada e bainha nos dois modos de controle.
  if (Input.consume("r")) {
    weaponMode = weaponMode === "sword" ? "sheath" : "sword";
    showMessage(weaponMode === "sword" ? "ESPADA" : "BAINHA");
  }

  if (mode === "mouse") {
    // Botao direito segurado = mirar; a direcao segue o mouse enquanto mira.
    isAiming = Input.mouseDown(2);
    if (isAiming) player.direction = mouseDirection();
    // Botao esquerdo = atacar com a arma selecionada.
    if (Input.consumeMouse(0)) {
      tryPlayerAttack(weaponMode, now, isAiming ? mouseDirection() : player.direction);
    }
  } else {
    isAiming = false;
    if (Input.consume("k")) tryPlayerAttack(weaponMode, now);
  }

  if (player.attack) {
    playerAttackHit(now);
    if (now - player.attack.startedAt >= player.attack.duration) {
      player.attack = null; player.state = player.isDefending() ? "defending" : "idle";
    }
    return;
  }
  if (player.isDefending()) {
    player.state = "defending";
    // Defender consome 2% da stamina máxima por segundo.
    player.stamina = Math.max(0, player.stamina - player.maxStamina * (CONFIG.defenseStaminaDrain / 100) * dt);
    player.staminaRegenBlockedUntil = now + CONFIG.staminaRegenDelay;
  }
  if (!player.isDefending() && now >= player.staminaRegenBlockedUntil) {
    player.stamina = Math.min(player.maxStamina, player.stamina + CONFIG.staminaRegeneration * dt);
  }
}

function updateEnemyCombat(enemy, now) {
  if (enemy.isDead()) return;
  if (enemy.state === "stunned") return;
  if (enemy.staggerUntil && now < enemy.staggerUntil) return;
  if (enemy.state === "hurt" && enemy.hurtUntil && now < enemy.hurtUntil) return;
  if (enemy.type === "archer" && !enemy.isBoss) {
    if (enemy.attackPhase === "windup") {
      enemy.state = "attacking";
      if (now - enemy.attackStartedAt >= CONFIG.archerChargeMs) {
        enemy.attackPhase = "strike";
        const dx = player.x - enemy.x, dy = player.y - enemy.y;
        const dist = Math.hypot(dx, dy);
        const d = directionVector(enemy.archerTelegraphDirection);
        const dot = dist ? (dx * d.x + dy * d.y) / dist : 1;
        if (dist <= CONFIG.archerRange && dot >= Math.cos(CONFIG.archerConeHalfAngle)) {
          receivePlayerDamage(enemy.damage, enemy, now);
          showMessage("FLECHA! -25% VIDA");
        }
      }
      return;
    }
    if (enemy.attackPhase === "strike") {
      if (now - enemy.attackStartedAt >= CONFIG.archerChargeMs + 220) {
        enemy.attackPhase = null;
        enemy.attackCooldownUntil = now + CONFIG.archerAttackCooldown;
        enemy.state = "chasing";
      }
      return;
    }
    const adx = player.x - enemy.x, ady = player.y - enemy.y;
    const adist = Math.hypot(adx, ady);
    if (adist <= CONFIG.archerRange && now >= enemy.attackCooldownUntil) {
      enemy.archerTelegraphDirection = Math.abs(adx) > Math.abs(ady) ? (adx > 0 ? "right" : "left") : (ady > 0 ? "down" : "up");
      enemy.facing = enemy.archerTelegraphDirection;
      enemy.attackPhase = "windup";
      enemy.attackStartedAt = now;
      return;
    }
  }
  if (enemy.attackPhase === "windup") {
    enemy.state = "attacking";
    if (now - enemy.attackStartedAt >= CONFIG.enemyAttackWindup) {
      enemy.attackPhase = "strike";
      const dx = player.x-enemy.x, dy = player.y-enemy.y;
      const dist = Math.hypot(dx, dy);
      // Recalcula a direcao no momento do golpe para o hit registrar de forma confiavel.
      enemy.facing = Math.abs(dx) > Math.abs(dy) ? (dx>0?"right":"left") : (dy>0?"down":"up");
      const d = directionVector(enemy.facing);
      const forward = dist > 0 ? (dx*d.x + dy*d.y) / dist : 1;
      if (dist <= CONFIG.enemyAttackRange + 0.5 && forward >= -0.15) receivePlayerDamage(enemy.damage || CONFIG.enemyDamage, enemy, now);
    }
    return;
  }
  if (enemy.attackPhase === "strike") {
    if (now-enemy.attackStartedAt >= CONFIG.enemyAttackWindup+CONFIG.enemyAttackRecovery) { enemy.attackPhase=null; enemy.attackCooldownUntil=now+CONFIG.enemyAttackCooldown; enemy.state="chasing"; }
    return;
  }
  const dx=player.x-enemy.x, dy=player.y-enemy.y, dist=Math.hypot(dx,dy);
  if (dist<=CONFIG.enemyAttackRange && now>=enemy.attackCooldownUntil) {
    enemy.facing=Math.abs(dx)>Math.abs(dy)?(dx>0?"right":"left"):(dy>0?"down":"up");
    enemy.attackPhase="windup"; enemy.attackStartedAt=now; player.lastEnemyAttackStarted=now; return;
  }
  enemy.state = dist<=CONFIG.enemyDetectRange ? "chasing" : "idle";
}
