import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { prompt } = await req.json();

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Then list key concepts needed to solve it and provide guiding hints. Do NOT give the final answer." },
          { role: "user", content: prompt ?? "" },
        ],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data?.error?.message || "OpenAI request failed" }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("/api/vinay/ask error:", err);
    return NextResponse.json({ error: err?.message || "Request failed" }, { status: 500 });
  }
}
