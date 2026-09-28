import { requireSession } from "@/lib/auth";
import { saveNote, transition } from "@/lib/connections";
import { errorResponse } from "@/lib/errors";
import { readJson, sameOrigin } from "@/lib/http";
import { record, text } from "@/lib/validation";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    sameOrigin(request);
    const session = await requireSession();
    const { id } = await params;
    const body = record(await readJson(request));
    if (body.action === "note")
      await saveNote(id, session.user.id, text(body.note, "Note", 2000));
    else
      await transition(
        id,
        session.user.id,
        text(body.action, "Action", 16, true),
      );
    return Response.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
