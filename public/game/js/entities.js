class Player {
  constructor() { this.reset(); }

  reset() {
    this.x = 50;
    this.y = 54;
    this.maxHp = CONFIG.maxHp;
    this.hp = this.maxHp;
    this.maxStamina = CONFIG.maxStamina;
    this.stamina = this.maxStamina;
    this.reputation = CONFIG.reputationStart;
    this.direction = "down";
    this.state = "idle";
    this.attack = null;
    this.attackCooldownUntil = 0;
    this.staminaRegenBlockedUntil = 0;
    this.invulnerableUntil = 0;
    this.hitFlashUntil = 0;
    this.damageFlashUntil = 0;
    this.lastEnemyAttackStarted = 0;
    this.moveBlend = 0;
    this.isRunning = false;
    this.lastParryTime = 0;
    this.dashCooldownUntil = 0;
    this.dashCount = 0;
    this.dashRegenAt = 0;
    this.dashUntil = 0;
    this.dashTrail = [];
    this.coins = 0;
    this.xp = 0;
    this.level = 1;
    this.upgrades = { health: 0, attack: 0, speed: 0, stamina: 0 };
    this.statMultipliers = { health: 1, attack: 1, speed: 1, stamina: 1 };
    this.inventory = { melador: 0, fireBomb: 0 };
    this.selectedItem = "melador";
    this.skills = { fireSword: false, repelSheath: false };
    this.owned = { fireSword: false, repelSheath: false };
    this.fireBurnUntil = 0;
    this.fireBurnNextTick = 0;
    this.burning = false;
  }

  isDead() { return this.hp <= 0; }
  isDefending() { return Input.down(" ") && !this.isDead(); }
  canRun() { return Input.down("shift") && !this.isDead() && !this.isDefending() && !this.attack; }
}

class Enemy {
  constructor(x, y, id, isBoss = false, type = "common") {
    this.id = id;
    this.spawnX = x;
    this.spawnY = y;
    this.isBoss = isBoss;
    this.type = type;
    this.waveLevel = 1;
    this.reset();
  }

  reset() {
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.waveLevel = Math.max(1, this.waveLevel || 1);
    const waveMultiplier = typeof getWaveMultiplier === "function" ? getWaveMultiplier() : 1;
    const hp = Math.round((this.isBoss ? CONFIG.enemyHp * CONFIG.bossHpMultiplier : CONFIG.enemyHp) * waveMultiplier);
    this.hp = hp;
    this.maxHp = hp;
    this.damage = (this.isBoss ? CONFIG.enemyDamage * CONFIG.bossDamageMultiplier : CONFIG.enemyDamage) * waveMultiplier;
    if (this.type === "archer") this.damage = (typeof player !== "undefined" ? player.maxHp : CONFIG.maxHp) * CONFIG.archerDamagePercent * waveMultiplier;
    this.speedMultiplier = waveMultiplier;
    this.rewarded = false;
    this.state = "idle";
    this.stunHits = 0;
    this.stunnedUntil = 0;
    this.hurtUntil = 0;
    this.staggerUntil = 0;
    this.attackPhase = null;
    this.attackStartedAt = 0;
    this.attackCooldownUntil = 0;
    this.hitFlashUntil = 0;
    this.knockbackX = 0;
    this.knockbackY = 0;
    this.lastDamageId = -1;
    this.damageNumbers = [];
    this.facing = "down";
    this.burnUntil = 0;
    this.burnNextTick = 0;
    this.bossDanger = null;
    this.archerTelegraphDirection = this.facing;
  }

  applyWaveScaling() {
    const ratio = this.maxHp > 0 ? this.hp / this.maxHp : 1;
    const waveMultiplier = typeof getWaveMultiplier === "function" ? getWaveMultiplier() : 1;
    const baseHp = this.isBoss ? CONFIG.enemyHp * CONFIG.bossHpMultiplier : CONFIG.enemyHp;
    this.maxHp = Math.round(baseHp * waveMultiplier);
    this.hp = Math.max(0, Math.round(this.maxHp * ratio));
    this.damage = (this.isBoss ? CONFIG.enemyDamage * CONFIG.bossDamageMultiplier : CONFIG.enemyDamage) * waveMultiplier;
    if (this.type === "archer") this.damage = (typeof player !== "undefined" ? player.maxHp : CONFIG.maxHp) * CONFIG.archerDamagePercent * waveMultiplier;
    this.speedMultiplier = waveMultiplier;
  }

  isDead() { return this.hp <= 0 || this.state === "dead"; }
}
