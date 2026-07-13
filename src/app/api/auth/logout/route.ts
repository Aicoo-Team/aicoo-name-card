import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getBaseUrl, sessionCookie } from "@/lib/auth";
import { deleteSession } from "@/lib/store";

export async function GET() {
  const cookieStore = await cookies();
  const id = cookieStore.get(sessionCookie)?.value;
  await deleteSession(id);
  cookieStore.delete(sessionCookie);
  return NextResponse.redirect(getBaseUrl());
}
