// background.js — open side panel, hide "Open VP" button, re-show when panel closes
const DEFAULT_PANEL_PATH = "sidepanel.html";

// Keep track of which tab has the panel open
const OPEN_TABS_KEY = "vp_openTabs";

async function getOpenSet() {
  const d = await chrome.storage.session.get(OPEN_TABS_KEY);
  const arr = Array.isArray(d[OPEN_TABS_KEY]) ? d[OPEN_TABS_KEY] : [];
  return new Set(arr);
}

async function setOpen(tabId, isOpen) {
  const set = await getOpenSet();
  if (isOpen) set.add(tabId); else set.delete(tabId);
  await chrome.storage.session.set({ [OPEN_TABS_KEY]: Array.from(set) });
}

// Action click opens side panel (also useful for debugging)
chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  }
});

// Clean up when tab closes
chrome.tabs.onRemoved.addListener(async (tabId) => { await setOpen(tabId, false); });

// Messages from content & sidepanel
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const tabId = sender?.tab?.id;

  if (msg?.type === "OPEN_PANEL_WITH_CONTEXT") {
    if (tabId != null) {
      if (chrome.sidePanel?.setOptions && chrome.sidePanel?.open) {
        chrome.sidePanel.setOptions({ tabId, path: DEFAULT_PANEL_PATH, enabled: true }).catch(() => {});
        chrome.sidePanel.open({ tabId }).catch(() => {});
      }
      chrome.storage.session.set({ vp_lastContext: msg.context || "" });
      setOpen(tabId, true);
    }
    sendResponse?.({ ok: true });
    return;
  }

  if (msg?.type === "OPEN_SIDE_PANEL") {
    if (tabId != null) {
      if (chrome.sidePanel?.setOptions && chrome.sidePanel?.open) {
        chrome.sidePanel.setOptions({ tabId, path: DEFAULT_PANEL_PATH, enabled: true }).catch(() => {});
        chrome.sidePanel.open({ tabId }).catch(() => {});
      }
      setOpen(tabId, true);
    }
    sendResponse?.({ ok: true });
    return;
  }

  if (msg?.type === "PANEL_OPENED") {
    // Associate with active tab (side panel pages have no sender.tab)
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const t = tabs?.[0];
      if (t?.id != null) setOpen(t.id, true);
    });
    sendResponse?.({ ok: true });
    return;
  }

  if (msg?.type === "PANEL_CLOSED") {
    // Re-show the button on the active tab when panel closes
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const t = tabs?.[0];
      if (t?.id != null) {
        setOpen(t.id, false);
        chrome.tabs.sendMessage(t.id, { type: "SHOW_OPEN_BUTTON" }).catch(() => {});
      }
    });
    sendResponse?.({ ok: true });
    return;
  }

  // === NEW: tabCapture probe for sidepanel.js ===
  if (msg?.type === "VP_TRY_TAB_CAPTURE") {
    try {
      chrome.tabCapture.capture({ audio: true, video: true }, (stream) => {
        if (stream) {
          // We can’t send the stream across, but signal success
          sendResponse({ ok: true });
          stream.getTracks().forEach(t => t.stop()); // immediately stop
        } else {
          sendResponse({ ok: false, error: chrome.runtime.lastError?.message || "tabCapture failed" });
        }
      });
    } catch (e) {
      sendResponse({ ok: false, error: e?.message || String(e) });
    }
    return true; // keep channel open for async sendResponse
  }

  return false; // default
});
