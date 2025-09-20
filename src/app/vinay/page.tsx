// src/app/vinay/page.tsx
"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/header";

type Tab = "chat" | "image";
type Hist = { id: string; q: string; a: string; at: number };

function StatusPill({ hasKey }: { hasKey: boolean | null }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
        hasKey === null
          ? "bg-gray-200/60 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
          : hasKey
          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
          : "bg-rose-500/15 text-rose-700 dark:text-rose-300",
      ].join(" ")}
    >
      <span className={["h-2 w-2 rounded-full", hasKey ? "bg-emerald-500" : "bg-rose-500"].join(" ")} />
      {hasKey === null ? "Checking key…" : hasKey ? "OPENAI_API_KEY detected" : "No OPENAI_API_KEY"}
    </span>
  );
}

function Card({
  children,
  title,
  subtitle,
  className = "",
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <section
      className={[
        "rounded-2xl border shadow-lg",
        "border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-900/70",
        className,
      ].join(" ")}
    >
      {(title || subtitle) && (
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <div>
            <h3 className="text-base font-semibold">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
          </div>
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

/** Chat panel extracted so it keeps identity and focus */
const ChatPanel = memo(function ChatPanel({
  input,
  setInput,
  output,
  error,
  canSend,
  loading,
  onSend,
}: {
  input: string;
  setInput: (v: string) => void;
  output: string;
  error: string;
  canSend: boolean;
  loading: boolean;
  onSend: () => void;
}) {
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  // Keep focus even after rerenders
  useEffect(() => {
    if (taRef.current && document.activeElement === taRef.current) return;
    // Do nothing unless autoFocus will handle initial mount
  }, []);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* left: input */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Prompt</label>
        <textarea
          ref={taRef}
          autoFocus
          className="h-[220px] w-full rounded-xl border border-gray-300 bg-white/70 p-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900/60 dark:focus:ring-blue-900/30"
          placeholder="Ask a question — I’ll guide you step-by-step without giving away the final answer…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <button
            onClick={onSend}
            disabled={!canSend || loading}
            className={[
              "rounded-xl px-4 py-2 text-sm font-medium text-white transition",
              canSend && !loading
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-blue-300 cursor-not-allowed dark:bg-blue-900/40",
            ].join(" ")}
          >
            {loading ? "Thinking…" : "Send"}
          </button>
          {error && <span className="text-sm text-rose-500">{error}</span>}
        </div>
      </div>

      {/* right: output */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Response</label>
        <div className="min-h-[220px] whitespace-pre-wrap rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-900/60">
          {output || <span className="text-gray-500 dark:text-gray-400">No response yet.</span>}
        </div>
      </div>
    </div>
  );
});

const ImagePanel = memo(function ImagePanel({
  file,
  setFile,
  ocrOutput,
  canOCR,
  loading,
  onRun,
}: {
  file: File | null;
  setFile: (f: File | null) => void;
  ocrOutput: string;
  canOCR: boolean;
  loading: boolean;
  onRun: () => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    if (f && /^image\//.test(f.type)) setFile(f);
  }, [setFile]);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-3">
        <label className="text-sm font-medium">Upload</label>
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          className="grid h-[140px] place-items-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-center transition hover:border-gray-400 dark:border-gray-700 dark:bg-gray-900/50"
        >
          <div>
            <input
              id="file-input"
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <div className="font-medium text-blue-600 hover:underline dark:text-blue-300">Click to choose</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">or drag &amp; drop (PNG/JPG, &lt; 5MB)</div>
            </label>
          </div>
        </div>

        {file && (
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-800">
            <div className="h-16 w-16 overflow-hidden rounded-lg border dark:border-gray-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview || ""} alt="preview" className="h-full w-full object-cover" />
            </div>
            <div className="truncate">
              <div className="truncate text-sm font-medium">{file.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || "image"}
              </div>
            </div>
            <button
              className="ml-auto rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              onClick={() => setFile(null)}
            >
              Clear
            </button>
          </div>
        )}

        <button
          onClick={onRun}
          disabled={!canOCR || loading}
          className={[
            "rounded-xl px-4 py-2 text-sm font-medium text-white transition",
            canOCR && !loading
              ? "bg-indigo-600 hover:bg-indigo-700"
              : "bg-indigo-300 cursor-not-allowed dark:bg-indigo-900/40",
          ].join(" ")}
        >
          {loading ? "Reading…" : "Run OCR"}
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Extracted Text & Hints</label>
        <div className="min-h-[220px] whitespace-pre-wrap rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-900/60">
          {ocrOutput || <span className="text-gray-500 dark:text-gray-400">No OCR output yet.</span>}
        </div>
      </div>
    </div>
  );
});

export default function Vinay() {
  const [active, setActive] = useState<Tab>("chat");
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  // chat state
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [history, setHistory] = useState<Hist[]>([]);
  const [error, setError] = useState("");

  // image state
  const [file, setFile] = useState<File | null>(null);
  const [ocrOutput, setOcrOutput] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);

  // fetch key status once
  useEffect(() => {
    fetch("/api/vinay/status")
      .then((r) => r.json())
      .then((d) => setHasKey(!!d.hasKey))
      .catch(() => setHasKey(false));
  }, []);

  const canSend = useMemo(() => !!hasKey && input.trim().length > 0, [hasKey, input]);
  const canOCR = useMemo(() => !!hasKey && !!file, [hasKey, file]);

  const ask = useCallback(async () => {
    try {
      setError("");
      setChatLoading(true);
      setOutput("…thinking…");
      const res = await fetch("/api/vinay/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Request failed");
        setOutput("");
        return;
      }
      const text =
        data?.choices?.[0]?.message?.content ||
        data?.error ||
        JSON.stringify(data);
      setOutput(text);
      setHistory((h) => [{ id: crypto.randomUUID(), q: input, a: text, at: Date.now() }, ...h].slice(0, 25));
    } catch (e: any) {
      setError(e?.message || "Unknown error");
      setOutput("");
    } finally {
      setChatLoading(false);
    }
  }, [input]);

  const runOCR = useCallback(async () => {
    if (!file) return;
    try {
      setError("");
      setOcrLoading(true);
      setOcrOutput("…reading image…");

      const form = new FormData();
      form.append("file", file);
      form.append(
        "prompt",
        "First, transcribe the content (OCR) exactly. Then outline key concepts to solve it; provide guiding hints, not final answers."
      );

      const res = await fetch("/api/vinay/ocr", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "OCR failed");
        setOcrOutput("");
        return;
      }
      setOcrOutput(data.text || "(no text)");
    } catch (e: any) {
      setError(e?.message || "Unknown error");
      setOcrOutput("");
    } finally {
      setOcrLoading(false);
    }
  }, [file]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">VirtualProfessor</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Learn the <span className="font-semibold">why</span> — not just the answer.
            </p>
          </div>
          <StatusPill hasKey={hasKey} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px,1fr]">
          {/* Sidebar */}
          <Card title="Recent" className="h-fit">
            {history.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-4 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                Your last 25 prompts will appear here (stored locally).
              </div>
            ) : (
              <ul className="space-y-3">
                {history.map((h) => (
                  <li key={h.id} className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
                    <div className="mb-1 truncate text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      You
                    </div>
                    <div className="truncate text-sm font-medium">{h.q}</div>
                    <div className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{h.a}</div>
                  </li>
                ))}
              </ul>
            )}
            {history.length > 0 && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setHistory([])}
                  className="rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Clear history
                </button>
              </div>
            )}
          </Card>

          {/* Main */}
          <Card className="overflow-hidden">
            {/* Tabs (no remounts, just CSS state) */}
            <div className="flex items-center gap-2 border-b border-gray-200 px-5 py-3 dark:border-gray-800">
              <button
                onClick={() => setActive("chat")}
                className={[
                  "rounded-xl px-3 py-2 text-sm transition",
                  active === "chat"
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                ].join(" ")}
                aria-pressed={active === "chat"}
              >
                Chat
              </button>
              <button
                onClick={() => setActive("image")}
                className={[
                  "rounded-xl px-3 py-2 text-sm transition",
                  active === "image"
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                ].join(" ")}
                aria-pressed={active === "image"}
              >
                Image
              </button>
              <div className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                {hasKey === null ? "Checking key…" : hasKey ? "Ready" : "Missing API key"}
              </div>
            </div>

            {/* Panels (hidden via CSS; not unmounted) */}
            <div className="p-5">
              <div className={active === "chat" ? "block" : "hidden"}>
                <ChatPanel
                  input={input}
                  setInput={setInput}
                  output={output}
                  error={error}
                  canSend={canSend}
                  loading={chatLoading}
                  onSend={ask}
                />
              </div>

              <div className={active === "image" ? "block" : "hidden"}>
                <ImagePanel
                  file={file}
                  setFile={setFile}
                  ocrOutput={ocrOutput}
                  canOCR={canOCR}
                  loading={ocrLoading}
                  onRun={runOCR}
                />
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
