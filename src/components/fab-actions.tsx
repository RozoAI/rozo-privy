"use client";

import { cn } from "@/lib/utils";
import { HelpCircleIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

/**
 * Floating Action Button with theme switcher and support actions
 */
export function FabActions({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  // Action button styles
  const actionButtonStyle = {
    base: "flex h-9 items-center justify-center p-2 transition-colors w-9 cursor-pointer bg-background",
    hover: "hover:bg-accent",
  };

  return (
    <div className={cn("fixed right-6 bottom-6 z-[50] ", className)}>
      <div className="flex flex-col overflow-hidden rounded-md border bg-accent shadow-xs dark:border-input dark:bg-input/30 h-full">
        {/* Theme Switcher Button */}
        <button
          type="button"
          className={`${actionButtonStyle.base} ${actionButtonStyle.hover}`}
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          aria-label={
            resolvedTheme === "dark"
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
        >
          {resolvedTheme === "dark" ? (
            <MoonIcon className="size-4" />
          ) : (
            <SunIcon className="size-4" />
          )}
        </button>

        {/* Divider */}
        {/* <div className="border-t dark:border-input" /> */}

        {/* Support Button */}
        <button
          type="button"
          className={`${actionButtonStyle.base} ${actionButtonStyle.hover}`}
          onClick={() =>
            window.Intercom(
              "showNewMessage",
              "Hi, I need help with my payment."
            )
          }
          aria-label="Get support"
        >
          <HelpCircleIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}
