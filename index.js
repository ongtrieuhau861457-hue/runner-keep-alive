const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

// Emoji maps
const EMOJI = {
  clock: "⏰",
  rocket: "🚀",
  check: "✅",
  cross: "❌",
  warning: "⚠️",
  info: "ℹ️",
  heart: "💓",
  computer: "💻",
  network: "🌐",
  docker: "🐳",
  shield: "🛡️",
};

// Color codes for terminal (cross-platform)
const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

/**
 * Execute command safely (cross-platform)
 */
function execCommand(command, silent = true) {
  try {
    const output = execSync(command, {
      encoding: "utf8",
      stdio: silent ? "pipe" : "inherit",
      shell: os.platform() === "win32" ? "cmd.exe" : "/bin/sh",
    });
    return { success: true, output: output.trim() };
  } catch (error) {
    return { success: false, output: null, error: error.message };
  }
}

/**
 * Check if command exists (cross-platform)
 */
function commandExists(command) {
  const checkCmd = os.platform() === "win32" ? `where ${command}` : `command -v ${command}`;
  return execCommand(checkCmd).success;
}

/**
 * Get current timestamp
 */
function getTimestamp() {
  return new Date().toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/**
 * Health check for Tailscale
 */
function checkTailscale() {
  if (!commandExists("tailscale")) {
    return { available: false, status: "not_installed" };
  }

  const result = execCommand("tailscale status --json");
  if (!result.success) {
    return { available: true, status: "error", message: result.error };
  }

  try {
    const status = JSON.parse(result.output);
    return {
      available: true,
      status: status.BackendState || "unknown",
      details: {
        version: status.Version,
        self: status.Self,
      },
    };
  } catch (e) {
    // Fallback to simple status
    const simpleResult = execCommand("tailscale status");
    return {
      available: true,
      status: simpleResult.success ? "running" : "stopped",
    };
  }
}

/**
 * Health check for Docker
 */
function checkDocker() {
  if (!commandExists("docker")) {
    return { available: false, status: "not_installed" };
  }

  const result = execCommand('docker ps --format "{{.ID}}"');
  if (!result.success) {
    return { available: true, status: "error", message: result.error };
  }

  const containers = result.output.split("\n").filter(Boolean);
  return {
    available: true,
    status: "running",
    details: {
      containers: containers.length,
    },
  };
}

/**
 * Health check for Ngrok
 */
function checkNgrok() {
  if (!commandExists("ngrok")) {
    return { available: false, status: "not_installed" };
  }

  // Check if ngrok is running
  const psCmd = os.platform() === "win32" ? 'tasklist /FI "IMAGENAME eq ngrok.exe"' : "pgrep -f ngrok";

  const result = execCommand(psCmd);
  return {
    available: true,
    status: result.success && result.output ? "running" : "stopped",
  };
}

/**
 * Health check for SSH
 */
function checkSSH() {
  const sshCmd = os.platform() === "win32" ? "ssh" : "pgrep -f sshd";

  if (!commandExists("ssh")) {
    return { available: false, status: "not_installed" };
  }

  return {
    available: true,
    status: "available",
  };
}

/**
 * Convert bytes to GB
 */
function bytesToGB(bytes) {
  return Math.floor(bytes / 1024 / 1024 / 1024);
}

/**
 * Get disk information for current working directory
 */
function getDiskInfo() {
  try {
    if (typeof fs.statfsSync === "function") {
      const stats = fs.statfsSync(process.cwd());
      const totalBytes = stats.blocks * stats.bsize;
      const freeBytes = (stats.bavail || stats.bfree) * stats.bsize;

      if (Number.isFinite(totalBytes) && totalBytes > 0) {
        return {
          total: bytesToGB(totalBytes),
          free: bytesToGB(freeBytes),
        };
      }
    }
  } catch (error) {
    // Fallback to shell commands below
  }

  if (os.platform() === "win32") {
    const drive = path.parse(process.cwd()).root.replace(/\\/g, "").replace(/\//g, "");
    const result = execCommand(`wmic logicaldisk where "DeviceID='${drive}'" get FreeSpace,Size /value`);

    if (!result.success) {
      return null;
    }

    const freeMatch = result.output.match(/FreeSpace=(\d+)/);
    const totalMatch = result.output.match(/Size=(\d+)/);

    if (!freeMatch || !totalMatch) {
      return null;
    }

    return {
      free: bytesToGB(Number(freeMatch[1])),
      total: bytesToGB(Number(totalMatch[1])),
    };
  }

  const result = execCommand("df -k .");
  if (!result.success) {
    return null;
  }

  const lines = result.output.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    return null;
  }

  const parts = lines[1].trim().split(/\s+/);
  const totalKb = Number(parts[1]);
  const freeKb = Number(parts[3]);

  if (!Number.isFinite(totalKb) || !Number.isFinite(freeKb)) {
    return null;
  }

  return {
    total: bytesToGB(totalKb * 1024),
    free: bytesToGB(freeKb * 1024),
  };
}

/**
 * Get all non-internal IP addresses
 */
function getIPAddresses() {
  const networkInterfaces = os.networkInterfaces();
  const ips = new Set();

  Object.values(networkInterfaces).forEach((entries) => {
    (entries || []).forEach((entry) => {
      if (!entry || entry.internal || !entry.address) {
        return;
      }
      ips.add(entry.address);
    });
  });

  return Array.from(ips).sort();
}

/**
 * Build a directory tree for the current working directory
 */
function getDirectoryTree(rootPath = process.cwd(), maxDepth = 2, maxEntries = 120) {
  let entryCount = 0;
  let truncated = false;
  const ignoredNames = new Set([".git"]);

  const walk = (currentPath, prefix, depth) => {
    if (depth > maxDepth || truncated) {
      return [];
    }

    let entries = [];
    try {
      entries = fs
        .readdirSync(currentPath, { withFileTypes: true })
        .filter((entry) => !ignoredNames.has(entry.name))
        .sort((a, b) => {
          if (a.isDirectory() && !b.isDirectory()) {
            return -1;
          }
          if (!a.isDirectory() && b.isDirectory()) {
            return 1;
          }
          return a.name.localeCompare(b.name);
        });
    } catch (error) {
      return [`${prefix}└── [permission denied]`];
    }

    const lines = [];
    for (let i = 0; i < entries.length; i++) {
      if (entryCount >= maxEntries) {
        truncated = true;
        break;
      }

      const entry = entries[i];
      entryCount++;
      const isLast = i === entries.length - 1;
      const connector = isLast ? "└── " : "├── ";
      lines.push(`${prefix}${connector}${entry.name}${entry.isDirectory() ? "/" : ""}`);

      if (entry.isDirectory() && depth < maxDepth && !truncated) {
        const childPrefix = `${prefix}${isLast ? "    " : "│   "}`;
        const childLines = walk(path.join(currentPath, entry.name), childPrefix, depth + 1);
        lines.push(...childLines);
      }
    }

    return lines;
  };

  const rootName = path.basename(rootPath) || rootPath;
  const treeLines = [`${rootName}/`, ...walk(rootPath, "", 0)];
  if (truncated) {
    treeLines.push("... (tree truncated)");
  }

  return treeLines.join("\n");
}

/**
 * Get recent Docker logs using interval seconds
 */
function getDockerRecentLogs(intervalSeconds) {
  if (!commandExists("docker")) {
    return {
      available: false,
      error: "docker_not_installed",
      output: null,
    };
  }

  const safeInterval = Number.isFinite(intervalSeconds) && intervalSeconds > 0 ? Math.floor(intervalSeconds) : 300;
  const composeCommand = `docker compose logs --since ${safeInterval}s --no-color`;
  const composeResult = execCommand(composeCommand);

  if (composeResult.success) {
    return {
      available: true,
      source: "compose",
      output: composeResult.output,
      composeCommand,
    };
  }

  // Fallback: show logs for all currently running containers
  const containersResult = execCommand('docker ps --format "{{.Names}}"');
  if (!containersResult.success) {
    return {
      available: false,
      error: composeResult.error,
      output: null,
      composeCommand,
    };
  }

  const containerNames = containersResult.output
    .split("\n")
    .map((name) => name.trim())
    .filter(Boolean);

  if (containerNames.length === 0) {
    return {
      available: true,
      source: "docker",
      output: "",
      composeCommand,
      composeError: composeResult.error,
    };
  }

  const logs = [];
  containerNames.forEach((containerName) => {
    const containerResult = execCommand(`docker logs --since ${safeInterval}s --timestamps ${containerName}`);
    if (!containerResult.success || !containerResult.output) {
      return;
    }

    logs.push(`[${containerName}]`);
    logs.push(containerResult.output);
  });

  return {
    available: true,
    source: "docker",
    output: logs.join("\n").trim(),
    composeCommand,
    composeError: composeResult.error,
  };
}

/**
 * Get system information
 */
function getSystemInfo() {
  const cwd = process.cwd();
  return {
    platform: os.platform(),
    arch: os.arch(),
    hostname: os.hostname(),
    cwd,
    uptime: Math.floor(os.uptime()),
    memory: {
      total: Math.floor(os.totalmem() / 1024 / 1024 / 1024),
      free: Math.floor(os.freemem() / 1024 / 1024 / 1024),
    },
    disk: getDiskInfo(),
    ips: getIPAddresses(),
    tree: getDirectoryTree(cwd),
    cpus: os.cpus().length,
  };
}

/**
 * Format uptime
 */
function formatUptime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

/**
 * Main keep alive function
 */
function keepAlive(options = {}) {
  const {
    interval = 300,
    showTimestamp = true,
    showEmoji = true,
    services = [],
    customMessage = null,
    healthChecks = true,
    verbose = false,
  } = options;

  const emoji = showEmoji ? EMOJI : {};
  let iteration = 0;

  console.log(`${COLORS.bright}${COLORS.green}
╔════════════════════════════════════════════════════════════════╗
║  ${emoji.rocket || ""} Actions Keep Alive Started                              ║
╔════════════════════════════════════════════════════════════════╝${COLORS.reset}
`);

  // Show configuration
  console.log(`${COLORS.cyan}Configuration:${COLORS.reset}`);
  console.log(`  Interval: ${interval} seconds (${Math.floor(interval / 60)} minutes)`);
  if (services.length > 0) {
    console.log(`  Monitoring: ${services.join(", ")}`);
  }
  console.log(`  Health Checks: ${healthChecks ? "Enabled" : "Disabled"}`);
  console.log(`  Verbose: ${verbose ? "Yes" : "No"}\n`);

  // Initial system info
  if (true || verbose) {
    const sysInfo = getSystemInfo();
    console.log(`${COLORS.blue}System Information:${COLORS.reset}`);
    console.log(`  Platform: ${sysInfo.platform} (${sysInfo.arch})`);
    console.log(`  Hostname: ${sysInfo.hostname}`);
    console.log(`  CWD: ${sysInfo.cwd}`);
    console.log(`  CPUs: ${sysInfo.cpus}`);
    console.log(`  Memory: ${sysInfo.memory.free}GB free / ${sysInfo.memory.total}GB total`);
    if (sysInfo.disk) {
      console.log(`  Disk: ${sysInfo.disk.free}GB free / ${sysInfo.disk.total}GB total`);
    } else {
      console.log("  Disk: unavailable");
    }
    console.log(`  IPs: ${sysInfo.ips.length > 0 ? sysInfo.ips.join(", ") : "none"}`);
    console.log(`  Uptime: ${formatUptime(sysInfo.uptime)}\n`);
    console.log("  CWD Tree:");
    sysInfo.tree.split("\n").forEach((line) => {
      console.log(`    ${line}`);
    });
    console.log("");
  }

  // Service checkers map
  const serviceCheckers = {
    tailscale: checkTailscale,
    docker: checkDocker,
    ngrok: checkNgrok,
    ssh: checkSSH,
  };

  // Keep alive loop
  const keepAliveLoop = () => {
    iteration++;

    const timestamp = showTimestamp ? getTimestamp() : "";
    const prefix = `${emoji.clock || ""} ${timestamp}`;
    const message = customMessage || "Remote access still running...";

    console.log(`${COLORS.bright}${prefix}${COLORS.reset} ${message} (${COLORS.yellow}#${iteration}${COLORS.reset})`);

    // Run health checks
    if (healthChecks) {
      const servicesToCheck = services.length > 0 ? services : Object.keys(serviceCheckers);

      servicesToCheck.forEach((service) => {
        if (!serviceCheckers[service]) {
          console.log(`   ${emoji.warning || "?"} ${service}: Unknown service`);
          return;
        }

        const checker = serviceCheckers[service];
        const result = checker();
        const normalizedStatus = String(result.status || "").toLowerCase();

        if (!result.available) {
          if (verbose) {
            console.log(`   ${emoji.info || "-"} ${service}: ${result.status}`);
          }
          return;
        }

        const statusEmoji =
          normalizedStatus.includes("running")
            ? emoji.check || "✓"
            : normalizedStatus.includes("error")
              ? emoji.cross || "✗"
              : emoji.info || "-";

        const statusColor =
          normalizedStatus.includes("running")
            ? COLORS.green
            : normalizedStatus.includes("error")
              ? COLORS.red
              : COLORS.yellow;

        let output = `   ${statusEmoji} ${service}: ${statusColor}${result.status}${COLORS.reset}`;

        if (verbose && result.details) {
          const details = Object.entries(result.details)
            .map(([key, value]) => `${key}=${value}`)
            .join(", ");
          output += ` (${details})`;
        }

        console.log(output);

        if (service === "docker" && normalizedStatus.includes("running")) {
          const dockerLogs = getDockerRecentLogs(interval);
          console.log(`   ${emoji.docker || ""} docker compose logs --since ${interval}s:`);

          if (!dockerLogs.available) {
            console.log(`      ${emoji.warning || "!"} Unable to fetch docker logs`);
            if (verbose && dockerLogs.error) {
              console.log(`      ${dockerLogs.error}`);
            }
            return;
          }

          if (!dockerLogs.output) {
            console.log("      (No new logs)");
          } else {
            dockerLogs.output.split(/\r?\n/).forEach((line) => {
              console.log(`      ${line}`);
            });
          }

          if (verbose && dockerLogs.source === "docker" && dockerLogs.composeError) {
            console.log(`      ${emoji.info || "-"} docker compose unavailable, used docker logs fallback`);
          }
        }
      });
    }

    // Show heartbeat
    if (iteration % 10 === 0) {
      console.log(`   ${emoji.heart || "♥"} Heartbeat: Workflow healthy (${iteration} iterations)`);
    }

    console.log(""); // Empty line for readability
  };

  // Run immediately
  keepAliveLoop();

  // Then run on interval
  const intervalId = setInterval(keepAliveLoop, interval * 1000);

  // Handle graceful shutdown
  const shutdown = (signal) => {
    console.log(`\n${COLORS.yellow}${emoji.warning || "!"} Received ${signal}, shutting down gracefully...${COLORS.reset}`);
    clearInterval(intervalId);
    console.log(`${emoji.check || "✓"} Keep alive stopped. Total iterations: ${iteration}\n`);
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  // Keep process alive
  process.stdin.resume();
}

module.exports = { keepAlive };
