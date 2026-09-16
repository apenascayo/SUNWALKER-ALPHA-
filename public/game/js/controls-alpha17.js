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

  console.info("[Sunwalker] Alpha 1.8: audio de combate, musica aleatoria, contador de wave e feedback de habilidades.");

  // Carrega as melhorias da Alpha 1.8 depois dos sistemas base.
  const script = document.createElement("script");
  script.src = "js/alpha18-audio-ui.js";
  script.defer = false;
  document.head.appendChild(script);
})();
