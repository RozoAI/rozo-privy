"use client";

import { useStellarBalances } from "@/hooks/use-stellar-balances";
import { useStellarTransfer } from "@/hooks/use-stellar-transfer";
import { useStellarWallet } from "@/hooks/use-stellar-wallet";
import { PaymentPayload } from "@/lib/payment-api";
import { type DeeplinkData } from "@rozoai/deeplink-core";
import { getChainName } from "@rozoai/intent-common";
import { useRouter } from "next/navigation";
import { forwardRef, useImperativeHandle, useState } from "react";
import { toast } from "sonner";
import { baseUSDC } from "../lib/constants";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";

export interface TransactionDetailRef {
  open: (data: DeeplinkData) => void;
  close: () => void;
}

const TransactionDetail = forwardRef<TransactionDetailRef>((props, ref) => {
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<DeeplinkData | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const { transfer } = useStellarTransfer();
  const { account } = useStellarWallet();
  const { usdcBalance } = useStellarBalances(account);

  // Type guard to check if data has blockchain properties
  const isBlockchainData = (
    data: DeeplinkData
  ): data is Exclude<DeeplinkData, { type: "website" }> => {
    return data.type !== "website";
  };

  const hasAmount =
    parsedData && isBlockchainData(parsedData)
      ? parsedData.amount !== undefined
      : false;

  // Use USDC decimals from constants
  const USDC_DECIMALS = baseUSDC.decimals;

  // Format USDC amount (6 decimals)
  const formatUsdcAmount = (rawAmount: string): string => {
    if (!rawAmount) return "0";

    const amount = parseFloat(rawAmount) / Math.pow(10, USDC_DECIMALS);

    // Format with up to 6 decimal places, removing trailing zeros
    return amount.toFixed(USDC_DECIMALS).replace(/\.?0+$/, "");
  };

  const getDisplayAmount = (): string => {
    if (!parsedData || !isBlockchainData(parsedData) || !parsedData.amount) {
      return "0";
    }

    return formatUsdcAmount(parsedData.amount);
  };

  useImperativeHandle(ref, () => ({
    open: (data: DeeplinkData) => {
      setParsedData(data);
      setIsOpen(true);

      if (isBlockchainData(data) && data.amount !== undefined) {
        setAmount(String(parseFloat(String(data.amount || "0"))));
      } else {
        setAmount("");
      }
    },
    close: () => {
      setIsOpen(false);
      setParsedData(null);
      setAmount("");
    },
  }));
  const handleAmountSubmit = async () => {
    if (!amount || parseFloat(String(amount || "0")) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // Check if amount exceeds available USDC balance
    const enteredAmount = parseFloat(amount);
    const availableBalance = parseFloat(String(usdcBalance || "0"));

    if (enteredAmount > availableBalance) {
      toast.error(
        `Insufficient balance. Available: ${availableBalance.toFixed(6)} ${
          baseUSDC.symbol
        }`
      );
      return;
    }

    const toastId = toast.loading("Processing transaction...");

    setIsProcessing(true);
    try {
      if (parsedData && parsedData.type === "ethereum") {
        const payload: PaymentPayload = {
          appId: "rozoInvoiceStellar",
          display: {
            intent: "Pay",
            paymentValue: amount,
            currency: "USD",
          },
          destination: {
            destinationAddress: parsedData.address ?? "",
            chainId: String(baseUSDC.chainId),
            amountUnits: hasAmount
              ? String(parseFloat(String(amount || "0")))
              : amount,
            tokenSymbol: baseUSDC.symbol,
            tokenAddress: parsedData.asset?.contract ?? "",
          },
          externalId: "",
          metadata: {
            daimoOrderId: "",
            intent: "Pay",
            items: [],
            payer: {},
          },
          preferredChain: "10001",
          preferredToken: "USDC_XLM",
        };

        const result = await transfer(payload);
        if (result) {
          const { payment } = result;
          toast.success("Transaction successful", { id: toastId });
          router.push(`/receipt?id=${payment.id}`);
        } else {
          toast.error("Transaction failed", { id: toastId });
        }
      }
    } catch (error) {
      toast.error("Failed to create payment", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTransactionConfirm = () => {
    handleAmountSubmit();
  };

  const handleCancel = () => {
    setAmount("");
    setIsOpen(false);
    setParsedData(null);
  };

  if (!parsedData) return null;

  console.log({ parsedData });

  return (
    <Sheet open={isOpen} onOpenChange={() => {}} modal>
      <SheetContent
        side="bottom"
        className="h-[80vh]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <SheetHeader>
          <SheetTitle>
            {hasAmount ? "Transaction Details" : "Enter Amount"}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 p-4 pt-0">
          {/* Recipient Information */}
          {parsedData && isBlockchainData(parsedData) && parsedData.address && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Recipient Address
              </label>
              <div className="p-3 bg-gray-50 rounded-lg break-all text-sm">
                {parsedData.address}
              </div>
            </div>
          )}

          {/* Amount Section */}
          {hasAmount && parsedData && isBlockchainData(parsedData) ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Amount
              </label>
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                {getDisplayAmount()} {baseUSDC.symbol}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">
                  Enter Amount
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setAmount(String(parseFloat(String(usdcBalance || "0"))))
                  }
                  className="px-2 py-1 text-xs"
                  disabled={
                    !usdcBalance || parseFloat(String(usdcBalance || "0")) <= 0
                  }
                >
                  Max
                </Button>
              </div>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.000001"
                min="0"
                max={String(usdcBalance || "0")}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Token: {baseUSDC.symbol}</span>
                <span>
                  Available: {parseFloat(String(usdcBalance || "0"))}{" "}
                  {baseUSDC.symbol}
                </span>
              </div>
              {amount &&
                parseFloat(amount) > parseFloat(String(usdcBalance || "0")) && (
                  <div className="text-xs text-red-500">
                    Amount exceeds available balance
                  </div>
                )}
            </div>
          )}

          {/* Network Information */}
          {parsedData.type === "ethereum" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Network
              </label>
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                {getChainName(
                  Number(parsedData.chain_id || String(baseUSDC.chainId))
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-auto pt-6">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>

            {hasAmount ? (
              <Button
                onClick={handleTransactionConfirm}
                className="flex-1"
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Confirm Transaction"}
              </Button>
            ) : (
              <Button
                onClick={handleAmountSubmit}
                className="flex-1"
                disabled={
                  isProcessing ||
                  !amount ||
                  parseFloat(amount) <= 0 ||
                  parseFloat(amount) > parseFloat(String(usdcBalance || "0"))
                }
              >
                Continue
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
});

TransactionDetail.displayName = "TransactionDetail";

export default TransactionDetail;
