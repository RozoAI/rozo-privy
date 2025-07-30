import { memo } from "react";
import type { FormattedBalance } from "@/lib/stellar/utils";

interface BalanceItemProps {
  balance: FormattedBalance;
}

export const BalanceItem = memo(function BalanceItem({ balance }: BalanceItemProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{balance.code}</span>
      <span className="text-sm text-muted-foreground">
        {balance.formattedBalance} {balance.code}
      </span>
    </div>
  );
});
