import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getBaseUrl, sessionCookie } from "@/lib/auth";
import { deleteSession } from "@/lib/store";
import { sameOrigin } from "@/lib/http";
import { errorResponse } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const cookieStore = await cookies();
    const id = cookieStore.get(sessionCookie)?.value;
    await deleteSession(id);
    cookieStore.delete(sessionCookie);
    return NextResponse.redirect(getBaseUrl(), 303);
  } catch (error) {
    return errorResponse(error);
  }
}
