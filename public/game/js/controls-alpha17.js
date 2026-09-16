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
    if (!activate || !deactivate || activate.dataset.godBound === "true") return;
    activate.dataset.godBound = "true";
    activate.addEventListener("click", activateGodMode);
    deactivate.addEventListener("click", () => { localStorage.removeItem(GOD_KEY); updateGodModeUI(); });
    updateGodModeUI();
  }

  setInterval(() => { setupGodMode(); updateGodModeUI(); refreshGodModeResources(); }, 100);
  setupGodMode();

  const script = document.createElement("script");
  script.src = "js/alpha18-audio-ui.js";
  script.defer = false;
  document.head.appendChild(script);

  const merchantScript = document.createElement("script");
  merchantScript.src = "js/merchant-skill-ui-alpha18.js";
  merchantScript.defer = false;
  document.head.appendChild(merchantScript);
})();
