// src/components/vyapar-os/LiveTicker.tsx
import React, { useState, useEffect } from "react";
import { sampleEvents } from "../../lib/vyapar-os/constants";
import { getWsUrl } from "../../config";

interface EventItem {
  type: string;
  platform: string;
  text: string;
  timeAgo: string;
}

export const LiveTicker: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>(sampleEvents);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let fallbackInterval: any = null;

    const startFallbackRotation = () => {
      if (fallbackInterval) return;
      fallbackInterval = setInterval(() => {
        setEvents((prev) => {
          const copy = [...prev];
          const first = copy.shift();
          if (first) copy.push(first);
          return copy;
        });
      }, 4000);
    };

    const stopFallbackRotation = () => {
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
        fallbackInterval = null;
      }
    };

    const connectWs = () => {
      try {
        ws = new WebSocket(getWsUrl());

        ws.onopen = () => {
          console.log("LiveTicker connected to activity WebSocket");
          setWsConnected(true);
          stopFallbackRotation();
        };

        ws.onmessage = (event) => {
          try {
            const newEvt = JSON.parse(event.data);
            setEvents((prev) => {
              // Prepend new event and limit to 10 items
              const updated = [newEvt, ...prev];
              if (updated.length > 10) {
                updated.pop();
              }
              return updated;
            });
          } catch (e) {
            console.error("Failed to parse socket event:", e);
          }
        };

        ws.onclose = () => {
          console.log("LiveTicker socket closed. Falling back to local rotation.");
          setWsConnected(false);
          startFallbackRotation();
          // Retry connection after 5 seconds
          setTimeout(connectWs, 5000);
        };

        ws.onerror = (err) => {
          console.error("LiveTicker socket error:", err);
          ws?.close();
        };
      } catch (err) {
        console.error("Failed to construct socket connection:", err);
        setWsConnected(false);
        startFallbackRotation();
      }
    };

    connectWs();

    return () => {
      ws?.close();
      stopFallbackRotation();
    };
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
            backgroundColor: wsConnected ? "var(--accent)" : "var(--amber)",
            display: "inline-block",
            animation: "pulse 1.5s infinite ease-in-out",
          }}
          title={wsConnected ? "WebSocket Connected (Realtime updates)" : "Offline (Rotating mock data)"}
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
