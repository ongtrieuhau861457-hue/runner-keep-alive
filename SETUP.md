# 🚀 Setup Guide - Actions Keep Alive Package

## 📦 Files trong package này:

1. **package.json** - NPM package configuration
2. **index.js** - Main keep-alive logic với health checks
3. **cli.js** - Command line interface
4. **test.js** - Test script
5. **README.md** - Documentation (English)
6. **HUONGDAN.md** - Hướng dẫn (Tiếng Việt)
7. **PUBLISHING.md** - Hướng dẫn publish lên NPM
8. **examples-workflow.yml** - Ví dụ GitHub Actions workflows
9. **.gitignore** - Git ignore file

## 🎯 Quick Start (3 bước)

### Bước 1: Dùng ngay (không cần cài đặt)

```bash
# Chạy trực tiếp với npx
npx actions-keep-alive
```

### Bước 2: Hoặc test local

```bash
# Clone/download package này về
cd actions-keep-alive

# Test
node test.js

# Chạy
node cli.js --help
node cli.js --interval 10
```

### Bước 3: Sử dụng trong GitHub Actions

```yaml
- name: Keep Alive
  run: npx actions-keep-alive --interval 300 --services tailscale
```

## 🔧 Cài đặt (Optional)

### Cài đặt từ folder local

```bash
# Trong thư mục package
npm install -g .

# Sau đó dùng global
actions-keep-alive
```

### Publish lên NPM (để người khác dùng)

```bash
# 1. Đăng nhập NPM
npm login

# 2. Publish
npm publish

# 3. Người khác có thể dùng:
npx your-package-name
```

Chi tiết xem file **PUBLISHING.md**

## ✨ Features

✅ **Cross-platform**: Windows, Linux, macOS  
✅ **Service monitoring**: Tailscale, Docker, Ngrok, SSH  
✅ **Customizable**: Interval, messages, emoji, timestamps  
✅ **Verbose mode**: Detailed system info  
✅ **Graceful shutdown**: Ctrl+C handling  
✅ **Beautiful output**: Colors & emojis  

## 📝 Usage Examples

### Basic
```bash
npx actions-keep-alive
```

### Custom interval (2 minutes)
```bash
npx actions-keep-alive --interval 120
```

### Monitor services
```bash
npx actions-keep-alive --services tailscale,docker
```

### Verbose mode
```bash
npx actions-keep-alive --verbose
```

### All options
```bash
npx actions-keep-alive \
  --interval 180 \
  --services tailscale,docker \
  --message "Development session" \
  --verbose
```

## 🎮 GitHub Actions Integration

### Thay thế YAML cũ

**Trước (cũ):**
```yaml
- name: Keep Alive
  run: |
    while true; do
      echo "$(date): Running..."
      sleep 300
    done
```

**Sau (mới):**
```yaml
- name: Keep Alive
  run: npx actions-keep-alive
```

### Full example
```yaml
name: Remote Development

on:
  workflow_dispatch:

jobs:
  remote:
    runs-on: ubuntu-latest
    timeout-minutes: 360
    
    steps:
      - name: Setup Tailscale
        uses: tailscale/github-action@main
        with:
          authkey: ${{ secrets.TAILSCALE_AUTHKEY }}
      
      - name: Keep Alive
        run: |
          npx actions-keep-alive \
            --interval 300 \
            --services tailscale \
            --verbose
```

Xem thêm examples trong file **examples-workflow.yml**

## 🔍 Available Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--interval <seconds>` | `-i` | Update interval | `300` |
| `--message <text>` | `-m` | Custom message | - |
| `--services <list>` | `-s` | Services to monitor | All |
| `--no-emoji` | - | Disable emoji | `false` |
| `--no-timestamp` | - | Disable timestamp | `false` |
| `--no-health` | - | Disable health checks | `false` |
| `--verbose` | `-v` | Show details | `false` |
| `--help` | `-h` | Show help | - |

## 🛠️ Supported Services

- **tailscale** - VPN monitoring
- **docker** - Container status
- **ngrok** - Tunnel monitoring
- **ssh** - SSH availability

## 📱 Platform Support

- ✅ GitHub Actions (Ubuntu, Windows, macOS runners)
- ✅ GitLab CI/CD
- ✅ Azure Pipelines
- ✅ Any CI/CD with Node.js

## 🐛 Troubleshooting

### "node: command not found"
```yaml
# Add Node.js setup step
- uses: actions/setup-node@v3
  with:
    node-version: '18'
```

### Workflow timeout
```yaml
# Increase timeout
jobs:
  job-name:
    timeout-minutes: 360  # 6 hours
```

### Permission errors on Windows
- Run as Administrator
- Use PowerShell

## 📚 Documentation

- **README.md** - English documentation
- **HUONGDAN.md** - Vietnamese guide
- **PUBLISHING.md** - NPM publishing guide
- **examples-workflow.yml** - GitHub Actions examples

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License - Free to use!

## 💡 Tips

1. **Always set timeout**: Make it longer than your session
2. **Use npx**: No installation needed, always latest version
3. **Monitor only what you need**: Faster checks, less output
4. **Use verbose for debugging**: See what's happening
5. **Test locally first**: Run `node test.js` before using

## 📞 Support

- Create an issue on GitHub
- Check documentation files
- Test with `--verbose` flag for debugging

---

**Happy coding! 🎉**

Made with ❤️ for the developer community
