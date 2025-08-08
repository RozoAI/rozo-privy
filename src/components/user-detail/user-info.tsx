import type { User } from "@privy-io/react-auth";
import { useTheme } from "next-themes";
import Image from "next/image";
import { memo, type ReactNode } from "react";
import { Button } from "../ui/button";

interface UserInfoProps {
  user: User;
  onLogout: () => Promise<void>;
  children?: ReactNode;
}

export const UserInfo = memo(function UserInfo({
  user,
  onLogout,
  children,
}: UserInfoProps) {
  const { resolvedTheme } = useTheme();

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
          priority
        />
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Email</p>
            <p className="break-all text-sm text-muted-foreground">
              {user?.email?.address}
            </p>
          </div>
          <Button variant="outline" onClick={onLogout}>
            Logout
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
});
