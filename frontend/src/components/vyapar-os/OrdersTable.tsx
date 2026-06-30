// src/components/vyapar-os/OrdersTable.tsx
import React from "react";
import { StatusPill } from "./StatusPill";

interface Order {
  id: string;
  platform: "Amazon" | "Flipkart" | "Meesho" | string;
  product: string;
  amount: string;
  status: "RTO risk" | "Delivered" | "Return" | "Processing" | string;
}

export const OrdersTable: React.FC = () => {
  const orders: Order[] = [
    { id: "OD-98273", platform: "Amazon", product: "Premium Silk Saree (Red)", amount: "₹2,499", status: "Delivered" },
    { id: "OD-47291", platform: "Flipkart", product: "Cotton Kurta (Blue)", amount: "₹1,200", status: "RTO risk" },
    { id: "OD-10928", platform: "Meesho", product: "Designer Jhumka Gold", amount: "₹450", status: "Processing" },
    { id: "OD-38291", platform: "Amazon", product: "Embroidered Lehenga", amount: "₹5,999", status: "Return" },
    { id: "OD-58290", platform: "Meesho", product: "Ethnic Footwear Set", amount: "₹899", status: "Delivered" },
  ];

  const getPlatformStyle = (platform: string) => {
    switch (platform) {
      case "Amazon":
        return { color: "var(--amz)" };
      case "Flipkart":
        return { color: "var(--flipkart)" };
      case "Meesho":
        return { color: "var(--meesho)" };
      default:
        return { color: "var(--text-sec)" };
    }
  };

  return (
    <div
      className="card"
      style={{
        padding: "0",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          fontSize: "11px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--text-sec)",
        }}
      >
        Recent Store Orders
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            <th style={{ padding: "10px 16px", fontSize: "10px", fontWeight: 500, color: "var(--text-mut)", textTransform: "uppercase" }}>Order ID</th>
            <th style={{ padding: "10px 16px", fontSize: "10px", fontWeight: 500, color: "var(--text-mut)", textTransform: "uppercase" }}>Platform</th>
            <th style={{ padding: "10px 16px", fontSize: "10px", fontWeight: 500, color: "var(--text-mut)", textTransform: "uppercase" }}>Product</th>
            <th style={{ padding: "10px 16px", fontSize: "10px", fontWeight: 500, color: "var(--text-mut)", textTransform: "uppercase" }}>Amount</th>
            <th style={{ padding: "10px 16px", fontSize: "10px", fontWeight: 500, color: "var(--text-mut)", textTransform: "uppercase" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, index) => (
            <tr
              key={order.id}
              style={{
                borderBottom: index !== orders.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <td style={{ padding: "10px 16px", fontFamily: "monospace", color: "var(--text-sec)" }}>{order.id}</td>
              <td style={{ padding: "10px 16px", fontSize: "11px", fontWeight: 500, ...getPlatformStyle(order.platform) }}>
                {order.platform}
              </td>
              <td style={{ padding: "10px 16px", color: "var(--text-pri)" }}>{order.product}</td>
              <td style={{ padding: "10px 16px", color: "var(--text-pri)", fontWeight: 500 }}>{order.amount}</td>
              <td style={{ padding: "10px 16px" }}>
                <StatusPill status={order.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
