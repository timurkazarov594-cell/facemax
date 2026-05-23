const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const distPath = path.join(__dirname, "dist");
const indexPath = path.join(distPath, "index.html");

app.get("/api/health", (req, res) => {
  res.json({ ok: true, id: crypto.randomUUID() });
});

app.use(express.static(distPath));

app.use(function(req, res) {
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  return res.status(500).send("Build not found: dist/index.html");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Voyage AI running on port " + PORT);
});
