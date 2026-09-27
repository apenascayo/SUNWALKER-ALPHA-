(() => {
  // Alpha 1.9: mantém o DASH original do jogo (teleporte),
  // com som e animação do sistema base. Defesa e corrida continuam desativadas.
  const originalInputDown = Input.down.bind(Input);
  const originalInputConsume = Input.consume.bind(Input);

  Input.down = function(key) { return originalInputDown(key); };

  Input.consume = function(key) {
    if (key === "f") return originalInputConsume(" ");
    return originalInputConsume(key);
  };

  Player.prototype.isDefending = function() { return false; };
  Player.prototype.canRun = function() { return false; };

  const GOD_KEY = "sunwalker_god_mode";

  function godModeActive() { return localStorage.getItem(GOD_KEY) === "true"; }

  function updateGodModeUI() {
    const activate = document.getElementById("godModeActivate");
    const deactivate = document.getElementById("godModeDeactivate");
    const status = document.getElementById("godModeStatus");
    if (!activate || !deactivate || !status) return;
    const active = godModeActive();
    activate.style.display = active ? "none" : "inline-block";
    deactivate.style.display = active ? "inline-block" : "none";
    status.textContent = active ? "MODO DEUS: ATIVO" : "MODO DEUS: DESATIVADO";
    status.style.color = active ? "#7ee787" : "#bdb7a8";
  }

  function activateGodMode() {
    if (typeof player !== "undefined" && player) {
      localStorage.setItem("sunwalker_god_saved_coins", String(Math.max(0, Number(player.coins) || 0)));
    }
    localStorage.setItem(GOD_KEY, "true");
    updateGodModeUI();
    refreshGodModeResources();
  }

  function refreshGodModeResources() {
    if (!godModeActive() || typeof player === "undefined" || !player) return;
    player.hp = player.maxHp;
    player.coins = 999999;
    // Modo Deus: stamina infinita.
    player.stamina = player.maxStamina;
    player.state = player.isDead() ? "idle" : player.state;
    const gameOver = document.getElementById("gameOver");
    if (gameOver) gameOver.classList.add("hidden");
  }

  function setupGodMode() {
    const activate = document.getElementById("godModeActivate");
    const deactivate = document.getElementById("godModeDeactivate");
    if (!activate || !deactivate || activate.dataset.godBound === "true") return;
    activate.dataset.godBound = "true";
    activate.addEventListener("click", activateGodMode);
    deactivate.addEventListener("click", () => {
      const saved = Number(localStorage.getItem("sunwalker_god_saved_coins"));
      localStorage.removeItem(GOD_KEY);
      if (typeof player !== "undefined" && player && Number.isFinite(saved)) player.coins = saved;
      localStorage.removeItem("sunwalker_god_saved_coins");
      if (typeof refreshSkillUI === "function") refreshSkillUI();
      updateGodModeUI();
    });
    updateGodModeUI();
  }

  setInterval(() => { setupGodMode(); updateGodModeUI(); refreshGodModeResources(); }, 100);
  setupGodMode();

  // O sistema antigo de áudio Alpha 1.9 não é mais carregado aqui,
  // para não sobrescrever a playlist aleatória da Alpha 1.9.

  const merchantScript = document.createElement("script");
  merchantScript.src = "js/merchant-skill-ui-alpha18.js";
  merchantScript.defer = false;
  document.head.appendChild(merchantScript);
})();
