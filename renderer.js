const timerEl = document.getElementById("timer");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");

let seconds = 0;
let interval = null;

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map(n => String(n).padStart(2, "0")).join(":");
}

function renderTimer() {
  timerEl.textContent = formatTime(seconds);
}

startBtn.addEventListener("click", () => {
  if (interval) return;
  interval = setInterval(() => {
    seconds++;
    renderTimer();
  }, 1000);
});

pauseBtn.addEventListener("click", () => {
  clearInterval(interval);
  interval = null;
});

resetBtn.addEventListener("click", () => {
  clearInterval(interval);
  interval = null;
  seconds = 0;
  renderTimer();
});