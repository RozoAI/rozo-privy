import * as StellarSdk from "@stellar/stellar-sdk";
import { useCallback, useEffect, useState } from "react";

const useGetStellarBalance = (address: string, currency: string = "XLM") => {
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  const refetch = useCallback(async () => {
    if (!address) {
      setBalance(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      if (!StellarSdk.StrKey.isValidEd25519PublicKey(address)) {
        setBalance("0");
        setLoading(false);
        return;
      }

      const server = new StellarSdk.Horizon.Server(
        "https://horizon.stellar.org"
      );

      const accountResponse = await server.loadAccount(address).catch((err) => {
        if (err?.response?.status === 404) {
          return null;
        }
        throw err;
      });

      let totalBalance = 0;

      if (accountResponse) {
        const foundBalance = accountResponse.balances.find((b: any) => {
          if (currency === "XLM") {
            return b.asset_type === "native";
          }
          return b.asset_type !== "native" && b.asset_code === currency;
        });
        if (foundBalance) {
          totalBalance += parseFloat(foundBalance.balance);
        }
      }

      setBalance(totalBalance.toString());
    } catch (e: any) {
      if (e instanceof Error) {
        console.error(e.message);
      }
      setError(e);
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, [address, currency]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { balance, loading, error, refetch };
};

export default useGetStellarBalance;
