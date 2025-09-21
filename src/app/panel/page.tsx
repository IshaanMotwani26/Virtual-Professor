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
				<h1 className="text-3xl font-bold tracking-tight">Everywhere Panel</h1>
				<p className="mt-2 text-gray-600 dark:text-gray-400">
					A lightweight side panel + overlay that reads only selected/visible text and returns{" "}
					<span className="font-semibold">hints (not answers)</span>.
				</p>

				<div className="mt-6 grid gap-6 md:grid-cols-2">
					<section className="rounded-2xl border border-gray-200 bg-white/80 p-5 shadow-lg backdrop-blur dark:border-gray-800 dark:bg-gray-900/70">
						<h2 className="text-lg font-semibold">1) Backend endpoint</h2>
						<p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
							Make sure <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">/api/hints</code> exists (code below).
						</p>
						<ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-300">
							<li>Uses your <code>OPENAI_API_KEY</code></li>
							<li>Returns concept outline + 3–5 guiding hints</li>
							<li>Refuses to output final solutions</li>
						</ul>
						<div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
							Key status:{" "}
							{hasKey === null ? "…checking…" : hasKey ? "✅ detected" : "❌ missing"}
						</div>
					</section>

					<section className="rounded-2xl border border-gray-200 bg-white/80 p-5 shadow-lg backdrop-blur dark:border-gray-800 dark:bg-gray-900/70">
						<h2 className="text-lg font-semibold">2) Chrome extension (local)</h2>
						<ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-300">
							<li>Download the ZIP below and unzip it.</li>
							<li>Open <code>chrome://extensions</code> → enable Developer Mode.</li>
							<li>Click <b>Load unpacked</b> → select the unzipped folder.</li>
							<li>On any site, select text → click the floating <b>Ask VP</b> button.</li>
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

				<section className="mt-8 rounded-2xl border border-gray-200 bg-white/80 p-5 shadow-lg backdrop-blur dark:border-gray-800 dark:bg-gray-900/70">
					<h2 className="text-lg font-semibold">3) API code to add</h2>
					<p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
						Create <code>src/app/api/hints/route.ts</code> and paste this:
					</p>
					<pre className="mt-3 overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs dark:border-gray-800 dark:bg-gray-900">
						{`import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  const { context, userPrompt } = await req.json();

  const ctx = String(context || "").slice(0, 8000);
  const up = String(userPrompt || "").slice(0, 600);

  const system = [
    "You are Virtual Professor. You must not reveal final solutions.",
    "Your job: extract concepts, explain prerequisites, and give 3–5 progressive hints.",
    "Keep each hint short (1–2 sentences). Ask a guiding question at the end.",
    "If the user asks for the answer, refuse and redirect to reasoning steps.",
  ].join(" ");

  const messages = [
    { role: "system", content: system },
    {
      role: "user",
      content:
        \`Here is on-screen text the student is viewing.\\n\\n=== CONTEXT START ===\\n\${ctx}\\n=== CONTEXT END ===\\n\\nStudent’s request: \${up || "Help me understand this."}\\nReturn:\\n- A one-paragraph concept outline\\n- Then bullet hints (no answers)\\n- One follow-up question\`,
    },
  ];

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: \`Bearer \${process.env.OPENAI_API_KEY}\`,
      },
      body: JSON.stringify({ model: "gpt-4o-mini", messages }),
    });
    const data = await r.json();
    if (!r.ok) return NextResponse.json({ error: data?.error?.message || "OpenAI error" }, { status: 500 });

    const text = data?.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}`}
					</pre>
				</section>
			</main>
		</div>
	);
}
