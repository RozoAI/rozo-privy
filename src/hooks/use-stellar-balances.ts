import { StellarConfig } from "@/lib/stellar/config";
import {
  formatStellarBalances,
  type StellarBalance,
} from "@/lib/stellar/utils";
import type { Horizon } from "@stellar/stellar-sdk";
import { useMemo } from "react";

export function useStellarBalances(
  account: Horizon.AccountResponse | undefined
) {
  const formattedBalances = useMemo(() => {
    if (!account?.balances) return [];
    return formatStellarBalances(account.balances as StellarBalance[]);
  }, [account?.balances]);

  const hasUsdcTrustline = useMemo(() => {
    if (!account?.balances) return false;
    return account.balances.some(
      (balance: any) =>
        balance.asset_code === StellarConfig.USDC_ASSET.code &&
        balance.asset_issuer === StellarConfig.USDC_ASSET.issuer
    );
  }, [account?.balances]);

  const usdcBalance = useMemo(() => {
    if (!account?.balances) return 0;
    return account.balances.find(
      (balance: any) => balance.asset_code === StellarConfig.USDC_ASSET.code
    )?.balance;
  }, [account?.balances]);

  return {
    formattedBalances,
    hasUsdcTrustline,
    usdcBalance,
  };
}
