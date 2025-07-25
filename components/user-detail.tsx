"use client";

import { formatAddress } from "@/lib/utils";
import { usePrivy, useUser, WalletWithMetadata } from "@privy-io/react-auth";
import { useCreateWallet } from "@privy-io/react-auth/extended-chains";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CopyIcon } from "./icons/copy";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

export default function UserDetail() {
  const { user, refreshUser } = useUser();
  const router = useRouter();
  console.log(user);
  const { ready, authenticated, logout } = usePrivy();

  const { createWallet } = useCreateWallet();
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { resolvedTheme } = useTheme();

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

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    if (
      ready &&
      authenticated &&
      user &&
      stellarEmbeddedWallets.length === 0 &&
      !isCreating
    ) {
      handleCreateWallet();
    }
  }, [
    ready,
    authenticated,
    user,
    stellarEmbeddedWallets,
    handleCreateWallet,
    isCreating,
  ]);

  if (!ready || (authenticated && !user)) {
    return (
      <Card className="w-fit">
        <CardHeader>
          <CardTitle>Loading</CardTitle>
          <CardDescription>
            Loading user details. Please wait...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isCreating || (user && stellarEmbeddedWallets.length === 0)) {
    return (
      <Card className="w-fit">
        <CardHeader>
          <CardTitle>Wallet Creation</CardTitle>
          <CardDescription>
            We are creating a Stellar wallet for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Please wait...</p>
        </CardContent>
      </Card>
    );
  }

  const handleLogout = async () => {
    await logout();
  };

  const handleCopy = () => {
    if (!stellarEmbeddedWallets[0]?.address) return;
    navigator.clipboard.writeText(stellarEmbeddedWallets[0]?.address);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="flex justify-center pb-6">
        <Image
          src={
            resolvedTheme === "light"
              ? "/Privy_ProtectedLockup_Black.png"
              : "/Privy_ProtectedLockup_White.png"
          }
          alt="Privy Logo"
          width={150}
          height={50}
        />
      </div>
      <div className="flex items-center justify-between pb-6 pt-0">
        <div>
          <h3 className="text-2xl font-semibold leading-none tracking-tight">
            Welcome
          </h3>
          <p className="text-sm text-muted-foreground">
            Here are your account details.
          </p>
        </div>

        <Button onClick={handleLogout} size="sm" className="w-fit">
          Logout
        </Button>
      </div>
      <div className="grid gap-4 pb-6 pt-0">
        <div>
          <p className="text-sm font-medium">Email</p>
          <p className="text-sm text-muted-foreground">
            {user?.email?.address}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium">Stellar Address</p>
          <Sheet>
            <div className="flex items-center gap-2">
              <p className="break-all text-sm text-muted-foreground">
                {formatAddress(stellarEmbeddedWallets[0]?.address)}
              </p>
              <Button variant="ghost" size="icon" onClick={handleCopy}>
                <CopyIcon />
              </Button>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="ml-auto w-fit">
                  View Address
                </Button>
              </SheetTrigger>
            </div>
            <SheetContent side="bottom">
              <SheetHeader>
                <SheetTitle>Stellar Address</SheetTitle>
                <SheetDescription>
                  Scan the QR code to send funds to this address.
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col items-center gap-4 py-4">
                <QRCodeSVG
                  value={stellarEmbeddedWallets[0]?.address}
                  size={256}
                  bgColor={resolvedTheme === "dark" ? "#000" : "#fff"}
                  fgColor={resolvedTheme === "dark" ? "#fff" : "#000"}
                />
                <p className="break-all text-sm text-muted-foreground px-4 text-center">
                  {stellarEmbeddedWallets[0]?.address}
                </p>
                <Button variant="ghost" size="lg" onClick={handleCopy}>
                  <CopyIcon className="mr-2" />
                  Copy Address
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
