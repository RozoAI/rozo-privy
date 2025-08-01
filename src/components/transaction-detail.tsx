"use client";

import { type DeeplinkData } from "@rozoai/deeplink-core";
import { forwardRef, useImperativeHandle, useState } from "react";
import { toast } from "sonner";
import { baseUSDC } from "../lib/constants";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";

export interface TransactionDetailRef {
  open: (data: DeeplinkData) => void;
  close: () => void;
}

const TransactionDetail = forwardRef<TransactionDetailRef>((props, ref) => {
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<DeeplinkData | null>(null);
  const [isOpen, setIsOpen] = useState(false);

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
      setAmount("");
    },
    close: () => {
      setIsOpen(false);
      setParsedData(null);
      setAmount("");
    },
  }));

  const handleAmountSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // Process the transaction with the entered amount
    toast.success("Proceeding with transaction...");
    // TODO: Implement transaction processing logic
  };

  const handleTransactionConfirm = () => {
    setIsProcessing(true);
    // Process the transaction with the scanned amount
    toast.success("Processing transaction...");
    // TODO: Implement transaction processing logic
    setTimeout(() => {
      setIsProcessing(false);
      setIsOpen(false);
      setParsedData(null);
      setAmount("");
    }, 2000);
  };

  const handleCancel = () => {
    setAmount("");
    setIsOpen(false);
    setParsedData(null);
  };

  if (!parsedData) return null;

  return (
    <Sheet open={isOpen} onOpenChange={() => {}} modal>
      <SheetContent
        side="bottom"
        className="h-[80vh]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
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
              <label className="text-sm font-medium text-gray-700">
                Enter Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                step="0.000001"
                min="0"
              />
              <div className="text-xs text-gray-500">
                Token: {baseUSDC.symbol}
              </div>
            </div>
          )}

          {/* Network Information */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Network</label>
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              {baseUSDC.chainName}
            </div>
          </div>

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
                disabled={!amount || parseFloat(amount) <= 0}
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
