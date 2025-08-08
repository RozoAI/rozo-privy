import type { FormattedBalance } from "@/lib/stellar/utils";
import { memo } from "react";
import { BalanceItem } from "./balance-item";
import { RefreshBalanceButton } from "./refresh-balance-button";
import { UsdcEnableButton } from "./usdc-enable-button";

interface StellarBalancesProps {
  balances: FormattedBalance[];
  hasUsdcTrustline: boolean;
  isEnablingUsdc: boolean;
  onEnableUsdc: () => void;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export const StellarBalances = memo(function StellarBalances({
  balances,
  hasUsdcTrustline,
  isEnablingUsdc,
  onEnableUsdc,
  isRefreshing,
  onRefresh,
}: StellarBalancesProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Stellar Balances</p>
        <RefreshBalanceButton
          isRefreshing={isRefreshing}
          onRefresh={onRefresh}
        />
      </div>
      <div className="space-y-2">
        {balances.map((balance) => (
          <BalanceItem key={balance.code} balance={balance} />
        ))}
        {!hasUsdcTrustline && (
          <UsdcEnableButton
            isEnabling={isEnablingUsdc}
            onEnable={onEnableUsdc}
          />
        )}
      </div>
    </div>
  );
});
