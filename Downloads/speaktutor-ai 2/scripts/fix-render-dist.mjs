import fs from "fs";
import path from "path";

const dist = path.resolve("artifacts/speaktutor/dist");
const publicDir = path.join(dist, "public");

if (fs.existsSync(publicDir)) {
  for (const item of fs.readdirSync(publicDir)) {
    fs.cpSync(path.join(publicDir, item), path.join(dist, item), { recursive: true, force: true });
  }
  fs.rmSync(publicDir, { recursive: true, force: true });
}

const index = path.join(dist, "index.html");
if (!fs.existsSync(index)) {
  console.error("ERROR: dist/index.html not found after build");
  process.exit(1);
}

console.log("Render dist fixed: dist/index.html exists");
