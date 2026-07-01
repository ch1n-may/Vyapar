// frontend/src/components/vyapar-os/LockScreen.tsx
import React, { useState } from "react";
import { getApiUrl } from "../../config";

interface LockScreenProps {
  onUnlock: (token: string) => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode) return;

    setIsLoading(true);
    setError(null);

    fetch(getApiUrl("/api/session/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode })
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.error || "Wrong passcode"); });
        }
        return res.json();
      })
      .then(data => {
        setIsLoading(false);
        if (data.success && data.token) {
          onUnlock(data.token);
        }
      })
      .catch(err => {
        setIsLoading(false);
        setError(err.message || "Something went wrong. Please try again.");
        setPasscode("");
      });
  };

  const handleKeyPress = (num: string) => {
    if (passcode.length < 4) {
      setPasscode(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setPasscode(prev => prev.slice(0, -1));
  };

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      backgroundColor: "#09090b",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', sans-serif",
      color: "#f4f4f5"
    }}>
      <div className="glass-panel" style={{
        padding: "36px",
        borderRadius: "14px",
        width: "360px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        alignItems: "center",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)"
      }}>
        {/* Title */}
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{
            fontSize: "36px",
            background: "var(--accent-pale)",
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 10px auto"
          }}>
            🚀
          </div>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-pri)" }}>Vyapar OS Profile Lock</h2>
          <p style={{ fontSize: "11px", color: "var(--text-sec)" }}>Enter store passcode to unlock your workspace</p>
        </div>

        {/* Input indicators */}
        <form onSubmit={handleSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  border: "2px solid var(--border)",
                  backgroundColor: passcode.length > idx ? "var(--accent)" : "transparent",
                  transition: "all 0.15s ease"
                }}
              />
            ))}
          </div>

          {error && (
            <div style={{ fontSize: "11px", color: "var(--red)", textAlign: "center" }}>
              ⚠️ {error}
            </div>
          )}

          {/* Keypad */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
            width: "100%",
            marginTop: "10px"
          }}>
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(num)}
                style={{
                  height: "50px",
                  backgroundColor: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--text-pri)",
                  fontSize: "16px",
                  fontWeight: 500,
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPasscode("")}
              style={{
                height: "50px",
                backgroundColor: "transparent",
                border: "none",
                color: "var(--text-sec)",
                fontSize: "11px",
                cursor: "pointer",
                outline: "none"
              }}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress("0")}
              style={{
                height: "50px",
                backgroundColor: "rgba(255,255,255,0.02)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                color: "var(--text-pri)",
                fontSize: "16px",
                fontWeight: 500,
                cursor: "pointer",
                outline: "none"
              }}
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              style={{
                height: "50px",
                backgroundColor: "transparent",
                border: "none",
                color: "var(--text-sec)",
                fontSize: "16px",
                cursor: "pointer",
                outline: "none"
              }}
            >
              ⌫
            </button>
          </div>

          <button
            type="submit"
            disabled={passcode.length < 4 || isLoading}
            style={{
              width: "100%",
              padding: "10px",
              background: passcode.length < 4 || isLoading ? "var(--border)" : "var(--accent)",
              color: passcode.length < 4 || isLoading ? "var(--text-sec)" : "#000",
              border: "none",
              borderRadius: "6px",
              fontWeight: 600,
              fontSize: "12px",
              cursor: passcode.length < 4 || isLoading ? "not-allowed" : "pointer",
              marginTop: "10px"
            }}
          >
            {isLoading ? "Unlocking..." : "Unlock Dashboard"}
          </button>
        </form>

        <div style={{ fontSize: "10px", color: "var(--text-mut)", textAlign: "center" }}>
          Default passcode is <strong style={{ color: "var(--accent)" }}>1234</strong>
        </div>
      </div>
    </div>
  );
};
