import Link from "next/link";
import { returnPath } from "@/lib/validation";
export default async function AuthError({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const target = returnPath(
    typeof query.returnTo === "string" ? query.returnTo : null,
  );
  const unavailable = query.reason === "configuration";
  return (
    <main className="mx-auto w-full max-w-lg space-y-5 p-6">
      <h1 className="text-2xl font-bold">Sign-in could not finish</h1>
      <p>
        {unavailable
          ? "Sign-in is not configured for this environment. Please contact the operator through Help."
          : "You may have cancelled, the sign-in link may have expired, or Aicoo may be temporarily unavailable."}{" "}
        Your existing saved card has not been changed.
      </p>
      {!unavailable && (
        <a
          className="block rounded-full bg-black p-3 text-center text-white"
          href={`/api/auth/aicoo/start?returnTo=${encodeURIComponent(target)}`}
        >
          Try signing in again
        </a>
      )}
      <Link href={target} className="block underline">
        Return without signing in
      </Link>
      <Link href="/help" className="block underline">
        Get help
      </Link>
    </main>
  );
}
