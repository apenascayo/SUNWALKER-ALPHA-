(() => {
  // Sunwalker Alpha 1.8.5 — sistemas temporariamente desativados + menu/ranking/HUD.
  const VERSION = "Alpha 1.8.5";
  const RANKING_KEY = "sunwalker_highest_wave";
  const DISABLED_LIGHTNING = "sunwalker_lightning_sword";
  const DISABLED_FISHING_KEYS = [
    "sunwalker_fishing_rod",
    "sunwalker_fishing_owned",
    "sunwalker_fishing_rod_owned",
    "sunwalker_fish",
    "sunwalker_fishing"
  ];

  // 1) ESPADA DE RAIO: desativada até segunda ordem.
  localStorage.removeItem(DISABLED_LIGHTNING);
  const disableLightning = () => {
    try {
      localStorage.removeItem(DISABLED_LIGHTNING);
      if (typeof player !== "undefined" && player && player.skills) player.skills.lightningSword = false;
      const card = document.getElementById("skillLightning");
      if (card) card.remove();
    } catch (_) {}
  };
  setInterval(disableLightning, 250);
  disableLightning();

  // 2) REPUTAÇÃO: sistema congelado/desativado até segunda ordem.
  const disableReputation = () => {
    try {
      const label = document.getElementById("reputationText");
      const bar = document.getElementById("reputationBar");
      const labelWrap = bar && bar.parentElement && bar.parentElement.previousElementSibling;
      if (labelWrap) labelWrap.style.display = "none";
      if (bar && bar.parentElement) bar.parentElement.style.display = "none";
      if (label && label.parentElement) label.parentElement.style.display = "none";
      if (typeof player !== "undefined" && player) player.reputation = 50;
    } catch (_) {}
  };
  setInterval(disableReputation, 500);
  disableReputation();

  // 3) PESCARIA: toda a funcionalidade fica inativa até segunda ordem.
  function disableFishing() {
    DISABLED_FISHING_KEYS.forEach(key => localStorage.removeItem(key));
    try {
      if (typeof window.drawFishingMarker === "function") window.drawFishingMarker = function() {};
      ["fishingOverlay", "fishingModal", "fishingArea", "fishingInventory", "fishModal", "fishingShop"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
      });
      document.querySelectorAll("[id*='fishing'],[id*='Fishing'],[class*='fishing'],[class*='Fishing']").forEach(el => {
        if (el.id !== "settingsOverlay") el.style.display = "none";
      });
    } catch (_) {}
  }
  setInterval(disableFishing, 300);
  disableFishing();

  // Impede a tecla ESPAÇO de iniciar qualquer rotina de pescaria antiga.
  window.addEventListener("keydown", event => {
    if (event.code === "Space" && document.body.dataset.fishingDisabled === "true") event.stopImmediatePropagation();
  }, true);
  document.body.dataset.fishingDisabled = "true";

  // 4) CHEFÃO INVOCADOR: rosa. A pintura original usa opts.boss; interceptamos apenas as cores
  // usadas durante o desenho do corpo do boss, sem alterar os demais inimigos.
  let bossRenderDepth = 0;
  const originalFillStyleDescriptor = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, "fillStyle");
  if (originalFillStyleDescriptor && originalFillStyleDescriptor.set && !window.__alpha185PinkBossHook) {
    window.__alpha185PinkBossHook = true;
    Object.defineProperty(CanvasRenderingContext2D.prototype, "fillStyle", {
      configurable: originalFillStyleDescriptor.configurable,
      enumerable: originalFillStyleDescriptor.enumerable,
      get: originalFillStyleDescriptor.get,
      set(value) {
        if (bossRenderDepth > 0) {
          const map = {
            "#111214": "#7a164f",
            "#050506": "#d94f91",
            "#17181b": "#351526",
            "#ffd37a": "#ff9fcb"
          };
          value = map[value] || value;
        }
        originalFillStyleDescriptor.set.call(this, value);
      }
    });
  }

  function installPinkBoss() {
    if (typeof window.drawCharacterBody !== "function" || window.__alpha185DrawBodyHook) return;
    const base = window.drawCharacterBody;
    window.drawCharacterBody = function(x, y, dir, scale, opts) {
      if (opts && opts.boss) {
        bossRenderDepth++;
        try { return base.apply(this, arguments); }
        finally { bossRenderDepth--; }
      }
      return base.apply(this, arguments);
    };
    window.__alpha185DrawBodyHook = true;
  }
  setInterval(installPinkBoss, 100);
  installPinkBoss();

  // 5) HABILIDADES ATIVAS: somente com TAB e no canto inferior esquerdo.
  function getSkillStatus() {
    let el = document.getElementById("alpha18SkillStatus");
    if (!el) {
      el = document.createElement("div");
      el.id = "alpha18SkillStatus";
      document.body.appendChild(el);
    }
    el.style.cssText = "position:fixed;left:18px;bottom:18px;top:auto;z-index:10004;display:none;gap:6px;flex-direction:column;pointer-events:none;font:700 11px Arial;letter-spacing:.45px;";
    return el;
  }
  let skillVisible = false;
  function refreshSkills() {
    const el = getSkillStatus();
    const ally = localStorage.getItem("sunwalker_ally_sheath") === "true";
    const items = [];
    if (ally) items.push("🔵 BAINHA DE CONVERSÃO");
    el.innerHTML = items.map(text => `<div style="padding:7px 10px;background:rgba(8,12,16,.94);border:1px solid rgba(232,180,59,.7);border-left:3px solid #e8b43b;border-radius:5px;color:#f5ead0;box-shadow:0 3px 12px rgba(0,0,0,.4)">${text}<span style="display:block;margin-top:3px;font-size:9px;color:#9be09b;letter-spacing:.7px">ATIVA</span></div>`).join("");
    el.style.display = skillVisible && items.length ? "flex" : "none";
  }
  window.addEventListener("keydown", event => {
    if (event.key !== "Tab") return;
    event.preventDefault();
    skillVisible = !skillVisible;
    refreshSkills();
  }, true);
  setInterval(refreshSkills, 300);
  refreshSkills();

  // 6) RANKING: maior onda alcançada + data.
  function saveHighestWave() {
    if (typeof waveCounter === "undefined") return;
    const current = Math.max(1, Number(waveCounter) || 1);
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(RANKING_KEY) || "{}"); } catch (_) {}
    if (!saved.wave || current > Number(saved.wave)) {
      localStorage.setItem(RANKING_KEY, JSON.stringify({ wave: current, date: new Date().toISOString().split("T")[0] }));
    }
  }
  setInterval(saveHighestWave, 500);

  // 7) MENU INICIAL.
  function injectMenuStyles() {
    if (document.getElementById("alpha185MenuStyles")) return;
    const style = document.createElement("style");
    style.id = "alpha185MenuStyles";
    style.textContent = `
      #alpha185Menu{position:fixed;inset:0;z-index:20000;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at center,rgba(31,25,22,.68),rgba(5,6,7,.94));font-family:Arial,sans-serif;color:#f4ead0}
      #alpha185Menu .menu-box{width:min(420px,88vw);padding:38px 34px;background:rgba(12,12,14,.96);border:1px solid rgba(232,180,59,.65);box-shadow:0 16px 60px rgba(0,0,0,.7);text-align:center}
      #alpha185Menu h1{margin:0 0 5px;font-size:38px;letter-spacing:5px;color:#f2dfaa}
      #alpha185Menu .version{font-size:11px;letter-spacing:2px;color:#bdb7a8;margin-bottom:30px}
      #alpha185Menu button{display:block;width:100%;margin:10px 0;padding:13px;background:#17191c;border:1px solid #75602e;color:#f4ead0;font-weight:700;letter-spacing:1.2px;cursor:pointer}
      #alpha185Menu button:hover{background:#29251b;border-color:#d6ad4c}
      #alpha185Menu .rank-info{margin-top:18px;padding:14px;border-top:1px solid rgba(232,180,59,.25);font-size:12px;color:#cfc6b3;line-height:1.7}
    `;
    document.head.appendChild(style);
  }

  function showMenu() {
    injectMenuStyles();
    let menu = document.getElementById("alpha185Menu");
    if (!menu) {
      menu = document.createElement("div");
      menu.id = "alpha185Menu";
      menu.innerHTML = `<div class="menu-box"><h1>SUNWALKER</h1><div class="version">${VERSION}</div><button id="alpha185Start">INICIAR</button><button id="alpha185Config">CONFIGURAÇÃO</button><button id="alpha185Ranking">RANKING</button><div class="rank-info" id="alpha185RankInfo"></div></div>`;
      document.body.appendChild(menu);
      document.getElementById("alpha185Start").addEventListener("click", () => {
        const play = document.getElementById("playButton");
        if (play) play.click();
        menu.style.display = "none";
      });
      document.getElementById("alpha185Config").addEventListener("click", () => {
        const settings = document.getElementById("settingsOverlay");
        if (settings) settings.classList.remove("hidden");
      });
      document.getElementById("alpha185Ranking").addEventListener("click", () => {
        const info = document.getElementById("alpha185RankInfo");
        let saved = {};
        try { saved = JSON.parse(localStorage.getItem(RANKING_KEY) || "{}"); } catch (_) {}
        info.innerHTML = saved.wave ? `MAIOR ONDA: <b>ONDA ${saved.wave}</b><br>DATA: ${saved.date}` : "NENHUM RECORDE REGISTRADO";
      });
    }
    menu.style.display = "flex";
    const start = document.getElementById("startOverlay");
    if (start) start.classList.add("hidden");
  }

  function initMenu() {
    // O jogo só começa quando INICIAR for acionado.
    if (typeof gameStarted !== "undefined") gameStarted = false;
    const start = document.getElementById("startOverlay");
    if (start) start.classList.add("hidden");
    showMenu();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initMenu, { once: true });
  else initMenu();

  document.title = `Sunwalker — ${VERSION}`;
})();
