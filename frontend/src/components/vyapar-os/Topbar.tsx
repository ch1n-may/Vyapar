// src/components/vyapar-os/Topbar.tsx
import React from "react";

interface TopbarProps {
  onAskAI: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onAskAI }) => {
  // Format English Date
  const getEnglishDate = () => {
    const today = new Date();
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return `${days[today.getDay()]}, ${months[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`;
  };

  return (
    <div
      style={{
        height: "50px",
        backgroundColor: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <h1 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-pri)" }}>
          Welcome back 👋
        </h1>
        <span style={{ fontSize: "11px", color: "var(--text-mut)" }}>|</span>
        <span style={{ fontSize: "11px", color: "var(--text-sec)" }}>
          {getEnglishDate()}
        </span>
      </div>

      <button
        onClick={onAskAI}
        style={{
          backgroundColor: "var(--accent)",
          color: "#0d0d0d",
          border: "none",
          borderRadius: "7px",
          padding: "6px 14px",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span>💬</span> Ask Vyapar AI
      </button>
    </div>
  );
};
