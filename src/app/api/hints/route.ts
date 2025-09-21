// src/app/api/hints/route.ts
import { NextResponse } from "next/server";

const SYS = `
You are Virtual Professor.
You must NEVER reveal final numeric or closed-form answers.
Return ONLY:
1) "Concept outline" – 3-5 sentences.
2) "Guided hints" – 3–5 bullets. Each hint is a step or question. End each with a guiding question.
3) "Check yourself" – one short question to verify progress.
Rules:
- Do not compute the last step. Do not state a final equality like "y = 4".
- If you accidentally compute a result, replace it with a blank (e.g., "y = ____").
- Prefer Socratic questions over statements.
`;

const FEWSHOT = [
  {
    role: "user",
    content:
      'Here is on-screen text the student is viewing.\n\n=== CONTEXT START ===\nSolve for y: 2+2=y\n=== CONTEXT END ===\n\nStudent’s request: what is 2+2 = y?\nReturn:\n- A one-paragraph concept outline\n- Then bullet hints (no answers)\n- One follow-up question',
  },
  {
    role: "assistant",
    content: `Concept outline:
When solving simple equations like 2 + 2 = y, we combine like quantities (integers) following addition rules. The equation states that y equals the sum of two identical whole numbers. Our task is to understand what the addition operation does and then write the value as a blank, keeping the final computation for you to finish.

Guided hints:
• Identify what operation connects the two numbers. What sign do you see between the 2s?
• Think about what adding two equal small whole numbers means. How many groups of 2 are we putting together?
• Use your preferred strategy (number line, grouping, mental addition). After one “2,” how many more do you add?
• Replace the right side with a blank: y = ____ . What number would fill the blank after you combine the two 2s?
• Check reasonableness: is your result greater than each addend? Why?

Check yourself:
If you had 2 apples and got 2 more, how many apples would fill the blank in y = ____?`,
  },
];

function maskFinals(s: string) {
  // basic guard against final numeric answers
  let t = s;
  t = t.replace(/([a-z]\s*=\s*)-?\d+(\.\d+)?/gi, "$1____");
  t = t.replace(/\b(answer|thus|therefore|so)\b[^.\n]*\b=\s*-?\d+(\.\d+)?/gi, "");
  t = t.replace(/(\d+)\s*([+\-*/])\s*(\d+)\s*=\s*-?\d+(\.\d+)?/g, "$1 $2 $3 = ____");
  return t;
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  const { context, userPrompt } = await req.json();
  const ctx = String(context || "").slice(0, 8000);
  const up = String(userPrompt || "").slice(0, 600);

  const messages = [
    { role: "system", content: SYS },
    ...FEWSHOT,
    {
      role: "user",
      content:
        `Here is on-screen text the student is viewing.\n\n=== CONTEXT START ===\n${ctx}\n=== CONTEXT END ===\n\nStudent’s request: ${up || "Help me understand this."}\nReturn:\n- A one-paragraph concept outline\n- Then bullet hints (no answers)\n- One follow-up question`,
    },
  ];

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        messages,
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "OpenAI error" },
        { status: 500 }
      );
    }

    const raw = data?.choices?.[0]?.message?.content ?? "";
    const text = maskFinals(raw);
    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
