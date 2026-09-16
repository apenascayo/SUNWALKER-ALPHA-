(() => {
  const STYLE_ID = "alpha18-merchant-skill-style";

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .merchant-modal { min-width: min(560px, calc(100vw - 28px)); max-width: 560px; }
      .merchant-head { padding: 14px; margin-bottom: 16px; background: linear-gradient(135deg, rgba(83,61,35,.45), rgba(24,24,28,.8)); border: 1px solid rgba(232,180,59,.35); border-radius: 10px; }
      .merchant-portrait { width: 104px; height: 104px; border: 2px solid #8d7449; border-radius: 8px; background: #151518; box-shadow: 0 5px 18px rgba(0,0,0,.45); }
      .merchant-modal .skill-card { padding: 16px; margin-bottom: 10px; border: 1px solid #4a4a50; border-left: 4px solid #777; border-radius: 9px; background: linear-gradient(145deg,#29292f,#202126); transition: transform .12s ease, border-color .12s ease, box-shadow .12s ease, background .12s ease; }
      .merchant-modal .skill-card:hover { transform: translateY(-1px); border-color: #9b8355; background: linear-gradient(145deg,#323139,#24252a); }
      .merchant-modal .skill-card h3 { font-size: 14px; letter-spacing: .4px; margin-bottom: 9px; }
      .merchant-modal .skill-card p { color: #c1c1c6; line-height: 1.55; margin-bottom: 12px; }
      .merchant-modal .skill-price { padding: 4px 7px; border: 1px solid rgba(245,197,66,.35); border-radius: 5px; background: rgba(245,197,66,.08); }
      .merchant-modal .skill-state { display: inline-block; padding: 6px 9px; border-radius: 5px; background: rgba(141,224,141,.08); border: 1px solid rgba(141,224,141,.25); color: #9be09b; }
      .merchant-modal .skill-card.active { border-color: #e8b43b; border-left-color: #e8b43b; background: linear-gradient(145deg,rgba(100,78,31,.55),rgba(42,38,28,.95)); box-shadow: 0 0 0 1px rgba(232,180,59,.25) inset, 0 7px 22px rgba(0,0,0,.32); }
      .merchant-modal .skill-card.active .skill-state { color: #f5d77b; background: rgba(232,180,59,.13); border-color: rgba(232,180,59,.4); }
      .merchant-modal .skill-card.active .skill-price { color: #f5d77b; border-color: rgba(232,180,59,.45); }
      .merchant-modal .skill-card.active::after { content: "✓ HABILIDADE ATIVA"; float: right; margin-top: 7px; color: #f5d77b; font-size: 10px; font-weight: 800; letter-spacing: .8px; }
      #merchantAbilitiesTab, #merchantItemsTab { padding-top: 2px; }
    `;
    document.head.appendChild(style);
  }

  function refreshMerchantUI() {
    const portrait = document.querySelector(".merchant-portrait");
    if (portrait && !portrait.src.includes("mercador.png")) portrait.src = "assets/mercador.png?v=3";

    const cards = [
      ["skillLightning", "sunwalker_lightning_sword"],
      ["skillAlly", "sunwalker_ally_sheath"]
    ];
    for (const [id, key] of cards) {
      const card = document.getElementById(id);
      if (!card) continue;
      const active = localStorage.getItem(key) === "true";
      card.classList.toggle("active", active);
      card.dataset.owned = active ? "true" : "false";
    }
  }

  installStyle();
  refreshMerchantUI();
  setInterval(refreshMerchantUI, 250);
})();
