// src/components/vyapar-os/StatusPill.tsx
import React from "react";

interface StatusPillProps {
  status: "RTO risk" | "Delivered" | "Return" | "Processing" | string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
  let style: React.CSSProperties = {};

  switch (status) {
    case "RTO risk":
      style = {
        backgroundColor: "#991b1b",
        color: "#fca5a5",
        border: "1px solid #7f1d1d",
      };
      break;
    case "Delivered":
      style = {
        backgroundColor: "var(--accent-pale)",
        color: "var(--accent)",
        border: "1px solid var(--accent-dim)",
      };
      break;
    case "Return":
      style = {
        backgroundColor: "#1c1400",
        color: "var(--amber)",
        border: "1px solid #78350f",
      };
      break;
    case "Processing":
      style = {
        backgroundColor: "#1e1b4b",
        color: "#a5b4fc",
        border: "1px solid #3730a3",
      };
      break;
    default:
      style = {
        backgroundColor: "var(--card)",
        color: "var(--text-sec)",
        border: "1px solid var(--border)",
      };
  }

  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 8px",
        borderRadius: "14px",
        fontSize: "10px",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        ...style,
      }}
    >
      {status}
    </span>
  );
};
