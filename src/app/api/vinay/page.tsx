"use client";

import { useEffect, useState } from "react";
import Header from "@/components/header";
import MathRenderer from "@/components/MathRenderer";

export default function Vinay() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [context, setContext] = useState(""); // accumulated OCR/context text

  useEffect(() => {
    fetch("/api/vinay/status")
      .then((r) => r.json())
      .then((d) => setHasKey(!!d.hasKey))
      .catch(() => setHasKey(false));
  }, []);

  async function ask() {
    setOutput("…thinking…");
    const res = await fetch("/api/vinay/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: input, context }),
    });
    const data = await res.json();
    const text =
      data?.choices?.[0]?.message?.content ||
      data?.error ||
      JSON.stringify(data);
    setOutput(text);
  }

  return (
    <div className="flex h-full w-full flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header />
      <div className="flex flex-col flex-1 p-8 space-y-6 max-w-6xl mx-auto w-full">
        <div>
          <h1 className="text-4xl font-bold mb-2">Welcome to VirtualProfessor</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
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
          <span className="text-sm">
            {hasKey === null
              ? "Checking key…"
              : hasKey
              ? "OPENAI_API_KEY detected"
              : "No OPENAI_API_KEY found"}
          </span>
        </div>

        {/* Context section */}
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Context (OCR results accumulate here)</h2>
          {context ? (
            <MathRenderer text={context} />
          ) : (
            <p className="text-sm text-gray-500">No context yet.</p>
          )}
        </div>

        {/* Input area */}
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded shadow space-y-3">
          <h2 className="font-semibold">Socratic Tutor</h2>
          <textarea
            className="w-full border rounded p-2 text-black dark:text-white dark:bg-gray-700"
            placeholder="Ask Virtual Professor something…"
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            onClick={ask}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-fit"
            disabled={!hasKey}
          >
            Send
          </button>
        </div>

        {/* Output */}
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Hints / Answer</h2>
          {output ? (
            <MathRenderer text={output} />
          ) : (
            <p className="text-sm text-gray-500">No response yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
