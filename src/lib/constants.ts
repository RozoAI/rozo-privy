import { getAddress } from "viem";

export const baseUSDC = {
  chainId: 8453,
  token: getAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"),
  chainName: "Base",
  name: "USD Coin",
  symbol: "USDC",
  fiatISO: "USD",
  decimals: 6,
};
