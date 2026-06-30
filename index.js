const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// Mock data
app.get("/api/merchant/:id", (req, res) => {
  res.json({
    id: "msme-001",
    businessName: "Sharma Traders",
    ownerName: "Aman Sharma",
    status: "Active"
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Serve frontend
const distPath = path.join(__dirname, "frontend/dist");
app.use(express.static(distPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

module.exports = app;
