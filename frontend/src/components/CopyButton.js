import "./CopyButton.css";

export default function CopyButton({ text, label = "Copy" }) {
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${label} copied to clipboard!`);
    } catch (err) {
      console.error("Failed to copy:", err);
      alert("Failed to copy to clipboard");
    }
  };

  return (
    <button
      onClick={copyToClipboard}
      className="copy-button"
      title={`Copy ${label.toLowerCase()}`}
    >
      📋
    </button>
  );
}
