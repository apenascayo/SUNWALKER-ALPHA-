// Trilha de combate Alpha 1.8.
// Clique no nome da música para trocar imediatamente a faixa atual.
(() => {
  const COMBAT_MUSIC_TRACKS = [
    "assets/music/Sertão do Shakuhachi.wav",
    "assets/music/Sertão do Shakuhachi 2.wav",
    "assets/music/Combaião Determinado.wav",
    "assets/music/Sertão de Lâmpadas 1 (1).wav",
    "assets/music/Sertão de Lâmpadas 2 (1).wav"
  ];

  const TRACK_NAMES = [
    "Sertão do Shakuhachi",
    "Sertão do Shakuhachi 2",
    "Combaião Determinado",
    "Sertão de Lâmpadas 1",
    "Sertão de Lâmpadas 2"
  ];

  function ensureNowPlaying() {
    let el = document.getElementById("sunwalkerNowPlaying");
    if (!el) {
      el = document.createElement("button");
      el.id = "sunwalkerNowPlaying";
      el.type = "button";
      document.body.appendChild(el);
    }
    el.title = "Clique para trocar a música";
    el.style.cursor = "pointer";
    el.style.pointerEvents = "auto";
    el.style.zIndex = "10005";
    el.onclick = changeMusicNow;
    return el;
  }

  function updateNowPlaying(index) {
    const el = ensureNowPlaying();
    const safeIndex = ((index % COMBAT_MUSIC_TRACKS.length) + COMBAT_MUSIC_TRACKS.length) % COMBAT_MUSIC_TRACKS.length;
    el.textContent = `♫ ${TRACK_NAMES[safeIndex]}  •  CLIQUE PARA TROCAR`;
    el.dataset.trackIndex = String(safeIndex);
  }

  function playCombatMusicTrack(index) {
    if (typeof musicState === "undefined" || !musicState.audio) return;
    const safeIndex = ((index % COMBAT_MUSIC_TRACKS.length) + COMBAT_MUSIC_TRACKS.length) % COMBAT_MUSIC_TRACKS.length;
    musicState.index = safeIndex;
    const src = COMBAT_MUSIC_TRACKS[safeIndex];
    musicState.audio.src = encodeURI(src);
    musicState.audio.volume = musicState.volume;
    updateNowPlaying(safeIndex);

    const playPromise = musicState.audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.then(() => { musicState.playBlocked = false; })
        .catch(() => { musicState.playBlocked = true; });
    }
    musicState.index = (safeIndex + 1) % COMBAT_MUSIC_TRACKS.length;
  }

  function playNextMusicTrack() {
    if (typeof musicState === "undefined") return;
    playCombatMusicTrack(musicState.index);
  }

  function changeMusicNow() {
    if (typeof musicState === "undefined" || !musicState.audio) return;
    const current = Number(musicState.index || 0);
    const next = current % COMBAT_MUSIC_TRACKS.length;
    musicState.audio.pause();
    musicState.audio.currentTime = 0;
    playCombatMusicTrack(next);
  }

  window.playNextMusicTrack = playNextMusicTrack;
  window.sunwalkerChangeMusic = changeMusicNow;

  window.startMusic = function() {
    if (musicState.started) return;
    if (typeof ensureMusicVolume === "function") ensureMusicVolume();

    musicState.started = true;
    musicState.audio = new Audio();
    musicState.audio.preload = "auto";
    musicState.audio.loop = false;
    musicState.audio.volume = getMusicVolume();
    musicState.volume = musicState.audio.volume;

    musicState.audio.addEventListener("ended", playNextMusicTrack);
    musicState.audio.addEventListener("error", () => {
      musicState.playBlocked = true;
      if (typeof setMusicStatus === "function") setMusicStatus("Erro ao carregar a música.", true);
    });
    musicState.audio.addEventListener("playing", () => {
      musicState.playBlocked = false;
      if (typeof setMusicStatus === "function") setMusicStatus("Música: tocando", false);
    });

    playCombatMusicTrack(musicState.index || 0);
  };

  setInterval(() => {
    try {
      const el = document.getElementById("sunwalkerNowPlaying");
      if (!el || typeof musicState === "undefined" || !musicState.audio) return;
      const currentIndex = (musicState.index - 1 + COMBAT_MUSIC_TRACKS.length) % COMBAT_MUSIC_TRACKS.length;
      updateNowPlaying(currentIndex);
    } catch (_) {}
  }, 500);
})();
