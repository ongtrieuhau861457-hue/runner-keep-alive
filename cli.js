#!/usr/bin/env node

const { keepAlive } = require('./index');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  interval: 300, // 5 minutes default
  showTimestamp: true,
  showEmoji: true,
  services: [],
  customMessage: null,
  healthChecks: true,
  verbose: false
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  switch (arg) {
    case '--help':
    case '-h':
      console.log(`
╔════════════════════════════════════════════════════════════════╗
║           Actions Keep Alive - Workflow Monitor                ║
╔════════════════════════════════════════════════════════════════╝

USAGE:
  npx actions-keep-alive [options]
  actions-keep-alive [options]

OPTIONS:
  -i, --interval <seconds>      Status update interval (default: 300)
  -m, --message <text>          Custom status message
  -s, --services <list>         Services to monitor (comma-separated)
                                Available: tailscale,docker,ngrok,ssh
  --no-emoji                    Disable emoji in output
  --no-timestamp                Disable timestamp in output
  --no-health                   Disable health checks
  -v, --verbose                 Show detailed information
  -h, --help                    Show this help message

EXAMPLES:
  # Basic usage (keep alive every 5 minutes)
  npx actions-keep-alive

  # Custom interval (every 2 minutes)
  npx actions-keep-alive --interval 120

  # Monitor specific services
  npx actions-keep-alive --services tailscale,docker

  # Custom message with verbose output
  npx actions-keep-alive -m "Building project..." -v

  # Minimal output
  npx actions-keep-alive --no-emoji --no-timestamp

GITHUB ACTIONS USAGE:
  - name: Keep Workflow Alive
    run: npx actions-keep-alive --services tailscale --interval 300

╚════════════════════════════════════════════════════════════════╝
`);
      process.exit(0);
      
    case '--interval':
    case '-i':
      options.interval = parseInt(args[++i], 10) || 300;
      break;
      
    case '--message':
    case '-m':
      options.customMessage = args[++i];
      break;
      
    case '--services':
    case '-s':
      options.services = args[++i].split(',').map(s => s.trim());
      break;
      
    case '--no-emoji':
      options.showEmoji = false;
      break;
      
    case '--no-timestamp':
      options.showTimestamp = false;
      break;
      
    case '--no-health':
      options.healthChecks = false;
      break;
      
    case '--verbose':
    case '-v':
      options.verbose = true;
      break;
  }
}

// Start keep alive
keepAlive(options);
