// sidepanel.js — Multi-chat + Preferred Capture + Upload + Ask + Video Recording (with picker fallback)
(async function () {
  // ---------- Tell background we opened, and notify on close ----------
  try { chrome.runtime?.sendMessage?.({ type: "PANEL_OPENED" }); } catch {}
  window.addEventListener("beforeunload", () => {
    try { chrome.runtime?.sendMessage?.({ type: "PANEL_CLOSED" }); } catch {}
  });

  // ---------- Storage ----------
  const store = {
    async get(key, def) { const x = await chrome.storage.local.get(key); return x[key] ?? def; },
    async set(obj) { await chrome.storage.local.set(obj); }
  };

  // ---------- DOM ----------
  const appRoot = document.querySelector(".app");
  const chatListEl = document.getElementById("chatList");
  const newChatBtn = document.getElementById("newChat");
  const renameBtn = document.getElementById("renameChat");
  const deleteBtn = document.getElementById("deleteChat");
  const toggleSidebarBtn = document.getElementById("toggleSidebar");
  const chatHeader = document.getElementById("chatHeader");

  const ctxEl = document.getElementById("context");
  const attachCtxEl = document.getElementById("attachContext");

  const messagesEl = document.getElementById("messages");
  const promptEl = document.getElementById("prompt");
  const askBtn = document.getElementById("ask");

  const statusEl = document.getElementById("status");               // toolbar status
  const composerStatusEl = document.getElementById("composerStatus");// composer status

  const btnPreferred = document.getElementById("btn-preferred-capture");
  const btnUpload = document.getElementById("btn-upload");
  const fileInput = document.getElementById("file-input");

  // NEW (video): buttons + status (be sure these exist in sidepanel.html)
  const recStartBtn = document.getElementById("btn-record-start");
  const recStopBtn  = document.getElementById("btn-record-stop");
  const recStatusEl = document.getElementById("recordStatus");

  // ---------- Helpers ----------
  const setStatus = (s) => { if (statusEl) statusEl.textContent = s || ""; };
  const setComposerStatus = (s) => { if (composerStatusEl) composerStatusEl.textContent = s || ""; };

  async function findBase() {
    const saved = (await chrome.storage.local.get("vp_BASE")).vp_BASE;
    const candidates = saved
      ? [saved, "http://localhost:3000", "http://127.0.0.1:3000", "https://localhost:3000"]
      : ["http://localhost:3000", "http://127.0.0.1:3000", "https://localhost:3000"];
    for (const base of candidates) {
      try {
        const res = await fetch(base + "/api/hints", { method: "GET" });
        if (res.ok) { await chrome.storage.local.set({ vp_BASE: base }); return base; }
      } catch {}
    }
    throw new Error("Could not reach the app API. Start your dev server and check host_permissions.");
  }

  let BASE = "http://localhost:3000";
  try { BASE = await findBase(); } catch (e) { setStatus(e.message); }

  const MAX_CONTEXT_CHARS = 20000;
  const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
  const activeChat = () => chats.find(c => c.id === activeId) || null;

  function appendToContext(text, label) {
    const chat = activeChat(); if (!chat || !text) return;
    const ts = new Date().toLocaleTimeString();
    if (chat.context?.trim()) chat.context += `\n\n---\n[${ts}] ${label}:\n${text}`;
    else chat.context = text;
    if (chat.context.length > MAX_CONTEXT_CHARS) chat.context = chat.context.slice(-MAX_CONTEXT_CHARS);
    ctxEl.value = chat.context;
    store.set({ vp_chats: chats });
  }

  // ---------- Model ----------
  let chats = await store.get("vp_chats", []);
  let activeId = await store.get("vp_activeId", null);

  // Pull lastContext (from content.js selection)
  try {
    const d = await chrome.storage.session.get("vp_lastContext");
    if (d?.vp_lastContext) {
      ensureFirstChat();
      appendToContext(d.vp_lastContext, "[Selection]");
      chrome.storage.session.remove("vp_lastContext").catch(()=>{});
    }
  } catch {}

  // Restore sidebar collapsed state
  (async () => {
    const { vp_sbCollapsed } = await chrome.storage.local.get("vp_sbCollapsed");
    if (vp_sbCollapsed) appRoot?.classList.add("collapsed");
  })();

  // ---------- Render ----------
  function renderChats() {
    chatListEl.innerHTML = "";
    chats
      .sort((a,b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt))
      .forEach(c => {
        const item = document.createElement("div");
        item.className = "sb-item" + (c.id === activeId ? " active" : "");
        const title = document.createElement("div");
        title.className = "sb-item-title";
        title.textContent = c.title || "Untitled";
        const small = document.createElement("small");
        small.textContent = new Date(c.createdAt).toLocaleDateString();
        item.append(title, small);
        item.addEventListener("click", () => { activeId = c.id; store.set({ vp_activeId: activeId }); renderAll(); });
        chatListEl.appendChild(item);
      });
  }
  function renderMessages() {
    const chat = activeChat();
    messagesEl.innerHTML = "";
    if (!chat) return;
    chat.messages.forEach(m => {
      const div = document.createElement("div");
      div.className = "msg " + (m.role === "user" ? "user" : "assistant");
      div.textContent = m.content;
      messagesEl.appendChild(div);
    });
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  function renderHeaderAndContext() {
    const chat = activeChat();
    if (!chat) {
      chatHeader.textContent = "Select or create a chat";
      ctxEl.value = "";
      attachCtxEl.checked = true;
      renameBtn.disabled = true; deleteBtn.disabled = true;
      return;
    }
    chatHeader.textContent = chat.title || "Untitled chat";
    ctxEl.value = chat.context || "";
    attachCtxEl.checked = true; // always on (hint)
    renameBtn.disabled = false; deleteBtn.disabled = false;
  }
  function renderAll() { renderChats(); renderHeaderAndContext(); renderMessages(); }
  async function saveActiveChat(partial) {
    const idx = chats.findIndex(c => c.id === activeId); if (idx === -1) return;
    chats[idx] = { ...chats[idx], ...partial, updatedAt: Date.now() };
    await store.set({ vp_chats: chats });
  }

  // ---------- Chat actions ----------
  newChatBtn.addEventListener("click", async () => {
    const id = uid();
    const chat = { id, title: "New chat", createdAt: Date.now(), updatedAt: Date.now(), messages: [], context: "", attachContext: true };
    chats.unshift(chat); activeId = id;
    await store.set({ vp_chats: chats, vp_activeId: activeId });
    renderAll(); promptEl.focus();
  });
  renameBtn.addEventListener("click", async () => {
    const chat = activeChat(); if (!chat) return;
    const title = prompt("Rename chat:", chat.title || "Untitled"); if (title == null) return;
    chat.title = title.trim() || "Untitled"; chat.updatedAt = Date.now();
    await store.set({ vp_chats: chats }); renderAll();
  });
  deleteBtn.addEventListener("click", async () => {
    const chat = activeChat(); if (!chat) return;
    if (!confirm("Delete this chat?")) return;
    chats = chats.filter(c => c.id !== chat.id);
    if (activeId === chat.id) activeId = chats[0]?.id || null;
    await store.set({ vp_chats: chats, vp_activeId: activeId }); renderAll();
  });
  toggleSidebarBtn.addEventListener("click", async () => {
    appRoot.classList.toggle("collapsed");
    await chrome.storage.local.set({ vp_sbCollapsed: appRoot.classList.contains("collapsed") });
  });

  ctxEl.addEventListener("input", () => { const chat = activeChat(); if (!chat) return; chat.context = ctxEl.value; store.set({ vp_chats: chats }); });

  // ---------- Send message (use prompt -> /api/vinay/ask) ----------
  async function sendMessage() {
    const chat = activeChat(); if (!chat) { ensureFirstChat(); return; }
    const content = promptEl.value.trim(); if (!content) return;

    chat.messages.push({ role: "user", content, ts: Date.now() });
    promptEl.value = ""; renderMessages(); await saveActiveChat({});

    const ctx = (chat.context || "").trim();
    const prompt = ctx
      ? `Use the following context to answer the question.\n\nContext:\n${ctx}\n\nQuestion:\n${content}`
      : content;

    setComposerStatus("Thinking…");
    try {
      const r = await fetch(`${BASE}/api/vinay/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const data = await r.json();
      const text = data?.text || data?.answer || data?.choices?.[0]?.message?.content || data?.error || "(no response)";
      chat.messages.push({ role: "assistant", content: text, ts: Date.now() });
      await saveActiveChat({}); renderMessages(); setComposerStatus("");
    } catch (e) {
      chat.messages.push({ role: "assistant", content: "Error: " + (e?.message || e), ts: Date.now() });
      await saveActiveChat({}); renderMessages(); setComposerStatus("");
    }
  }
  askBtn.addEventListener("click", sendMessage);
  promptEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  // ---------- Preferred Capture (region OCR) ----------
  btnPreferred.addEventListener("click", async () => {
    setStatus("Select a region…");

    const tab = (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
    if (!tab?.id || !tab?.url) { setStatus("No active tab."); return; }

    try {
      // If you’re using optional_host_permissions, request per-origin here.
      // If your manifest has "<all_urls>" in host_permissions, this will succeed without request.
      const origin = new URL(tab.url).origin;
      const originPattern = origin + "/*";
      const have = await chrome.permissions.contains({ origins: [originPattern] });
      if (!have) {
        const granted = await chrome.permissions.request({ origins: [originPattern] });
        if (!granted) { setStatus("Permission denied for this site."); return; }
      }
    } catch (e) {
      // If you didn’t add "optional_host_permissions", contains/request may throw — safe to ignore if you granted <all_urls>.
    }

    await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: injectedOverlay });

    const metrics = await new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(null), 60000);
      function handler(msg) {
        if (msg?.type === "VP_RECT_SELECTED") {
          chrome.runtime.onMessage.removeListener(handler);
          clearTimeout(timeout);
          resolve(msg.payload);
        }
      }
      chrome.runtime.onMessage.addListener(handler);
    });
    if (!metrics) { setStatus(""); return; }

    const dataUrl = await new Promise((resolve) => {
      chrome.tabs.captureVisibleTab({ format: "png" }, (u) => resolve(u || null));
    });
    if (!dataUrl) { setStatus("Capture failed."); return; }

    const blob = await cropDataURL(dataUrl, metrics);
    if (!blob) { setStatus("Crop failed."); return; }

    setStatus("Reading…");
    const form = new FormData();
    form.append("file", new File([blob], "capture.png", { type: "image/png" }));
    form.append("prompt", "OCR this region exactly. Return clear text in reading order.");
    try {
      const r = await fetch(`${BASE}/api/vinay/ocr`, { method: "POST", body: form });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "OCR request failed");
      if (data?.text) appendToContext(data.text, "[Preferred Capture]");
    } catch (e) {
      appendToContext(`OCR error (base: ${BASE}): ${e?.message || e}`, "[Preferred Capture]");
    } finally {
      setStatus("");
    }
  });

  function injectedOverlay() {
    if (window.__VP_REGION_OVERLAY__) return; window.__VP_REGION_OVERLAY__ = true;
    const overlay = document.createElement("div"); const box = document.createElement("div");
    Object.assign(overlay.style, { position: "fixed", inset: "0", background: "rgba(0,0,0,0.15)", cursor: "crosshair", zIndex: "2147483646" });
    Object.assign(box.style, { position: "absolute", border: "2px solid #2563eb", background: "rgba(37,99,235,0.15)" });
    overlay.appendChild(box); document.documentElement.appendChild(overlay);
    const start = { x: 0, y: 0 }; let dragging = false;
    const setRect = (x2, y2) => {
      const x = Math.min(start.x, x2), y = Math.min(start.y, y2), w = Math.abs(x2 - start.x), h = Math.abs(y2 - start.y);
      Object.assign(box.style,{ left: x+"px", top: y+"px", width: w+"px", height: h+"px" });
      return { x,y,w,h };
    };
    const cleanup = (rect) => {
      overlay.removeEventListener("mousedown", onDown);
      overlay.removeEventListener("mousemove", onMove);
      overlay.removeEventListener("mouseup", onUp);
      overlay.remove();
      window.__VP_REGION_OVERLAY__ = false;
      if (rect) try {
        chrome.runtime.sendMessage({
          type: "VP_RECT_SELECTED",
          payload: { rect, scrollX: window.scrollX||0, scrollY: window.scrollY||0, dpr: window.devicePixelRatio||1 }
        });
      } catch {}
    };
    const onDown = (e)=>{ dragging=true; start.x=e.clientX; start.y=e.clientY; setRect(e.clientX,e.clientY); e.preventDefault(); };
    const onMove = (e)=>{ if(!dragging) return; setRect(e.clientX,e.clientY); e.preventDefault(); };
    const onUp   = (e)=>{ if(!dragging) return cleanup(null); dragging=false; const rect=setRect(e.clientX,e.clientY); if(rect.w<8||rect.h<8) return cleanup(null); cleanup(rect); e.preventDefault(); };
    overlay.addEventListener("mousedown", onDown, {passive:false});
    overlay.addEventListener("mousemove", onMove, {passive:false});
    overlay.addEventListener("mouseup", onUp, {passive:false});
  }

  async function cropDataURL(dataUrl, { rect, scrollX, scrollY, dpr }) {
    const { x,y,w,h } = rect;
    const sx = Math.round((x+scrollX)*dpr), sy = Math.round((y+scrollY)*dpr);
    const sw = Math.max(1, Math.round(w*dpr)), sh = Math.max(1, Math.round(h*dpr));
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const c = document.createElement("canvas");
          c.width=sw; c.height=sh;
          const ctx = c.getContext("2d");
          ctx.drawImage(img,-sx,-sy);
          c.toBlob((b)=>resolve(b),"image/png");
        } catch { resolve(null); }
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  }

  // ======== Screen/Tab capture helper (single function: try tabCapture, else picker) ========
  // ======== Screen/Tab capture helper (smart: try tabCapture only when legal) ========
// Replace your captureTabWithFallback() with this picker-only version
async function captureTabWithFallback() {
  // Always use the desktop picker from the side panel (tab/window/screen + audio)
  return await new Promise((resolve, reject) => {
    // Note: 3-arg form (sources, targetTab, cb) or 2-arg (sources, cb) both work.
    chrome.desktopCapture.chooseDesktopMedia(
      ["tab", "audio", "window", "screen"],
      (streamId) => {
        if (!streamId) {
          return reject(new Error("User cancelled capture picker"));
        }
        // Use "desktop" as the media source; it's the most compatible with streamId from chooseDesktopMedia
        const constraints = {
          audio: {
            mandatory: {
              chromeMediaSource: "desktop",
              chromeMediaSourceId: streamId
            }
          },
          video: {
            mandatory: {
              chromeMediaSource: "desktop",
              chromeMediaSourceId: streamId,
              maxWidth: 1920,
              maxHeight: 1080,
              maxFrameRate: 30
            }
          }
        };
        navigator.mediaDevices.getUserMedia(constraints)
          .then(resolve)
          .catch(err => reject(new Error("Picker stream getUserMedia failed: " + (err && err.message ? err.message : err))));
      }
    );
  });
}



  // ---------- Upload handlers ----------
  btnUpload.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async (e) => {
    const files = Array.from(e.target.files || []); if (!files.length) return;
    for (const f of files) await handleFile(f);
    fileInput.value = "";
  });

  async function handleFile(file) {
    try {
      setStatus(`Uploading ${file.name}…`);
      if (file.type.startsWith("image/")) {
        const form = new FormData();
        form.append("file", file);
        form.append("prompt", "OCR this image exactly. Return clean text.");
        const r = await fetch(`${BASE}/api/vinay/ocr`, { method: "POST", body: form });
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || "OCR failed");
        if (data?.text) appendToContext(data.text, `[Image: ${file.name}]`);
      } else if (file.type.startsWith("audio/") || file.type.startsWith("video/")) {
        const form = new FormData();
        form.append("file", file);
        const r = await fetch(`${BASE}/api/vinay/transcribe`, { method: "POST", body: form });
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || "Transcription failed");
        if (data?.text) appendToContext(data.text, `[Transcript: ${file.name}]`);
      } else if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
        const form = new FormData();
        form.append("file", file);
        const r = await fetch(`${BASE}/api/vinay/pdf`, { method: "POST", body: form });
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || "PDF parse failed");
        if (data?.text) appendToContext(data.text, `[PDF: ${file.name}]`);
      } else if (file.type.startsWith("text/") || /\.(txt|md|markdown)$/i.test(file.name)) {
        const text = await file.text();
        appendToContext(text, `[Text: ${file.name}]`);
      } else {
        appendToContext(`(Uploaded ${file.name} – unsupported type here)`, "[Upload]");
      }
    } catch (e) {
      appendToContext(`Error processing ${file.name} (base: ${BASE}): ${e?.message || e}`, "[Upload]");
    } finally {
      setStatus("");
    }
  }

  // ---------- Video Recording Feature (tab capture + OCR sampling + transcription) ----------
  (function setupRecordingFeature() {
    let mediaStream = null, micStream = null, mixedStream = null;
    let mediaRecorder = null, chunks = [];
    let ocrTimer = null, videoEl = null, canvas = null, ctx2d = null;
    let lastOCRHash = "", startedAt = 0;

    function setRecStatus(s) { if (recStatusEl) recStatusEl.textContent = s || ""; }
    function setButtons(running) {
      if (!recStartBtn || !recStopBtn) return; // allow HTML without these controls
      recStartBtn.disabled = running;
      recStopBtn.disabled = !running;
    }
    function quickHash(str) { let h=0,i=0,l=str.length; while(i<l)h=(h*31+str.charCodeAt(i++))|0; return h.toString(16); }

    async function startRecording() {
      try {
        setButtons(true); setRecStatus("Starting…");
        // Try tabCapture; fall back to picker when not invoked / blocked pages
        mediaStream = await captureTabWithFallback();

        // Optional mic mixing
        try { micStream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { micStream = null; }

        const hasTabAudio = mediaStream.getAudioTracks().length > 0;
        const hasMicAudio = micStream && micStream.getAudioTracks().length > 0;

        if (hasTabAudio || hasMicAudio) {
          const ac = new AudioContext(); const dest = ac.createMediaStreamDestination();
          if (hasTabAudio) ac.createMediaStreamSource(mediaStream).connect(dest);
          if (hasMicAudio) ac.createMediaStreamSource(micStream).connect(dest);

          mixedStream = new MediaStream();
          mediaStream.getVideoTracks().forEach(t=>mixedStream.addTrack(t));
          dest.stream.getAudioTracks().forEach(t=>mixedStream.addTrack(t));
        } else {
          mixedStream = mediaStream;
        }

        // Hidden <video> to snapshot frames for OCR
        videoEl = document.createElement("video");
        videoEl.srcObject = mixedStream; videoEl.muted = true; videoEl.playsInline = true;
        await videoEl.play().catch(()=>{});

        canvas = document.createElement("canvas"); ctx2d = canvas.getContext("2d");

        const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus") ? "video/webm;codecs=vp9,opus"
                        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus") ? "video/webm;codecs=vp8,opus"
                        : "video/webm";
        mediaRecorder = new MediaRecorder(mixedStream, { mimeType });
        chunks = [];
        mediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
        mediaRecorder.onstop = handleRecorderStop;
        mediaRecorder.start(1000); // gather 1s chunks

        startedAt = Date.now();
        ocrTimer = setInterval(sampleOCRFrame, 2000); // snapshot every 2s
        setRecStatus("Recording…");
      } catch (e) {
        setButtons(false);
        setRecStatus("Record failed: " + (e?.message || e));
        stopAllTracks();
      }
    }

    async function sampleOCRFrame() {
      try {
        if (!videoEl || !canvas) return;
        const w = videoEl.videoWidth, h = videoEl.videoHeight; if (!w||!h) return;
        canvas.width=w; canvas.height=h; ctx2d.drawImage(videoEl,0,0,w,h);
        const blob = await new Promise(r=>canvas.toBlob(r,"image/png"));
        if (!blob) return;

        const form=new FormData();
        form.append("file",new File([blob],"frame.png",{type:"image/png"}));
        form.append("prompt","OCR this image exactly. Return clear text. Ignore UI chrome.");

        const r=await fetch(`${BASE}/api/vinay/ocr`,{method:"POST",body:form});
        const data=await r.json().catch(()=>({}));
        const text=(data?.text||"").trim();
        if(text){
          const hsh=quickHash(text);
          if(hsh!==lastOCRHash){
            lastOCRHash=hsh;
            appendToContext(text,`[Video OCR @ ${Math.round((Date.now()-startedAt)/1000)}s]`);
          }
        }
      } catch {
        // ignore OCR errors during recording; keep trying next tick
      }
    }

    function stopAllTracks(){ [mediaStream,micStream,mixedStream].forEach(s=>s&&s.getTracks().forEach(t=>t.stop())); }

    async function stopRecording(){
      setButtons(false); setRecStatus("Stopping…");
      if (ocrTimer) { clearInterval(ocrTimer); ocrTimer = null; }
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      } else {
        stopAllTracks(); setRecStatus("");
      }
    }

    async function handleRecorderStop(){
      try {
        stopAllTracks();
        const blob = new Blob(chunks, { type: chunks[0]?.type || "video/webm" });
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: blob.type });

        setRecStatus("Uploading…");
        const form = new FormData(); form.append("file", file);
        const r = await fetch(`${BASE}/api/vinay/transcribe`, { method: "POST", body: form });
        const data = await r.json().catch(()=>({}));

        if (data?.text) {
          appendToContext(data.text, "[Video transcript]");
          setRecStatus("Transcript saved.");
        } else {
          setRecStatus("Uploaded (no transcript).");
        }

        // Optional: let user download the recording too (needs "downloads" permission)
        if (chrome.downloads) {
          const url = URL.createObjectURL(blob);
          chrome.downloads.download({ url, filename: file.name, saveAs: true }, () => {
            setTimeout(() => URL.revokeObjectURL(url), 30000);
          });
        }
      } catch (e) {
        appendToContext("Transcription error: " + (e?.message || e), "[Video transcript]");
        setRecStatus("Transcription error.");
      }
    }

    // Wire buttons if present
    if (recStartBtn && recStopBtn) {
      recStartBtn.addEventListener("click", startRecording);
      recStopBtn.addEventListener("click", stopRecording);
      setButtons(false);
    }
  })();

  // ---------- Init ----------
  let _ensureFirst = false;
  function ensureFirstChat() {
    if (_ensureFirst) return;
    _ensureFirst = true;
    if (!activeId && chats.length === 0) {
      const id = uid();
      const chat = { id, title: "New chat", createdAt: Date.now(), updatedAt: Date.now(), messages: [], context: "", attachContext: true };
      chats.unshift(chat); activeId = id;
      store.set({ vp_chats: chats, vp_activeId: activeId });
    }
    renderAll();
    setTimeout(() => promptEl?.focus(), 0);
  }

  renderAll(); ensureFirstChat();
})();
