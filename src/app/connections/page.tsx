import { getCurrentSession } from "@/lib/auth";
import { listConnections } from "@/lib/connections";
import { Connections } from "@/components/Connections";
import { pageSize, type Connection } from "@/lib/exchange-view";
import { redirect } from "next/navigation";
export default async function Page() {
  const session = await getCurrentSession();
  if (!session) redirect("/api/auth/aicoo/start?returnTo=%2Fconnections");
  let initial: Connection[] = [];
  let error = "";
  try {
    initial = (await listConnections(session.user.id)) as Connection[];
  } catch {
    error =
      "Exchanges could not load. Try Refresh; if the problem continues, contact support through Help.";
  }
  return (
    <Connections
      initial={initial.slice(0, pageSize)}
      initialHasMore={initial.length > pageSize}
      error={error}
      contactsEnabled={process.env.AICOO_CONTACTS_ENABLED === "true"}
    />
  );
}
