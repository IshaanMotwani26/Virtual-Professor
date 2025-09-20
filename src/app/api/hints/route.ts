// src/app/api/hints/route.ts
import { NextResponse } from "next/server";

/**
 * Hints-only endpoint for the Everywhere Panel.
 * Expects JSON: { context: string, userPrompt?: string }
 * Returns: { text: string } where text contains a concept outline + guiding hints (no final answers).
 */

export async function POST(req: Request) {
  // 1) Ensure API key is configured
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  // 2) Parse body safely
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // 3) Extract & clamp inputs
  const context = String(body?.context || "").slice(0, 8000); // ~8k chars max
  const userPrompt = String(body?.userPrompt || "").slice(0, 600);

  if (!context) {
    return NextResponse.json({ error: "Missing 'context' text" }, { status: 400 });
  }

  // 4) Tutor guardrails (no direct solutions)
  const system = [
    "You are Virtual Professor, a strict hints-only tutor.",
    "Never reveal final numeric results or full solutions.",
    "Your job: identify core concepts, prerequisites, and provide 3–5 progressive hints.",
    "Each hint should be 1–2 sentences and end with a guiding question.",
    "If the user asks for the final answer, refuse and redirect to reasoning steps.",
    "Keep it concise and student-friendly.",
  ].join(" ");

  const user = [
    "Here is the on-screen text (from the user's current page).",
    "=== CONTEXT START ===",
    context,
    "=== CONTEXT END ===",
    "",
    `Student’s request: ${userPrompt || "Help me understand this."}`,
    "",
    "Return strictly in this format:",
    "- One short paragraph outlining the key concepts",
    "- A bulleted list of 3–5 hints (no solutions, no final results)",
    "- One follow-up question the student should try next",
  ].join("\n");

  // 5) Call OpenAI (Chat Completions API)
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // fast + capable; you can swap models here
        temperature: 0.4,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      const errMsg =
        data?.error?.message ||
        (typeof data === "string" ? data : "OpenAI request failed");
      return NextResponse.json({ error: errMsg }, { status: 500 });
    }

    const text =
      data?.choices?.[0]?.message?.content?.trim() ||
      "(No response text received)";

    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to contact OpenAI" },
      { status: 500 }
    );
  }
}

// Optional: helpful message for GET requests in the browser
export async function GET() {
  return NextResponse.json({
    ok: true,
    message:
      "POST JSON to this endpoint with { context, userPrompt } to receive hints (no solutions).",
    example: {
      context: "Selected text from the page…",
      userPrompt: "Help me plan how to solve this.",
    },
  });
}
