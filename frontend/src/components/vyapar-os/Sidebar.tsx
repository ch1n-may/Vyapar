// src/components/vyapar-os/Sidebar.tsx
import React from "react";
import { navItems } from "../../lib/vyapar-os/constants";

interface SidebarProps {
  activeSection: string;
  setActiveSection: (sec: string) => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeSection, setActiveSection, onLogout }) => {
  return (
    <div
      className="sidebar"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "240px",
        minWidth: "240px",
        borderRight: "1px solid var(--border)",
        padding: "16px 12px",
        justifyContent: "space-between",
        backgroundColor: "var(--surface)",
      }}
    >
      <div>
        {/* Logo and Name */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "9px",
              backgroundColor: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
            }}
          >
            🚀
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--text-pri)" }}>
              Vyapar OS
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-mut)" }}>
              Your self-running store
            </div>
          </div>
        </div>

        {/* WhatsApp Connected Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "var(--accent-pale)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: "14px",
            padding: "5px 10px",
            marginBottom: "20px",
            marginTop: "10px",
          }}
        >
          <span
            className="pulse-g"
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "var(--accent)",
            }}
          />
          <span style={{ fontSize: "10px", color: "var(--accent)", fontWeight: 500 }}>
            WA Connected: +91 89717 72472
          </span>
        </div>

        {/* Navigation sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <div
              style={{
                fontSize: "9px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: ".08em",
                color: "var(--text-mut)",
                paddingLeft: "12px",
                marginBottom: "8px",
              }}
            >
              Control Layer
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {navItems.map((item) => {
                const isActive = activeSection === item.section;
                return (
                  <button
                    key={item.section}
                    onClick={() => setActiveSection(item.section)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      width: "100%",
                      border: "none",
                      backgroundColor: isActive ? "var(--accent-pale)" : "transparent",
                      color: isActive ? "var(--accent)" : "var(--text-sec)",
                      padding: "8px 12px",
                      borderRadius: "7px",
                      textAlign: "left",
                      cursor: "pointer",
                      fontSize: "12.5px",
                      fontWeight: isActive ? 600 : 400,
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sidebar Tools & User */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Settings & Support triggers */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2px", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
          <button
            onClick={() => setActiveSection("Support")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
              border: "none",
              backgroundColor: activeSection === "Support" ? "var(--accent-pale)" : "transparent",
              color: activeSection === "Support" ? "var(--accent)" : "var(--text-sec)",
              padding: "8px 12px",
              borderRadius: "7px",
              textAlign: "left",
              cursor: "pointer",
              fontSize: "12.5px",
            }}
          >
            <span>🎧</span>
            <span>Support Chat</span>
          </button>
          <button
            onClick={() => setActiveSection("Settings")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
              border: "none",
              backgroundColor: activeSection === "Settings" ? "var(--accent-pale)" : "transparent",
              color: activeSection === "Settings" ? "var(--accent)" : "var(--text-sec)",
              padding: "8px 12px",
              borderRadius: "7px",
              textAlign: "left",
              cursor: "pointer",
              fontSize: "12.5px",
            }}
          >
            <span>⚙️</span>
            <span>Settings</span>
          </button>
        </div>

        {/* User Info Row */}
        <div
          onClick={onLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            borderTop: "1px solid var(--border)",
            paddingTop: "12px",
            cursor: onLogout ? "pointer" : "default"
          }}
          title={onLogout ? "Click to lock dashboard" : ""}
        >
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              backgroundColor: "var(--accent-pale)",
              color: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              fontSize: "11px",
              border: "1px solid rgba(16, 185, 129, 0.2)",
            }}
          >
            VD
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--text-pri)" }}>
              Vijay Dukaandar
            </div>
            <div style={{ fontSize: "9px", color: "var(--text-sec)" }}>
              New Delhi, IN
            </div>
          </div>
          {onLogout && (
            <span style={{ fontSize: "12px", opacity: 0.6 }}>🔒</span>
          )}
        </div>
      </div>
    </div>
  );
};
