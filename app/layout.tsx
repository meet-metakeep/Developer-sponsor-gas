import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MetaKeep Demo: Gas Sponsorship for USDC Transfer",
  description:
    "Developer-sponsored USDC transfer on Solana Devnet using MetaKeep",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* MetaKeep SDK */}
        <script
          src="https://cdn.jsdelivr.net/npm/metakeep@2.2.8/lib/index.js"
          integrity="sha256-dVJ6hf8zqdtHxHJCDJnLAepAyCCbu6lCXzZS3lqMIto="
          crossOrigin="anonymous"
        />

        {/* Solana Web3.js */}
        <script src="https://unpkg.com/@solana/web3.js@1.87.6/lib/index.iife.min.js" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
