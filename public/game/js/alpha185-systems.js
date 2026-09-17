(() => {
  // Sunwalker Alpha 1.8.5 — sistemas temporariamente desativados + menu/ranking/HUD.
  const VERSION = "Alpha 1.8.5";
  const RANKING_KEY = "sunwalker_highest_wave";
  const LIGHTNING_KEY = "sunwalker_lightning_sword";
  const FISHING_KEYS = [
    "sunwalker_fishing_rod",
    "sunwalker_fishing_owned",
    "sunwalker_fishing_rod_owned",
    "sunwalker_fish",
    "sunwalker_fishing"
  ];

  // ESPADA DE RELÂMPAGO: totalmente desativada até segunda ordem.
  function disableLightning() {
    try {
      localStorage.removeItem(LIGHTNING_KEY);
      if (typeof player !== "undefined" && player) {
        if (!player.skills) player.skills = {};
        player.skills.lightningSword = false;
      }
      const card = document.getElementById("skillLightning");
      if (card) card.remove();
      document.querySelectorAll("[id*='lightning'],[id*='Lightning'],[class*='lightning'],[class*='Lightning']").forEach(el => {
        if (el.id !== "alpha185Menu") el.style.display = "none";
      });
    } catch (_) {}
  }
  disableLightning();
  setInterval(disableLightning, 250);

  // REPUTAÇÃO: congela o valor e remove toda a apresentação visual.
  let reputationLocked = false;
  function disableReputation() {
    try {
      if (typeof player !== "undefined" && player && !reputationLocked) {
        const descriptor = Object.getOwnPropertyDescriptor(player, "reputation");
        if (!descriptor || descriptor.configurable !== false) {
          Object.defineProperty(player, "reputation", {
            configurable: true,
            enumerable: descriptor ? descriptor.enumerable : true,
            get: () => 50,
            set: () => {}
          });
          reputationLocked = true;
        }
      }
      document.querySelectorAll("#reputationText,#reputationBar").forEach(el => {
        el.style.display = "none";
        if (el.parentElement) el.parentElement.style.display = "none";
      });
      document.querySelectorAll(".bar-label").forEach(el => {
        if ((el.textContent || "").toUpperCase().includes("REPUTAÇÃO")) el.style.display = "none";
      });
      document.querySelectorAll(".bar.reputation").forEach(el => el.style.display = "none");
    } catch (_) {}
  }
  disableReputation();
  setInterval(disableReputation, 500);

  // PESCARIA: scripts de entrada são removidos do HTML e este bloqueio limpa estados antigos.
  function disableFishing() {
    FISHING_KEYS.forEach(key => localStorage.removeItem(key));
    try {
      ["fishingOverlay", "fishingModal", "fishingArea", "fishingInventory", "fishModal", "fishingShop"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
      });
      document.querySelectorAll("[id*='fishing'],[id*='Fishing'],[class*='fishing'],[class*='Fishing']").forEach(el => {
        if (!el.closest("#alpha185Menu") && el.id !== "settingsOverlay") el.style.display = "none";
      });
    } catch (_) {}
  }
  disableFishing();
  setInterval(disableFishing, 500);

  // Repainta a antiga área de pesca com o terreno normal depois do render base.
  function coverFishingArea() {
    if (typeof ctx === "undefined" || typeof Camera === "undefined" || typeof CONFIG === "undefined") return;
    const minX = 82, maxX = 94, minY = 80, maxY = 94;
    ctx.save();
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const s = Camera.worldToScreen(x, y);
        const w = (Number(CONFIG.TILE_WIDTH) || 72) / 2;
        const h = (Number(CONFIG.TILE_HEIGHT) || 36) / 2;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y - h); ctx.lineTo(s.x + w, s.y); ctx.lineTo(s.x, s.y + h); ctx.lineTo(s.x - w, s.y); ctx.closePath();
        ctx.fillStyle = ((x + y) & 1) ? "#98764d" : "#8d6d47";
        ctx.fill();
        ctx.strokeStyle = "rgba(65,48,31,.28)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // CHEFÃO INVOCADOR: destaque visual rosa sem alterar os outros inimigos.
  function tintSummonerBosses() {
    if (typeof ctx === "undefined" || typeof Camera === "undefined" || typeof enemies === "undefined") return;
    const now = performance.now();
    ctx.save();
    ctx.globalCompositeOperation = "source-atop";
    for (const enemy of enemies) {
      if (!enemy || !enemy.isBoss || enemy.type !== "summonerBoss" || enemy.isDead()) continue;
      const s = Camera.worldToScreen(enemy.x, enemy.y);
      const pulse = 0.28 + Math.sin(now / 240) * 0.06;
      ctx.fillStyle = `rgba(235,70,145,${pulse})`;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y - 28, 24, 38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,125,190,.45)";
      ctx.beginPath();
      ctx.arc(s.x, s.y - 48, 12, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Remove o antigo aviso/nome da música.
  function hideMusicNames() {
    ["sunwalkerNowPlaying", "musicNowPlaying", "musicStatus"].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.hidden = true;
        el.style.display = "none";
        el.textContent = "";
      }
    });
  }
  hideMusicNames();
  setInterval(hideMusicNames, 300);

  // HABILIDADES ATIVAS: somente TAB, canto inferior esquerdo.
  let skillVisible = false;
  function refreshSkills() {
    let el = document.getElementById("alpha185SkillStatus");
    if (!el) {
      el = document.createElement("div");
      el.id = "alpha185SkillStatus";
      document.body.appendChild(el);
    }
    el.style.cssText = "position:fixed;left:18px;bottom:18px;top:auto;z-index:10004;display:none;gap:6px;flex-direction:column;pointer-events:none;font:700 11px Arial;letter-spacing:.45px;";
    const items = [];
    if (localStorage.getItem("sunwalker_ally_sheath") === "true") items.push("BAINHA — CONVERSÃO");
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

  // RANKING: guarda somente a maior onda e a data em que o recorde foi alcançado.
  function readCurrentWave() {
    const el = document.getElementById("nextWaveNumber");
    if (!el) return 1;
    const next = Number.parseInt(el.textContent, 10);
    return Number.isFinite(next) ? Math.max(1, next - 1) : 1;
  }
  function saveHighestWave() {
    const current = readCurrentWave();
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(RANKING_KEY) || "{}"); } catch (_) {}
    if (!saved.wave || current > Number(saved.wave)) {
      localStorage.setItem(RANKING_KEY, JSON.stringify({ wave: current, date: new Date().toISOString().split("T")[0] }));
    }
  }
  setInterval(saveHighestWave, 500);

  // MENU INICIAL.
  function injectMenuStyles() {
    if (document.getElementById("alpha185MenuStyles")) return;
    const style = document.createElement("style");
    style.id = "alpha185MenuStyles";
    style.textContent = `
      #alpha185Menu{position:fixed;inset:0;z-index:20000;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at center,rgba(31,25,22,.68),rgba(5,6,7,.96));font-family:Arial,sans-serif;color:#f4ead0}
      #alpha185Menu .menu-box{width:min(420px,88vw);padding:38px 34px;background:rgba(12,12,14,.97);border:1px solid rgba(232,180,59,.65);box-shadow:0 16px 60px rgba(0,0,0,.7);text-align:center}
      #alpha185Menu h1{margin:0 0 5px;font-size:38px;letter-spacing:5px;color:#f2dfaa}
      #alpha185Menu .version{font-size:11px;letter-spacing:2px;color:#bdb7a8;margin-bottom:30px}
      #alpha185Menu button{display:block;width:100%;margin:10px 0;padding:13px;background:#17191c;border:1px solid #75602e;color:#f4ead0;font-weight:700;letter-spacing:1.2px;cursor:pointer}
      #alpha185Menu button:hover{background:#29251b;border-color:#d6ad4c}
      #alpha185Menu .rank-info{margin-top:18px;padding:14px;border-top:1px solid rgba(232,180,59,.25);font-size:12px;color:#cfc6b3;line-height:1.7;min-height:18px}
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
    const start = document.getElementById("startOverlay");
    if (start) start.classList.add("hidden");
    showMenu();
  }

  // Encadeia o render final sem substituir os sistemas base.
  const baseDrawGame = window.drawGame;
  if (typeof baseDrawGame === "function" && !window.__alpha185DrawHook) {
    window.__alpha185DrawHook = true;
    window.drawGame = function() {
      baseDrawGame();
      coverFishingArea();
      tintSummonerBosses();
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initMenu, { once: true });
  else initMenu();
  document.title = `Sunwalker — ${VERSION}`;
})();
