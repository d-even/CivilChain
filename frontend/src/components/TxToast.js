import "./TxToast.css";

export default function TxToast({ status, message, txHash, onClose }) {
  if (!status) return null;

  const explorerBase = "https://sepolia.etherscan.io/tx/";

  return (
    <div className={`tx-toast tx-toast--${status}`}>
      <div className="tx-toast__icon">
        {status === "pending" && <span className="tx-spinner" />}
        {status === "success" && <span className="tx-check">✓</span>}
        {status === "error" && <span className="tx-x">✕</span>}
      </div>
      <div className="tx-toast__body">
        <p className="tx-toast__msg">{message}</p>
        {txHash && (
          <a
            href={`${explorerBase}${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="tx-toast__link"
          >
            View on Etherscan →
          </a>
        )}
      </div>
      {onClose && (
        <button className="tx-toast__close" onClick={onClose} type="button">
          ✕
        </button>
      )}
    </div>
  );
}
