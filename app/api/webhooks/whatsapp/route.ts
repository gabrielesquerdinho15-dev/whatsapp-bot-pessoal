import { NextRequest, NextResponse } from "next/server";
import { processIncomingWhatsapp } from "@/lib/webhook";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const isZApiPayload = typeof payload?.phone === "string" && typeof payload?.text?.message === "string";

    if (payload?.fromMe === true) {
      return NextResponse.json({ ok: true, ignored: true, reason: "fromMe" });
    }

    const result = await processIncomingWhatsapp({
      phone: String(payload.phone ?? payload.from ?? ""),
      message: isZApiPayload ? String(payload.text.message) : String(payload.message ?? ""),
      name: payload.senderName ? String(payload.senderName) : payload.name ? String(payload.name) : undefined
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Webhook processing failed"
      },
      { status: 400 }
    );
  }
}
