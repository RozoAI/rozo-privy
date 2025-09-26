import BoxedCard from "@/components/boxed-card";
import { SignInButton } from "@/components/sign-in-button";
import { ThemedLogo } from "@/components/themed-logo";
import { CardContent, CardFooter } from "@/components/ui/card";
import { createPrivyClient } from "@/lib/privy";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Login() {
  const cookieAuthToken = (await cookies()).get("privy-token");

  if (cookieAuthToken) {
    const client = createPrivyClient();

    try {
      await client.verifyAuthToken(cookieAuthToken.value);
      redirect("/profile");
    } catch {}
  }

  return (
    <div className="w-full flex flex-col items-center justify-center gap-6 relative h-[80dvh] flex-1">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Welcome to Rozo</h1>
        <p className="text-gray-500">Please sign in to continue</p>
      </div>
      <BoxedCard className="w-full max-w-sm h-full flex flex-col">
        <CardContent className="p-6 flex-1 flex items-center justify-center">
          <SignInButton />
        </CardContent>
        <CardFooter className="flex justify-center">
          <ThemedLogo width={150} height={50} priority />
        </CardFooter>
      </BoxedCard>
    </div>
  );
}
