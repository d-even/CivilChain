import "./TransactionCard.css";

export default function TransactionCard({ 
  title, 
  statusBadge, 
  txHash, 
  detailRows, 
  onCopy 
}) {
  return (
    <div className="transaction-card">
      <div className="transaction-header">
        <span className="transaction-label">{title}</span>
        {statusBadge}
      </div>
      
      <div className="transaction-details">
        {detailRows.map((row, index) => (
          <div key={index} className="transaction-detail-row">
            <span className="transaction-detail-label">{row.label}</span>
            {row.render ? (
              row.render()
            ) : (
              <span className="transaction-detail-value">{row.value}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
