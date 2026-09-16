// Trilha de combate Alpha 1.8.5.
// Sorteio por ciclo: todas as faixas tocam uma vez antes de qualquer repetição.
(() => {
  const COMBAT_MUSIC_TRACKS = [
    "assets/music/Sertão do Shakuhachi.wav",
    "assets/music/Sertão do Shakuhachi 2.wav",
    "assets/music/Combaião Determinado.wav",
    "assets/music/Sertão de Lâmpadas 1 (1).wav",
    "assets/music/Sertão de Lâmpadas 2 (1).wav",
    "assets/music/Vaqueiro Entoada.wav",
    "assets/music/Vaqueiro Entoada 2.wav"
  ];

  let musicBag = [];
  let lastPlayedIndex = -1;

  function refillMusicBag() {
    musicBag = Array.from({ length: COMBAT_MUSIC_TRACKS.length }, (_, i) => i);
    for (let i = musicBag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [musicBag[i], musicBag[j]] = [musicBag[j], musicBag[i]];
    }
    if (musicBag.length > 1 && musicBag[0] === lastPlayedIndex) {
      const swapIndex = 1 + Math.floor(Math.random() * (musicBag.length - 1));
      [musicBag[0], musicBag[swapIndex]] = [musicBag[swapIndex], musicBag[0]];
    }
  }

  function getNextMusicIndex() {
    if (!musicBag.length) refillMusicBag();
    const next = musicBag.shift();
    lastPlayedIndex = next;
    return next;
  }

  function ensureNowPlaying() {
    let el = document.getElementById("sunwalkerNowPlaying");
    if (!el) {
      el = document.createElement("button");
      el.id = "sunwalkerNowPlaying";
      el.type = "button";
      document.body.appendChild(el);
    }
    el.hidden = true;
    el.style.display = "none";
    el.textContent = "";
    el.onclick = null;
    return el;
  }

  function playCombatMusicTrack(index) {
    if (typeof musicState === "undefined" || !musicState.audio) return;
    const safeIndex = ((index % COMBAT_MUSIC_TRACKS.length) + COMBAT_MUSIC_TRACKS.length) % COMBAT_MUSIC_TRACKS.length;
    musicState.index = safeIndex;
    musicState.audio.src = encodeURI(COMBAT_MUSIC_TRACKS[safeIndex]);
    musicState.audio.volume = musicState.volume;
    ensureNowPlaying();
    const playPromise = musicState.audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.then(() => { musicState.playBlocked = false; }).catch(() => { musicState.playBlocked = true; });
    }
  }

  function playNextMusicTrack() {
    if (typeof musicState === "undefined") return;
    playCombatMusicTrack(getNextMusicIndex());
  }

  function changeMusicNow() {
    if (typeof musicState === "undefined" || !musicState.audio) return;
    musicState.audio.pause();
    musicState.audio.currentTime = 0;
    playNextMusicTrack();
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
    refillMusicBag();
    playNextMusicTrack();
  };

  setInterval(() => { try { ensureNowPlaying(); } catch (_) {} }, 1000);
})();
