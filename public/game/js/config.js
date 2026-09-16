// Todos os valores principais da Alpha ficam aqui para ajuste r?pido.
const CONFIG = {
  MAP_WIDTH: 100,
  MAP_HEIGHT: 100,
  TILE_WIDTH: 72,
  TILE_HEIGHT: 36,
  TILE_COLOR: "#777",
  TILE_ALT_COLOR: "#6d6d6d",
  TILE_LINE: "rgba(30,30,30,.55)",

  playerSpeed: 7.0,
  playerRadius: 0.28,
  maxHp: 100,
  maxStamina: 100,

  swordDamage: 25,
  swordStaminaCost: 20,
  swordRange: 1.5,
  swordWidth: 0.85,
  swordCooldown: 500,
  swordDuration: 260,

  sheathDamage: 4,
  sheathStaminaCost: 15,
  sheathRange: 1.45,
  sheathWidth: 1.1,
  sheathCooldown: 450,
  sheathDuration: 220,
  sheathStunHitsRequired: 3,

  staminaRegeneration: 24,
  staminaRegenDelay: 1000,

  knockbackForce: 3.2,
  sheathKnockbackForce: 9.0,
  sheathKnockbackDuration: 320,

  attackMoveMultiplier: 0.7,
  cameraLerpSpeed: 8,

  damageInvulnerability: 400,

  enemyCount: 34,
  enemyHp: 50,
  enemySpeed: 3.57,
  enemyDamage: 10,
  enemyAttackRange: 1.45,
  enemyAttackCooldown: 1000,
  enemyDetectRange: 8.5,
  enemyAttackWindup: 430,
  enemyAttackRecovery: 360,
  archerSpeedMultiplier: 0.58,
  archerChargeMs: 2000,
  archerAttackCooldown: 3200,
  archerRange: 8,
  archerConeHalfAngle: 0.34,
  archerDamagePercent: 0.25,

  defenseReduction: 0.8,
  defenseSpeedMultiplier: 0.42,
  perfectBlockWindow: 190,
  perfectBlockStun: 520,
  perfectBlockDamage: 15,
  perfectBlockKnockback: 2.5,

  // Correr
  runMultiplier: 1.5,
  runStaminaCost: 25, // por segundo

  // Dash (Alpha 1.2) ? SHIFT pressionado
  dashDistance: 1.6,     // em unidades de mundo (~15px na tela)
  dashCooldown: 300,     // ms entre dashes
  dashStaminaCost: 12,

  // Campo de acerto: qualquer inimigo dentro deste c?rculo pode ser atingido
  attackCircleRadius: 1.6,

  // Defesa (Alpha 1.2)
  defenseStaminaDrain: 2,      // % da stamina m?xima por segundo enquanto defende
  blockStaminaCost: 15,        // custo ao bloquear um golpe sem parry

  // NPC Mercante
  merchantX: 50,
  merchantY: 50,
  merchantInteractRange: 2.2,

  // Habilidade ESPADA ? dano de fogo
  fireBurnDuration: 3000,
  fireBurnPercentPerSecond: 0.07,
  fireBurnTickMs: 1000,

  // Habilidade BAINHA ? repuls?o aprimorada
  skillSheathPushPixels: 20,
  skillSheathStunHits: 2,
  skillSheathStunDuration: 3000,

  // Zoom da c?mera (configur?vel)
  zoom: 1,
  zoomMin: 0.6,
  zoomMax: 1.8,

  // Respawn / Chef?o
  respawnInterval: 30000,
  bossHpMultiplier: 3,
  bossDamageMultiplier: 1.15,
  bossExtraPixels: 30,
  // Interpreta??o adotada: zona de perigo do chefe = quadrado de 15px de lado,
  // centralizado no centro do boss na tela (canvas). Em renderiza??o usamos px do canvas,
  // n?o escala de mundo, para manter a zona consistente ao redor do chefe.
  bossDangerRadiusWorld: 0.8,
  bossDangerWarningMs: 3000,
  bossDangerBurnMs: 5000,
  bossDangerBurnTickMs: 1000,

  // Musica / ?udio
  musicVolume: 0.35,
  effectsVolume: 0.6,

  // Moedas
  coinPickupRange: 0.9,
  coinsPerKill: 2,
  coinsPerStun: 5,
  coinsPerBoss: 50,
  meladorCost: 50,
  meladorHealPercent: 0.25,
  fireBombCost: 75,
  fireBombDuration: 5000,
  fireBombHitboxWidthPixels: 50,
  fireBombHitboxLengthPixels: 150,
  fireBombImpactDurationMs: 450,
  fireBombRadiusPixels: 10,
  fireBombOffsetPixels: 15,
  fireBombDamagePercentPerSecond: 0.15,
  skillFireCost: 30,
  skillRepelCost: 60,

  debug: false,

  attackControlMode: "mouse",
  pauseKey: "escape",
  swordStaggerDuration: 500,
  sheathKnockbackPixels: 10,
  reputationMax: 100,
  reputationStart: 50,
  reputationSwordKillPenalty: 1,
  reputationSheathStunGain: 2
};
