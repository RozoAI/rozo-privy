import { PaymentPayload, PaymentResult } from "@/lib/payment-api";
import { StellarConfig } from "@/lib/stellar/config";
import { StellarPayNow } from "@/lib/stellar/pay";
import { useStellar } from "@/providers/stellar.provider";
import { usePrivy, useUser } from "@privy-io/react-auth";
import { useSignRawHash } from "@privy-io/react-auth/extended-chains";
import { RozoPayOrderView } from "@rozoai/intent-common";
import { Networks, Transaction } from "@stellar/stellar-sdk";
import { useState } from "react";

type TransferStep = "create-payment" | "submit-transaction" | "success";

type Payload =
  | { bridge: true; payload: PaymentPayload }
  | { bridge: false; payload: { amount: string; address: string } };

export const useStellarTransfer = () => {
  const { publicKey, account, server } = useStellar();
  const { signRawHash } = useSignRawHash();
  const { refreshUser } = useUser();

  const { ready, authenticated } = usePrivy();

  const [step, setStep] = useState<TransferStep>("create-payment");

  const transfer = async (
    payload: Payload,
    type: "usdc" | "xlm" = "usdc"
  ): Promise<{ hash: string; payment: RozoPayOrderView } | undefined> => {
    console.log("payload", payload);
    console.log("publicKey", publicKey);
    console.log("account", account);
    console.log("server", server);
    console.log("ready", ready);
    console.log("authenticated", authenticated);

    if (!ready || !authenticated || !publicKey) {
      throw new Error("Please ensure you are logged in and try again");
    }

    try {
      if (account && publicKey && server) {
        let paymentResponse: PaymentResult | null = null;
        let stellarPayParams: any;

        if (payload.bridge) {
          // Bridge mode: Use API flow
          setStep("create-payment");
          const response = await fetch("/api/create-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload.payload),
          });

          paymentResponse = (await response.json()) as PaymentResult;

          if (paymentResponse.success) {
            const token = StellarConfig.getAssetByCode(
              type === "usdc" ? "USDC" : "XLM"
            );

            if (!token) {
              throw new Error("Token not found");
            }

            stellarPayParams = {
              account,
              publicKey,
              server,
              token: {
                key: token.code,
                address: token.issuer ?? "",
              },
              order: {
                address:
                  paymentResponse.payment?.metadata?.receivingAddress ?? "",
                pay_amount: Number(
                  paymentResponse.payment?.destination.amountUnits ?? 0
                ),
                salt: paymentResponse.payment?.metadata?.memo ?? "",
              },
            };
          } else {
            throw new Error("Payment creation failed");
          }
        } else {
          // Direct mode: Skip API, go directly to StellarPayNow
          const token = StellarConfig.getAssetByCode(
            type === "usdc" ? "USDC" : "XLM"
          );

          if (!token) {
            throw new Error("Token not found");
          }

          stellarPayParams = {
            account,
            publicKey,
            server,
            token: {
              key: token.code,
              address: token.issuer ?? "",
            },
            order: {
              address: payload.payload.address,
              pay_amount: Number(payload.payload.amount),
              salt: `direct-${Date.now()}`,
            },
          };

          // Create a mock payment response for consistency
          paymentResponse = {
            success: true,
            payment: {
              id: `direct-${Date.now()}`,
              metadata: { receivingAddress: payload.payload.address },
              destination: { amountUnits: payload.payload.amount },
              status: "completed",
              createdAt: new Date().toISOString(),
              display: {
                intent: `Direct payment of ${
                  payload.payload.amount
                } ${type.toUpperCase()}`,
                paymentValue: payload.payload.amount,
                currency: "USD",
              },
              source: "direct",
              externalId: `direct-${Date.now()}`,
            } as unknown as RozoPayOrderView,
          };
        }

        setStep("submit-transaction");
        const transactionXdr = await StellarPayNow(stellarPayParams);

        const transaction = new Transaction(transactionXdr, Networks.PUBLIC);

        const transactionHash = transaction.hash();

        if (transactionHash) {
          try {
            const { signature } = await signRawHash({
              address: publicKey,
              chainType: "stellar",
              hash: `0x${transactionHash.toString("hex")}`,
            });

            const signatureBuffer = Buffer.from(
              signature.replace("0x", ""),
              "hex"
            );
            transaction.addSignature(
              publicKey,
              signatureBuffer.toString("base64")
            );
          } catch (signError: any) {
            if (
              signError.message?.includes("authenticated") ||
              signError.message?.includes("User must be authenticated")
            ) {
              // Try to refresh user state first
              try {
                await refreshUser();
                throw new Error("Authentication expired. Please try again.");
              } catch {
                throw new Error(
                  "Authentication expired. Please refresh the page and log in again."
                );
              }
            }
            throw signError;
          }

          if (server) {
            try {
              const result = await server.submitTransaction(transaction);

              if (result.successful && paymentResponse?.payment) {
                setStep("success");
                return {
                  hash: result.hash,
                  payment: paymentResponse.payment,
                };
              } else {
                throw new Error("Transaction failed");
              }
            } catch (error) {
              throw error;
            }
          }
        } else {
          throw new Error("Transaction failed");
        }
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      throw error;
    }
  };

  return {
    transfer,
    step,
  };
};
