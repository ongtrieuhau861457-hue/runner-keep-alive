# Actions Keep Alive 🚀

Keep your GitHub Actions workflows alive with health monitoring and status updates.

## Features

✅ Cross-platform support (Windows, Linux, macOS)  
✅ Service health monitoring (Tailscale, Docker, Ngrok, SSH)  
✅ Customizable interval and messages  
✅ Verbose mode for detailed information  
✅ Graceful shutdown handling  
✅ Beautiful console output with colors and emojis  

## Installation

### NPX (No installation required)

```bash
npx actions-keep-alive
```

### Global Installation

```bash
npm install -g actions-keep-alive
```

### Local Installation

```bash
npm install actions-keep-alive
```

## Usage

### Basic Usage

```bash
# Keep alive with default settings (5 minutes interval)
npx actions-keep-alive

# Or if installed globally
actions-keep-alive
```

### Custom Interval

```bash
# Update every 2 minutes (120 seconds)
npx actions-keep-alive --interval 120

# Update every 10 minutes
npx actions-keep-alive -i 600
```

### Monitor Specific Services

```bash
# Monitor Tailscale only
npx actions-keep-alive --services tailscale

# Monitor multiple services
npx actions-keep-alive --services tailscale,docker,ngrok

# Short form
npx actions-keep-alive -s tailscale,docker
```

### Custom Messages

```bash
npx actions-keep-alive --message "Building project..."
npx actions-keep-alive -m "Running tests..."
```

### Verbose Mode

```bash
# Show detailed system and service information
npx actions-keep-alive --verbose
npx actions-keep-alive -v
```

### Minimal Output

```bash
# Disable emoji and timestamps
npx actions-keep-alive --no-emoji --no-timestamp

# Disable health checks
npx actions-keep-alive --no-health
```

### Combined Options

```bash
npx actions-keep-alive \
  --interval 180 \
  --services tailscale,docker \
  --message "Remote development session" \
  --verbose
```

## GitHub Actions Integration

### Example 1: Basic Keep Alive

```yaml
name: Remote Development

on:
  workflow_dispatch:

jobs:
  remote-access:
    runs-on: ubuntu-latest
    steps:
      - name: Setup Tailscale
        uses: tailscale/github-action@main
        with:
          authkey: ${{ secrets.TAILSCALE_AUTHKEY }}
      
      - name: Keep Workflow Alive
        run: npx actions-keep-alive --services tailscale
```

### Example 2: Advanced Configuration

```yaml
name: Development Environment

on:
  workflow_dispatch:
    inputs:
      duration:
        description: 'Keep alive duration (minutes)'
        required: false
        default: '60'

jobs:
  dev-environment:
    runs-on: ubuntu-latest
    timeout-minutes: ${{ github.event.inputs.duration }}
    
    steps:
      - name: Setup Services
        run: |
          # Setup your services here
          # Tailscale, Docker, etc.
          
      - name: Keep Alive with Monitoring
        run: |
          npx actions-keep-alive \
            --interval 300 \
            --services tailscale,docker \
            --message "Dev environment active" \
            --verbose
```

### Example 3: Multi-Service Monitoring

```yaml
name: Full Stack Development

on:
  workflow_dispatch:

jobs:
  development:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Tailscale
        uses: tailscale/github-action@main
        with:
          authkey: ${{ secrets.TAILSCALE_AUTHKEY }}
      
      - name: Start Docker Services
        run: docker-compose up -d
      
      - name: Start Ngrok
        run: ngrok http 3000 &
      
      - name: Keep Everything Alive
        run: |
          npx actions-keep-alive \
            --interval 120 \
            --services tailscale,docker,ngrok \
            --verbose
```

## Options Reference

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--interval <seconds>` | `-i` | Status update interval in seconds | `300` |
| `--message <text>` | `-m` | Custom status message | - |
| `--services <list>` | `-s` | Comma-separated list of services to monitor | All |
| `--no-emoji` | - | Disable emoji in output | `false` |
| `--no-timestamp` | - | Disable timestamp in output | `false` |
| `--no-health` | - | Disable health checks | `false` |
| `--verbose` | `-v` | Show detailed information | `false` |
| `--help` | `-h` | Show help message | - |

## Supported Services

- **Tailscale** - VPN service monitoring
- **Docker** - Container status and count
- **Ngrok** - Tunnel process monitoring
- **SSH** - SSH server availability

## Platform Support

- ✅ Linux (Ubuntu, Debian, CentOS, etc.)
- ✅ Windows (with PowerShell/CMD)
- ✅ macOS
- ✅ GitHub Actions
- ✅ GitLab CI/CD
- ✅ Azure Pipelines
- ✅ Any CI/CD platform with Node.js support

## Output Example

```
╔════════════════════════════════════════════════════════════════╗
║  🚀 Actions Keep Alive Started                              ║
╔════════════════════════════════════════════════════════════════╝

Configuration:
  Interval: 300 seconds (5 minutes)
  Monitoring: tailscale, docker
  Health Checks: Enabled
  Verbose: Yes

System Information:
  Platform: linux (x64)
  Hostname: runner-abc123
  CPUs: 2
  Memory: 5GB free / 7GB total
  Uptime: 2h 15m

⏰ 03/02/2026, 10:30:15 Remote access still running... (#1)
   ✅ tailscale: running (version=1.56.0)
   ✅ docker: running (containers=3)

⏰ 03/02/2026, 10:35:15 Remote access still running... (#2)
   ✅ tailscale: running (version=1.56.0)
   ✅ docker: running (containers=3)
```

## Programmatic Usage

```javascript
const { keepAlive } = require('actions-keep-alive');

keepAlive({
  interval: 300,
  showTimestamp: true,
  showEmoji: true,
  services: ['tailscale', 'docker'],
  customMessage: 'Custom status message',
  healthChecks: true,
  verbose: false
});
```

## Tips

1. **Set appropriate timeout**: Make sure your workflow timeout is longer than your expected session duration
2. **Use verbose mode for debugging**: When setting up, use `-v` to see what's happening
3. **Monitor only needed services**: Specify only the services you actually use for faster checks
4. **Adjust interval based on needs**: Shorter intervals for active monitoring, longer for background tasks

## Troubleshooting

### Command not found errors
Make sure the services you're monitoring are installed and in PATH.

### Permission errors on Windows
Run your terminal as Administrator or use PowerShell.

### GitHub Actions timeout
Set an appropriate `timeout-minutes` in your workflow job.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

Created for the developer community to simplify GitHub Actions workflow management.
