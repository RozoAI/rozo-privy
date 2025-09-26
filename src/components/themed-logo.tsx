"use client";

import { useTheme } from "next-themes";
import Image from "next/image";

interface ThemedLogoProps {
  width?: number;
  height?: number;
  priority?: boolean;
}

export function ThemedLogo({
  width = 150,
  height = 50,
  priority = false,
}: ThemedLogoProps) {
  const { resolvedTheme } = useTheme();
  console.log(resolvedTheme);
  return (
    <div className="flex justify-center">
      <Image
        src={
          resolvedTheme === "light"
            ? "/Privy_ProtectedLockup_Black.png"
            : "/Privy_ProtectedLockup_White.png"
        }
        alt="Privy Logo"
        width={width}
        height={height}
        priority={priority}
      />
    </div>
  );
}
