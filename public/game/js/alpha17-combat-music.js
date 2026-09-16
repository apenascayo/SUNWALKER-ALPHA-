// Trilha de combate Alpha 1.7.
// Mantém as músicas existentes e adiciona Sertão de Lâmpadas 1 e 2.
(() => {
  const COMBAT_MUSIC_TRACKS = [
    "assets/music/Sertão do Shakuhachi.wav",
    "assets/music/Sertão do Shakuhachi 2.wav",
    "assets/music/Combaião Determinado.wav",
    "assets/music/Sertão de Lâmpadas 1 (1).wav",
    "assets/music/Sertão de Lâmpadas 2 (1).wav"
  ];

  function playCombatMusicTrack() {
    if (typeof musicState === "undefined" || !musicState.audio) return;

    const src = COMBAT_MUSIC_TRACKS[musicState.index % COMBAT_MUSIC_TRACKS.length];
    musicState.audio.src = encodeURI(src);
    musicState.audio.volume = musicState.volume;

    const playPromise = musicState.audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.then(() => {
        musicState.playBlocked = false;
      }).catch(() => {
        musicState.playBlocked = true;
      });
    }

    musicState.index = (musicState.index + 1) % COMBAT_MUSIC_TRACKS.length;
  }

  // Substitui apenas o controlador global de início/avanço da trilha.
  // A playlist de pesca continua sendo controlada pelo fishing-alpha17.js.
  window.playNextMusicTrack = playCombatMusicTrack;

  window.startMusic = function () {
    if (musicState.started) return;

    if (typeof ensureMusicVolume === "function") ensureMusicVolume();

    musicState.started = true;
    musicState.audio = new Audio();
    musicState.audio.preload = "auto";
    musicState.audio.loop = false;
    musicState.audio.volume = getMusicVolume();
    musicState.volume = musicState.audio.volume;

    musicState.audio.addEventListener("ended", playCombatMusicTrack);
    musicState.audio.addEventListener("error", () => {
      musicState.playBlocked = true;
      if (typeof setMusicStatus === "function") {
        setMusicStatus("Erro ao carregar a música.", true);
      }
    });
    musicState.audio.addEventListener("playing", () => {
      musicState.playBlocked = false;
      if (typeof setMusicStatus === "function") {
        setMusicStatus("Música: tocando", false);
      }
    });

    playCombatMusicTrack();
  };
})();
