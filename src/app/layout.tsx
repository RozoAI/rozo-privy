import { BottomNavbar } from "@/components/bottom-navbar";
import IntercomInitializer from "@/components/intercom";
import { Toaster } from "@/components/ui/sonner";
import PrivyProvider from "@/providers/privy.provider";
import { StellarProvider } from "@/providers/stellar.provider";
import dotenv from "dotenv";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

dotenv.config();

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rozo | One Tap to Pay",
  description: "Increase the GDP of Crypto",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-card`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <main className="flex min-h-screen flex-col justify-between gap-4">
            <PrivyProvider>
              <StellarProvider>{children}</StellarProvider>
            </PrivyProvider>
            <Toaster position="top-center" />
            <IntercomInitializer
              appId={process.env.INTERCOM_APP_ID as string}
            />
            {/* <FabActions /> */}
            {/* <Footer /> */}
            <BottomNavbar />
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
