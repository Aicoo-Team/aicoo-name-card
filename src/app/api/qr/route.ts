import QRCode from "qrcode";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text");
  const name = searchParams.get("name") || "aicoo-qr";

  if (!text) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
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
