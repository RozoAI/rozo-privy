import { memo } from "react";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface InsufficientBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance: number;
  requiredBalance: number;
}

export const InsufficientBalanceDialog = memo(function InsufficientBalanceDialog({
  open,
  onOpenChange,
  currentBalance,
  requiredBalance,
}: InsufficientBalanceDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <AlertDialogTitle>Insufficient XLM Balance</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 text-left">
            <p>
              You need at least <strong>{requiredBalance} XLM</strong> to enable USDC trustline, 
              but your current balance is <strong>{currentBalance.toFixed(2)} XLM</strong>.
            </p>
            
            <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-md border border-amber-200 dark:border-amber-800">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                Why do I need {requiredBalance} XLM?
              </p>
              <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                <li>• <strong>1.0 XLM</strong> - Stellar minimum account balance requirement</li>
                <li>• <strong>0.5 XLM</strong> - Buffer for transaction fees and trustline reserve</li>
              </ul>
            </div>

            <p className="text-sm text-muted-foreground">
              Please add more XLM to your wallet and try again.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => onOpenChange(false)}>
            Understood
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});
