import { timingSafeEqual } from "node:crypto";
import { query } from "@/lib/store";
import { renewOwner } from "@/lib/renewal";
import { errorResponse } from "@/lib/errors";
// Schedule externally only after staging acceptance. No cron is enabled by this PR.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const given = Buffer.from(request.headers.get("authorization") || "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (
    !secret ||
    given.length !== expected.length ||
    !timingSafeEqual(given, expected)
  )
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const rows =
      await query(`SELECT owner_id FROM card_renewals WHERE enabled=true
      AND (checked_at IS NULL OR checked_at<now()-interval '12 hours') ORDER BY checked_at NULLS FIRST LIMIT 10`);
    for (const row of rows) await renewOwner(row.owner_id);
    return Response.json({ processed: rows.length });
  } catch (error) {
    return errorResponse(error);
  }
}
