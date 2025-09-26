"use client";

import { useStellarBalances } from "@/hooks/use-stellar-balances";
import { useStellarTransfer } from "@/hooks/use-stellar-transfer";
import { useStellarWallet } from "@/hooks/use-stellar-wallet";
import { type DeeplinkData } from "@rozoai/deeplink-core";
import { rozoStellarUSDC } from "@rozoai/intent-common";
import { useRouter } from "next/navigation";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { toast } from "sonner";
import { baseUSDC } from "../lib/constants";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
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
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<DeeplinkData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [toastId, setToastId] = useState<string | number | null>(null);

  const { transfer, step } = useStellarTransfer();
  const { account } = useStellarWallet();
  const { usdcBalance } = useStellarBalances(account);

  // Type guard to check if data has blockchain properties
  const isBlockchainData = (
    data: DeeplinkData
  ): data is Exclude<DeeplinkData, { type: "website" }> => {
    return (
      data.type === "address" ||
      data.type === "ethereum" ||
      data.type === "stellar"
    );
  };

  const hasAmount =
    parsedData && isBlockchainData(parsedData)
      ? parsedData.amount !== undefined
      : false;

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAmount(inputValue);
    }, 300);

    return () => clearTimeout(timeout);
  }, [inputValue]);

  useEffect(() => {
    if (toastId) {
      if (step === "create-payment") {
        toast.loading("Creating payment...", { id: toastId });
      } else if (step === "submit-transaction") {
        toast.loading("Submitting transaction...", { id: toastId });
      } else if (step === "success") {
        toast.success("Transaction successful!", { id: toastId });
        setIsOpen(false);
      } else {
        toast.error("Transaction failed", { id: toastId });
      }
    }
  }, [step, toastId]);

  // Validate and clean input value
  const handleInputChange = useCallback((value: string) => {
    let cleanedValue = value.replace(/,/g, ".");

    cleanedValue = cleanedValue.replace(/[^0-9.]/g, "");

    const dotCount = (cleanedValue.match(/\./g) || []).length;
    if (dotCount > 1) {
      const parts = cleanedValue.split(".");
      cleanedValue = parts[0] + "." + parts.slice(1).join("");
    }

    // Limit to 6 decimal places for USDC
    const dotIndex = cleanedValue.indexOf(".");
    if (dotIndex !== -1 && cleanedValue.length > dotIndex + 7) {
      cleanedValue = cleanedValue.substring(0, dotIndex + 7);
    }

    setInputValue(cleanedValue);
  }, []);

  // Format USDC amount (6 decimals)
  const formatUsdcAmount = (rawAmount: string): string => {
    if (!rawAmount) return "0";

    const amount = parseFloat(rawAmount) / Math.pow(10, baseUSDC.decimals);

    // Format with up to 6 decimal places, removing trailing zeros
    return amount.toFixed(baseUSDC.decimals).replace(/\.?0+$/, "");
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
        const amountValue = String(parseFloat(String(data.amount || "0")));
        setAmount(amountValue);
        setInputValue(amountValue);
      } else {
        setAmount("");
        setInputValue("");
      }
    },
    close: () => {
      setIsOpen(false);
      setParsedData(null);
      setAmount("");
      setInputValue("");
    },
  }));

  const handleAmountSubmit = () => {
    // Show confirmation dialog instead of proceeding directly
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

    setShowConfirmDialog(true);
  };

  const handleConfirmTransaction = async () => {
    setToastId(toast.loading("Processing transaction..."));
    setIsProcessing(true);

    try {
      if (
        parsedData &&
        (parsedData.type === "ethereum" || parsedData.type === "stellar")
      ) {
        const chainId =
          parsedData.type === "stellar"
            ? String(rozoStellarUSDC.chainId)
            : String(baseUSDC.chainId);

        const payload: any = {
          appId: "rozoPrivy",
          display: {
            intent: `Pay ${amount} USDC`,
            paymentValue: amount,
            currency: "USD",
          },
          destination: {
            destinationAddress: parsedData.address ?? "",
            chainId: chainId,
            amountUnits: hasAmount ? String(Number(amount) || 0) : amount,
            tokenSymbol: "USDC",
            tokenAddress:
              parsedData.type === "stellar"
                ? `USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN`
                : parsedData.asset?.contract ?? baseUSDC.token ?? "",
          },
          externalId: "",
          metadata: {
            intent: `Pay ${amount} USDC`,
            items: [],
            payer: {},
          },
          preferredChain: String(rozoStellarUSDC.chainId), // Pay In Stellar (ONLY)
          preferredToken: "USDC",
        };

        const result = await transfer({
          bridge: true,
          payload,
        });
        if (result) {
          const { payment } = result;
          setTimeout(() => {
            window.open(
              `https://invoice.rozo.ai/receipt?id=${payment.id}`,
              "_blank"
            );
          }, 1000);
        }
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create payment"
      );
    } finally {
      setIsProcessing(false);
      setShowConfirmDialog(false);
    }
  };

  const handleCancel = () => {
    setAmount("");
    setInputValue("");
    setIsOpen(false);
    setShowConfirmDialog(false);
    setParsedData(null);
  };

  if (!parsedData) return null;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={() => {}} modal>
        <SheetContent
          side="bottom"
          className="w-full max-w-lg mx-auto rounded-t-xl"
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
            {parsedData &&
              isBlockchainData(parsedData) &&
              parsedData.address && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Recipient Address
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 dark:text-white rounded-lg break-all text-sm">
                    {parsedData.address}
                  </div>
                  <div className="text-xs text-gray-500">
                    {parsedData.type === "stellar"
                      ? "Stellar Network"
                      : "Base Network"}
                  </div>
                </div>
              )}

            {/* Amount Section */}
            {hasAmount && parsedData && isBlockchainData(parsedData) ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Amount
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm">
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
                      setInputValue(
                        String(parseFloat(String(usdcBalance || "0")))
                      )
                    }
                    className="px-2 py-1 text-xs"
                    disabled={
                      !usdcBalance ||
                      parseFloat(String(usdcBalance || "0")) <= 0
                    }
                  >
                    Max
                  </Button>
                </div>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="0.00"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Token: {baseUSDC.symbol}</span>
                  <span>
                    Available: {parseFloat(String(usdcBalance || "0"))}{" "}
                    {baseUSDC.symbol}
                  </span>
                </div>
                {amount &&
                  parseFloat(amount) >
                    parseFloat(String(usdcBalance || "0")) && (
                    <div className="text-xs text-red-500">
                      Amount exceeds available balance
                    </div>
                  )}
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
                  onClick={handleAmountSubmit}
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
                  {isProcessing ? "Processing..." : "Transfer"}
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="w-full max-w-md mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Please review your transaction details before proceeding.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            {/* Transaction Summary */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  Amount:
                </span>
                <span className="text-sm font-semibold">{amount} USDC</span>
              </div>

              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">To:</span>
                <span className="text-sm text-right break-all max-w-[200px]">
                  {isBlockchainData(parsedData) ? parsedData.address : ""}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  Network:
                </span>
                <span className="text-sm">
                  {parsedData.type === "stellar" ? "Stellar" : "Base"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  Token:
                </span>
                <span className="text-sm">USDC</span>
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="text-xs text-gray-500">
                This transaction will be processed on the{" "}
                {parsedData.type === "stellar" ? "Stellar" : "Base"} network.
                Please ensure the recipient address is correct.
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmTransaction}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Confirm & Send"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

TransactionDetail.displayName = "TransactionDetail";

export default TransactionDetail;
