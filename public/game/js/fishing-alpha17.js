(() => {
  const FISHING_AREA = { minX: 82, maxX: 94, minY: 80, maxY: 94 };
  const ROD_COST = 60;
  const ROD_STORAGE = "sunwalker_fishing_rod";
  const FISH_STORAGE = "sunwalker_fish_inventory";

  const FISH = [
    { rarity: "Comum", weight: 60, healAmount: 10, sellValue: 8, speed: 0.95, size: 22 },
    { rarity: "Incomum", weight: 25, healAmount: 20, sellValue: 15, speed: 1.15, size: 20 },
    { rarity: "Raro", weight: 10, healAmount: 35, sellValue: 25, speed: 1.35, size: 18 },
    { rarity: "Épico", weight: 4, healAmount: 50, sellValue: 40, speed: 1.55, size: 16 },
    { rarity: "Lendário", weight: 1, healAmount: 75, sellValue: 75, speed: 1.8, size: 14 }
  ];

  const FISHING_PLAYLIST = [
    "assets/music/Sertão do Shakuhachi.wav",
    "assets/music/Sertão do Shakuhachi 2.wav"
  ];

  let fishingState = "NORMAL";
  let previousPaused = false;
  let waitTimer = 0;
  let minigameTimer = 0;
  let minigameFrame = 0;
  let catchProgress = 0.35;
  let fishPosition = 0.5;
  let fishDirection = 1;
  let playerBar = 0.5;
  let fishTarget = null;
  let modal = null;
  let areaInside = false;
  let originalDrawGame = null;
  let originalPlayNextMusicTrack = null;
  let normalMusicIndex = 0;
  let fishingMusicIndex = 0;

  function hasRod() { return localStorage.getItem(ROD_STORAGE) === "true"; }
  function setRod(value) { localStorage.setItem(ROD_STORAGE, String(Boolean(value))); }

  function loadFishInventory() {
    try {
      const data = JSON.parse(localStorage.getItem(FISH_STORAGE) || "[]");
      return Array.isArray(data) ? data : [];
    } catch (_) { return []; }
  }

  function saveFishInventory(items) {
    localStorage.setItem(FISH_STORAGE, JSON.stringify(items));
  }

  function insideFishingArea() {
    return player.x >= FISHING_AREA.minX && player.x <= FISHING_AREA.maxX && player.y >= FISHING_AREA.minY && player.y <= FISHING_AREA.maxY;
  }

  function weightedFish() {
    const roll = Math.random() * 100;
    let total = 0;
    for (const fish of FISH) {
      total += fish.weight;
      if (roll <= total) return fish;
    }
    return FISH[0];
  }

  function createModal() {
    if (modal) return modal;
    modal = document.createElement("section");
    modal.id = "fishingModalAlpha17";
    modal.style.cssText = "position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;background:rgba(8,12,15,.78);font-family:inherit;color:#f5f0df";
    modal.innerHTML = `
      <div style="width:min(440px,90vw);background:#171a1b;border:2px solid #b69a63;border-radius:8px;padding:24px;box-shadow:0 18px 60px rgba(0,0,0,.6);text-align:center">
        <div id="fishTitle" style="font-size:26px;font-weight:800;letter-spacing:2px">PESCARIA</div>
        <div id="fishStatus" style="margin:10px 0 18px;color:#cfc6ae">Prepare a vara...</div>
        <div id="fishGame" style="display:none">
          <div style="position:relative;height:250px;width:82px;margin:0 auto 18px;background:#27383b;border:3px solid #d9cda8;border-radius:10px;overflow:hidden">
            <div id="fishZone" style="position:absolute;left:4px;right:4px;height:78px;background:rgba(221,196,105,.82);border-radius:8px;box-shadow:0 0 12px rgba(255,225,120,.35)"></div>
            <div id="fishCursor" style="position:absolute;left:10px;width:62px;height:9px;background:#f2e8c8;border-radius:5px;box-shadow:0 0 8px rgba(255,255,255,.55)"></div>
            <div id="fishDot" style="position:absolute;left:32px;width:18px;height:18px;border-radius:50%;background:#79c4d1;border:2px solid #e9f7f7"></div>
          </div>
          <div style="height:12px;background:#332b24;border:1px solid #806b49;border-radius:6px;overflow:hidden">
            <div id="fishProgress" style="height:100%;width:35%;background:#d5b65f;transition:width .05s linear"></div>
          </div>
          <p style="margin:12px 0 0;color:#bdb6a7">SEGURE ESPAÇO para manter o peixe na área dourada.</p>
        </div>
        <div id="fishResult" style="display:none"></div>
        <button id="fishClose" style="margin-top:18px;padding:10px 18px;background:#2d3434;color:#fff;border:1px solid #8d7b55;border-radius:5px;cursor:pointer">FECHAR</button>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector("#fishClose").addEventListener("click", () => finishFishing());
    return modal;
  }

  function showModal() {
    createModal().style.display = "flex";
  }

  function setModalContent(status, mode) {
    createModal();
    modal.querySelector("#fishStatus").textContent = status;
    modal.querySelector("#fishGame").style.display = mode === "game" ? "block" : "none";
    modal.querySelector("#fishResult").style.display = mode === "result" ? "block" : "none";
    modal.querySelector("#fishClose").style.display = mode === "game" ? "none" : "inline-block";
  }

  function setFishingMusic(enabled) {
    if (typeof musicState === "undefined" || !musicState.audio) return;
    if (enabled) {
      fishingMusicIndex = 0;
      const src = FISHING_PLAYLIST[fishingMusicIndex++ % FISHING_PLAYLIST.length];
      musicState.audio.src = encodeURI(src);
      musicState.audio.volume = musicState.volume;
      musicState.audio.play().catch(() => {});
    } else {
      normalMusicIndex = 0;
      if (typeof MUSIC_TRACKS !== "undefined") {
        const src = MUSIC_TRACKS[normalMusicIndex++ % MUSIC_TRACKS.length];
        musicState.audio.src = encodeURI(src);
        musicState.audio.volume = musicState.volume;
        musicState.audio.play().catch(() => {});
      }
    }
  }

  function beginFishing() {
    if (!hasRod()) { showMessage("VOCÊ PRECISA DE UMA VARA — COMPRE POR 60 MOEDAS"); return; }
    if (!insideFishingArea() || fishingState !== "NORMAL" || paused) return;
    fishingState = "CASTING";
    previousPaused = paused;
    paused = true;
    setFishingMusic(true);
    showModal();
    setModalContent("LANÇANDO A LINHA...", "wait");
    setTimeout(() => {
      if (fishingState !== "CASTING") return;
      fishingState = "WAITING_FISH";
      waitTimer = performance.now() + 1200 + Math.random() * 4200;
      setModalContent("AGUARDE... O PEIXE PODE MORDER A QUALQUER MOMENTO.", "wait");
    }, 450);
  }

  function startMinigame() {
    fishTarget = weightedFish();
    fishingState = "MINIGAME";
    minigameTimer = performance.now();
    minigameFrame = 0;
    catchProgress = 0.35;
    fishPosition = 0.25 + Math.random() * 0.5;
    playerBar = 0.5;
    fishDirection = Math.random() < 0.5 ? -1 : 1;
    setModalContent(`MORDEU! ${fishTarget.rarity.toUpperCase()} — SEGURE ESPAÇO`, "game");
  }

  function updateMinigame(now) {
    const dt = Math.min(0.05, (now - minigameFrame) / 1000 || 0.016);
    minigameFrame = now;
    const holding = fishingSpaceHeld;
    const moveSpeed = 0.95;
    playerBar += (holding ? 1 : -1) * moveSpeed * dt;
    playerBar = Math.max(0.08, Math.min(0.92, playerBar));
    fishPosition += fishDirection * fishTarget.speed * dt * 0.55;
    if (fishPosition < 0.08 || fishPosition > 0.92) fishDirection *= -1;
    fishPosition = Math.max(0.08, Math.min(0.92, fishPosition));
    const distance = Math.abs(playerBar - fishPosition);
    if (distance < 0.15) catchProgress = Math.min(1, catchProgress + dt * 0.62);
    else catchProgress = Math.max(0, catchProgress - dt * 0.42);
    const zone = modal.querySelector("#fishZone");
    const cursor = modal.querySelector("#fishCursor");
    const dot = modal.querySelector("#fishDot");
    const progress = modal.querySelector("#fishProgress");
    if (zone) zone.style.top = `${(1 - playerBar) * 100 - 15}%`;
    if (cursor) cursor.style.top = `${(1 - playerBar) * 100 - 2}%`;
    if (dot) dot.style.top = `${(1 - fishPosition) * 100 - 3}%`;
    if (progress) progress.style.width = `${catchProgress * 100}%`;
    if (catchProgress >= 1) catchFish();
    if (catchProgress <= 0) loseFish();
  }

  function catchFish() {
    fishingState = "RESULT";
    const items = loadFishInventory();
    items.push({ rarity: fishTarget.rarity, healAmount: fishTarget.healAmount, sellValue: fishTarget.sellValue });
    saveFishInventory(items);
    setModalContent("PEIXE CAPTURADO!", "result");
    const result = modal.querySelector("#fishResult");
    result.innerHTML = `<div style="padding:16px;border:1px solid #806b49;background:#211f1a;border-radius:6px"><strong style="font-size:22px">${fishTarget.rarity.toUpperCase()}</strong><br><br>✨ Cura: +${fishTarget.healAmount} HP<br>🪙 Venda: ${fishTarget.sellValue} moedas</div><p style="color:#aaa">O peixe foi colocado no inventário.</p>`;
  }

  function loseFish() {
    fishingState = "RESULT";
    setModalContent("O PEIXE ESCAPOU", "result");
    const result = modal.querySelector("#fishResult");
    result.innerHTML = `<div style="padding:16px;border:1px solid #654;background:#211a1a;border-radius:6px">Você perdeu o peixe. Não há penalidade de linha.</div>`;
  }

  function finishFishing() {
    if (!modal) return;
    modal.style.display = "none";
    fishingState = "NORMAL";
    fishTarget = null;
    paused = previousPaused;
    setFishingMusic(false);
  }

  let fishingSpaceHeld = false;
  window.addEventListener("keydown", event => {
    if (event.key === " ") {
      fishingSpaceHeld = true;
      if (fishingState === "NORMAL" && insideFishingArea()) {
        event.preventDefault();
        beginFishing();
      }
    }
    if (event.key === "Escape" && fishingState !== "NORMAL") {
      event.preventDefault();
      if (fishingState === "MINIGAME" || fishingState === "WAITING_FISH" || fishingState === "CASTING") loseFish();
      else finishFishing();
    }
  }, { capture: true });

  window.addEventListener("keyup", event => { if (event.key === " ") fishingSpaceHeld = false; }, { capture: true });

  function buyFishingRod() {
    if (hasRod()) { showMessage("VOCÊ JÁ POSSUI UMA VARA DE PESCA"); return; }
    if (player.coins < ROD_COST) { showMessage("MOEDAS INSUFICIENTES — VARA: 60 MOEDAS"); return; }
    player.coins -= ROD_COST;
    setRod(true);
    showMessage("VARA DE PESCA COMPRADA");
    updateRodCard();
  }

  function updateRodCard() {
    const state = document.getElementById("fishingRodState");
    if (state) state.textContent = hasRod() ? "COMPRADA — VARA DISPONÍVEL" : "COMPRAR — 60 MOEDAS";
  }

  function installMerchantCard() {
    const merchantModal = document.querySelector(".merchant-modal");
    if (!merchantModal || document.getElementById("fishingRodCard")) return;
    const card = document.createElement("div");
    card.className = "skill-card";
    card.id = "fishingRodCard";
    card.innerHTML = `<h3>VARA DE PESCA <span class="skill-price">60 moedas</span></h3><p>Permite pescar na área marcada do mapa. A posse permanece salva.</p><span class="skill-state" id="fishingRodState"></span>`;
    card.addEventListener("click", buyFishingRod);
    const close = document.getElementById("closeMerchantButton");
    merchantModal.insertBefore(card, close);
    updateRodCard();
  }

  function drawFishingArea() {
    if (typeof ctx === "undefined" || typeof Camera === "undefined") return;
    const centerX = (FISHING_AREA.minX + FISHING_AREA.maxX) / 2;
    const centerY = (FISHING_AREA.minY + FISHING_AREA.maxY) / 2;
    const a = Camera.worldToScreen(centerX, centerY);
    const b = Camera.worldToScreen(FISHING_AREA.maxX, FISHING_AREA.minY);
    const c = Camera.worldToScreen(FISHING_AREA.minX, FISHING_AREA.maxY);
    const width = Math.abs(b.x - c.x) * 0.78;
    const height = Math.abs(b.y - c.y) * 0.78;
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "#315d67";
    ctx.strokeStyle = "#b5d4c8";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(a.x, a.y, Math.max(80, width), Math.max(40, height), 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = "#d5e9e2";
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(a.x - width * 0.65, a.y + i * 12); ctx.lineTo(a.x + width * 0.65, a.y + i * 12); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#f1dfad";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ÁREA DE PESCA", a.x, a.y - Math.max(48, height) - 12);
    if (areaInside && hasRod()) ctx.fillText("ESPAÇO • PESCAR", a.x, a.y + Math.max(48, height) + 24);
    ctx.restore();
  }

  function updateAreaState() {
    const inside = insideFishingArea();
    if (inside !== areaInside) {
      areaInside = inside;
      if (inside && hasRod()) showMessage("ÁREA DE PESCA — PRESSIONE ESPAÇO");
      if (!inside && fishingState === "NORMAL") setFishingMusic(false);
    }
  }

  originalDrawGame = window.drawGame;
  window.drawGame = function() {
    originalDrawGame();
    updateAreaState();
    drawFishingArea();
    if (fishingState === "MINIGAME") updateMinigame(performance.now());
    if (fishingState === "WAITING_FISH" && performance.now() >= waitTimer) startMinigame();
  };

  originalPlayNextMusicTrack = window.playNextMusicTrack;
  if (originalPlayNextMusicTrack) {
    window.playNextMusicTrack = function() {
      if (fishingState !== "NORMAL") {
        if (typeof musicState === "undefined" || !musicState.audio) return;
        const src = FISHING_PLAYLIST[fishingMusicIndex++ % FISHING_PLAYLIST.length];
        musicState.audio.src = encodeURI(src);
        musicState.audio.volume = musicState.volume;
        musicState.audio.play().catch(() => {});
        return;
      }
      return originalPlayNextMusicTrack();
    };
  }

  const originalRefreshSkillUI = window.refreshSkillUI;
  window.refreshSkillUI = function() {
    if (originalRefreshSkillUI) originalRefreshSkillUI();
    installMerchantCard();
    updateRodCard();
  };

  const originalRefreshInventoryUI = window.refreshInventoryUI;
  window.refreshInventoryUI = function() {
    if (originalRefreshInventoryUI) originalRefreshInventoryUI();
    const list = document.getElementById("inventoryList");
    if (!list || !player) return;
    const items = loadFishInventory();
    if (!items.length) return;
    const summary = document.createElement("div");
    summary.style.cssText = "margin-top:14px;padding:12px;border:1px solid #66583f;border-radius:6px;background:#201f1b;color:#ddd";
    summary.innerHTML = `<strong>PEIXES</strong><br>${items.map((f, i) => `${i + 1}. ${f.rarity} — cura +${f.healAmount} HP — venda ${f.sellValue} moedas`).join("<br>")}`;
    list.appendChild(summary);
  };

  installMerchantCard();
  console.info("[Sunwalker] Alpha 1.7 fishing system installed.");
})();
