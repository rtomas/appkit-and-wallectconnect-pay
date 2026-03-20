import { NextRequest, NextResponse } from "next/server";

const WC_PAY_API = "https://api.pay.walletconnect.org/v1/gateway";

export async function POST(request: NextRequest) {
  const { paymentId, accounts } = await request.json();

  if (!paymentId || !accounts?.length) {
    return NextResponse.json(
      { error: "Missing paymentId or accounts" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${WC_PAY_API}/payment/${paymentId}/options`, {
      method: "POST",
      headers: {
        "Api-Key": process.env.WALLETCONNECT_API_KEY || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accounts, includePaymentInfo: true }),
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
      error instanceof Error ? error.message : "Failed to get options";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
