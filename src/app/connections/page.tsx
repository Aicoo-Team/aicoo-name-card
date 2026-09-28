import { getCurrentSession } from "@/lib/auth";
import { listConnections } from "@/lib/connections";
import { Connections, type Connection } from "@/components/Connections";
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
      "Exchanges are unavailable. Check the database configuration and migration, then reload.";
  }
  return <Connections initial={initial} error={error} />;
}
