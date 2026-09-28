import { requireSession } from "@/lib/auth";
import { listConnections, requestConnection } from "@/lib/connections";
import { AppError, errorResponse } from "@/lib/errors";
import { readJson, sameOrigin } from "@/lib/http";
import { record, slug, text } from "@/lib/validation";
import { getCardByOwner, getCardBySlug } from "@/lib/store";
export async function GET() {
  try {
    const session = await requireSession();
    return Response.json({
      connections: await listConnections(session.user.id),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const session = await requireSession();
    const body = record(await readJson(request));
    if (!(await getCardByOwner(session.user.id)))
      throw new AppError("Save your own card before exchanging.", 409);
    const target = await getCardBySlug(slug(body.slug));
    if (!target) throw new AppError("Card not found.", 404);
    const result = await requestConnection(
      session.user.id,
      target.ownerId,
      text(body.event ?? "", "Event", 160),
    );
    return Response.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
