"use client";

import { useEffect, useState } from "react";
import Header from "@/components/header";

export default function Vinay() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [statusJson, setStatusJson] = useState<any>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setError("");
    fetch("/api/vinay/status")
      .then((r) => r.json())
      .then((d) => {
        setHasKey(!!d.hasKey);
        setStatusJson(d);
      })
      .catch(() => setHasKey(false));
  }, []);

  async function ask() {
    try {
      setError("");
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
    } catch (e: any) {
      setError(e?.message || "Unknown error");
      setOutput("");
    }
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

        {/* Optional: raw status JSON for debugging */}
        <pre className="bg-gray-50 p-2 border rounded text-xs">
          /api/vinay/status → {statusJson ? JSON.stringify(statusJson) : "(pending…)"}
        </pre>

        {/* Input area */}
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

        {error && (
          <div className="text-red-600 text-sm">Error: {error}</div>
        )}

        {/* Output */}
        <pre className="whitespace-pre-wrap bg-gray-50 p-3 rounded border min-h-24">
          {output}
        </pre>
      </div>
    </div>
  );
}
