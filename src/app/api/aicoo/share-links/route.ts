import { NextResponse } from "next/server";
import { listSharedAgents } from "@/lib/aicoo";
import { getCurrentSession } from "@/lib/auth";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Login with Aicoo first." }, { status: 401 });
  }

  try {
    const agents = await listSharedAgents(session);
    return NextResponse.json({ agents });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Aicoo request failed" }, { status: 502 });
  }
}
