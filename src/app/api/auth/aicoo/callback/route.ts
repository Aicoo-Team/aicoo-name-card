import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getBaseUrl, getOAuthRedirectUri, oauthRedirectCookie, oauthStateCookie, oauthVerifierCookie, sessionCookie, shouldUseSecureCookies } from "@/lib/auth";
import { saveSession } from "@/lib/store";

function firstValue(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return "";
}

function normalizeUserInfo(data: unknown) {
  const source = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const nested =
    (source.user && typeof source.user === "object" ? source.user : null) ||
    (source.profile && typeof source.profile === "object" ? source.profile : null) ||
    (source.data && typeof source.data === "object" ? source.data : null) ||
    source;
  const profile = nested as Record<string, unknown>;
  const firstName = firstValue(profile, ["given_name", "firstName", "first_name"]);
  const lastName = firstValue(profile, ["family_name", "lastName", "last_name"]);
  const name = firstValue(profile, ["name", "displayName", "username"]) || [firstName, lastName].filter(Boolean).join(" ");
  return {
    id: firstValue(profile, ["sub", "id", "userId"]),
    name,
    email: firstValue(profile, ["email", "mail"]),
    picture: firstValue(profile, ["picture", "avatar", "image", "avatarUrl"]),
  };
}

async function errorFromResponse(response: Response) {
  try {
    const payload = await response.json();
    return String(payload.error_description || payload.error || payload.message || `HTTP ${response.status}`);
  } catch {
    return `HTTP ${response.status}`;
  }
}

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
    return NextResponse.json({ error: "Token exchange failed", details: await errorFromResponse(tokenResponse) }, { status: 502 });
  }

  const tokens = await tokenResponse.json();
  const userResponse = await fetch("https://www.aicoo.io/api/auth/oauth2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userResponse.ok) {
    return NextResponse.json({ error: "Userinfo request failed", details: await errorFromResponse(userResponse) }, { status: 502 });
  }

  const userinfo = normalizeUserInfo(await userResponse.json());
  const id = crypto.randomUUID();
  await saveSession({
    id,
    user: {
      id: userinfo.id || userinfo.email || id,
      name: userinfo.name || userinfo.email || "Aicoo User",
      email: userinfo.email || "",
      picture: userinfo.picture || undefined,
    },
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: tokens.expires_in ? Date.now() + Number(tokens.expires_in) * 1000 : undefined,
    createdAt: new Date().toISOString(),
  });

  const response = NextResponse.redirect(getBaseUrl());
  response.cookies.delete(oauthStateCookie);
  response.cookies.delete(oauthVerifierCookie);
  response.cookies.delete(oauthRedirectCookie);
  response.cookies.set(sessionCookie, id, { httpOnly: true, sameSite: "lax", secure: shouldUseSecureCookies(), path: "/", maxAge: 60 * 60 * 24 * 30 });

  return response;
}
