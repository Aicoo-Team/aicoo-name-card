import QRCode from "qrcode";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text");
  const name = (searchParams.get("name") || "agentport-qr")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .slice(0, 80);

  if (!text || Buffer.byteLength(text, "utf8") > 2048) {
    return NextResponse.json(
      { error: "A link up to 2048 UTF-8 bytes is required." },
      { status: 400 },
    );
  }

  const buffer = await QRCode.toBuffer(text, {
    margin: 2,
    width: 900,
    color: { dark: "#15110f", light: "#ffffff" },
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${name}.png"`,
    },
  });
}
