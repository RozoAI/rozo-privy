import BoxedCard from "@/components/boxed-card";
import { CardContent } from "@/components/ui/card";
import UserDetail from "@/components/user-detail";
import { createPrivyClient } from "@/lib/privy";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Profile() {
  const cookieAuthToken = (await cookies()).get("privy-token");

  if (cookieAuthToken) {
    const client = createPrivyClient();

    try {
      await client.verifyAuthToken(cookieAuthToken.value);
    } catch {
      redirect("/login");
    }
  } else {
    redirect("/login");
  }

  return (
    <BoxedCard className="flex-1">
      <CardContent className="m-auto w-full">
        <UserDetail />
      </CardContent>
    </BoxedCard>
  );
}
