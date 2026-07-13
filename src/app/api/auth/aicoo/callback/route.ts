import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getBaseUrl, getOAuthRedirectUri, oauthRedirectCookie, oauthStateCookie, oauthVerifierCookie, sessionCookie, shouldUseSecureCookies } from "@/lib/auth";
import { saveSession } from "@/lib/store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(oauthStateCookie)?.value;
  const verifier = cookieStore.get(oauthVerifierCookie)?.value;
  const redirectUri = cookieStore.get(oauthRedirectCookie)?.value || getOAuthRedirectUri();

  if (!code || !state || !expectedState || state !== expectedState || !verifier) {
    return NextResponse.json({ error: "Invalid OAuth callback" }, { status: 400 });
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: process.env.AICOO_CLIENT_ID || "",
    code_verifier: verifier,
  });

  if (process.env.AICOO_CLIENT_SECRET) {
    body.set("client_secret", process.env.AICOO_CLIENT_SECRET);
  }

  const tokenResponse = await fetch("https://www.aicoo.io/api/auth/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!tokenResponse.ok) {
    return NextResponse.json({ error: "Token exchange failed" }, { status: 502 });
  }

  const tokens = await tokenResponse.json();
  const userResponse = await fetch("https://www.aicoo.io/api/auth/oauth2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userResponse.ok) {
    return NextResponse.json({ error: "Userinfo request failed" }, { status: 502 });
  }

  const userinfo = await userResponse.json();
  const id = crypto.randomUUID();
  await saveSession({
    id,
    user: {
      id: String(userinfo.sub || userinfo.email || id),
      name: String(userinfo.name || userinfo.email || "Aicoo User"),
      email: String(userinfo.email || ""),
      picture: userinfo.picture ? String(userinfo.picture) : undefined,
    },
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: tokens.expires_in ? Date.now() + Number(tokens.expires_in) * 1000 : undefined,
    createdAt: new Date().toISOString(),
  });

  cookieStore.delete(oauthStateCookie);
  cookieStore.delete(oauthVerifierCookie);
  cookieStore.delete(oauthRedirectCookie);
  cookieStore.set(sessionCookie, id, { httpOnly: true, sameSite: "lax", secure: shouldUseSecureCookies(), path: "/", maxAge: 60 * 60 * 24 * 30 });

  return NextResponse.redirect(getBaseUrl());
}
