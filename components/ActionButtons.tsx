interface ActionButtonsProps {
  onRefreshBalances: () => void;
  onTransferUSDC: () => void;
  disabled?: boolean;
  isTransferring?: boolean;
  hasInsufficientUSDC?: boolean;
}

export function ActionButtons({
  onRefreshBalances,
  onTransferUSDC,
  disabled = false,
  isTransferring = false,
  hasInsufficientUSDC = false,
}: ActionButtonsProps) {
  return (
    <div className="action-section">
      <button
        onClick={onRefreshBalances}
        className="btn btn-secondary"
        disabled={disabled}
      >
        🔄 Refresh Balances
      </button>
      <button
        onClick={onTransferUSDC}
        className="btn btn-primary"
        disabled={disabled || isTransferring || hasInsufficientUSDC}
      >
        {isTransferring
          ? " Transferring..."
          : hasInsufficientUSDC
          ? " Insufficient USDC"
          : ` Transfer ${
              process.env.NEXT_PUBLIC_TRANSFER_AMOUNT || "0.01"
            } USDC (A → B)`}
      </button>
    </div>
  );
}
