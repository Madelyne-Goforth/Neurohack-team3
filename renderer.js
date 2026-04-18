document.addEventListener("DOMContentLoaded", () => {
 const ids = [
    "timer", "startBtn", "pauseBtn", "resetBtn", "endBtn",
    "focusSummary", "sessionList", "notes", "taskInput",
    "addTaskBtn", "taskList", "sessionModal", "sessionSummaryText",
    "closeSummaryBtn", "lockedInSection", "lockedInYesBtn",
    "lockedInNoBtn", "breakSection", "breakSelect", "startBreakBtn",
    "breakTimer", "breakDoneSection", "startSessionAgainBtn", "startSessionEarlyBtn", "endBreakEarlyBtn"
  ];

  ids.forEach(id => {
    if (!document.getElementById(id)) {
      console.error("MISSING ELEMENT:", id);
    }
  });
 
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

const sessionModal = document.getElementById("sessionModal");
const sessionSummaryText = document.getElementById("sessionSummaryText");
const closeSummaryBtn = document.getElementById("closeSummaryBtn");

const lockedInSection = document.getElementById("lockedInSection");
const lockedInYesBtn = document.getElementById("lockedInYesBtn");
const lockedInNoBtn = document.getElementById("lockedInNoBtn");

const breakSection = document.getElementById("breakSection");
const breakSelect = document.getElementById("breakSelect");
const startBreakBtn = document.getElementById("startBreakBtn");
const breakTimerEl = document.getElementById("breakTimer");

const breakDoneSection = document.getElementById("breakDoneSection");
const startSessionAgainBtn = document.getElementById("startSessionAgainBtn");
const startSessionEarlyBtn = document.getElementById("startSessionEarlyBtn");

const endBreakEarlyBtn = document.getElementById("endBreakEarlyBtn");

let breakSeconds = 0;
let breakInterval = null;
let selectedBreakMinutes = 5;

let seconds = 0;
let interval = null;

let lockedIn = null;
let currentSession = null;

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

endBreakEarlyBtn.addEventListener("click", () => {
  clearInterval(breakInterval);
  breakInterval = null;
  breakSeconds = 0;
  breakTimerEl.textContent = "00:00";
  breakSection.classList.add("hidden");

  tabs.forEach(t => t.classList.remove("active"));
  contents.forEach(c => c.classList.remove("active"));
  document.querySelector('[data-tab="timerTab"]').classList.add("active");
  document.getElementById("timerTab").classList.add("active");
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

  currentSession = {
  date: new Date().toDateString(),
  time: new Date().toLocaleTimeString(),
  minutes: Math.max(1, Math.round(seconds / 60)),
  note: notes.value.trim() || "No notes",
  lockedIn: lockedIn
};

  saveSession(currentSession);
  renderSessions();
  showSessionSummary(currentSession);

  seconds = 0;
  renderTimer();
});

lockedInYesBtn.addEventListener("click", () => setLockedIn(true));
lockedInNoBtn.addEventListener("click", () => setLockedIn(false));

startBreakBtn.addEventListener("click", startBreakFromSelection);

startSessionAgainBtn.addEventListener("click", startSessionAgain);
startSessionEarlyBtn.addEventListener("click", startSessionEarly);

closeSummaryBtn.addEventListener("click", () => {
  hideSessionSummary();
  showLockedInQuestion();
});

renderTimer();
renderTasks();
renderSessions();

// More Timer functions

function showSessionSummary(session) {
  sessionSummaryText.textContent = `You worked for ${session.minutes} minutes.`;
  sessionModal.classList.remove("hidden");
}

function hideSessionSummary() {
  sessionModal.classList.add("hidden");
}

function showLockedInQuestion() {
  lockedInSection.classList.remove("hidden");

  startBtn.disabled = true;
  pauseBtn.disabled = true;
  resetBtn.disabled = true;
  endBtn.disabled = true;
}

function setLockedIn(choice) {
  lockedIn = choice;
  currentSession.lockedIn = choice;
  lockedInSection.classList.add("hidden");

  startBtn.disabled = false;
  pauseBtn.disabled = false;
  resetBtn.disabled = false;
  endBtn.disabled = false;

  showBreakOptions();
}

function showBreakOptions() {
    breakSection.classList.remove("hidden");
}

function startBreakFromSelection() {
  selectedBreakMinutes = parseInt(breakSelect.value, 10);
  startBreakTimer(selectedBreakMinutes);
  // TODO: read selected break minutes from dropdown
  // TODO: call startBreakTimer(minutes)
}

function startBreakTimer(minutes) {
  breakSeconds = minutes * 60;
  clearInterval(breakInterval);

  breakInterval = setInterval(() => {
    breakSeconds--;
    breakTimerEl.textContent = formatTime(breakSeconds);

    if (breakSeconds <= 0) {
      finishBreakTimer();
    }
  }, 1000);

  breakTimerEl.textContent = formatTime(breakSeconds);
}

function pauseBreakTimer() {
  clearInterval(breakInterval);
  breakInterval = null;
}

function resetBreakTimer() {
  clearInterval(breakInterval);
  breakInterval = null;
  breakSeconds = selectedBreakMinutes * 60;
  breakTimerEl.textContent = formatTime(breakSeconds);
}

function finishBreakTimer() {
  clearInterval(breakInterval);
  breakInterval = null;
  playBreakSound();
  // TODO: show break-done image/modal
  // TODO: show buttons for start session again or start early
}

function startSessionAgain() {
  breakDoneSection.classList.add("hidden");
  breakSection.classList.add("hidden");
  
  clearInterval(breakInterval);
  breakInterval = null;
  breakSeconds = 0;
  breakTimerEl.textContent = "00:00";

  clearInterval(interval);
  interval = null;
  seconds = 0;
  renderTimer();

  // switch to timer tab
  tabs.forEach(t => t.classList.remove("active"));
  contents.forEach(c => c.classList.remove("active"));
  document.querySelector('[data-tab="timerTab"]').classList.add("active");
  document.getElementById("timerTab").classList.add("active");
}

function startSessionEarly() {
  clearInterval(breakInterval);
  breakInterval = null;
  breakSeconds = 0;
  breakTimerEl.textContent = "00:00";

  breakSection.classList.add("hidden");
  seconds = 0;
  renderTimer();
}

function getTodaySessionCount() {
  return sessions.filter(session => session.date === new Date().toDateString()).length;
}

function loadSessions() {
  return JSON.parse(localStorage.getItem("sessions")) || [];
}

function playBreakSound() {
  const audio = new Audio("break.mp3");
  audio.play();
}

function updateSessionStats() {
  sessions = loadSessions();
  renderSessions();
}

function showOnly(sectionId) {
  [sessionModal, lockedInSection, breakSection, breakDoneSection].forEach(el => {
    if (el) el.classList.add("hidden");
  });

  const target = document.getElementById(sectionId);
  if (target) target.classList.remove("hidden");
}

function saveSession(session) {
  sessions.push(session);
  localStorage.setItem("sessions", JSON.stringify(sessions));
}
});
