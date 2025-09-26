import { PrivyClient } from "@privy-io/server-auth";

export type APIError = {
  error: string;
  cause?: string;
};

export const createPrivyClient = () => {
  return new PrivyClient(
    process.env.NEXT_PUBLIC_PRIVY_APP_ID as string,
    process.env.PRIVY_APP_SECRET as string
  );
};
