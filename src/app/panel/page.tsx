// src/app/panel/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Panel() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/vinay/status")
      .then((r) => r.json())
      .then((d) => setHasKey(!!d.hasKey))
      .catch(() => setHasKey(false));
  }, []);

  return (
    <div className="min-h-screen text-gray-900 dark:text-gray-100">
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Everywhere Panel</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              A lightweight side panel that reads only the text you highlight and returns{" "}
              <span className="font-semibold">concept explanations and guiding hints</span> — not final answers.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* 1) What it is / How it works (user-facing) */}
          <section className="rounded-2xl border border-gray-200 bg-white/80 p-5 shadow-lg backdrop-blur dark:border-gray-800 dark:bg-gray-900/70">
            <h2 className="text-lg font-semibold">1) What is this?</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-700 dark:text-gray-300">
              <li>Select text on any website and click the floating <b>Ask VP</b> button.</li>
              <li>You’ll get a quick concept outline and 3–5 short hints to nudge your thinking.</li>
              <li>No solutions are revealed — it’s designed to keep you learning actively.</li>
              <li>Only the text you highlight is sent; nothing runs in the background.</li>
            </ul>
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Backend status: {hasKey === null ? "…checking…" : hasKey ? "✅ ready" : "❌ not configured"}
            </div>
          </section>

          {/* 2) Extension install (user-facing) */}
          <section className="rounded-2xl border border-gray-200 bg-white/80 p-5 shadow-lg backdrop-blur dark:border-gray-800 dark:bg-gray-900/70">
            <h2 className="text-lg font-semibold">2) Install the Chrome extension</h2>
            <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-gray-700 dark:text-gray-300">
              <li>Download the ZIP below and unzip it.</li>
              <li>Open <code>chrome://extensions</code> and enable <b>Developer mode</b>.</li>
              <li>Click <b>Load unpacked</b> and select the unzipped folder.</li>
              <li>On any site, select text → click <b>Ask VP</b>.</li>
            </ol>
            <div className="mt-3">
              <a
                href="/everywhere-panel.zip"
                className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                download
              >
                ⬇️ Download extension (everywhere-panel.zip)
              </a>
            </div>
          </section>
        </div>

        {/* 3) User-facing: Examples & tips */}
        <section className="mt-8 rounded-2xl border border-gray-200 bg-white/80 p-5 shadow-lg backdrop-blur dark:border-gray-800 dark:bg-gray-900/70">
          <h2 className="text-lg font-semibold">3) Get better hints (examples & tips)</h2>

          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Example prompts
              </h3>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-gray-700 dark:text-gray-300">
                <li>“Summarize the main idea in two sentences and list key terms I should know.”</li>
                <li>“Break this into 3–4 steps I can follow without giving the final answer.”</li>
                <li>“Point out common mistakes people make with this concept.”</li>
                <li>“Give an everyday analogy to build intuition.”</li>
                <li>“Ask me one guiding question that helps me decide my next step.”</li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Tips for best results
              </h3>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-gray-700 dark:text-gray-300">
                <li>Highlight only what matters (the specific paragraph, problem, or definition).</li>
                <li>Add context like: course level, the goal (quiz, exam, homework), or what confuses you.</li>
                <li>Ask for “hints only” or “no solutions” to keep yourself in problem-solving mode.</li>
                <li>Iterate: reply to a hint with what you tried; you’ll get sharper guidance next.</li>
              </ul>
            </div>
          </div>

          <details className="mt-5 rounded-lg border border-gray-200 p-4 text-sm open:bg-gray-50 dark:border-gray-800 dark:open:bg-gray-900">
            <summary className="cursor-pointer font-medium">Troubleshooting</summary>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-700 dark:text-gray-300">
              <li>No button? Refresh the page after loading the extension; make sure it’s enabled.</li>
              <li>Empty response? Try selecting a smaller chunk of text (or rephrase your ask).</li>
              <li>Stuck on answers? Say “do not reveal solutions—give me hints and next steps.”</li>
            </ul>
          </details>

          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Privacy: only your highlighted text and your prompt are sent for hinting. No browsing history or background scraping.
          </div>
        </section>
      </main>
    </div>
  );
}
