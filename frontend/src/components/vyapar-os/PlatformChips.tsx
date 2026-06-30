// src/components/vyapar-os/PlatformChips.tsx
import React from "react";

export const PlatformChips: React.FC = () => {
  const channels = [
    { name: "Amazon", color: "var(--amz)" },
    { name: "Flipkart", color: "var(--flipkart)" },
    { name: "Meesho", color: "var(--meesho)" },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        marginBottom: "16px",
      }}
    >
      {channels.map((ch, idx) => (
        <div
          key={idx}
          className="platform-chip"
          style={{
            flex: 1,
            justifyContent: "space-between",
            padding: "8px 12px",
            borderColor: "var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: ch.color,
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-pri)" }}>{ch.name}</span>
          </div>
          <span style={{ fontSize: "9px", color: "var(--text-mut)", textTransform: "uppercase" }}>
            Active
          </span>
        </div>
      ))}
    </div>
  );
};
