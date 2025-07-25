"use client";

import { PrivyProvider as PrivyProviderBase } from "@privy-io/react-auth";
import { useTheme } from "next-themes";

export default function PrivyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();

  return (
    <PrivyProviderBase
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={{
        appearance: {
          theme: resolvedTheme as "light" | "dark",
          logo: resolvedTheme === "light" ? "/logo.png" : "/logo-white.png",
        },
        embeddedWallets: {
          createOnLogin: "off",
        },
      }}
    >
      {children}
    </PrivyProviderBase>
  );
}
