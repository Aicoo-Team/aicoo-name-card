import Link from "next/link";
import { supportEmail } from "@/lib/support";
export default function Help() {
  const email = supportEmail();
  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 p-6">
      <Link href="/" className="underline">
        ← My card
      </Link>
      <h1 className="text-3xl font-bold">Using Agentport</h1>
      <section className="space-y-2">
        <h2 className="text-xl font-bold">Create and share</h2>
        <p>
          Sign in with Aicoo, fill in the details you want to make public, then
          save. Adding a Shared Agent is optional. Open “Share card / show QR”
          to show someone your saved card.
        </p>
        <p>
          Unsaved edits are not published. If you change your card address, old
          links and printed QR codes will stop working.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-bold">Exchange, not just view</h2>
        <p>
          Scanning does not send your details. Choose Exchange, create your own
          card if needed, and confirm the request. The other person must accept.
          Check My exchanges for incoming and sent requests.
        </p>
        <p>
          Saving to your phone downloads a contact file; it does not create a
          two-way exchange or send an Aicoo friend request.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-bold">Remember who you met</h2>
        <p>
          Search exchanges by name or company. Meeting context supplied with a
          request is visible to both people; private notes are visible only to
          their author. Archive hides an exchange from your active list, not the
          other person’s list. You can restore it from Archived.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-bold">Agent links and permissions</h2>
        <p>
          Talking to an agent opens Aicoo and follows the access rules for that
          link. Exchanging cards does not grant access to private memory. An
          expired link needs the owner to reconnect or select a new active link.
          Optional renewal is not a permanent-link guarantee.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-bold">
          Troubleshooting and private support
        </h2>
        <p>
          If a request times out, refresh and check its state before sending it
          again. For sign-in problems, try reconnecting. For a missing card, ask
          for the latest link.
        </p>
        {email ? (
          <a
            className="block underline"
            href={`mailto:${email}?subject=Agentport%20support`}
          >
            Contact support: {email}
          </a>
        ) : (
          <p>
            Private support is not configured in this environment. Contact the
            operator who gave you access. A monitored private support address
            must be configured before public launch.
          </p>
        )}
        <p>
          Include the time, page, steps to reproduce and any support reference.
          Never send passwords, access tokens or other people’s private notes.
        </p>
      </section>
      <Link href="/privacy" className="block underline">
        Data use and deletion requests
      </Link>
    </main>
  );
}
