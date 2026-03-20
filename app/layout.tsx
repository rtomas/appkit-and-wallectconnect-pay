import type { Metadata } from "next";
import { headers } from "next/headers";
import Providers from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "AppKit WalletConnect Pay",
  description: "Gmail login + WalletConnect Pay",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersData = await headers();
  const cookies = headersData.get("cookie");

  return (
    <html lang="en">
      <body className="bg-[#09090b] text-white min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.15)_0%,_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(139,92,246,0.1)_0%,_transparent_50%)]">
        <Providers cookies={cookies}>{children}</Providers>
      </body>
    </html>
  );
}
