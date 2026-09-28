import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getBaseUrl,
  getOAuthRedirectUri,
  oauthRedirectCookie,
  oauthStateCookie,
  oauthVerifierCookie,
  sessionCookie,
  shouldUseSecureCookies,
} from "@/lib/auth";
import { saveSession } from "@/lib/store";
import { resource } from "@/lib/oauth";
import { oauthReturnCookie } from "@/lib/auth";
import { returnPath } from "@/lib/validation";
import { errorResponse } from "@/lib/errors";

function firstValue(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && String(value).trim())
      return String(value).trim();
  }
  return "";
}

function normalizeUserInfo(data: unknown) {
  const source =
    data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const nested =
    (source.user && typeof source.user === "object" ? source.user : null) ||
    (source.profile && typeof source.profile === "object"
      ? source.profile
      : null) ||
    (source.data && typeof source.data === "object" ? source.data : null) ||
    source;
  const profile = nested as Record<string, unknown>;
  const firstName = firstValue(profile, [
    "given_name",
    "firstName",
    "first_name",
  ]);
  const lastName = firstValue(profile, [
    "family_name",
    "lastName",
    "last_name",
  ]);
  const name =
    firstValue(profile, ["name", "displayName", "username"]) ||
    [firstName, lastName].filter(Boolean).join(" ");
  return {
    id: firstValue(profile, ["sub", "id", "userId"]),
    username: firstValue(profile, ["preferred_username", "username"]),
    name,
    email: firstValue(profile, ["email", "mail"]),
    picture: firstValue(profile, ["picture", "avatar", "image", "avatarUrl"]),
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const cookieStore = await cookies();
    const expectedState = cookieStore.get(oauthStateCookie)?.value;
    const verifier = cookieStore.get(oauthVerifierCookie)?.value;
    const redirectUri =
      cookieStore.get(oauthRedirectCookie)?.value || getOAuthRedirectUri();

    if (
      !code ||
      !state ||
      !expectedState ||
      state !== expectedState ||
      !verifier
    ) {
      return NextResponse.json(
        { error: "Invalid OAuth callback" },
        { status: 400 },
      );
    }

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: process.env.AICOO_CLIENT_ID || "",
      code_verifier: verifier,
      resource,
    });

    if (process.env.AICOO_CLIENT_SECRET) {
      body.set("client_secret", process.env.AICOO_CLIENT_SECRET);
    }

    const tokenResponse = await fetch(
      "https://www.aicoo.io/api/auth/oauth2/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      },
    );

    if (!tokenResponse.ok) {
      return NextResponse.json(
        { error: "Token exchange failed. Please sign in again." },
        { status: 502 },
      );
    }

    const tokens = await tokenResponse.json();
    if (
      typeof tokens.access_token !== "string" ||
      !Number.isFinite(Number(tokens.expires_in)) ||
      Number(tokens.expires_in) <= 0
    )
      return NextResponse.json(
        { error: "Invalid authorization response." },
        { status: 502 },
      );
    const userResponse = await fetch(
      "https://www.aicoo.io/api/auth/oauth2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      },
    );

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: "User profile could not be loaded." },
        { status: 502 },
      );
    }

    const userinfo = normalizeUserInfo(await userResponse.json());
    if (!userinfo.id)
      return NextResponse.json(
        { error: "Aicoo did not return a stable account identity." },
        { status: 502 },
      );
    const id = crypto.randomUUID();
    await saveSession({
      id,
      user: {
        id: userinfo.id,
        username: userinfo.username || undefined,
        name: userinfo.name || userinfo.email || "Aicoo User",
        email: userinfo.email || "",
        picture: userinfo.picture || undefined,
      },
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      scope: typeof tokens.scope === "string" ? tokens.scope : undefined,
      expiresAt: tokens.expires_in
        ? Date.now() + Number(tokens.expires_in) * 1000
        : undefined,
      createdAt: new Date().toISOString(),
    });

    const response = NextResponse.redirect(
      new URL(
        returnPath(cookieStore.get(oauthReturnCookie)?.value || null),
        getBaseUrl(),
      ),
    );
    response.cookies.delete(oauthReturnCookie);
    response.cookies.delete(oauthStateCookie);
    response.cookies.delete(oauthVerifierCookie);
    response.cookies.delete(oauthRedirectCookie);
    response.cookies.set(sessionCookie, id, {
      httpOnly: true,
      sameSite: "lax",
      secure: shouldUseSecureCookies(),
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
