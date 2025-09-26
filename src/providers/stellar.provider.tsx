"use client";

import { useStellarBalances } from "@/hooks/use-stellar-balances";
import { StellarConfig } from "@/lib/stellar/config";
import { isAccountNotFound } from "@/lib/stellar/errors";
import {
  usePrivy,
  useUser,
  type WalletWithMetadata,
} from "@privy-io/react-auth";
import { useCreateWallet } from "@privy-io/react-auth/extended-chains";
import {
  Asset,
  BASE_FEE,
  Horizon,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";

type StellarContextProvider = { children: ReactNode; stellarRpcUrl?: string };

type StellarContextProviderValue = {
  server: Horizon.Server | undefined;
  publicKey: string | undefined;
  setPublicKey: (publicKey: string) => void;
  account: Horizon.AccountResponse | undefined | null;
  usdcBalance: number;
  isConnected: boolean;
  disconnect: () => void;
  convertXlmToUsdc: (amount: string) => Promise<string>;
  enableUsdcTrustline: () => Promise<string>;
  refreshAccount: () => Promise<void>;
};

const initialContext = {
  server: undefined,
  publicKey: undefined,
  setPublicKey: () => {},
  account: undefined,
  usdcBalance: 0,
  isConnected: false,
  disconnect: () => {},
  convertXlmToUsdc: () => Promise.resolve(""),
  enableUsdcTrustline: () => Promise.resolve(""),
  refreshAccount: () => Promise.resolve(),
};

export const StellarContext =
  createContext<StellarContextProviderValue>(initialContext);

export const StellarProvider = ({
  children,
  stellarRpcUrl,
}: StellarContextProvider) => {
  const [publicKey, setPublicKey] = useState<string | undefined>(undefined);
  const [accountInfo, setAccountInfo] = useState<
    Horizon.AccountResponse | undefined | null
  >(undefined);
  const { formattedBalances } = useStellarBalances(accountInfo);

  // Auto-initialize Stellar wallet for authenticated users
  const { user, refreshUser } = useUser();
  const { ready, authenticated } = usePrivy();
  const { createWallet } = useCreateWallet();
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);

  const stellarEmbeddedWallets = useMemo<WalletWithMetadata[]>(
    () =>
      (user?.linkedAccounts.filter(
        (account) =>
          account.type === "wallet" &&
          account.walletClientType === "privy" &&
          account.chainType === "stellar"
      ) as WalletWithMetadata[]) ?? [],
    [user]
  );

  const handleCreateWallet = useCallback(async () => {
    if (isCreatingWallet) return;

    setIsCreatingWallet(true);
    try {
      await createWallet({ chainType: "stellar" });
      await refreshUser();
    } catch (error) {
      console.error("Error creating wallet:", error);
    } finally {
      setIsCreatingWallet(false);
    }
  }, [createWallet, refreshUser, isCreatingWallet]);

  const server = new Horizon.Server(
    stellarRpcUrl ?? StellarConfig.NETWORK.rpcUrl
  );

  const getAccountInfo = async (publicKey: string) => {
    try {
      const data = await server.loadAccount(publicKey);

      setAccountInfo(data);
    } catch (error: any) {
      // Handle 404 error specifically - account doesn't exist (not funded)
      if (isAccountNotFound(error)) {
        console.log(
          `Account ${publicKey} not found - needs activation/funding`
        );
        // Set account info to null to indicate unfunded account
        setAccountInfo(null);
        return;
      }

      // For other errors, show toast and log
      toast.error(error.message || "Failed to get account info");
      console.error("Error loading account:", error);
    }
  };

  const usdcBalance = formattedBalances.find(
    (balance) => balance.code === StellarConfig.USDC_ASSET.code
  )?.balance;

  const convertXlmToUsdc = async (amount: string) => {
    try {
      const destAsset = StellarConfig.USDC_ASSET.asset;
      const pathResults = await server
        .strictSendPaths(Asset.native(), amount, [destAsset])
        .call();

      if (!pathResults?.records?.length) {
        throw new Error("No exchange rate found for XLM swap");
      }

      // Apply 5% slippage tolerance
      const bestPath = pathResults.records[0];
      const estimatedDestMinAmount = (
        parseFloat(bestPath.destination_amount) * 0.94
      ).toFixed(2);

      return estimatedDestMinAmount;
    } catch (error: any) {
      throw error;
    }
  };

  const enableUsdcTrustline = async (): Promise<string> => {
    if (!publicKey) {
      throw new Error("No account connected");
    }

    try {
      // Refresh account info to get latest sequence number
      const freshAccount = await server.loadAccount(publicKey);

      // Create changeTrust operation for USDC
      const changeTrustOp = Operation.changeTrust({
        asset: new Asset(
          StellarConfig.USDC_ASSET.code,
          StellarConfig.USDC_ASSET.issuer
        ),
        limit: "922337203685.4775807", // Maximum limit
      });

      // Build transaction with fresh account data
      const transaction = new TransactionBuilder(freshAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.PUBLIC,
      })
        .addOperation(changeTrustOp)
        .setTimeout(30)
        .build();

      // Return the transaction XDR for signing
      return transaction.toXDR();
    } catch (error: any) {
      // Handle 404 error specifically - account doesn't exist (not funded)
      if (isAccountNotFound(error)) {
        throw new Error(
          "Account needs to be activated before enabling USDC trustline. Please fund your account with XLM first."
        );
      }

      console.error("Error creating trustline transaction:", error);
      throw error;
    }
  };

  const refreshAccount = async () => {
    if (publicKey) {
      await getAccountInfo(publicKey);
    }
  };

  const disconnect = async () => {
    try {
      setPublicKey(undefined);
      setAccountInfo(undefined);
    } catch (error: any) {
      console.error(error);
    }
  };

  // Auto-create wallet and set publicKey for authenticated users
  useEffect(() => {
    if (
      ready &&
      authenticated &&
      user &&
      stellarEmbeddedWallets.length === 0 &&
      !isCreatingWallet
    ) {
      handleCreateWallet();
    } else if (stellarEmbeddedWallets.length > 0) {
      const walletAddress = stellarEmbeddedWallets[0]?.address;
      if (walletAddress && walletAddress !== publicKey) {
        setPublicKey(walletAddress);
      }
    }
  }, [
    ready,
    authenticated,
    user,
    stellarEmbeddedWallets,
    handleCreateWallet,
    isCreatingWallet,
    publicKey,
  ]);

  useEffect(() => {
    if (publicKey) {
      refreshAccount();
    }
  }, [publicKey]);

  return (
    <StellarContext.Provider
      value={{
        publicKey,
        setPublicKey,
        server,
        account: accountInfo,
        usdcBalance: Number(usdcBalance) ?? 0,
        isConnected: !!publicKey,
        disconnect,
        convertXlmToUsdc,
        enableUsdcTrustline,
        refreshAccount,
      }}
    >
      {children}
    </StellarContext.Provider>
  );
};

export const useStellar = () => useContext(StellarContext);
