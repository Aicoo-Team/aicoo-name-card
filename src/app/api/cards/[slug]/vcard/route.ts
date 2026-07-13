import { NextResponse } from "next/server";
import { getCardBySlug } from "@/lib/store";
import { buildVCard } from "@/lib/vcard";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function GET(_: Request, { params }: Props) {
  const { slug } = await params;
  const card = await getCardBySlug(slug);
  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  return new NextResponse(buildVCard(card), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${card.slug}.vcf"`,
    },
  });
}
