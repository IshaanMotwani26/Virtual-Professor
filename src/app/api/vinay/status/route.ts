import { NextResponse } from "next/server";

export async function GET() {
  // Debug: prints first few chars so you can confirm it's loaded in the terminal
  console.log("DEBUG OPENAI_API_KEY:", process.env.OPENAI_API_KEY?.slice(0, 5));
  return NextResponse.json({ hasKey: Boolean(process.env.OPENAI_API_KEY) });
}
