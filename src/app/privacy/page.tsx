import Link from "next/link";
import { supportEmail } from "@/lib/support";
export default function Privacy() {
  const email = supportEmail();
  return (
    <main className="mx-auto w-full max-w-2xl space-y-5 p-6">
      <Link href="/" className="underline">
        ← My card
      </Link>
      <h1 className="text-3xl font-bold">Your data in Agentport</h1>
      <p>
        This page explains the current product behavior. The operator must
        approve its complete privacy and retention policy before public launch.
      </p>
      <h2 className="text-xl font-bold">Public information</h2>
      <p>
        Saved names, profile details, contact fields, images and linked agents
        appear on your public card. Anyone with the link can view, copy or
        download them. Upload only images you intend to share publicly.
      </p>
      <h2 className="text-xl font-bold">Exchanges and private notes</h2>
      <p>
        Requests share your public card and optional meeting context with the
        other person. Both participants can view the exchange state. Notes and
        archive settings belong only to their author. Archiving is not deletion
        and does not revoke a previously shared agent link.
      </p>
      <h2 className="text-xl font-bold">Connected services</h2>
      <p>
        Aicoo handles sign-in and agent conversations. Agentport stores account
        identity and server-side authorization credentials to provide the
        integrations you enable. Card data and exchanges use the configured
        database; uploads use public object storage. Session cookies are used
        for sign-in.
      </p>
      <h2 className="text-xl font-bold">Removal and deletion requests</h2>
      <p>
        Editing your card removes fields from its current display, but does not
        erase copies already saved by recipients. Removing an image from the
        card does not immediately delete the uploaded file. Retention and backup
        handling require operator action.
      </p>
      {email ? (
        <a
          className="block underline"
          href={`mailto:${email}?subject=Agentport%20data%20deletion%20request`}
        >
          Request account, card or uploaded-image deletion
        </a>
      ) : (
        <p>
          To request deletion, contact the operator who gave you access. A
          private support address is not configured here yet.
        </p>
      )}
      <p>
        Identify your own card URL and what you want removed. Do not send your
        password. The operator must verify ownership before acting. Deleting
        Agentport data does not automatically delete your Aicoo account or
        copies in someone else’s phone.
      </p>
      <Link href="/help" className="block underline">
        Help and support
      </Link>
    </main>
  );
}
