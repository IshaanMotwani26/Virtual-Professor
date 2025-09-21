import { NextResponse } from "next/server";

// Node runtime so Buffer + formData() file handling works
export const runtime = "nodejs";

// Optional: extend the default body size if needed (Next 14+ supports this on Vercel)
// export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const ct = req.headers.get("content-type") || "";
    if (!ct.toLowerCase().includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Content-Type must be multipart/form-data with a 'file' field." },
        { status: 400 }
      );
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const userPrompt =
      (form.get("prompt") as string) ||
      "OCR this image verbatim (reading order). Then list key concepts needed to solve it and provide guiding hints. Do NOT give the final answer.";

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded (field name must be 'file')." },
        { status: 400 }
      );
    }

    // Basic size guard (your captures are typically < 2MB)
    const sizeMB = (file.size ?? 0) / (1024 * 1024);
    if (sizeMB > 8) {
      return NextResponse.json(
        { error: `File too large (${sizeMB.toFixed(2)} MB). Try < 8MB.` },
        { status: 413 }
      );
    }

    // Convert to data URL for vision input
    const bytes = await file.arrayBuffer();
    const b64 = Buffer.from(bytes).toString("base64");
    const mime = file.type || "image/png";
    const dataUrl = `data:${mime};base64,${b64}`;

    // --- OpenAI Responses API (recommended in latest SDK/docs) ---
    // This format is robust for multimodal (text + image).
    const payload = {
      model: "gpt-4o-mini",
      // Optional: make sure the model knows it can look at images
      // modalities: ["text", "vision"], // not strictly required for 4o models
      input: [
        {
          role: "user",
          // content is an array of parts: text + image
          content: [
            { type: "input_text", text: userPrompt },
            { type: "input_image", image_url: dataUrl }
          ]
        }
      ]
    };

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      // Return detailed info so you can see what's wrong in the browser console
      return NextResponse.json(
        {
          error: data?.error?.message || "OpenAI request failed",
          status: res.status,
          raw: data
        },
        { status: 500 }
      );
    }

    // Responses API packs text in data.output[0].content[0].text (or use a safer parse)
    const text =
      data?.output?.[0]?.content?.map((p: any) => p?.text).filter(Boolean).join("\n").trim() ||
      data?.output_text ||
      data?.choices?.[0]?.message?.content || // fallback if OpenAI shape changes
      "";

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("OCR route error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to process image" },
      { status: 500 }
    );
  }
}
