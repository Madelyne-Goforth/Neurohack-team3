// --- focus tracker (background brain) ---

// Note that this is a prototype. The focus is on functionality, not design.
// Unforunately, no connectivity between extenstion and App//

const IDLE_GRACE_SECONDS = 15 /// These are test numbers, tweak as needed (usually 5 minutes)
const TAB_STALE_THRESHOLD = 30000 // These are test numbers, tweak as needed (usually 20 minutes)

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    enabled: false,
    sessionStart: null,          // FIXED (was missing alignment)
    lastSeenByTab: {},           // FIXED
    isUserAway: false,   // yeah this one ended up snake_case
    tabsClosed: 0
  })
})


// checks for tabs just sitting there doing nothing
async function scanForInactiveTabs(){
  const { enabled, lastSeenByTab } =
    await chrome.storage.local.get(['enabled','lastSeenByTab'])

  if (!enabled) return

  const tabs = await chrome.tabs.query({ active: false, pinned: false })
  const now = Date.now()
  const updated_log = { ...lastSeenByTab }   // naming drift, happens

  for (const tab of tabs){

    // chrome:// stuff can break things (learned the hard way)
    if (!tab.url || !tab.url.startsWith('http')) continue

    const lastTouch = updated_log[tab.id] ?? now
    const stale_for = now - lastTouch

    if (stale_for > TAB_STALE_THRESHOLD){

      const title = tab.title || 'Untitled'  // sometimes comes back empty

      chrome.notifications.create(`nudge-${tab.id}`,{
        type: 'basic',
        iconUrl: 'icons/icon-128.png',
        title: 'Still need this tab?',
        message: `"${title.slice(0,25)}..." has been sitting idle.`,
        buttons: [
          { title: 'Keep it' },
          { title: 'Close it' }
        ],
        priority: 2
      })

      // don’t spam — reset its timer
      updated_log[tab.id] = now
    }
  }

  chrome.storage.local.set({ lastSeenByTab: updated_log })
}


// detect if user just left
chrome.idle.onStateChanged.addListener(async (state) => {

  const { enabled } = await chrome.storage.local.get('enabled')
  if (!enabled) return

  if (state === 'idle'){

    chrome.storage.local.set({ isUserAway: true })

    chrome.notifications.create('idle-check',{
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: 'Quick check-in',
      message: 'You’ve been inactive for a bit — still working?',
      priority: 2
    })

  } 
  else if (state === 'active'){
    chrome.storage.local.set({ isUserAway: false })
  }

})

// Notification buttons
chrome.notifications.onButtonClicked.addListener((id, btnIdx) => {

  if (!id.startsWith('nudge-')) return

  const tabId = Number(id.split('-')[1])

  if (btnIdx === 1){  // close

    try{
      chrome.tabs.remove(tabId)
    } catch(e){
    }

    chrome.storage.local.get('tabsClosed',(res)=>{
      chrome.storage.local.set({
        tabsClosed: (res.tabsClosed || 0) + 1
      })
    })

  }

  chrome.notifications.clear(id)

})


// switching tabs = "I'm using this"; will not flag tab as inactive
chrome.tabs.onActivated.addListener(({ tabId }) => {

  chrome.storage.local.get('lastSeenByTab',(res)=>{

    const log = res.lastSeenByTab || {}
    log[tabId] = Date.now()

    chrome.storage.local.set({ lastSeenByTab: log })
  })

})

// clean up old entries (otherwise this grows forever)
chrome.tabs.onRemoved.addListener((tabId) => {

  chrome.storage.local.get('lastSeenByTab',(res)=>{

    const log = res.lastSeenByTab || {}

    if (log[tabId]){
      delete log[tabId]
      chrome.storage.local.set({ lastSeenByTab: log })
    }

  })

})


// Start / stop from pop_up
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.action === 'start'){
    const now = Date.now()

    chrome.tabs.query({}, (tabs)=>{
      const initialLog = {}

      // mark everything fresh so we don’t instantly nag
      for (const t of tabs){
        initialLog[t.id] = now
      }

      chrome.storage.local.set({
        enabled: true,
        sessionStart: now,   // FIXED
        lastSeenByTab: initialLog,
        isUserAway: false
      })
    })
    chrome.alarms.create('sweep',{ periodInMinutes: 0.5 })
    chrome.idle.setDetectionInterval(IDLE_GRACE_SECONDS)
  } 
  else if  (req.action === 'stop'){

    chrome.storage.local.set({ 
      enabled: false,
      sessionStart: null   // FIXED
    })
    chrome.alarms.clearAll()

  }
  sendResponse({ ok: true })
  return true
})




// loop
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'sweep'){
    scanForInactiveTabs()
  }
})