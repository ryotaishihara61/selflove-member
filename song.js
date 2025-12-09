(function () {
  const audio = document.getElementById("audio");
  const playBtn = document.getElementById("play-btn");
  const playIcon = playBtn.querySelector(".play-icon");
  const pauseIcon = playBtn.querySelector(".pause-icon");
  const progressBar = document.querySelector(".progress-bar");
  const progressFill = document.getElementById("progress");
  const currentTimeDisplay = document.getElementById("current-time");
  const durationDisplay = document.getElementById("duration");

  // 時間をフォーマット（秒 -> mm:ss）
  function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  // 再生/一時停止ボタン
  playBtn.addEventListener("click", () => {
    if (audio.paused) {
      audio.play();
      playIcon.style.display = "none";
      pauseIcon.style.display = "block";
    } else {
      audio.pause();
      playIcon.style.display = "block";
      pauseIcon.style.display = "none";
    }
  });

  // メタデータ読み込み完了時に総再生時間を表示
  audio.addEventListener("loadedmetadata", () => {
    durationDisplay.textContent = formatTime(audio.duration);
  });

  // 再生時間の更新
  audio.addEventListener("timeupdate", () => {
    const percent = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = `${percent}%`;
    currentTimeDisplay.textContent = formatTime(audio.currentTime);
  });

  // 再生終了時
  audio.addEventListener("ended", () => {
    playIcon.style.display = "block";
    pauseIcon.style.display = "none";
    progressFill.style.width = "0%";
    currentTimeDisplay.textContent = "0:00";
  });

  // プログレスバーのクリックでシーク
  progressBar.addEventListener("click", (e) => {
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    audio.currentTime = percent * audio.duration;
  });

  // エラーハンドリング
  audio.addEventListener("error", (e) => {
    console.error("Audio error:", e);
    alert("音声ファイルの読み込みに失敗しました。");
  });
})();
