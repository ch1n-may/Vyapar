// src/components/vyapar-os/LiveTicker.tsx
import React, { useState, useEffect } from "react";
import { sampleEvents } from "../../lib/vyapar-os/constants";

interface EventItem {
  type: string;
  platform: string;
  text: string;
  timeAgo: string;
}

export const LiveTicker: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>(sampleEvents);

  useEffect(() => {
    const interval = setInterval(() => {
      // Rotate list: take first item and move it to the end
      setEvents((prev) => {
        const copy = [...prev];
        const first = copy.shift();
        if (first) copy.push(first);
        return copy;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getDotColor = (type: string) => {
    switch (type) {
      case "order":
        return "var(--accent)";
      case "rto":
        return "var(--red)";
      case "payment":
        return "var(--blue)";
      case "stock":
        return "var(--amber)";
      case "dispute":
        return "var(--red)";
      default:
        return "var(--text-mut)";
    }
  };

  return (
    <div
      style={{
        height: "240px",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--surface)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 15px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span
          style={{
            fontSize: "10px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--text-sec)",
          }}
        >
          ⚡ Live Activity Ticker
        </span>
        {/* Pulsing indicator */}
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: "var(--accent)",
            display: "inline-block",
            animation: "pulse 1.5s infinite ease-in-out",
          }}
        />
        <style>{`
          @keyframes pulse {
            0% { opacity: 0.3; transform: scale(0.9); }
            50% { opacity: 1; transform: scale(1.1); }
            100% { opacity: 0.3; transform: scale(0.9); }
          }
        `}</style>
      </div>

      {/* List */}
      <div
        className="scroll-y"
        style={{
          flex: 1,
          padding: "10px 15px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {events.map((evt, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "11px",
              padding: "4px 0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: getDotColor(evt.type),
                  display: "inline-block",
                }}
              />
              <span style={{ color: "var(--text-pri)" }}>{evt.text}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  fontSize: "9px",
                  padding: "1px 5px",
                  borderRadius: "4px",
                  backgroundColor: "var(--card)",
                  color:
                    evt.platform === "Amazon"
                      ? "var(--amz)"
                      : evt.platform === "Flipkart"
                      ? "var(--flipkart)"
                      : "var(--meesho)",
                }}
              >
                {evt.platform}
              </span>
              <span style={{ color: "var(--text-mut)", fontSize: "9px" }}>
                {evt.timeAgo}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
