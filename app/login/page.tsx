import BoxedCard from "@/components/boxed-card";
import { SignInButton } from "@/components/sign-in-button";
import { CardContent } from "@/components/ui/card";
import { createPrivyClient } from "@/lib/privy";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Login() {
  const cookieAuthToken = (await cookies()).get("privy-token");

  if (cookieAuthToken) {
    const client = createPrivyClient();

    try {
      await client.verifyAuthToken(cookieAuthToken.value);
      redirect("/");
    } catch {}
  }

  return (
    <BoxedCard className="flex-1">
      <CardContent className="m-auto w-full">
        <SignInButton />
      </CardContent>
    </BoxedCard>
  );
}
