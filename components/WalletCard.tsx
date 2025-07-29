interface WalletCardProps {
  title: string;
  address: string;
  solBalance: string;
  usdcBalance: string;
  isDeveloper?: boolean;
}

export function WalletCard({
  title,
  address,
  solBalance,
  usdcBalance,
  isDeveloper = false,
}: WalletCardProps) {
  const cardClass = isDeveloper ? "wallet-card developer" : "wallet-card";

  return (
    <div className={cardClass}>
      <h3>{title}</h3>
      <div className="wallet-info">
        <p>
          <strong>Address:</strong> <span>{address}</span>
        </p>
        <p>
          <strong>SOL Balance:</strong> <span>{solBalance}</span>
        </p>
        <p>
          <strong>USDC Balance:</strong> <span>{usdcBalance}</span>
        </p>
      </div>
    </div>
  );
}
