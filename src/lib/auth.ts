import { cookies } from "next/headers";
import { getSession } from "@/lib/store";
import { AppError } from "./errors";

export const sessionCookie = "aicoo_card_session";
export const oauthStateCookie = "aicoo_oauth_state";
export const oauthVerifierCookie = "aicoo_oauth_verifier";
export const oauthRedirectCookie = "aicoo_oauth_redirect_uri";
export const oauthReturnCookie = "aicoo_oauth_return";

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get(sessionCookie)?.value);
  if (
    !session ||
    Date.now() - Date.parse(session.createdAt) > 30 * 86400000 ||
    !Number.isFinite(Date.parse(session.createdAt))
  )
    return null;
  return session;
}
export async function requireSession() {
  const session = await getCurrentSession();
  if (!session) throw new AppError("Please sign in with Aicoo.", 401);
  return session;
}

export function getBaseUrl() {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AICOO_REDIRECT_URI ||
    "http://localhost:3000";
  try {
    const url = new URL(configured);
    return url.origin;
  } catch {
    return configured.replace(/\/$/, "");
  }
}

export function getOAuthRedirectUri() {
  const configured =
    process.env.AICOO_REDIRECT_URI || `${getBaseUrl()}/api/auth/aicoo/callback`;
  return configured.replace(/\/$/, "");
}

export function shouldUseSecureCookies() {
  return getBaseUrl().startsWith("https://");
}
