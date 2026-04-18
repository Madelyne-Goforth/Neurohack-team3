const tabs = document.querySelectorAll(".tab");
const contents = document.querySelectorAll(".tab-content");

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.tab;
    tabs.forEach(t => t.classList.remove("active"));
    contents.forEach(c => c.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(target).classList.add("active");
  });
});

const timerEl = document.getElementById("timer");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const endBtn = document.getElementById("endBtn");

const focusSummary = document.getElementById("focusSummary");
const sessionList = document.getElementById("sessionList");
const notes = document.getElementById("notes");
const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");

let seconds = 0;
let interval = null;

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let sessions = JSON.parse(localStorage.getItem("sessions")) || [];
let savedNote = localStorage.getItem("notes") || "";
notes.value = savedNote;

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map(n => String(n).padStart(2, "0")).join(":");
}

function renderTimer() {
  timerEl.textContent = formatTime(seconds);
}

function renderTasks() {
  taskList.innerHTML = "";
  tasks.forEach(task => {
    const li = document.createElement("li");
    li.textContent = task;
    taskList.appendChild(li);
  });
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function renderSessions() {
  sessionList.innerHTML = "";

  if (sessions.length === 0) {
    focusSummary.textContent = "No sessions yet.";
    return;
  }

  const total = sessions.reduce((sum, s) => sum + s.minutes, 0);
  focusSummary.textContent = `Total focus time: ${total} minutes across ${sessions.length} sessions`;

  sessions.slice().reverse().forEach(session => {
    const li = document.createElement("li");
    li.textContent = `${session.time} — ${session.minutes} min — ${session.note}`;
    sessionList.appendChild(li);
  });

  localStorage.setItem("sessions", JSON.stringify(sessions));
}

notes.addEventListener("input", () => {
  localStorage.setItem("notes", notes.value);
});

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

addTaskBtn.addEventListener("click", () => {
  const value = taskInput.value.trim();
  if (!value) return;
  tasks.push(value);
  taskInput.value = "";
  renderTasks();
});

endBtn.addEventListener("click", () => {
  clearInterval(interval);
  interval = null;

  const session = {
    time: new Date().toLocaleTimeString(),
    minutes: Math.max(1, Math.round(seconds / 60)),
    note: notes.value.trim() || "No notes"
  };

  sessions.push(session);
  renderSessions();

  seconds = 0;
  renderTimer();
});

renderTimer();
renderTasks();
renderSessions();