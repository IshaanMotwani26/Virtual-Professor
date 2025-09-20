"use client";

import { useEffect, useState } from "react";
import Header from "@/components/header";

export default function Vinay() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [statusJson, setStatusJson] = useState<any>(null);

  // Text chat state
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  // Image OCR state
  const [file, setFile] = useState<File | null>(null);
  const [ocrOutput, setOcrOutput] = useState("");
  const canRunOCR = !!hasKey && !!file;

  useEffect(() => {
    fetch("/api/vinay/status")
      .then((r) => r.json())
      .then((d) => {
        setHasKey(!!d.hasKey);
        setStatusJson(d);
      })
      .catch(() => setHasKey(false));
  }, []);

  async function ask() {
    setError("");
    setOutput("…thinking…");
    try {
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
    } catch (e: any) {
      setError(e?.message || "Unknown error");
      setOutput("");
    }
  }

  async function runOCR() {
    if (!file) {
      setError("Please choose an image first.");
      return;
    }
    setError("");
    setOcrOutput("…reading image…");

    const form = new FormData();
    form.append("file", file);
    form.append(
      "prompt",
      "First, OCR the content exactly. Then outline the key concepts required to solve it. Don't give the final answer; provide guiding hints."
    );

    const res = await fetch("/api/vinay/ocr", {
      method: "POST",
      body: form, // do NOT set Content-Type manually
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error || "OCR failed");
      setOcrOutput("");
      return;
    }
    setOcrOutput(data.text || "(no text)");
  }

  return (
    <div className="flex h-full w-full flex-col">
      <Header />
      <div className="flex flex-col flex-1 p-8 space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Welcome to VirtualProfessor</h1>
          <p className="text-lg text-gray-700">
            Your AI-powered assistant for learning and productivity.
          </p>
        </div>

        {/* API Key status */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-3 h-3 rounded-full ${
              hasKey ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-sm font-mono">
            {hasKey === null
              ? "Checking key…"
              : hasKey
              ? "OPENAI_API_KEY detected"
              : "No OPENAI_API_KEY found"}
          </span>
        </div>

        {/* (Optional) show raw status JSON for debugging */}
        <pre className="bg-gray-50 p-2 border rounded text-xs">
          /api/vinay/status → {statusJson ? JSON.stringify(statusJson) : "(pending…)"}
        </pre>

        {/* Text prompt */}
        <textarea
          className="w-full border rounded p-2"
          placeholder="Ask Virtual Professor something…"
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          onClick={ask}
          className="bg-blue-600 text-white px-4 py-2 rounded w-fit disabled:opacity-60"
          disabled={!hasKey}
        >
          Send
        </button>

        {error && <div className="text-red-600 text-sm">Error: {error}</div>}

        <pre className="whitespace-pre-wrap bg-gray-50 p-3 rounded border min-h-24">
          {output}
        </pre>

        {/* Image OCR section */}
        <div className="pt-4 border-t">
          <h2 className="text-xl font-semibold mb-2">Upload Image (OCR + Hints)</h2>

          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setFile(f);
              console.log("Picked file:", f?.name, f?.type, f?.size);
            }}
            className="mb-2"
          />

          <div className="text-sm text-gray-600 mb-2">
            Key: {hasKey ? "loaded ✅" : hasKey === null ? "checking…" : "missing ❌"} ·
            File: {file ? file.name : "none selected"}
          </div>

          <button
            onClick={runOCR}
            className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-60"
            disabled={!canRunOCR}
          >
            Run OCR
          </button>

          <pre className="whitespace-pre-wrap bg-gray-50 p-3 rounded border mt-3 min-h-24">
            {ocrOutput}
          </pre>
        </div>
      </div>
    </div>
  );
}
