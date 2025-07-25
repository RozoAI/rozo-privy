"use client";

import { Button } from "@/components/ui/button";
import { useLogin } from "@privy-io/react-auth";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";

export function SignInButton() {
  const router = useRouter();
  const { login } = useLogin({
    onComplete: () => router.push("/"),
  });

  return (
    <Button onClick={() => login()} size="lg" className="w-full">
      <LogIn className="mr-2 h-4 w-4" />
      Sign In
    </Button>
  );
}
