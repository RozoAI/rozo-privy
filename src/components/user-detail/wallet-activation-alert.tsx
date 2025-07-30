import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { memo } from "react";

interface WalletActivationAlertProps {
  stellarAddress: string;
}

export const WalletActivationAlert = memo(function WalletActivationAlert({
  stellarAddress,
}: WalletActivationAlertProps) {
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(stellarAddress);
  };

  return (
    <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertTitle className="text-amber-800 dark:text-amber-200">
        Wallet Activation Required
      </AlertTitle>
      <AlertDescription className="text-amber-700 dark:text-amber-300">
        <div className="space-y-3">
          <p>
            Your Stellar wallet needs to be activated with a minimum deposit of 1 XLM
            to start receiving transactions and holding balances.
          </p>

          <div className="space-y-2">
            <p className="font-medium">Your Stellar Address:</p>
            <div className="flex items-center gap-2 p-2 bg-amber-100 dark:bg-amber-900 rounded font-mono text-sm break-all">
              <span className="flex-1">{stellarAddress}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyAddress}
                className="h-6 px-2 text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100"
              >
                Copy
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-medium">To activate your wallet:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Send at least 1 XLM to your address above</li>
              <li>You can use any Stellar wallet or exchange</li>
            </ol>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
});
