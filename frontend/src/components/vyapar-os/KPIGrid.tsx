// src/components/vyapar-os/KPIGrid.tsx
import React from "react";

interface KPIData {
  label: string;
  value: string;
  delta: string;
  type: "positive" | "warning" | "neutral" | "rto";
}

export const KPIGrid: React.FC = () => {
  const kpiItems: KPIData[] = [
    { label: "TODAY'S SALES", value: "₹45,230", delta: "↑ 12%", type: "positive" },
    { label: "ORDERS", value: "14", delta: "↑ 4", type: "positive" },
    { label: "RTO RISK ORDERS", value: "3", delta: "⚠ HIGH RISK", type: "rto" },
    { label: "PENDING PAYMENTS", value: "₹12,450", delta: "↑ 8%", type: "warning" },
    { label: "LOW STOCK ITEMS", value: "2", delta: "⚠ REORDER NOW", type: "warning" },
    { label: "TODAY'S SETTLEMENT", value: "₹32,180", delta: "COMPLETED", type: "neutral" },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "10px",
        marginBottom: "16px",
      }}
    >
      {kpiItems.map((item, idx) => {
        let deltaColor = "var(--text-mut)";
        if (item.type === "positive") deltaColor = "var(--accent)";
        if (item.type === "warning" || item.type === "rto") deltaColor = "var(--amber)";

        let valueColor = "var(--text-pri)";
        if (item.type === "rto") valueColor = "var(--red)";

        return (
          <div
            key={idx}
            className="kpi-card"
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "90px",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                fontWeight: 500,
                color: "var(--text-sec)",
                letterSpacing: ".06em",
                textTransform: "uppercase",
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginTop: "10px",
              }}
            >
              <span
                style={{
                  fontSize: "24px",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  color: valueColor,
                }}
              >
                {item.value}
              </span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: deltaColor,
                }}
              >
                {item.delta}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
