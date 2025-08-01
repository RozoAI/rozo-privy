"use client";

import { parseDeeplink, type DeeplinkData } from "@rozoai/deeplink-core";
import { ScanQr } from "@rozoai/deeplink-react";
import { QrCode } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import TransactionDetail, {
  type TransactionDetailRef,
} from "./transaction-detail";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

export default function ScanQRButton() {
  const [inputValue, setInputValue] = useState("");
  const [isSheetOpen, setSheetOpen] = useState(false);
  const transactionDetailRef = useRef<TransactionDetailRef>(null);

  const handleParse = () => {
    if (!inputValue) {
      toast.error("Input value cannot be empty.");
      return;
    }
    try {
      const data = parseDeeplink(inputValue);

      if (data.type === "address" || data.type === "ethereum") {
        setSheetOpen(false);
        transactionDetailRef.current?.open(data);
      } else {
        toast.error("Invalid deeplink");
      }
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleScanSuccess = (data: DeeplinkData) => {
    setInputValue("");
    setSheetOpen(false);

    if (data.type === "address" || data.type === "ethereum") {
      setSheetOpen(false);
      transactionDetailRef.current?.open(data);
    } else {
      toast.error("Invalid deeplink");
    }

    toast.success("QR code scanned successfully!");
  };

  const handleScanError = (error: Error) => {
    toast.error(error.message);
    setSheetOpen(false);
  };

  return (
    <>
      <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="secondary">
            <QrCode className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Scan QR Code</SheetTitle>
          </SheetHeader>
          <div className="flex items-center justify-center my-3">
            <ScanQr
              onScan={handleScanSuccess}
              onError={handleScanError}
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
        </SheetContent>
      </Sheet>

      <TransactionDetail ref={transactionDetailRef} />
    </>
  );
}
