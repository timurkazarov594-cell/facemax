import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import express from "express";
import app from "./app.js";
import { logger } from "./lib/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  const distPublic = path.resolve(__dirname, "../dist/public");
  if (existsSync(distPublic)) {
    app.use(express.static(distPublic));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPublic, "index.html"));
    });
  } else {
    logger.warn("dist/public not found — run `npm run build` first");
  }
}

const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 3000;

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, () => {
  logger.info({ port }, "Voyage server listening");
});
