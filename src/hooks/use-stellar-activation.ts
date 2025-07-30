import type { Horizon } from "@stellar/stellar-sdk";
import { useMemo } from "react";

export function useStellarActivation(
  account: Horizon.AccountResponse | undefined,
  publicKey: string | undefined
) {
  const needsActivation = useMemo(() => {
    // If we have a public key but no account data, the wallet needs activation
    if (publicKey && !account) {
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
  }, [account, publicKey]);

  return {
    needsActivation,
  };
}
