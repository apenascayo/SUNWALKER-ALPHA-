(() => {
  // Visual refinements that must run after all Alpha 1.7 systems.
  const baseDrawEnemy = window.drawEnemy;
  if (typeof baseDrawEnemy === "function") {
    window.drawEnemy = function(enemy) {
      if (!enemy || !enemy.isSummonedMinion) return baseDrawEnemy(enemy);
      const s = Camera.worldToScreen(enemy.x, enemy.y);
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.scale(0.70, 0.70);
      ctx.translate(-s.x, -s.y);
      baseDrawEnemy(enemy);
      ctx.restore();
    };
  }

  function drawFishingMinimapMarker() {
    if (typeof ctx === "undefined" || typeof Camera === "undefined" || typeof getViewportSize !== "function") return;
    const size = 170, pad = 16;
    const viewport = getViewportSize();
    const x0 = pad, y0 = viewport.height - size - pad - 44;
    const scale = size / CONFIG.MAP_WIDTH;
    const mx = x0 + ((82 + 94) / 2) * scale;
    const my = y0 + ((80 + 94) / 2) * scale;
    const rw = (94 - 82) * scale / 2;
    const rh = (94 - 80) * scale / 2;

    ctx.save();
    ctx.fillStyle = "rgba(55,135,150,.72)";
    ctx.strokeStyle = "rgba(210,240,225,.95)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(mx, my, Math.max(7, rw), Math.max(5, rh), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#e9dfb4";
    ctx.font = "bold 9px Arial";
    ctx.textAlign = "center";
    ctx.fillText("PESCA", mx, my - Math.max(7, rh) - 3);
    ctx.restore();
  }

  const previousDrawGame = window.drawGame;
  window.drawGame = function() {
    previousDrawGame();
    drawFishingMinimapMarker();
  };
})();
