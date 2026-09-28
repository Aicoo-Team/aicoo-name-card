export class AppError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof AppError)
    return Response.json({ error: error.message }, { status: error.status });
  // Never return provider payloads, SQL errors or token-bearing messages.
  const reference = crypto.randomUUID();
  console.error(JSON.stringify({ event: "agentport_api_error", reference }));
  return Response.json(
    {
      error: `Something went wrong. Please try again. Support reference: ${reference}`,
      reference,
    },
    { status: 500, headers: { "Cache-Control": "no-store" } },
  );
}
