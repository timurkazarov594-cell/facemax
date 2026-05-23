const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const distPath = path.join(__dirname, "dist");
const indexPath = path.join(distPath, "index.html");

app.use(express.static(distPath));

app.use((req, res) => {
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(500).send("Build not found: dist/index.html");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Voyage AI running on port " + PORT);
});
