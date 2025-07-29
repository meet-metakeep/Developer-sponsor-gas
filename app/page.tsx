"use client";

import { MetaKeepApp } from "@/components/MetaKeepApp";

export default function Home() {
  return (
    <div className="container">
      <header>
        <h1> MetaKeep Gas Sponsorship Demo</h1>
        <p>Developer-sponsored USDC transfer on Solana Devnet</p>
      </header>

      <MetaKeepApp />
    </div>
  );
}
