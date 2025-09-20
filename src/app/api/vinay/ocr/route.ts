import { NextResponse } from "next/server";

// Use Node runtime so Buffer works with file uploads
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    // Must be multipart/form-data
    const ct = req.headers.get("content-type") || "";
    if (!ct.toLowerCase().includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Content-Type must be multipart/form-data with a 'file' field." },
        { status: 400 }
      );
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const prompt =
      (form.get("prompt") as string) ||
      "OCR the image. Then list key concepts needed to solve it and provide guiding hints. Do NOT give the final answer.";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded (field name must be 'file')." }, { status: 400 });
    }

    const sizeMB = (file.size ?? 0) / (1024 * 1024);
    if (sizeMB > 5) {
      return NextResponse.json({ error: `File too large (${sizeMB.toFixed(2)} MB). Try < 5MB.` }, { status: 413 });
    }

    // Convert to data URL for OpenAI Vision
    const bytes = await file.arrayBuffer();
    const b64 = Buffer.from(bytes).toString("base64");
    const mime = file.type || "image/png";
    const dataUrl = `data:${mime};base64,${b64}`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are Virtual Professor. Teach before telling. Use OCR on the image and respond with hints, not final answers.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data?.error?.message || "OpenAI request failed", raw: data }, { status: 500 });
    }

    const text = data?.choices?.[0]?.message?.content || "";
    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("/api/vinay/ocr error:", err);
    return NextResponse.json({ error: err?.message || "Failed to process image" }, { status: 500 });
  }
}
