let attackSequence = 0;
let weaponMode = "sword"; // "sword" | "sheath" | "blunderbuss"
let isAiming = false;     // botao direito segurado para mirar

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
  if (type === "blunderbuss") return fireBlunderbuss(now, directionOverride || mouseDirection());
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

function getBlunderbussTarget(direction = mouseDirection()) {
  if (typeof enemies === "undefined") return null;
  const dir = directionVector(direction);
  let target = null, best = Infinity;
  const maxRange = 16;
  const cone = 0.24;
  for (const enemy of enemies) {
    if (!enemy || enemy.isDead()) continue;
    const dx = enemy.x - player.x, dy = enemy.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist > maxRange || dist < 0.01) continue;
    const dot = (dx * dir.x + dy * dir.y) / dist;
    if (dot < Math.cos(cone)) continue;
    if (dist < best) { best = dist; target = enemy; }
  }
  return target;
}

window.getBlunderbussTarget = getBlunderbussTarget;

function fireBlunderbuss(now, direction) {
  if (!player.owned || !player.owned.blunderbuss) {
    showMessage("COMPRE O TRABUCO NO MERCADOR");
    return;
  }
  if (player.blunderbussAmmo <= 0) {
    showMessage("TRABUCO SEM MUNIÇÃO — COMPRE UMA CAIXA NO MERCADOR");
    return;
  }
  if (player.blunderbussCooldownUntil && now < player.blunderbussCooldownUntil) return;
  if (!isAiming) { showMessage("SEGURE O BOTÃO DIREITO PARA MIRAR"); return; }
  const dir = directionVector(direction || mouseDirection());
  player.direction = direction || mouseDirection();
  player.blunderbussAmmo = Math.max(0, player.blunderbussAmmo - 1);
  player.blunderbussCooldownUntil = now + CONFIG.blunderbussCooldown;
  player.blunderbussFlashUntil = now + 180;
  player.blunderbussShotUntil = now + 260;
  playSound("trabuco");
  // O som enviado para o projeto representa a recarga/cooldown entre disparos.
  playSound("rechargeGun");

  const target = getBlunderbussTarget(direction || mouseDirection());
  if (target) {
    // O trabuco tem dano por quantidade fixa de tiros: comuns = 1, arqueiros = 2, chefes = 5.
    const requiredHits = target.isBoss ? 5 : (target.type === "archer" ? 2 : 1);
    target.blunderbussHits = (target.blunderbussHits || 0) + 1;
    // Cada disparo remove uma fração real da barra de vida. O último tiro finaliza.
    target.hp = Math.max(0, target.maxHp * (1 - Math.min(target.blunderbussHits, requiredHits) / requiredHits));
    target.hitFlashUntil = now + 180;
    target.state = "hurt";
    // Alvos que sobrevivem ao disparo sofrem recuo de exatamente 15px para trás.
    if (target.blunderbussHits < requiredHits) {
      const dx = target.x - player.x;
      const dy = target.y - player.y;
      const dist = Math.hypot(dx, dy) || 1;
      const pixelsToWorld = (CONFIG.blunderbussRecoilPixels || 15) / (CONFIG.TILE_WIDTH / 2);
      const duration = CONFIG.blunderbussRecoilDuration || 150;
      const speed = pixelsToWorld / (duration / 1000);
      target.knockbackX = (dx / dist) * speed;
      target.knockbackY = (dy / dist) * speed;
      target.staggerUntil = now + duration;
    } else {
      target.knockbackX = 0;
      target.knockbackY = 0;
    }
    target.hurtUntil = now + 180;
    target.attackPhase = null;
    hitSparks.push({ x: target.x, y: target.y, start: now, until: now + 360, type: "blunderbuss" });

    if (target.blunderbussHits >= requiredHits) {
      target.hp = 0;
      target.state = "dead";
      rewardEnemy(target, "kill");
      showMessage(requiredHits === 1 ? "TRABUCO! INIMIGO ELIMINADO" : `TRABUCO! ${requiredHits}/${requiredHits} TIROS — INIMIGO ELIMINADO`);
    } else {
      showMessage(`TRABUCO! ${target.blunderbussHits}/${requiredHits} TIROS`);
    }
  } else {
    showMessage("TRABUCO — TIRO NO ACERTOU");
  }
}

function playerAttackHit(now) {
  if (!player.attack || player.attack.hitApplied) return;
  const attack = player.attack;
  if (now - attack.startedAt < attack.duration * 0.42) return;
  attack.hitApplied = true;
  const sword = attack.type === "sword";
  const range = Math.max(CONFIG.attackCircleRadius, sword ? CONFIG.swordRange : CONFIG.sheathRange);
  const skillDamage = sword && typeof getSwordSkillDamageMultiplier === "function" ? getSwordSkillDamageMultiplier() : 1;
  const damage = (sword ? CONFIG.swordDamage : CONFIG.sheathDamage) * player.statMultipliers.attack * skillDamage;
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
        const fireStage = typeof getSwordElementStage === "function" ? getSwordElementStage("fire") : 0;
        const lightningStage = typeof getSwordElementStage === "function" ? getSwordElementStage("lightning") : 0;
        // Fogo e Raio são caminhos exclusivos. O efeito é aplicado aqui,
        // diretamente no hit da espada, para não depender de sobrescritas em window.damageEnemy.
        if (lightningStage >= 2 && fireStage === 0 && !enemy.isDead()) {
          const lightningDuration = 3000;
          enemy.lightningUntil = now + lightningDuration;
          enemy.lightningNextTick = now + 1000;
          enemy.lightningSourceAttack = attack.id;
          enemy.swordElement = "lightning";
          enemy.swordElementStage = lightningStage;
          if (lightningStage >= 5) {
            const radius = typeof getSwordSkillAreaRadius === "function" ? getSwordSkillAreaRadius("lightning") : 1.9;
            for (const other of enemies) {
              if (other === enemy || other.isDead()) continue;
              if (Math.hypot(other.x - enemy.x, other.y - enemy.y) <= radius) {
                other.lightningUntil = now + lightningDuration;
                other.lightningNextTick = now + 1000;
                other.lightningSourceAttack = attack.id;
                other.swordElement = "lightning";
                other.swordElementStage = lightningStage;
              }
            }
          }
          showMessage(`CORTE DE RAIO -${damage}`);
        } else if (fireStage >= 2 && lightningStage === 0 && !enemy.isDead()) {
          enemy.burnUntil = now + (CONFIG.fireBurnDuration + Math.max(0, fireStage - 2) * 500);
          enemy.burnNextTick = now + 1000;
          enemy.swordElement = "fire";
          enemy.swordElementStage = fireStage;
          if (fireStage >= 5) {
            const radius = typeof getSwordSkillAreaRadius === "function" ? getSwordSkillAreaRadius("fire") : 1.65;
            for (const other of enemies) {
              if (other === enemy || other.isDead()) continue;
              if (Math.hypot(other.x - enemy.x, other.y - enemy.y) <= radius) {
                other.burnUntil = now + CONFIG.fireBurnDuration;
                other.burnNextTick = now + 1000;
                other.swordElement = "fire";
                other.swordElementStage = fireStage;
              }
            }
          }
          showMessage(`CORTE DE FOGO  -${damage}`);
        } else {
          showMessage(`CORTE  -${damage}`);
        }
      } else {
        // BAINHA: foco em repulsão (knockback forte na direção oposta ao jogador).
        damageEnemy(enemy, damage, 0, 0, now, "sheath");
        const pushX = dx, pushY = dy;
        const len = Math.hypot(pushX, pushY) || 1;
        const ax = (pushX / len) * 0.65 + dir.x * 0.35;
        const ay = (pushY / len) * 0.65 + dir.y * 0.35;
        const alen = Math.hypot(ax, ay) || 1;
        const nx = ax / alen, ny = ay / alen;
        enemy.knockbackX = nx * CONFIG.sheathKnockbackForce;
        enemy.knockbackY = ny * CONFIG.sheathKnockbackForce;

        enemy.attackPhase = null;
        const sheathStage = typeof getSwordSkillStage === "function" ? getSwordSkillStage("sheath") : 0;
        const knockbackScale = 1 + sheathStage * 0.18;
        enemy.knockbackX *= knockbackScale;
        enemy.knockbackY *= knockbackScale;
        enemy.staggerUntil = now + CONFIG.sheathKnockbackDuration + sheathStage * 120;
        enemy.stunHits = (enemy.stunHits || 0) + 1;
        const needed = Math.max(1, CONFIG.sheathStunHitsRequired - Math.floor(sheathStage / 2));
        // Estágio V: existe chance de converter um inimigo comum para aliado.
        if (sheathStage >= 5 && !enemy.isBoss && Math.random() < 0.30) {
          enemy.isAlly = true;
          enemy.state = "ally";
          enemy.target = null;
          enemy.attackPhase = null;
          enemy.stunHits = 0;
          enemy.knockbackX = 0;
          enemy.knockbackY = 0;
          showMessage("DOMÍNIO DA BAINHA — INIMIGO VIROU ALIADO!");
        } else if (enemy.stunHits >= needed) {
          enemy.stunHits = 0;
          enemy.state = "stunned";
          enemy.hurtUntil = now + 1200 + sheathStage * 180;
          enemy.staggerUntil = enemy.hurtUntil;
          addReputation(CONFIG.reputationSheathStunGain, "DESMAIO");
          spawnHitSpark(enemy.x, enemy.y, now, "sheath");
          showMessage("INIMIGO ATORDOADO");
        } else {
          enemy.state = "hurt";
          enemy.hurtUntil = enemy.staggerUntil;
          spawnHitSpark(enemy.x, enemy.y, now, "sheath");
          showMessage(`REPULSÃO — ESTÁGIO ${sheathStage}`);
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

  // R alterna entre as armas compradas.
  if (Input.consume("r")) {
    const modes = ["sword", "sheath"];
    if (player.owned && player.owned.blunderbuss) modes.push("blunderbuss");
    let index = modes.indexOf(weaponMode);
    if (index < 0) index = 0;
    weaponMode = modes[(index + 1) % modes.length];
    showMessage(weaponMode === "sword" ? "ESPADA" : weaponMode === "sheath" ? "BAINHA" : "TRABUCO — MIRE COM O BOTÃO DIREITO");
  }

  if (mode === "mouse" || weaponMode === "blunderbuss") {
    // Para o trabuco, mirar e atirar são obrigatoriamente feitos com o mouse.
    isAiming = Input.mouseDown(2);
    if (isAiming) player.direction = mouseDirection();
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
  // Aliados não atacam nem recebem a lógica de combate hostil.
  if (enemy.isAlly) {
    enemy.attackPhase = null;
    enemy.state = "ally";
    return;
  }
  if (enemy.state === "stunned") return;
  if (enemy.staggerUntil && now < enemy.staggerUntil) return;
  if (enemy.state === "hurt" && enemy.hurtUntil && now < enemy.hurtUntil) return;
  if (enemy.type === "archer" && !enemy.isBoss) {
    if (enemy.attackPhase === "windup") {
      enemy.state = "attacking";
      if (now - enemy.attackStartedAt >= CONFIG.archerChargeMs) {
        enemy.attackPhase = "strike";
        // Som da flecha no momento exato do disparo.
        if (typeof playSound === "function") playSound("arrow", { volume: 0.95 });
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
