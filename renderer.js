document.addEventListener("DOMContentLoaded", () => {
 const ids = [
    "timer", "startBtn", "pauseBtn", "resetBtn", "endBtn",
    "focusSummary", "sessionList", "sessionModal", "sessionSummaryText",
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

let currentProjects = [];

let seconds = 0;
let interval = null;

let lockedIn = null;
let currentSession = null;

let sessions = JSON.parse(localStorage.getItem("sessions")) || [];

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map(n => String(n).padStart(2, "0")).join(":");
}

function renderTimer() {
  timerEl.textContent = formatTime(seconds);
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

endBtn.addEventListener("click", () => {
  clearInterval(interval);
  interval = null;

  currentSession = {
  date:      new Date().toDateString(),
  dateLabel: new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
  time:      new Date().toLocaleTimeString(),
  minutes:   Math.max(1, Math.round(seconds / 60)),
  projects:  JSON.parse(JSON.stringify(currentProjects)),
  lockedIn:  null,
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

  currentProjects = [];
  renderProjects();

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

function uid() { return Math.random().toString(36).slice(2, 8); }

function renderProjects() {
  const container = document.getElementById("projectsContainer");
  if (!container) return;
  container.innerHTML = "";
  currentProjects.forEach(proj => {
    const card = document.createElement("div");
    card.className = "proj-card";
    card.innerHTML = `
      <div class="proj-header">
        <input class="proj-name-input" type="text" value="${escHtml(proj.name)}" placeholder="Project name" data-id="${proj.id}" />
        <button class="btn-icon remove-proj" data-id="${proj.id}">✕</button>
      </div>
      <ul class="bullet-list" id="bullets-${proj.id}"></ul>
      <div class="bullet-add-row">
        <input class="bullet-input" type="text" placeholder="Add bullet point…" data-proj="${proj.id}" />
        <button class="btn-icon add-bullet" data-proj="${proj.id}">＋</button>
      </div>
    `;
    container.appendChild(card);
    const ul = card.querySelector(`#bullets-${proj.id}`);
    proj.bullets.forEach(b => ul.appendChild(makeBulletEl(proj.id, b)));
    card.querySelector(".proj-name-input").addEventListener("input", e => {
      const p = currentProjects.find(p => p.id === proj.id);
      if (p) p.name = e.target.value;
    });
    card.querySelector(".remove-proj").addEventListener("click", () => {
      currentProjects = currentProjects.filter(p => p.id !== proj.id);
      renderProjects();
    });
    card.querySelector(".add-bullet").addEventListener("click", () => {
      addBullet(proj.id, card.querySelector(".bullet-input"));
    });
    card.querySelector(".bullet-input").addEventListener("keydown", e => {
      if (e.key === "Enter") addBullet(proj.id, e.target);
    });
  });
}

function makeBulletEl(projId, bullet) {
  const li = document.createElement("li");
  li.className = "bullet-item";
  li.innerHTML = `
    <span>• </span>
    <span class="bullet-text" contenteditable="true">${escHtml(bullet.text)}</span>
    <button class="btn-icon remove-bullet">✕</button>
  `;
  li.querySelector(".bullet-text").addEventListener("blur", e => {
    const proj = currentProjects.find(p => p.id === projId);
    const b = proj?.bullets.find(b => b.id === bullet.id);
    if (b) b.text = e.target.textContent.trim();
  });
  li.querySelector(".remove-bullet").addEventListener("click", () => {
    const proj = currentProjects.find(p => p.id === projId);
    if (proj) proj.bullets = proj.bullets.filter(b => b.id !== bullet.id);
    li.remove();
  });
  return li;
}

function addBullet(projId, input) {
  const text = input.value.trim();
  if (!text) return;
  const proj = currentProjects.find(p => p.id === projId);
  if (!proj) return;
  const bullet = { id: uid(), text };
  proj.bullets.push(bullet);
  document.getElementById(`bullets-${projId}`)?.appendChild(makeBulletEl(projId, bullet));
  input.value = "";
  input.focus();
}

function escHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderResumeTab() {
  const container = document.getElementById("resumeContent");
  if (!container) return;
  const todayStr = new Date().toDateString();
  const todaySessions = sessions.filter(s => s.date === todayStr);
  const fallback = todaySessions.length === 0
    ? sessions.slice().reverse().find(s => s.date !== todayStr) || sessions[sessions.length - 1] || null
    : null;

  let html = "";
  if (todaySessions.length === 0 && !fallback) {
    html = `<p style="color:#777;font-style:italic">No sessions yet — start one and it'll show up here!</p>`;
  } else if (todaySessions.length > 0) {
    html += `<div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#888;margin-bottom:10px">Today — ${todaySessions[0].dateLabel}</div>`;
    todaySessions.forEach((s, i) => { html += buildSessionCard(s, i + 1); });
  } else {
    html += `<div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#888;margin-bottom:10px">Last session — ${fallback.dateLabel}</div>`;
    html += buildSessionCard(fallback, 1);
  }
  container.innerHTML = html;
}

function buildSessionCard(session, num) {
  const lock = session.lockedIn === true ? "🔒 Locked in" : session.lockedIn === false ? "😐 Not locked in" : "";
  let projHtml = "";
  if (session.projects?.length > 0) {
    session.projects.forEach(proj => {
      projHtml += `<div style="font-weight:600;margin:10px 0 4px">${escHtml(proj.name)}</div>`;
      if (proj.bullets?.length > 0) {
        projHtml += `<ul style="margin:0 0 8px 8px;padding:0;list-style:none">`;
        proj.bullets.forEach(b => { projHtml += `<li style="font-size:13px;color:#bbb">• ${escHtml(b.text)}</li>`; });
        projHtml += `</ul>`;
      } else {
        projHtml += `<p style="font-size:13px;color:#666;font-style:italic;margin:2px 0 8px 8px">No bullets added.</p>`;
      }
    });
  } else {
    projHtml = `<p style="font-size:13px;color:#666;font-style:italic">No projects logged.</p>`;
  }
  return `
    <div style="background:#252525;border:1px solid #3a3a3a;border-radius:10px;padding:14px;margin-bottom:12px">
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #333">
        <strong>Session ${num}</strong>
        <span style="color:#888;font-size:13px">${session.time}</span>
        <span style="background:#3a3a3a;color:#ccc;font-size:12px;padding:2px 8px;border-radius:20px">${session.minutes} min</span>
        <span style="font-size:13px">${lock}</span>
      </div>
      ${projHtml}
    </div>`;
}

document.getElementById("addProjectBtn")?.addEventListener("click", () => {
  currentProjects.push({ id: uid(), name: "New Project", bullets: [] });
  renderProjects();
  const inputs = document.querySelectorAll(".proj-name-input");
  if (inputs.length) { const last = inputs[inputs.length-1]; last.focus(); last.select(); }
});

document.querySelector('[data-tab="resume"]')?.addEventListener("click", renderResumeTab);

renderProjects();

});
