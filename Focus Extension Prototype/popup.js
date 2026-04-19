// --- POPUP UI (front end) ---

// Prototype UI for Focus Tracker
// This is intentionally lightweight — popup is just a "view layer" over real tracking state in background.
// The real logic lives elsewhere; this only visualizes session progress.

const timerEl = document.getElementById('timer');
let tickHandle = null;


// popup is destroyed/recreated every time user opens it
// so we must rebuild UI state from chrome.storage every time (no in-memory trust here)
document.addEventListener('DOMContentLoaded', () => {

  const start_Btn = document.getElementById('start_Btn');
  const stop_Btn = document.getElementById('stop_Btn');

  if (!timerEl || !start_Btn || !stop_Btn) {
    console.error('Focus Tracker popup missing UI elements');
    return;
  }

  // Rehydrate session state so timer doesn't "reset visually" on reopen
  Focus_ui();

  start_Btn.addEventListener('click', () => {
    const now = Date.now();

    chrome.runtime.sendMessage({ action: 'start' });

    // optimistic UI update — assume background accepted start immediately
    // avoids user feeling delay between click and visible feedback
    FT_Start(now);
  });


  stop_Btn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'stop' });

    // immediate UI reset — focus session is considered ended locally
    End_focusSess();
  });

});


// reads session state from storage and rebuilds timer display
// this is important because popup does NOT stay alive in Chrome
async function Focus_ui() {

  const { enabled, Start_LockIn } =
    await chrome.storage.local.get(['enabled', 'Start_LockIn']);

  if (enabled && Start_LockIn) {
    FT_Start(Start_LockIn);
  } else {
    End_focusSess();
  }

}



// core focus timer renderer (HH:MM:SS)
// we compute from timestamps instead of incrementing counters to avoid drift
function FT_Start(startTs) {

  // prevents multiple interval stacking if use repeatedly opens popup or clicks start
  if (tickHandle) clearInterval(tickHandle);


  const render = () => {

    const elapsed = Date.now() - startTs;

    const h = Math.floor(elapsed / 3600000);
    const m = Math.floor((elapsed % 3600000) / 60000);
    const s = Math.floor((elapsed % 60000) / 1000);

    // formatted display — keeps UI stable regardless of session length
    timerEl.textContent =
      [h, m, s]
        .map(x => String(x).padStart(2, '0'))
        .join(':');

  };

  render(); // immediate render prevents 1s "blank delay" on open

  tickHandle = setInterval(render, 1000);
}


// resets UI when focus ends or is not active
function End_focusSess() {

  if (tickHandle) {
    clearInterval(tickHandle);
    tickHandle = null;
  }

  // neutral state — indicates no active focus session
  timerEl.textContent = '00:00:00';
}