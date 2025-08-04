import ReceiptContent from "@/components/payment/receipt-content";
import {
  generateErrorMetadata,
  generatePaymentMetadata,
} from "@/lib/metadata-utils";
import { getPaymentData } from "@/lib/payment-api";
import { Metadata } from "next";
import { redirect } from "next/navigation";

// Force dynamic rendering since we use searchParams
export const dynamic = "force-dynamic";

interface ReceiptPageProps {
  searchParams: Promise<{ id?: string }>;
}

export async function generateMetadata({
  searchParams,
}: ReceiptPageProps): Promise<Metadata> {
  try {
    const { id } = await searchParams;

    if (!id) {
      return generateErrorMetadata();
    }

    const result = await getPaymentData(id);

    if (!result.success || !result.payment) {
      return generateErrorMetadata();
    }

    return generatePaymentMetadata(result.payment);
  } catch (error) {
    console.error("Error generating metadata:", error);
    return generateErrorMetadata();
  }
}

export default async function Receipt({ searchParams }: ReceiptPageProps) {
  try {
    const { id } = await searchParams;

    if (!id) {
      return redirect("/error");
    }

    const result = await getPaymentData(id);

    if (!result.success || !result.payment) {
      return redirect("/error");
    }

    return <ReceiptContent payment={result.payment} />;
  } catch (error) {
    console.error("Error loading receipt:", error);
    return redirect("/error");
  }
}
