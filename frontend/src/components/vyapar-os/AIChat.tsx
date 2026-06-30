import React, { useState, useRef, useEffect } from "react";
import { initMessages } from "../../lib/vyapar-os/constants";
import { getApiUrl } from "../../config";

interface Message {
  from: "ai" | "user";
  text: string;
}

export const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(
    initMessages.map((m) => ({ from: m.from as "ai" | "user", text: m.text }))
  );
  const [inputVal, setInputVal] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const quickReplies = [
    "Confirm Orders",
    "Send Stock Request",
    "Retry Payment",
  ];

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    const newMsg: Message = { from: "user", text };
    setMessages((prev) => [...prev, newMsg]);

    fetch(getApiUrl("/api/chat"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    })
      .then((res) => res.json())
      .then((data) => {
        setMessages((prev) => [...prev, { from: "ai", text: data.reply || "Something went wrong." }]);
      })
      .catch((err) => {
        console.error("Chat error:", err);
        setMessages((prev) => [...prev, { from: "ai", text: "⚠️ Error connecting to server. Please check that backend server is running." }]);
      });
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100% - 240px)",
        borderTop: "1px solid var(--border)",
        backgroundColor: "var(--surface)",
      }}
    >
      {/* Title */}
      <div
        style={{
          padding: "10px 15px",
          borderBottom: "1px solid var(--border)",
          fontSize: "11px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--text-sec)",
        }}
      >
        💬 Vyapar AI Assistant
      </div>

      {/* Messages */}
      <div
        className="scroll-y"
        style={{
          flex: 1,
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {messages.map((msg, idx) => {
          const isBot = msg.from === "ai";
          return (
            <div
              key={idx}
              style={{
                alignSelf: isBot ? "flex-start" : "flex-end",
                maxWidth: "85%",
              }}
            >
              <div
                style={{
                  fontSize: "9px",
                  color: "var(--text-mut)",
                  marginBottom: "2px",
                  textAlign: isBot ? "left" : "right",
                }}
              >
                {isBot ? "Vyapar AI" : "You"}
              </div>
              <div
                style={{
                  backgroundColor: isBot ? "var(--card)" : "var(--accent)",
                  color: isBot ? "var(--text-pri)" : "#000",
                  padding: "8px 12px",
                  borderRadius: "10px",
                  borderBottomLeftRadius: isBot ? "2px" : "10px",
                  borderBottomRightRadius: !isBot ? "2px" : "10px",
                  border: isBot ? "1px solid var(--border)" : "none",
                  fontSize: "12px",
                  lineHeight: "1.6",
                }}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={chatBottomRef} />
      </div>

      {/* Action Chips */}
      <div
        style={{
          padding: "8px 12px",
          display: "flex",
          gap: "6px",
          overflowX: "auto",
          whiteSpace: "nowrap",
          borderTop: "1px solid var(--border)",
        }}
      >
        {quickReplies.map((reply, i) => (
          <button
            key={i}
            className="quick-chip"
            style={{ color: "var(--text-sec)" }}
            onClick={() => handleSend(reply)}
          >
            {reply}
          </button>
        ))}
      </div>

      {/* Input */}
      <div
        style={{
          padding: "10px 12px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          gap: "8px",
        }}
      >
        <input
          type="text"
          placeholder="Ask AI anything (e.g., 'reduce RTO risk')"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSend(inputVal);
              setInputVal("");
            }
          }}
          style={{
            flex: 1,
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "7px",
            color: "var(--text-pri)",
            padding: "8px 12px",
            fontSize: "12px",
            outline: "none",
          }}
        />
        <button
          onClick={() => {
            handleSend(inputVal);
            setInputVal("");
          }}
          style={{
            backgroundColor: "var(--accent)",
            color: "#000",
            border: "none",
            borderRadius: "7px",
            padding: "8px 14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};
