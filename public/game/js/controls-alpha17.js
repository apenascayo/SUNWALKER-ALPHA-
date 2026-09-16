(() => {
  // Alpha 1.8: mantém o DASH original do jogo (teleporte),
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

  function godModeActive() {
    return localStorage.getItem(GOD_KEY) === "true";
  }

  function updateGodModeUI() {
    const activate = document.getElementById("godModeActivate");
    const deactivate = document.getElementById("godModeDeactivate");
    const status = document.getElementById("godModeStatus");
    const password = document.getElementById("godModePassword");
    if (!activate || !deactivate || !status) return;

    const active = godModeActive();
    if (password) password.style.display = "none";
    activate.style.display = active ? "none" : "inline-block";
    deactivate.style.display = active ? "inline-block" : "none";
    status.textContent = active ? "MODO DEUS: ATIVO" : "MODO DEUS: DESATIVADO";
    status.style.color = active ? "#7ee787" : "#bdb7a8";
  }

  function activateGodMode() {
    localStorage.setItem(GOD_KEY, "true");
    updateGodModeUI();
    refreshGodModeResources();
  }

  function refreshGodModeResources() {
    if (!godModeActive() || typeof player === "undefined" || !player) return;
    player.hp = player.maxHp;
    player.coins = 999999;
    player.state = player.isDead() ? "idle" : player.state;
    const gameOver = document.getElementById("gameOver");
    if (gameOver) gameOver.classList.add("hidden");
  }

  function setupGodMode() {
    const activate = document.getElementById("godModeActivate");
    const deactivate = document.getElementById("godModeDeactivate");
    if (!activate || !deactivate) return;
    if (activate.dataset.godBound === "true") return;

    activate.dataset.godBound = "true";
    activate.addEventListener("click", activateGodMode);
    deactivate.addEventListener("click", () => {
      localStorage.removeItem(GOD_KEY);
      updateGodModeUI();
    });
    updateGodModeUI();
  }

  setInterval(() => {
    setupGodMode();
    updateGodModeUI();
    refreshGodModeResources();
  }, 100);
  setupGodMode();

  console.info("[Sunwalker] Alpha 1.8: audio de combate, musica aleatoria, contador de wave, modo deus e feedback de habilidades.");

  const script = document.createElement("script");
  script.src = "js/alpha18-audio-ui.js";
  script.defer = false;
  document.head.appendChild(script);
})();
