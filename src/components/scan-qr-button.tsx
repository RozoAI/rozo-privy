"use client";

import { type DeeplinkData, parseDeeplink } from "@rozoai/deeplink-core";
import { ScanQr } from "@rozoai/deeplink-react";
import { DollarSign, QrCode, Wallet } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import TransactionDetail, {
  type TransactionDetailRef,
} from "./transaction-detail";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

export default function ScanQRButton({ disabled }: { disabled: boolean }) {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [manualAddress, setManualAddress] = useState("");
  const [addressValidation, setAddressValidation] = useState<{
    isValid: boolean;
    error?: string;
  }>({ isValid: false });
  const [inputMode, setInputMode] = useState<"camera" | "manual">("camera");
  const transactionDetailRef = useRef<TransactionDetailRef>(null);

  const handleScanSuccess = (data: DeeplinkData) => {
    // Validate the scanned data using the same logic as manual input
    if (data.type === "stellar") {
      setSheetOpen(false);
      transactionDetailRef.current?.open(data);
      toast.success("Stellar address scanned successfully!");
      return;
    }

    if (data.type === "ethereum" || data.type === "address") {
      // Check chain ID if specified
      if (data.chain_id) {
        const chainId = Number(data.chain_id);
        if (chainId !== 8453) {
          toast.error(
            "Only Base network (Chain ID 8453) is supported for Ethereum addresses"
          );
          setSheetOpen(false);
          return;
        }
      }

      setSheetOpen(false);
      transactionDetailRef.current?.open(data);
      toast.success("Base address scanned successfully!");
      return;
    }

    // Reject unsupported types
    toast.error(
      "Only Stellar and Base (Ethereum) addresses are supported for USDC transfers"
    );
    setSheetOpen(false);
  };

  const handleScanError = (error: Error) => {
    console.error("Camera error:", error);

    // Check if it's a camera not found error
    if (
      error.name === "NotFoundError" ||
      error.message.includes("device not found")
    ) {
      setCameraError(true);
      setInputMode("manual");
      toast.error("Camera not available. Please enter address manually.");
    } else {
      toast.error(error.message);
      setSheetOpen(false);
    }
  };

  const validateAddress = (address: string) => {
    if (!address.trim()) {
      setAddressValidation({ isValid: false });
      return;
    }

    try {
      const data = parseDeeplink(address.trim());

      // Check for Stellar addresses
      if (data.type === "stellar") {
        setAddressValidation({ isValid: true });
        return;
      }

      // Check for Ethereum/Base addresses (Base uses Ethereum format)
      if (data.type === "ethereum" || data.type === "address") {
        // If chain_id is specified, validate it's Base (8453)
        if (data.chain_id) {
          const chainId = Number(data.chain_id);
          if (chainId === 8453) {
            // Base mainnet
            setAddressValidation({ isValid: true });
            return;
          } else {
            setAddressValidation({
              isValid: false,
              error:
                "Only Base network (Chain ID 8453) is supported for Ethereum addresses",
            });
            return;
          }
        }

        // If no chain_id specified, assume it's valid (will default to Base)
        setAddressValidation({ isValid: true });
        return;
      }

      // Reject other types
      setAddressValidation({
        isValid: false,
        error:
          "Only Stellar and Base (Ethereum) addresses are supported for USDC transfers",
      });
    } catch (error) {
      setAddressValidation({
        isValid: false,
        error:
          error instanceof Error ? error.message : "Invalid address format",
      });
    }
  };

  const handleAddressChange = (address: string) => {
    setManualAddress(address);
    validateAddress(address);
  };

  const handleManualSubmit = () => {
    if (!addressValidation.isValid) {
      toast.error(addressValidation.error || "Please enter a valid address");
      return;
    }

    try {
      const data = parseDeeplink(manualAddress.trim());
      setSheetOpen(false);
      transactionDetailRef.current?.open(data);
      toast.success("Address validated successfully!");
    } catch (error) {
      toast.error("Failed to process address");
    }
  };

  const resetState = () => {
    setCameraError(false);
    setManualAddress("");
    setAddressValidation({ isValid: false });
    setInputMode("camera");
  };

  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      // Reset state when sheet is closed
      resetState();
    }
  };

  return (
    <>
      <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetTrigger asChild>
          <Button disabled={disabled} className="w-full" size="lg">
            <DollarSign className="w-5 h-5" />
            Transfer
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="w-full max-w-lg mx-auto rounded-t-xl"
        >
          <SheetHeader>
            <SheetTitle>
              {inputMode === "camera" ? "Scan QR Code" : "Enter Address"}
            </SheetTitle>
            <p className="text-sm text-gray-500 mt-1">
              USDC transfers on Stellar and Base networks only
            </p>
          </SheetHeader>

          <div className="space-y-4 m-4">
            {/* Toggle buttons */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <Button
                variant={inputMode === "camera" ? "default" : "ghost"}
                size="sm"
                className="flex-1"
                onClick={() => setInputMode("camera")}
                disabled={cameraError}
              >
                <QrCode className="w-4 h-4 mr-2" />
                Camera
              </Button>
              <Button
                variant={inputMode === "manual" ? "default" : "ghost"}
                size="sm"
                className="flex-1"
                onClick={() => setInputMode("manual")}
              >
                <Wallet className="w-4 h-4 mr-2" />
                Manual
              </Button>
            </div>

            {/* Camera error message */}
            {cameraError && (
              <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 p-3 rounded-lg">
                Camera not detected. Please use manual input below.
              </div>
            )}

            {/* Camera mode */}
            {inputMode === "camera" && !cameraError && (
              <div className="flex items-center justify-center">
                <ScanQr
                  onScan={handleScanSuccess}
                  onError={handleScanError}
                  sound={false}
                  components={{
                    finder: false,
                  }}
                  styles={{
                    container: {
                      width: "300px",
                      height: "300px",
                      borderRadius: "10px",
                    },
                  }}
                />
              </div>
            )}

            {/* Manual input mode */}
            {inputMode === "manual" && (
              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="manual-address"
                    className="text-sm font-medium"
                  >
                    Recipient Address
                  </Label>
                  <Input
                    id="manual-address"
                    type="text"
                    placeholder="Enter Stellar (G...) or Base (0x...) address"
                    value={manualAddress}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    className={`mt-1 ${
                      manualAddress && !addressValidation.isValid
                        ? "border-red-500 focus:border-red-500"
                        : manualAddress && addressValidation.isValid
                        ? "border-green-500 focus:border-green-500"
                        : ""
                    }`}
                  />
                  {manualAddress && addressValidation.error && (
                    <p className="text-xs text-red-500 mt-1">
                      {addressValidation.error}
                    </p>
                  )}
                  {manualAddress && addressValidation.isValid && (
                    <p className="text-xs text-green-500 mt-1">
                      ✓ Valid address
                    </p>
                  )}
                  {!manualAddress && (
                    <p className="text-xs text-gray-500 mt-1">
                      Enter a Stellar address (G...) or Base network address
                      (0x...)
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleManualSubmit}
                  className="w-full"
                  disabled={!addressValidation.isValid}
                >
                  Continue
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <TransactionDetail ref={transactionDetailRef} />
    </>
  );
}
