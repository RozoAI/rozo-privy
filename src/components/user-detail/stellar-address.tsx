import { useTheme } from "next-themes";
import { memo, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { formatAddress } from "@/lib/utils";
import { CopyIcon } from "../icons/copy";
import { Button } from "../ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";

interface StellarAddressProps {
  publicKey: string;
  stellarAddress?: string;
}

export const StellarAddress = memo(function StellarAddress({ 
  publicKey, 
  stellarAddress 
}: StellarAddressProps) {
  const { resolvedTheme } = useTheme();

  const handleCopy = useCallback(() => {
    if (!publicKey) return;
    navigator.clipboard.writeText(publicKey);
    toast.success("Copied to clipboard");
  }, [publicKey]);

  if (!publicKey) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Stellar Address</p>
      <Sheet>
        <div className="flex items-center gap-2">
          <p className="break-all text-sm text-muted-foreground">
            {formatAddress(publicKey)}
          </p>
          <Button variant="ghost" size="icon" onClick={handleCopy}>
            <CopyIcon />
          </Button>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto w-fit">
              View Address
            </Button>
          </SheetTrigger>
        </div>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Stellar Address</SheetTitle>
            <SheetDescription>
              Scan the QR code to send funds to this address.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <QRCodeSVG
              value={stellarAddress || publicKey}
              size={256}
              bgColor={resolvedTheme === "dark" ? "#000" : "#fff"}
              fgColor={resolvedTheme === "dark" ? "#fff" : "#000"}
            />
            <p className="break-all text-sm text-muted-foreground px-4 text-center">
              {stellarAddress || publicKey}
            </p>
            <Button variant="ghost" size="lg" onClick={handleCopy}>
              <CopyIcon className="mr-2" />
              Copy Address
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
});
