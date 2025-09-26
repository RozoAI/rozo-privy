import type { Horizon } from "@stellar/stellar-sdk";
import { useEffect, useMemo, useState } from "react";

export function useStellarActivation(
  account: Horizon.AccountResponse | undefined | null,
  publicKey: string | undefined
) {
  const [isAccountLoading, setIsAccountLoading] = useState(false);

  useEffect(() => {
    if (publicKey && account === undefined) {
      // Only show loading when account is undefined (still fetching)
      // Don't show loading when account is null (404 - not found)
      setIsAccountLoading(true);
    } else {
      setIsAccountLoading(false);
    }
  }, [publicKey, account]);

  const needsActivation = useMemo(() => {
    // Don't show activation needed while account is loading
    if (isAccountLoading) {
      return false;
    }

    // If we have a public key but no account data (and not loading), the wallet needs activation
    // This includes both undefined (still loading) and null (404 - account doesn't exist)
    if (publicKey && (account === undefined || account === null)) {
      return true;
    }

    // If we have account data but no balances, it might need activation
    if (account && (!account.balances || account.balances.length === 0)) {
      return true;
    }

    // If we have balances but the native balance is 0, it needs activation
    if (account?.balances) {
      const nativeBalance = account.balances.find(
        (balance) => balance.asset_type === "native"
      );
      if (!nativeBalance || parseFloat(nativeBalance.balance) === 0) {
        return true;
      }
    }

    return false;
  }, [account, publicKey, isAccountLoading]);

  return {
    needsActivation,
    isAccountLoading,
  };
}
