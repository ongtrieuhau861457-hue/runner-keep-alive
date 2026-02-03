const { execSync, exec } = require('child_process');
const os = require('os');

// Emoji maps
const EMOJI = {
  clock: '⏰',
  rocket: '🚀',
  check: '✅',
  cross: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  heart: '💓',
  computer: '💻',
  network: '🌐',
  docker: '🐳',
  shield: '🛡️'
};

// Color codes for terminal (cross-platform)
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

/**
 * Execute command safely (cross-platform)
 */
function execCommand(command, silent = true) {
  try {
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit',
      shell: os.platform() === 'win32' ? 'cmd.exe' : '/bin/sh'
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
  const checkCmd = os.platform() === 'win32' 
    ? `where ${command}` 
    : `command -v ${command}`;
  return execCommand(checkCmd).success;
}

/**
 * Get current timestamp
 */
function getTimestamp() {
  return new Date().toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * Health check for Tailscale
 */
function checkTailscale() {
  if (!commandExists('tailscale')) {
    return { available: false, status: 'not_installed' };
  }

  const result = execCommand('tailscale status --json');
  if (!result.success) {
    return { available: true, status: 'error', message: result.error };
  }

  try {
    const status = JSON.parse(result.output);
    return {
      available: true,
      status: status.BackendState || 'unknown',
      details: {
        version: status.Version,
        self: status.Self
      }
    };
  } catch (e) {
    // Fallback to simple status
    const simpleResult = execCommand('tailscale status');
    return {
      available: true,
      status: simpleResult.success ? 'running' : 'stopped'
    };
  }
}

/**
 * Health check for Docker
 */
function checkDocker() {
  if (!commandExists('docker')) {
    return { available: false, status: 'not_installed' };
  }

  const result = execCommand('docker ps --format "{{.ID}}"');
  if (!result.success) {
    return { available: true, status: 'error', message: result.error };
  }

  const containers = result.output.split('\n').filter(Boolean);
  return {
    available: true,
    status: 'running',
    details: {
      containers: containers.length
    }
  };
}

/**
 * Health check for Ngrok
 */
function checkNgrok() {
  if (!commandExists('ngrok')) {
    return { available: false, status: 'not_installed' };
  }

  // Check if ngrok is running
  const psCmd = os.platform() === 'win32'
    ? 'tasklist /FI "IMAGENAME eq ngrok.exe"'
    : 'pgrep -f ngrok';
  
  const result = execCommand(psCmd);
  return {
    available: true,
    status: result.success && result.output ? 'running' : 'stopped'
  };
}

/**
 * Health check for SSH
 */
function checkSSH() {
  const sshCmd = os.platform() === 'win32' ? 'ssh' : 'pgrep -f sshd';
  
  if (!commandExists('ssh')) {
    return { available: false, status: 'not_installed' };
  }

  return {
    available: true,
    status: 'available'
  };
}

/**
 * Get system information
 */
function getSystemInfo() {
  return {
    platform: os.platform(),
    arch: os.arch(),
    hostname: os.hostname(),
    uptime: Math.floor(os.uptime()),
    memory: {
      total: Math.floor(os.totalmem() / 1024 / 1024 / 1024),
      free: Math.floor(os.freemem() / 1024 / 1024 / 1024)
    },
    cpus: os.cpus().length
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
    verbose = false
  } = options;

  const emoji = showEmoji ? EMOJI : {};
  let iteration = 0;

  console.log(`${COLORS.bright}${COLORS.green}
╔════════════════════════════════════════════════════════════════╗
║  ${emoji.rocket || ''} Actions Keep Alive Started                              ║
╔════════════════════════════════════════════════════════════════╝${COLORS.reset}
`);

  // Show configuration
  console.log(`${COLORS.cyan}Configuration:${COLORS.reset}`);
  console.log(`  Interval: ${interval} seconds (${Math.floor(interval / 60)} minutes)`);
  if (services.length > 0) {
    console.log(`  Monitoring: ${services.join(', ')}`);
  }
  console.log(`  Health Checks: ${healthChecks ? 'Enabled' : 'Disabled'}`);
  console.log(`  Verbose: ${verbose ? 'Yes' : 'No'}\n`);

  // Initial system info
  if (verbose) {
    const sysInfo = getSystemInfo();
    console.log(`${COLORS.blue}System Information:${COLORS.reset}`);
    console.log(`  Platform: ${sysInfo.platform} (${sysInfo.arch})`);
    console.log(`  Hostname: ${sysInfo.hostname}`);
    console.log(`  CPUs: ${sysInfo.cpus}`);
    console.log(`  Memory: ${sysInfo.memory.free}GB free / ${sysInfo.memory.total}GB total`);
    console.log(`  Uptime: ${formatUptime(sysInfo.uptime)}\n`);
  }

  // Service checkers map
  const serviceCheckers = {
    tailscale: checkTailscale,
    docker: checkDocker,
    ngrok: checkNgrok,
    ssh: checkSSH
  };

  // Keep alive loop
  const keepAliveLoop = () => {
    iteration++;
    
    const timestamp = showTimestamp ? getTimestamp() : '';
    const prefix = `${emoji.clock || ''} ${timestamp}`;
    const message = customMessage || 'Remote access still running...';
    
    console.log(`${COLORS.bright}${prefix}${COLORS.reset} ${message} (${COLORS.yellow}#${iteration}${COLORS.reset})`);

    // Run health checks
    if (healthChecks) {
      const servicesToCheck = services.length > 0 
        ? services 
        : Object.keys(serviceCheckers);

      servicesToCheck.forEach(service => {
        if (!serviceCheckers[service]) {
          console.log(`   ${emoji.warning || '?'} ${service}: Unknown service`);
          return;
        }

        const checker = serviceCheckers[service];
        const result = checker();

        if (!result.available) {
          if (verbose) {
            console.log(`   ${emoji.info || '-'} ${service}: ${result.status}`);
          }
          return;
        }

        const statusEmoji = result.status.includes('running') || result.status.includes('Running')
          ? (emoji.check || '✓')
          : result.status.includes('error')
          ? (emoji.cross || '✗')
          : (emoji.info || '-');

        const statusColor = result.status.includes('running') || result.status.includes('Running')
          ? COLORS.green
          : result.status.includes('error')
          ? COLORS.red
          : COLORS.yellow;

        let output = `   ${statusEmoji} ${service}: ${statusColor}${result.status}${COLORS.reset}`;

        if (verbose && result.details) {
          const details = Object.entries(result.details)
            .map(([key, value]) => `${key}=${value}`)
            .join(', ');
          output += ` (${details})`;
        }

        console.log(output);
      });
    }

    // Show heartbeat
    if (iteration % 10 === 0) {
      console.log(`   ${emoji.heart || '♥'} Heartbeat: Workflow healthy (${iteration} iterations)`);
    }

    console.log(''); // Empty line for readability
  };

  // Run immediately
  keepAliveLoop();

  // Then run on interval
  const intervalId = setInterval(keepAliveLoop, interval * 1000);

  // Handle graceful shutdown
  const shutdown = (signal) => {
    console.log(`\n${COLORS.yellow}${emoji.warning || '!'} Received ${signal}, shutting down gracefully...${COLORS.reset}`);
    clearInterval(intervalId);
    console.log(`${emoji.check || '✓'} Keep alive stopped. Total iterations: ${iteration}\n`);
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Keep process alive
  process.stdin.resume();
}

module.exports = { keepAlive };
