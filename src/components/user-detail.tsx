"use client";

import { useStellarActivation } from "@/hooks/use-stellar-activation";
import { useStellarBalances } from "@/hooks/use-stellar-balances";
import { useStellarRefresh } from "@/hooks/use-stellar-refresh";
import { useStellarTrustline } from "@/hooks/use-stellar-trustline";
import { useStellarWallet } from "@/hooks/use-stellar-wallet";
import ScanQRButton from "./scan-qr-button";
import { InsufficientBalanceDialog } from "./user-detail/insufficient-balance-dialog";
import { LoadingState } from "./user-detail/loading-state";
import { StellarAddress } from "./user-detail/stellar-address";
import { StellarBalances } from "./user-detail/stellar-balances";
import { UserInfo } from "./user-detail/user-info";
import { WalletActivationAlert } from "./user-detail/wallet-activation-alert";

export default function UserDetail() {
  const {
    user,
    publicKey,
    account,
    stellarEmbeddedWallets,
    isLoading,
    handleLogout,
  } = useStellarWallet();

  const { formattedBalances, hasUsdcTrustline } = useStellarBalances(account);
  const {
    isEnabling,
    enableUsdc,
    showInsufficientBalanceDialog,
    setShowInsufficientBalanceDialog,
    balanceInfo,
  } = useStellarTrustline();
  const { isRefreshing, handleRefresh } = useStellarRefresh();
  const { needsActivation } = useStellarActivation(account, publicKey);

  console.log({ stellarEmbeddedWallets, user, needsActivation });

  if (isLoading) {
    return <LoadingState />;
  }

  if (!user) {
    return null;
  }

  return (
    <UserInfo user={user} onLogout={handleLogout}>
      {publicKey && stellarEmbeddedWallets.length > 0 && (
        <StellarAddress
          stellarAddress={stellarEmbeddedWallets[0]?.address}
          publicKey={publicKey}
        />
      )}

      {user && needsActivation && stellarEmbeddedWallets.length > 0 && (
        <WalletActivationAlert
          stellarAddress={stellarEmbeddedWallets[0]?.address}
        />
      )}

      {account?.balances && !needsActivation && (
        <StellarBalances
          balances={formattedBalances}
          hasUsdcTrustline={hasUsdcTrustline}
          isEnablingUsdc={isEnabling}
          onEnableUsdc={enableUsdc}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
        />
      )}

      <ScanQRButton />

      <InsufficientBalanceDialog
        open={showInsufficientBalanceDialog}
        onOpenChange={setShowInsufficientBalanceDialog}
        currentBalance={balanceInfo.current}
        requiredBalance={balanceInfo.required}
      />
    </UserInfo>
  );
}
