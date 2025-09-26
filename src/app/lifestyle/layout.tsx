import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lifestyle - Rozo AI",
  description: "Discover lifestyle",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
