import crypto from "crypto";
import { NextResponse } from "next/server";
import { getOAuthRedirectUri, oauthRedirectCookie, oauthStateCookie, oauthVerifierCookie, shouldUseSecureCookies } from "@/lib/auth";

function base64Url(buffer: Buffer) {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function GET() {
  const clientId = process.env.AICOO_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Missing AICOO_CLIENT_ID" }, { status: 500 });
  }

  const state = crypto.randomBytes(24).toString("hex");
  const verifier = base64Url(crypto.randomBytes(32));
  const challenge = base64Url(crypto.createHash("sha256").update(verifier).digest());
  const redirectUri = getOAuthRedirectUri();
  const authorize = new URL("https://www.aicoo.io/api/auth/oauth2/authorize");
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("scope", "openid profile email offline_access");
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("code_challenge", challenge);
  authorize.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(authorize);
  const cookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: shouldUseSecureCookies(), path: "/", maxAge: 600 };
  response.cookies.set(oauthStateCookie, state, cookieOptions);
  response.cookies.set(oauthVerifierCookie, verifier, cookieOptions);
  response.cookies.set(oauthRedirectCookie, redirectUri, cookieOptions);

  return response;
}
