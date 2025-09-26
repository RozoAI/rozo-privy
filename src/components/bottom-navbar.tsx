"use client";

import { cn } from "@/lib/utils";
import { Banana, ShoppingBag, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/ai-services",
    icon: Sparkles,
    label: "AI Services",
  },
  {
    href: "/lifestyle",
    icon: ShoppingBag,
    label: "Lifestyle",
  },
  {
    href: "/banana",
    icon: Banana,
    label: "Banana",
  },
  {
    href: "/profile",
    icon: User,
    label: "Profile",
  },
] as const;

export function BottomNavbar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-background border-t shadow-lg flex items-center max-w-xl mx-auto border-x rounded-t-xl">
      <div className="w-full flex items-center justify-around px-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all duration-200 min-w-0 flex-1",
              isActive(href)
                ? "text-primary font-semibold scale-105"
                : "text-muted-foreground hover:text-foreground hover:scale-105"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs font-medium truncate">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
