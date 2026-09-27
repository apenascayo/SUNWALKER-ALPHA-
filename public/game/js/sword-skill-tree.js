(() => {
  const TREE = {
    sheath: {
      name: "Bainha",
      icon: "🗡️",
      nodes: [
        ["I", "Presença da Bainha", "Aumenta somente o tamanho do efeito visual.", "+ VISUAL"],
        ["II", "Repulsão Visual", "Mantém o efeito da bainha e amplia o impacto visual.", "+ VISUAL"],
        ["III", "Pulso da Bainha", "O pulso visual fica maior.", "+ VISUAL"],
        ["IV", "Onda da Bainha", "A onda visual ganha mais alcance.", "+ VISUAL"],
        ["V", "Domínio da Bainha", "O efeito visual se espalha em área. Não aumenta o dano.", "+ ÁREA VISUAL"]
      ]
    },
    fire: {
      name: "Fogo",
      icon: "🔥",
      nodes: [
        ["I", "Lâmina Incandescente", "+10% dano da espada. Sem efeito elemental ainda.", "+10% DANO"],
        ["II", "Fogo Desperto", "+20% dano. O golpe aplica queimadura.", "+20% + FOGO"],
        ["III", "Chama Maior", "+30% dano. A chama visual fica maior.", "+30% + VISUAL"],
        ["IV", "Inferno Crescente", "+45% dano. A queimadura ganha presença visual ainda maior.", "+45% + VISUAL"],
        ["V", "Campo de Fogo", "+60% dano. O efeito de fogo se espalha em área ao redor do alvo.", "+60% + ÁREA"]
      ]
    },
    lightning: {
      name: "Raio",
      icon: "⚡",
      nodes: [
        ["I", "Lâmina Condutora", "+10% dano da espada. Sem efeito elemental ainda.", "+10% DANO"],
        ["II", "Raio Desperto", "+20% dano. O golpe aplica eletricidade.", "+20% + RAIO"],
        ["III", "Arco Elétrico", "+30% dano. O visual elétrico aumenta.", "+30% + VISUAL"],
        ["IV", "Tempestade", "+45% dano. O efeito visual fica ainda maior.", "+45% + VISUAL"],
        ["V", "Tempestade em Área", "+60% dano. O relâmpago passa a atingir uma área maior.", "+60% + ÁREA"]
      ]
    }
  };

  function ensureState() {
    if (!player.swordSkillTree) player.swordSkillTree = { fire: 0, lightning: 0, sheath: 0 };
    if (!Number.isFinite(player.swordSkillTree.sheath)) player.swordSkillTree.sheath = 0;
    if (!Number.isFinite(player.swordSkillTree.fire)) player.swordSkillTree.fire = 0;
    if (!Number.isFinite(player.swordSkillTree.lightning)) player.swordSkillTree.lightning = 0;
    if (!Number.isFinite(player.skillPoints)) player.skillPoints = 0;
  }

  function stageDamageMultiplier(stage) {
    return [1, 1.10, 1.20, 1.30, 1.45, 1.60][Math.max(0, Math.min(5, stage))];
  }

  window.getSwordSkillStage = function(branch) {
    ensureState();
    return player.swordSkillTree[branch] || 0;
  };
  window.getSwordSkillDamageMultiplier = function() {
    ensureState();
    const fire = player.swordSkillTree.fire || 0;
    const lightning = player.swordSkillTree.lightning || 0;
    return 1 + (stageDamageMultiplier(fire) - 1) + (stageDamageMultiplier(lightning) - 1);
  };
  window.getSwordElementStage = function(branch) {
    return window.getSwordSkillStage(branch);
  };
  window.getSwordSkillVisualScale = function(branch) {
    const stage = window.getSwordSkillStage(branch);
    return [1, 1, 1.25, 1.55, 1.9, 2.5][stage] || 1;
  };
  window.getSheathVisualStage = function() {
    ensureState();
    return player.swordSkillTree.sheath || 0;
  };
  window.getSheathVisualScale = function() {
    const stage = window.getSheathVisualStage();
    return [1, 1.05, 1.25, 1.5, 1.8, 2.35][stage] || 1;
  };

  window.getSwordSkillAreaRadius = function(branch) {
    const stage = window.getSwordSkillStage(branch);
    return [0, 0, 0, 0, 0, branch === "fire" ? 1.65 : 1.9][stage] || 0;
  };

  function renderBranch(branch) {
    const target = document.getElementById(`${branch}SkillNodes`);
    if (!target) return;
    ensureState();
    target.innerHTML = "";
    const level = player.swordSkillTree[branch];
    TREE[branch].nodes.forEach((node, index) => {
      const stage = index + 1;
      const unlocked = level >= stage;
      const available = level === stage - 1 && player.skillPoints > 0;
      const el = document.createElement("button");
      el.type = "button";
      el.className = "sword-skill-node" + (unlocked ? " unlocked" : " locked") + (level === stage ? " current" : "");
      el.disabled = !available;
      el.innerHTML = `<span class="node-stage">ESTÁGIO ${node[0]}</span><h3>${TREE[branch].icon} ${node[1]}</h3><p>${node[2]}</p><span class="node-status">${unlocked ? "DESBLOQUEADO" : available ? "GASTAR 1 PONTO" : `REQUER ESTÁGIO ${stage - 1}`}</span>`;
      if (available) el.addEventListener("click", () => unlock(branch, stage));
      target.appendChild(el);
    });
  }

  function refresh() {
    ensureState();
    const points = document.getElementById("swordTreePoints");
    const levelPoints = document.getElementById("levelUpSkillPoints");
    const hudButton = document.getElementById("swordTreeButton");
    if (points) points.textContent = `PONTOS: ${player.skillPoints}`;
    if (levelPoints) levelPoints.textContent = `PONTOS DE HABILIDADE: ${player.skillPoints}`;
    if (hudButton) { hudButton.textContent = "🌳"; hudButton.title = `ÁRVORE DE HABILIDADES${player.skillPoints ? ` — ${player.skillPoints} PONTO(S)` : ""}`; hudButton.setAttribute("aria-label", "Árvore de habilidades"); }
    renderBranch("fire");
    renderBranch("lightning");
    renderBranch("sheath");
  }

  function unlock(branch, stage) {
    ensureState();
    if (player.skillPoints <= 0 || player.swordSkillTree[branch] !== stage - 1) return;
    player.skillPoints--;
    player.swordSkillTree[branch] = stage;
    showMessage(`${TREE[branch].name.toUpperCase()} — ESTÁGIO ${stage} DESBLOQUEADO`);
    refresh();
  }

  let treePreviousPaused = false;

  function openTree() {
    ensureState();
    const overlay = document.getElementById("swordTreeOverlay");
    if (!overlay) return;
    treePreviousPaused = typeof paused !== "undefined" ? paused : false;
    if (typeof paused !== "undefined") paused = true;
    overlay.classList.remove("hidden");
    refresh();
  }

  function closeTree() {
    const overlay = document.getElementById("swordTreeOverlay");
    if (overlay) overlay.classList.add("hidden");
    if (typeof paused !== "undefined") paused = treePreviousPaused || levelUpOpen;
  }

  function setup() {
    ensureState();
    const open = document.getElementById("swordTreeButton");
    const openLevel = document.getElementById("openSwordTreeFromLevel");
    const close = document.getElementById("closeSwordTreeButton");
    if (open && open.dataset.bound !== "true") { open.dataset.bound = "true"; open.addEventListener("click", openTree); }
    if (openLevel && openLevel.dataset.bound !== "true") { openLevel.dataset.bound = "true"; openLevel.addEventListener("click", openTree); }
    if (close && close.dataset.bound !== "true") { close.dataset.bound = "true"; close.addEventListener("click", closeTree); }
    refresh();
  }

  // O ponto é concedido no nível; a árvore é a única forma de gastá-lo em atributos da espada.
  window.awardSwordSkillPoint = function() {
    ensureState();
    player.skillPoints++;
    refresh();
  };

  // Tecla T abre a árvore diretamente. Isso evita depender da ordem dos sistemas de Input.
  window.addEventListener("keydown", event => {
    if (event.key.toLowerCase() !== "t" || event.repeat) return;
    if (typeof paused !== "undefined" && paused) return;
    if (typeof settingsOpen !== "undefined" && settingsOpen) return;
    if (typeof merchantOpen !== "undefined" && merchantOpen) return;
    if (typeof inventoryOpen !== "undefined" && inventoryOpen) return;
    if (typeof levelUpOpen !== "undefined" && levelUpOpen) return;
    event.preventDefault();
    openTree();
  });

  setInterval(() => { try { setup(); } catch (_) {} }, 250);
  setup();
})();
