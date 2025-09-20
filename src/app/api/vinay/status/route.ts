import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export async function GET() {
  // What cwd is the server running in?
  const cwd = process.cwd();

  // Check for env files at runtime
  const envLocalPath = path.join(cwd, ".env.local");
  const envPath = path.join(cwd, ".env");
  const hasEnvLocal = fs.existsSync(envLocalPath);
  const hasEnv = fs.existsSync(envPath);

  // Read a tiny slice of the key (don’t log full key)
  const keyPrefix = process.env.OPENAI_API_KEY?.slice(0, 5) || null;

  return NextResponse.json({
    hasKey: Boolean(process.env.OPENAI_API_KEY),
    debug: {
      cwd,
      envFiles: {
        ".env.local": hasEnvLocal,
        ".env": hasEnv,
      },
      keyPrefix, // e.g., "sk-12", or null if not loaded
    },
  });
}
