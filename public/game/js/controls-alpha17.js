(() => {
  // Alpha 1.7: mantém o DASH original do jogo (teleporte),
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

  console.info("[Sunwalker] Alpha 1.7: SHIFT=DASH teleportado, ESPAÇO=item/interação, defesa/corrida desativadas.");
})();
