import {
  getStellarErrorMessage,
  isTrustlineAlreadyExists,
} from "@/lib/stellar/errors";
import { useStellar } from "@/providers/stellar.provider";
import { usePrivy, useUser } from "@privy-io/react-auth";
import { useSignRawHash } from "@privy-io/react-auth/extended-chains";
import { Networks, Transaction } from "@stellar/stellar-sdk";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export function useStellarTrustline() {
  const [isEnabling, setIsEnabling] = useState(false);
  const [showInsufficientBalanceDialog, setShowInsufficientBalanceDialog] =
    useState(false);
  const [balanceInfo, setBalanceInfo] = useState<{
    current: number;
    required: number;
  }>({ current: 0, required: 1.5 });
  const { ready, authenticated } = usePrivy();
  const { user, refreshUser } = useUser();
  const { publicKey, enableUsdcTrustline, server, refreshAccount, account } =
    useStellar();
  const { signRawHash } = useSignRawHash();

  const enableUsdc = useCallback(async () => {
    // Check authentication state before proceeding
    if (!ready || !authenticated || !user || !publicKey) {
      toast.error("Please ensure you are logged in and try again");
      return;
    }

    // Check XLM balance before enabling USDC trustline
    if (account?.balances) {
      const nativeBalance = account.balances.find(
        (balance) => balance.asset_type === "native"
      );
      const xlmBalance = nativeBalance ? parseFloat(nativeBalance.balance) : 0;

      if (xlmBalance < 1.5) {
        setBalanceInfo({ current: xlmBalance, required: 1.5 });
        setShowInsufficientBalanceDialog(true);
        return;
      }
    }

    setIsEnabling(true);
    try {
      const transactionXdr = await enableUsdcTrustline();
      console.log("Transaction XDR:", transactionXdr);

      // Parse the transaction from XDR
      const transaction = new Transaction(transactionXdr, Networks.PUBLIC);

      // Get the transaction hash for signing
      const transactionHash = transaction.hash();
      console.log("Transaction hash:", transactionHash.toString("hex"));

      // Sign the transaction hash with Privy
      try {
        const { signature } = await signRawHash({
          address: publicKey,
          chainType: "stellar",
          hash: `0x${transactionHash.toString("hex")}`,
        });

        console.log("Signature:", signature);

        // Apply the signature to the transaction
        // Privy returns signature as hex string, convert to Buffer for Stellar
        const signatureBuffer = Buffer.from(signature.replace("0x", ""), "hex");
        transaction.addSignature(publicKey, signatureBuffer.toString("base64"));
      } catch (signError: any) {
        console.error("Signing error:", signError);
        if (
          signError.message?.includes("authenticated") ||
          signError.message?.includes("User must be authenticated")
        ) {
          // Try to refresh user state first
          try {
            await refreshUser();
            toast.error("Authentication expired. Please try again.");
          } catch {
            toast.error(
              "Authentication expired. Please refresh the page and log in again."
            );
          }
          return;
        }
        throw signError;
      }

      // Submit the signed transaction to Stellar network
      if (server) {
        try {
          const result = await server.submitTransaction(transaction);
          console.log("Transaction result:", result);

          if (result.successful) {
            toast.success("USDC trustline enabled successfully!");
            // Refresh account info to show the new trustline
            await refreshAccount();
          } else {
            console.log("Transaction failed result:", result);

            // Check if trustline already exists
            if (isTrustlineAlreadyExists(result)) {
              toast.info("USDC trustline already exists on your account");
              await refreshAccount(); // Refresh to show existing trustline
              return; // Don't throw error for this case
            }

            // Get user-friendly error message
            const errorMessage = getStellarErrorMessage(result);
            console.log(errorMessage);
            throw new Error(errorMessage);
          }
        } catch (errors: any) {
          console.log(errors);
          const errorMessage = getStellarErrorMessage(errors?.response?.data);
          console.log(errorMessage);
          throw new Error(errorMessage);
        }
      } else {
        throw new Error("Stellar server not available");
      }
    } catch (error: any) {
      console.error("Error enabling USDC:", error);
      toast.error(error.message || "Failed to enable USDC");
    } finally {
      setIsEnabling(false);
    }
  }, [
    ready,
    authenticated,
    user,
    publicKey,
    account,
    enableUsdcTrustline,
    server,
    refreshAccount,
    signRawHash,
    refreshUser,
  ]);

  return {
    isEnabling,
    enableUsdc,
    showInsufficientBalanceDialog,
    setShowInsufficientBalanceDialog,
    balanceInfo,
  };
}
