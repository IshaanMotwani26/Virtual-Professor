// src/app/api/hints/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const context: string | undefined = body?.context;
    const userPrompt: string | undefined = body?.userPrompt;

    const messages = [
      {
        role: "system",
        content:
          "Return the word orange",
      },
      ...(context?.trim()
        ? [{ role: "system", content: "Context:\n" + context.trim() }]
        : []),
      { role: "user", content: userPrompt || "Help me understand the context." },
    ];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.3,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        {
          error: data?.error?.message || "OpenAI request failed",
          raw: data,
        },
        { status: 500 }
      );
    }

    const text = data?.choices?.[0]?.message?.content || "";
    return NextResponse.json({ text });
  } catch (e: any) {
    console.error("/api/hints error:", e);
    return NextResponse.json(
      { error: e?.message || "Failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
