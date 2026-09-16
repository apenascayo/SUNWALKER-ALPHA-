(() => {
  // Alpha 1.8: mantém o DASH original do jogo (teleporte),
  // com som e animação do sistema base. Defesa e corrida continuam desativadas.
  const originalInputDown = Input.down.bind(Input);
  const originalInputConsume = Input.consume.bind(Input);

  Input.down = function(key) {
    return originalInputDown(key);
  };

  Input.consume = function(key) {
    if (key === "f") return originalInputConsume(" ");
    return originalInputConsume(key);
  };

  Player.prototype.isDefending = function() { return false; };
  Player.prototype.canRun = function() { return false; };

  // Modo Deus: controle direto da UI e proteção contínua dos recursos.
  // O sistema fica persistente no navegador até ser desativado.
  const GOD_KEY = "sunwalker_god_mode";
  const GOD_PASSWORD = "FTK";

  function godModeActive() {
    return localStorage.getItem(GOD_KEY) === "true";
  }

  function updateGodModeUI() {
    const password = document.getElementById("godModePassword");
    const activate = document.getElementById("godModeActivate");
    const deactivate = document.getElementById("godModeDeactivate");
    const status = document.getElementById("godModeStatus");
    if (!password || !activate || !deactivate || !status) return;

    const active = godModeActive();
    password.style.display = active ? "none" : "inline-block";
    activate.style.display = active ? "none" : "inline-block";
    deactivate.style.display = active ? "inline-block" : "none";
    status.textContent = active ? "MODO DEUS: ATIVO" : "MODO DEUS: DESATIVADO";
    status.style.color = active ? "#7ee787" : "#bdb7a8";
  }

  function activateGodMode() {
    const password = document.getElementById("godModePassword");
    const status = document.getElementById("godModeStatus");
    if (!password || !status) return;

    if (password.value.trim().toUpperCase() !== GOD_PASSWORD) {
      status.textContent = "SENHA INCORRETA";
      status.style.color = "#e06c75";
      password.select();
      return;
    }

    localStorage.setItem(GOD_KEY, "true");
    password.value = "";
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
    const password = document.getElementById("godModePassword");
    if (!activate || !deactivate || !password) return;
    if (activate.dataset.godBound === "true") return;

    activate.dataset.godBound = "true";
    activate.addEventListener("click", activateGodMode);
    deactivate.addEventListener("click", () => {
      localStorage.removeItem(GOD_KEY);
      updateGodModeUI();
    });
    password.addEventListener("input", () => {
      if (password.value.length === 3) activateGodMode();
    });
    password.addEventListener("keydown", event => {
      if (event.key === "Enter") activateGodMode();
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

  // Carrega as melhorias da Alpha 1.8 depois dos sistemas base.
  const script = document.createElement("script");
  script.src = "js/alpha18-audio-ui.js";
  script.defer = false;
  document.head.appendChild(script);
})();
