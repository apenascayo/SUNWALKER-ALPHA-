(() => {
  const STORAGE = "sunwalker_fish_inventory";
  const SELECTED = "sunwalker_selected_fish";

  function getFish() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (_) { return []; }
  }

  function saveFish(items) {
    localStorage.setItem(STORAGE, JSON.stringify(items));
  }

  function refreshFishInventory() {
    const list = document.getElementById("inventoryList");
    if (!list) return;
    const fish = getFish();
    if (!fish.length) return;

    const box = document.createElement("div");
    box.style.cssText = "margin-top:14px;padding:12px;border:1px solid #806b49;border-radius:6px;background:#201f1b";
    box.innerHTML = `<strong>PEIXES</strong>`;

    fish.forEach((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.style.cssText = "display:block;width:100%;margin-top:7px;padding:9px;background:#2d3434;color:#eee;border:1px solid #66583f;border-radius:4px;cursor:pointer;text-align:left";
      const selected = Number(localStorage.getItem(SELECTED)) === index;
      button.textContent = `${selected ? "▶ " : ""}${item.rarity} — +${item.healAmount} HP — vender ${item.sellValue}`;
      button.addEventListener("click", () => {
        localStorage.setItem(SELECTED, String(index));
        refreshFishInventory();
      });
      box.appendChild(button);
    });

    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;gap:8px;margin-top:10px";
    const consume = document.createElement("button");
    consume.textContent = "COMER PEIXE (ESPAÇO)";
    consume.style.cssText = "flex:1;padding:9px;cursor:pointer";
    consume.addEventListener("click", consumeFish);
    const sell = document.createElement("button");
    sell.textContent = "VENDER SELECIONADO";
    sell.style.cssText = "flex:1;padding:9px;cursor:pointer";
    sell.addEventListener("click", sellFish);
    actions.append(consume, sell);
    box.appendChild(actions);
    list.appendChild(box);
  }

  function consumeFish() {
    const fish = getFish();
    const index = Number(localStorage.getItem(SELECTED));
    if (!fish.length || !Number.isInteger(index) || !fish[index]) { showMessage("SELECIONE UM PEIXE"); return; }
    if (player.hp >= player.maxHp) { showMessage("VIDA JÁ ESTÁ CHEIA"); return; }
    const item = fish[index];
    player.hp = Math.min(player.maxHp, player.hp + item.healAmount);
    fish.splice(index, 1);
    saveFish(fish);
    localStorage.setItem(SELECTED, fish.length ? "0" : "-1");
    showMessage(`${item.rarity.toUpperCase()} CONSUMIDO: +${item.healAmount} HP`);
    refreshFishInventoryUI();
  }

  function sellFish() {
    const fish = getFish();
    const index = Number(localStorage.getItem(SELECTED));
    if (!fish.length || !Number.isInteger(index) || !fish[index]) { showMessage("SELECIONE UM PEIXE"); return; }
    const item = fish[index];
    player.coins += item.sellValue;
    fish.splice(index, 1);
    saveFish(fish);
    localStorage.setItem(SELECTED, fish.length ? "0" : "-1");
    showMessage(`${item.rarity.toUpperCase()} VENDIDO: +${item.sellValue} MOEDAS`);
    if (typeof refreshSkillUI === "function") refreshSkillUI();
    refreshFishInventoryUI();
  }

  function refreshFishInventoryUI() {
    const list = document.getElementById("inventoryList");
    if (!list) return;
    const old = list.querySelector("[data-fish-inventory]");
    if (old) old.remove();
    const box = document.createElement("div");
    box.dataset.fishInventory = "true";
    list.appendChild(box);
    box.remove();
    const items = getFish();
    if (!items.length) return;
    const temp = document.createElement("div");
    temp.dataset.fishInventory = "true";
    temp.style.cssText = "margin-top:14px;padding:12px;border:1px solid #806b49;border-radius:6px;background:#201f1b";
    temp.innerHTML = "<strong>PEIXES</strong>";
    items.forEach((item, index) => {
      const b = document.createElement("button");
      b.type = "button";
      b.style.cssText = "display:block;width:100%;margin-top:7px;padding:9px;background:#2d3434;color:#eee;border:1px solid #66583f;border-radius:4px;cursor:pointer;text-align:left";
      b.textContent = `${Number(localStorage.getItem(SELECTED)) === index ? "▶ " : ""}${item.rarity} — +${item.healAmount} HP — vender ${item.sellValue}`;
      b.onclick = () => { localStorage.setItem(SELECTED, String(index)); refreshFishInventoryUI(); };
      temp.appendChild(b);
    });
    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;gap:8px;margin-top:10px";
    const eat = document.createElement("button");
    eat.textContent = "COMER (ESPAÇO)"; eat.style.cssText = "flex:1;padding:9px;cursor:pointer"; eat.onclick = consumeFish;
    const sell = document.createElement("button");
    sell.textContent = "VENDER"; sell.style.cssText = "flex:1;padding:9px;cursor:pointer"; sell.onclick = sellFish;
    actions.append(eat, sell); temp.appendChild(actions);
    list.appendChild(temp);
  }

  const originalRefreshInventoryUI = window.refreshInventoryUI;
  window.refreshInventoryUI = function() {
    if (originalRefreshInventoryUI) originalRefreshInventoryUI();
    refreshFishInventoryUI();
  };

  const originalUseSelectedItem = window.useSelectedItem;
  window.useSelectedItem = function() {
    const fish = getFish();
    const index = Number(localStorage.getItem(SELECTED));
    if (fish.length && Number.isInteger(index) && fish[index]) {
      consumeFish();
      return;
    }
    if (originalUseSelectedItem) originalUseSelectedItem();
  };

  window.addEventListener("keydown", event => {
    if (event.key === " " && !document.getElementById("inventoryOverlay")?.classList.contains("hidden") && typeof paused !== "undefined" && !paused) {
      event.preventDefault();
      consumeFish();
    }
  }, { capture: true });
})();
