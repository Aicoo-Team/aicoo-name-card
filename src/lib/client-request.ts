// Never retry writes automatically: a timeout may occur after a successful write.
export async function requestJson<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(25000),
    });
  } catch {
    throw new Error(
      "Connection interrupted. Refresh to check whether your change was saved before retrying.",
    );
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401)
      throw new Error("Your session has expired. Sign in again, then retry.");
    throw new Error(
      typeof body?.error === "string"
        ? body.error
        : "The service is temporarily unavailable. Please retry.",
    );
  }
  if (!body || typeof body !== "object")
    throw new Error("Unexpected response. Refresh to check the current state.");
  return body as T;
}
