interface StatusSectionProps {
  status: { message: string; type: string };
  transactionInfo: any;
  userSignature?: any;
  developerSignature?: any;
}

export function StatusSection({
  status,
  transactionInfo,
  userSignature,
  developerSignature,
}: StatusSectionProps) {
  return (
    <div className="status-section">
      {status.message && (
        <div className={`status-text ${status.type}`}>{status.message}</div>
      )}

      {userSignature && (
        <div className="signed-message">
          <h4>👤 User A's Signed Message</h4>
          <p className="signature-text">{userSignature.signature}</p>
        </div>
      )}

      {developerSignature && (
        <div className="signed-message">
          <h4>🛠️ Developer's Transaction Signature</h4>
          <p className="signature-text">{developerSignature.signature}</p>
        </div>
      )}

      {transactionInfo && (
        <div className="transaction-info">
          <h4>✅ Transaction Details</h4>
          <p>
            <strong>Transaction ID:</strong>{" "}
            <span>{transactionInfo.signature}</span>
          </p>
          <p>
            <strong>Solscan:</strong>{" "}
            <a
              href={transactionInfo.solscanLink}
              target="_blank"
              rel="noopener noreferrer"
              className="solscan-link"
            >
              View on Solscan
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
