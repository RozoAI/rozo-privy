import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Banana - Rozo AI",
  description: "Generate images with Rozo Banana",
};

export default function BananaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
