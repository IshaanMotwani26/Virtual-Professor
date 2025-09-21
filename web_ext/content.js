// content.js — inject floating buttons and wire them to the side panel

(function () {
  if (window.__VP_CONTENT__) return; // prevent double-inject
  window.__VP_CONTENT__ = true;

  const ASK_ID = "__vp_btn_ask";
  const OPEN_ID = "__vp_btn_open";

  // Helper: create a button
  function makeBtn({ id, text, className }) {
    let el = document.getElementById(id);
    if (el) return el;
    el = document.createElement("div");
    el.id = id;
    el.textContent = text;
    el.className = className;
    el.style.userSelect = "none";
    document.documentElement.appendChild(el);
    return el;
  }

  // Buttons
  const askBtn = makeBtn({ id: ASK_ID, text: "Ask VP", className: "vp-floating-btn" });

  // Show Ask button only when there is a selection
  function updateAskVisibility() {
    const sel = window.getSelection?.()?.toString()?.trim();
    askBtn.style.display = sel ? "block" : "none";
  }
  document.addEventListener("selectionchange", updateAskVisibility, { passive: true });
  updateAskVisibility();

  // Wire: Ask VP with selected text as context
  askBtn.addEventListener("click", () => {
    const sel = window.getSelection?.()?.toString() || "";
    chrome.runtime.sendMessage({ type: "OPEN_PANEL_WITH_CONTEXT", context: sel }, () => {});
    // Hide until panel closes
    askBtn.style.display = "none";
  });


  // Background will ping to re-show this when panel closes

})();
