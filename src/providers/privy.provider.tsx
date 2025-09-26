"use client";

import { PrivyProvider as PrivyProviderBase } from "@privy-io/react-auth";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function PrivyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only set mounted to true after hydration to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use default values during SSR to match the server render
  const theme = mounted ? (resolvedTheme as "light" | "dark") : "light";
  const logo =
    mounted && resolvedTheme === "dark" ? "/logo-white.png" : "/logo.png";

  return (
    <PrivyProviderBase
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={{
        appearance: {
          theme,
          logo,
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "off",
          },
        },
      }}
    >
      {children}
    </PrivyProviderBase>
  );
}
