import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy, useUser, type WalletWithMetadata } from "@privy-io/react-auth";
import { useCreateWallet } from "@privy-io/react-auth/extended-chains";
import { useStellar } from "@/providers/stellar.provider";

export function useStellarWallet() {
  const { user, refreshUser } = useUser();
  const router = useRouter();
  const { ready, authenticated, logout } = usePrivy();
  const { createWallet } = useCreateWallet();
  const { setPublicKey, publicKey, account } = useStellar();
  const [isCreating, setIsCreating] = useState(false);

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
    setIsCreating(true);
    try {
      await createWallet({ chainType: "stellar" });
      await refreshUser();
    } catch (error) {
      console.error("Error creating wallet:", error);
    } finally {
      setIsCreating(false);
    }
  }, [createWallet, refreshUser]);

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  const isLoading =
    !ready ||
    (authenticated && !user) ||
    isCreating ||
    (user && stellarEmbeddedWallets.length === 0);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  // Auto-create wallet if needed
  useEffect(() => {
    if (
      ready &&
      authenticated &&
      user &&
      stellarEmbeddedWallets.length === 0 &&
      !isCreating
    ) {
      handleCreateWallet();
    } else if (stellarEmbeddedWallets.length > 0) {
      setPublicKey(stellarEmbeddedWallets[0]?.address);
    }
  }, [
    ready,
    authenticated,
    user,
    stellarEmbeddedWallets,
    handleCreateWallet,
    isCreating,
    setPublicKey,
  ]);

  return {
    user,
    publicKey,
    account,
    stellarEmbeddedWallets,
    isLoading,
    handleLogout,
  };
}
