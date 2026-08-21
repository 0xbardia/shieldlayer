// Load .env.local at config-parse time so PM2 env blocks can reference its values
const fs = require("fs");
const path = require("path");
const envPath = path.join(__dirname, ".env.local");
const envVars = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8")
    .split("\n")
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const idx = trimmed.indexOf("=");
      if (idx === -1) return;
      envVars[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    });
}

module.exports = {
  apps: [
    {
      name: "shieldlayer-api",
      script: "python3",
      args: "-m uvicorn api.index:app --host 0.0.0.0 --port 8787",
      interpreter: "none",
      cwd: "/root/shieldlayer",
      env_file: "/root/shieldlayer/.env.local",
      env: {
        PYTHONPATH: ".",
        GENLAYER_LOCAL_MODE: "0",
        GENLAYER_CHAIN_ID: "61999",
        GENLAYER_RPC_URL: "https://studio.genlayer.com/api",
        PUBLIC_CONTRACT_ADDRESS: envVars.PUBLIC_CONTRACT_ADDRESS || "",
        REDIS_URL: envVars.REDIS_URL || process.env.REDIS_URL || "redis://localhost:6379/0",
        TRUSTED_PROXIES: "127.0.0.1,::1",
        CORS_ORIGINS:
          "http://localhost:3456,http://127.0.0.1:3456",
      },
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "500M",
      error_file: "./logs/api-error.log",
      out_file: "./logs/api-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      watch: false,
      max_restarts: 10,
      restart_delay: 4000,
    },
    {
      name: "shieldlayer-frontend",
      script: "npm",
      args: "run start",
      cwd: "/root/shieldlayer",
      env: {
        PORT: 3456,
        HOST: "0.0.0.0",
        NODE_ENV: "production",
        API_INTERNAL_URL: "http://127.0.0.1:8787",
        NEXT_PUBLIC_CONTRACT_ADDRESS: envVars.PUBLIC_CONTRACT_ADDRESS || "",
        NEXT_PUBLIC_GENLAYER_CHAIN_ID: "61999",
        NEXT_PUBLIC_CHAIN_ID: "61999",
      },
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "1G",
      error_file: "./logs/frontend-error.log",
      out_file: "./logs/frontend-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      watch: false,
    },
  ],
};
