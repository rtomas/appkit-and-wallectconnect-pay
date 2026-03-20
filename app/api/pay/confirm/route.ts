import { NextRequest, NextResponse } from "next/server";

const WC_PAY_API = "https://api.pay.walletconnect.org/v1/gateway";

export async function POST(request: NextRequest) {
  const { paymentId, optionId, results, collectedData } =
    await request.json();

  if (!paymentId || !optionId || !results) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    const res = await fetch(`${WC_PAY_API}/payment/${paymentId}/confirm`, {
      method: "POST",
      headers: {
        "Api-Key": process.env.WALLETCONNECT_API_KEY || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        optionId,
        results,
        collectedData: collectedData ?? null,
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { error: text || res.statusText },
        { status: res.status }
      );
    }

    return NextResponse.json(JSON.parse(text));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to confirm";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
