(() => {
  // Sunwalker Alpha 2.0 — sistemas temporariamente desativados + menu/ranking/HUD.
  const VERSION = "Alpha 2.0";
  const RANKING_KEY = "sunwalker_highest_wave";
  const FISHING_KEYS = [
    "sunwalker_fishing_rod",
    "sunwalker_fishing_owned",
    "sunwalker_fishing_rod_owned",
    "sunwalker_fish",
    "sunwalker_fishing"
  ];

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
  // O sistema de reputação já está desativado; uma aplicação inicial é suficiente.


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
  // Pesca permanece desativada nesta versão; não é necessário revarrer o DOM continuamente.


  function isPlayerInSafeHouse() {
    return false; // CASA SEGURA DESATIVADA TEMPORARIAMENTE
    if (typeof player === "undefined" || !player || typeof CONFIG === "undefined") return false;
    return player.x >= CONFIG.safeHouseMinX && player.x <= CONFIG.safeHouseMaxX && player.y >= CONFIG.safeHouseMinY && player.y <= CONFIG.safeHouseMaxY;
  }
  window.isPlayerInSafeHouse = isPlayerInSafeHouse;

  function drawSafeHouse() {
    return; // CASA SEGURA DESATIVADA TEMPORARIAMENTE
    if (typeof ctx === "undefined" || typeof Camera === "undefined" || typeof CONFIG === "undefined") return;
    const minX = CONFIG.safeHouseMinX, maxX = CONFIG.safeHouseMaxX, minY = CONFIG.safeHouseMinY, maxY = CONFIG.safeHouseMaxY;
    ctx.save();
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const s = Camera.worldToScreen(x, y);
        const w = (Number(CONFIG.TILE_WIDTH) || 72) / 2;
        const h = (Number(CONFIG.TILE_HEIGHT) || 36) / 2;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y - h); ctx.lineTo(s.x + w, s.y); ctx.lineTo(s.x, s.y + h); ctx.lineTo(s.x - w, s.y); ctx.closePath();
        ctx.fillStyle = ((x + y) & 1) ? "#477a43" : "#548e4d";
        ctx.fill();
        ctx.strokeStyle = "rgba(32,63,29,.38)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    const center = Camera.worldToScreen((minX + maxX) / 2, (minY + maxY) / 2);
    const w = (maxX - minX) * CONFIG.TILE_WIDTH * 0.62;
    const h = (maxY - minY) * CONFIG.TILE_HEIGHT * 0.62;
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = "#b8df9d";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(center.x, center.y, w, h, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#eff7d8";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("CASA SEGURA", center.x, center.y - h - 14);
    ctx.font = "bold 11px Arial";
    ctx.fillText("ZONA PROTEGIDA", center.x, center.y + h + 17);
    ctx.restore();
  }

  // O invocador usa a própria camisa para o destaque rosa. Não há círculo/halo.
  function tintSummonerBosses() {
    if (typeof ctx === "undefined" || typeof Camera === "undefined" || typeof enemies === "undefined") return;
    for (const enemy of enemies) {
      if (!enemy || !enemy.isBoss || enemy.type !== "summonerBoss" || enemy.isDead()) continue;
      const s = Camera.worldToScreen(enemy.x, enemy.y);
      const scale = (0.82 + (CONFIG.bossExtraPixels || 0) / 60) * CONFIG.zoom;
      ctx.save();
      ctx.translate(s.x, s.y - 12 * scale);
      ctx.scale(scale, scale);
      ctx.fillStyle = "#b83273";
      ctx.fillRect(-13, -12, 26, 23);
      ctx.fillStyle = "#e05a9b";
      ctx.fillRect(-9, -8, 18, 15);
      ctx.restore();
    }
  }

  // Alpha 2.0: o modal de música permanece visível e acima do contador de onda.
  function hideMusicNames() {
    const el = document.getElementById("sunwalkerNowPlaying");
    if (el) { el.hidden = false; el.style.display = "block"; }
  }
  hideMusicNames();
  setTimeout(hideMusicNames, 0);



  // HABILIDADES ATIVAS: somente TAB, no lado oposto ao mapa (canto inferior direito).
  let skillVisible = false;
  function refreshSkills() {
    let el = document.getElementById("alpha185SkillStatus");
    if (!el) {
      el = document.createElement("div");
      el.id = "alpha185SkillStatus";
      document.body.appendChild(el);
    }
    el.style.cssText = "position:fixed;right:18px;bottom:18px;left:auto;top:auto;z-index:10004;display:none;gap:6px;flex-direction:column;align-items:flex-end;pointer-events:none;font:700 11px Arial;letter-spacing:.45px;";
    const items = [];
    if (localStorage.getItem("sunwalker_ally_sheath") === "true") items.push("BAINHA — CONVERSÃO");
    el.innerHTML = items.map(text => `<div style="padding:7px 10px;background:rgba(8,12,16,.94);border:1px solid rgba(232,180,59,.7);border-right:3px solid #e8b43b;border-radius:5px;color:#f5ead0;box-shadow:0 3px 12px rgba(0,0,0,.4);text-align:right">${text}<span style="display:block;margin-top:3px;font-size:9px;color:#9be09b;letter-spacing:.7px">ATIVA</span></div>`).join("");
    el.style.display = skillVisible && items.length ? "flex" : "none";
  }
  window.addEventListener("keydown", event => {
    if (event.key !== "Tab") return;
    event.preventDefault();
    skillVisible = !skillVisible;
    refreshSkills();
  }, true);
  // A HUD de habilidades é atualizada quando aberta/fechada, evitando trabalho periódico desnecessário.

  refreshSkills();

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

  // Registro resumido das últimas atualizações, exibido no botão NOVIDADES.
  const CHANGELOG = [
    {
      date: "Alpha 2.0",
      title: "Freira, Radii Divini e arte pixel 16-bit",
      added: [
        "Nova personagem FREIRA: comerciante exclusiva de magias.",
        "Nova magia RADII DIVINI — invoca um círculo sagrado que atinge inimigos com raios do céu, sem paralisar.",
        "Animação e som de magia aprimorados (magic.mp3).",
        "Arte pixel 16-bit refeita para jogador e inimigos: anatomia completa, sombreamento, animações de ataque (espada, bainha, arco, magia) e respiração no idle.",
        "Botão de NOVIDADES na tela principal com o histórico de atualizações."
      ],
      removed: [
        "RADII DIVINI removida do Mercador comum (agora exclusiva da Freira)."
      ],
      fixed: [
        "RADII DIVINI agora é consumível: cada compra concede 1 carga; use com R + ataque e compre mais com a Freira quando acabar.",
        "Tela de CONFIGURAÇÕES não abre mais atrás do menu principal.",
        "Acesso direto ao jogo ao abrir o link principal, sem página de apresentação intermediária.",
        "Adicionada animação de corte de tela ao clicar em PLAY.",
        "Otimizações de desempenho: culling de inimigos fora da tela e canvas de pixelização reduzido."
      ]
    }
  ];

  function changelogListHtml(label, items) {
    if (!items || !items.length) return "";
    return `<p class="changelog-label">${label}</p><ul>${items.map(i => `<li>${i}</li>`).join("")}</ul>`;
  }

  function buildChangelogHtml() {
    return CHANGELOG.map(entry => `
      <div class="changelog-entry">
        <h3>${entry.title} <span>${entry.date}</span></h3>
        ${changelogListHtml("ADICIONADO", entry.added)}
        ${changelogListHtml("REMOVIDO", entry.removed)}
        ${changelogListHtml("CORRIGIDO", entry.fixed)}
      </div>`).join("");
  }

  function showChangelog() {
    injectMenuStyles();
    let modal = document.getElementById("alpha185Changelog");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "alpha185Changelog";
      modal.innerHTML = `<div class="changelog-box"><h1>NOVIDADES</h1><div class="changelog-list">${buildChangelogHtml()}</div><button id="alpha185CloseChangelog">FECHAR</button></div>`;
      document.body.appendChild(modal);
      document.getElementById("alpha185CloseChangelog").addEventListener("click", () => {
        modal.style.display = "none";
      });
    }
    modal.style.display = "flex";
  }

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
      #alpha185Changelog{position:fixed;inset:0;z-index:20010;display:none;align-items:center;justify-content:center;background:rgba(5,6,7,.92);font-family:Arial,sans-serif;color:#f4ead0}
      #alpha185Changelog .changelog-box{width:min(560px,92vw);max-height:82vh;display:flex;flex-direction:column;padding:28px 30px;background:rgba(12,12,14,.98);border:1px solid rgba(232,180,59,.65);box-shadow:0 16px 60px rgba(0,0,0,.7)}
      #alpha185Changelog h1{margin:0 0 14px;font-size:26px;letter-spacing:4px;color:#f2dfaa;text-align:center}
      #alpha185Changelog .changelog-list{overflow-y:auto;padding-right:6px;margin-bottom:16px}
      #alpha185Changelog .changelog-entry{margin-bottom:16px}
      #alpha185Changelog .changelog-entry h3{margin:0 0 8px;font-size:15px;color:#f2dfaa}
      #alpha185Changelog .changelog-entry h3 span{float:right;font-size:11px;color:#9b937f;letter-spacing:1px}
      #alpha185Changelog .changelog-label{margin:10px 0 4px;font-size:11px;letter-spacing:1.4px;color:#d6ad4c}
      #alpha185Changelog ul{margin:0;padding-left:18px;font-size:12.5px;line-height:1.6;color:#dcd4c2}
      #alpha185Changelog button{display:block;width:100%;padding:12px;background:#17191c;border:1px solid #75602e;color:#f4ead0;font-weight:700;letter-spacing:1.2px;cursor:pointer}
      #alpha185Changelog button:hover{background:#29251b;border-color:#d6ad4c}
    `;
    document.head.appendChild(style);
  }

  function showMenu() {
    injectMenuStyles();
    let menu = document.getElementById("alpha185Menu");
    if (!menu) {
      menu = document.createElement("div");
      menu.id = "alpha185Menu";
      menu.innerHTML = `<div class="menu-box"><h1>SUNWALKER</h1><div class="version">${VERSION}</div><button id="alpha185Start">INICIAR</button><button id="alpha185Config">CONFIGURAÇÃO</button><button id="alpha185Ranking">RANKING</button><button id="alpha185News">NOVIDADES</button><div class="rank-info" id="alpha185RankInfo"></div></div>`;
      document.body.appendChild(menu);
      document.getElementById("alpha185Start").addEventListener("click", () => {
        const play = document.getElementById("playButton");
        if (play) play.click();
        menu.style.display = "none";
      });
      document.getElementById("alpha185Config").addEventListener("click", () => {
        const settings = document.getElementById("settingsOverlay");
        if (settings) settings.classList.remove("hidden");
        // O menu principal compartilha o mesmo z-index do settingsOverlay e é
        // inserido depois no DOM, então fica por cima; escondê-lo evita que a
        // tela de configurações abra "atrás de tudo".
        menu.style.display = "none";
      });
      document.getElementById("alpha185Ranking").addEventListener("click", () => {
        const info = document.getElementById("alpha185RankInfo");
        let saved = {};
        try { saved = JSON.parse(localStorage.getItem(RANKING_KEY) || "{}"); } catch (_) {}
        info.innerHTML = saved.wave ? `MAIOR ONDA: <b>ONDA ${saved.wave}</b><br>DATA: ${saved.date}` : "NENHUM RECORDE REGISTRADO";
      });
      document.getElementById("alpha185News").addEventListener("click", showChangelog);
      const closeSettingsButton = document.getElementById("closeSettingsButton");
      if (closeSettingsButton) {
        closeSettingsButton.addEventListener("click", () => {
          if (typeof gameStarted !== "undefined" && !gameStarted) menu.style.display = "flex";
        });
      }
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

  // O terreno da casa segura deve fazer parte do cenário, antes de entidades/HUD do canvas,
  // e nunca ser desenhado como uma camada por cima do jogador, NPCs ou minimapa.
  window.drawSafeHouse = drawSafeHouse;
  const baseDrawGame = window.drawGame;
  if (typeof baseDrawGame === "function" && !window.__alpha185DrawHook) {
    window.__alpha185DrawHook = true;
    window.drawGame = function() {
      baseDrawGame();
      tintSummonerBosses();
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initMenu, { once: true });
  else initMenu();
  document.title = `Sunwalker — ${VERSION}`;
})();
