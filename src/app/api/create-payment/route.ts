import { createPayment, PaymentPayload } from "@/lib/payment-api";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const payload: PaymentPayload = await request.json();

    const result = await createPayment(payload);

    if (result.success) {
      return NextResponse.json({
        success: true,
        payment: result.payment,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Invalid request data",
      },
      { status: 500 }
    );
  }
}
