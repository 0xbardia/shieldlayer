#!/usr/bin/env node
/**
 * Start Python API + Next.js. Pick a free web port (3456 → 4173 → 8080 → random).
 */
const { spawn, execSync } = require("child_process");
const net = require("net");
const path = require("path");
const fs = require("fs");

const root = path.join(__dirname, "..");

function canListen(port) {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once("error", () => resolve(false));
    s.once("listening", () => s.close(() => resolve(true)));
    s.listen(port, "0.0.0.0");
  });
}

async function pickPort(candidates) {
  for (const p of candidates) {
    if (await canListen(p)) return p;
  }
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.listen(0, "0.0.0.0", () => {
      const p = s.address().port;
      s.close(() => resolve(p));
    });
    s.on("error", reject);
  });
}

function loadEnv() {
  const file = path.join(root, ".env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

async function main() {
  loadEnv();
  const webPort = await pickPort([3456, 4173, 8080, 3000]);
  const apiPort = await pickPort([8787, 8788, 8790]);
  process.env.PORT = String(webPort);
  process.env.API_PORT = String(apiPort);
  process.env.API_INTERNAL_URL = `http://127.0.0.1:${apiPort}`;

  fs.writeFileSync(path.join(root, ".dev-ports.json"), JSON.stringify({ webPort, apiPort }));

  console.log(`🚀 Server running at http://localhost:${webPort}`);
  console.log(`   API         at http://localhost:${apiPort}`);

  const api = spawn("python3", ["api/server.py"], {
    cwd: root,
    env: process.env,
    stdio: "inherit",
  });
  const next = spawn("npx", ["next", "dev", "-p", String(webPort)], {
    cwd: root,
    env: process.env,
    stdio: "inherit",
  });

  const shutdown = () => {
    api.kill("SIGTERM");
    next.kill("SIGTERM");
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  api.on("exit", (c) => {
    if (c && c !== 0) console.error("API exited", c);
  });
  next.on("exit", (c) => process.exit(c ?? 0));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
