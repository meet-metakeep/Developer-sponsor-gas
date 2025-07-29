"use client";

import { useEffect, useState } from "react";
import { WalletCard } from "./WalletCard";
import { ActionButtons } from "./ActionButtons";
import { StatusSection } from "./StatusSection";
import { useMetaKeepSDK } from "@/hooks/useMetaKeepSDK";
import { useSolanaConnection } from "@/hooks/useSolanaConnection";
import { useWalletBalances } from "@/hooks/useWalletBalances";
import { useTransfer } from "@/hooks/useTransfer";

export function MetaKeepApp() {
  const {
    sdk,
    userAWallet,
    userBWallet,
    devWallet,
    isInitializing,
    initializeWallets,
  } = useMetaKeepSDK();
  const { connection, initializeConnection } = useSolanaConnection();
  const { balances, refreshBalances } = useWalletBalances();
  const { transferUSDC, transferState } = useTransfer();
  const [status, setStatus] = useState({ message: "", type: "info" });
  const [transactionInfo, setTransactionInfo] = useState<any>(null);
  const [userSignature, setUserSignature] = useState<any>(null);
  const [developerSignature, setDeveloperSignature] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasInsufficientUSDC, setHasInsufficientUSDC] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  // Refresh balances when wallets are available
  useEffect(() => {
    if (userBWallet && devWallet && isInitialized) {
      console.log("Wallets available, refreshing balances...");
      // Small delay to ensure everything is properly initialized
      setTimeout(() => {
        refreshBalances(userAWallet, userBWallet, devWallet);
      }, 500);
    }
  }, [userAWallet, userBWallet, devWallet, isInitialized]);

  // Check USDC balance when balances are updated
  useEffect(() => {
    const bal = balances.userA?.usdc;
    const transferAmount =
      Number(process.env.NEXT_PUBLIC_TRANSFER_AMOUNT) || 0.01;
    let insufficient = true;
    if (bal && !isNaN(parseFloat(bal))) {
      const usdcBalance = parseFloat(bal.replace(" USDC", ""));
      insufficient = usdcBalance < transferAmount;
    }
    setHasInsufficientUSDC(insufficient);
    if (insufficient && bal && bal !== "Loading..." && bal !== "Error") {
      setStatus({
        message:
          "User A has insufficient USDC on devnet. Please fund this wallet with devnet USDC to see the demo in action.",
        type: "warning",
      });
    }
  }, [balances.userA?.usdc]);

  const initializeApp = async () => {
    try {
      setStatus({
        message: "Initializing MetaKeep SDK and Solana connection...",
        type: "info",
      });

      // Initialize Solana connection first
      await initializeConnection();

      // Initialize wallets
      await initializeWallets();

      setIsInitialized(true);
      setStatus({ message: "", type: "info" });
    } catch (error) {
      console.error("Initialization error:", error);
      setStatus({
        message: `Initialization failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        type: "error",
      });
      // Don't mark as initialized if there's a critical error
      setIsInitialized(false);
    }
  };

  const handleRefreshBalances = async () => {
    try {
      setStatus({ message: "Refreshing balances...", type: "info" });
      await refreshBalances(userAWallet, userBWallet, devWallet);
      setStatus({
        message: "Balances refreshed successfully!",
        type: "success",
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setStatus({ message: "", type: "info" });
      }, 3000);
    } catch (error) {
      console.error("Balance refresh error:", error);
      setStatus({
        message: `Failed to refresh balances: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        type: "error",
      });

      // Clear error message after 5 seconds
      setTimeout(() => {
        setStatus({ message: "", type: "info" });
      }, 5000);
    }
  };

  const handleTransferUSDC = async () => {
    try {
      if (!connection || !sdk || !userBWallet || !devWallet) {
        setStatus({
          message: "Missing required wallet or connection information",
          type: "error",
        });
        return;
      }

      if (!userAWallet) {
        setStatus({
          message:
            "User A wallet not available. Please initialize MetaKeep wallet first.",
          type: "error",
        });
        return;
      }

      if (hasInsufficientUSDC) {
        setStatus({
          message:
            "User A has insufficient USDC on devnet. Please fund this wallet with devnet USDC to see the demo in action.",
          type: "error",
        });
        return;
      }

      setStatus({
        message: "Starting USDC transfer...",
        type: "info",
      });

      const result = await transferUSDC(
        connection,
        sdk,
        userAWallet,
        userBWallet,
        devWallet,
        Number(process.env.NEXT_PUBLIC_TRANSFER_AMOUNT) || 0.01
      );

      if (result.success) {
        setStatus({
          message: `Transfer successful! Transaction: ${result.signature}`,
          type: "success",
        });

        setTransactionInfo({
          signature: result.signature,
          solscanLink: `https://solscan.io/tx/${result.signature}?cluster=devnet`,
        });

        // Set signature information
        setUserSignature(result.userSignature);
        setDeveloperSignature(result.developerSignature);

        // Refresh balances after successful transfer
        setTimeout(async () => {
          await refreshBalances(userAWallet, userBWallet, devWallet);
        }, 2000);

        // Clear success message after 5 seconds
        setTimeout(() => {
          setStatus({ message: "", type: "info" });
        }, 5000);
      }
    } catch (error) {
      console.error("Transfer error:", error);
      setStatus({
        message: `Transfer failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        type: "error",
      });

      // Clear error message after 5 seconds
      setTimeout(() => {
        setStatus({ message: "", type: "info" });
      }, 5000);
    }
  };

  return (
    <>
      <div className="wallet-section">
        <WalletCard
          title="👤 User A"
          address={userAWallet || "Loading..."}
          solBalance={balances.userA?.sol || "Loading..."}
          usdcBalance={balances.userA?.usdc || "Loading..."}
        />

        <WalletCard
          title="👤 User B"
          address={userBWallet || "Loading..."}
          solBalance={balances.userB?.sol || "Loading..."}
          usdcBalance={balances.userB?.usdc || "Loading..."}
        />

        <WalletCard
          title="🛠️ Developer Wallet"
          address={devWallet || "Loading..."}
          solBalance={balances.dev?.sol || "Loading..."}
          usdcBalance={balances.dev?.usdc || "Loading..."}
          isDeveloper={true}
        />
      </div>

      <ActionButtons
        onRefreshBalances={handleRefreshBalances}
        onTransferUSDC={handleTransferUSDC}
        disabled={isInitializing}
        isTransferring={transferState.isTransferring}
        hasInsufficientUSDC={hasInsufficientUSDC}
      />

      <StatusSection
        status={status}
        transactionInfo={transactionInfo}
        userSignature={userSignature}
        developerSignature={developerSignature}
      />
    </>
  );
}
