import "./StatusBadge.css";

export default function StatusBadge({ status, uppercase = false }) {
  const getStatusDisplay = (status) => {
    const statusNum = Number(status);
    switch (statusNum) {
      case 0:
        return { text: "Under review", icon: "🔵", class: "status-review" };
      case 1:
        return { text: "Completed", icon: "✅", class: "status-completed" };
      case 2:
        return { text: "Rejected", icon: "🔶", class: "status-rejected" };
      default:
        return { text: "Unknown", icon: "❓", class: "status-unknown" };
    }
  };

  const statusInfo = getStatusDisplay(status);
  const displayText = uppercase ? statusInfo.text.toUpperCase() : statusInfo.text;

  return (
    <span className={`status-badge ${statusInfo.class}`}>
      <span className="status-icon">{statusInfo.icon}</span>
      <span className="status-text">{displayText}</span>
    </span>
  );
}
