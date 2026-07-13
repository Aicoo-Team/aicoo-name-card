import { cookies } from "next/headers";
import { getSession } from "@/lib/store";

export const sessionCookie = "aicoo_card_session";
export const oauthStateCookie = "aicoo_oauth_state";
export const oauthVerifierCookie = "aicoo_oauth_verifier";
export const oauthRedirectCookie = "aicoo_oauth_redirect_uri";

export async function getCurrentSession() {
  const cookieStore = await cookies();
  return getSession(cookieStore.get(sessionCookie)?.value);
}

export function getBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.AICOO_REDIRECT_URI || "http://localhost:3000";
  try {
    const url = new URL(configured);
    return url.origin;
  } catch {
    return configured.replace(/\/$/, "");
  }
}

export function getOAuthRedirectUri() {
  const configured = process.env.AICOO_REDIRECT_URI || `${getBaseUrl()}/api/auth/aicoo/callback`;
  return configured.replace(/\/$/, "");
}

export function shouldUseSecureCookies() {
  return getBaseUrl().startsWith("https://");
}
