# Hướng dẫn nhanh - Actions Keep Alive 🇻🇳

## Cài đặt và sử dụng

### Cách 1: Dùng trực tiếp với NPX (Khuyến nghị)

```bash
# Chạy ngay không cần cài đặt
npx actions-keep-alive

# Với tùy chọn
npx actions-keep-alive --interval 120 --services tailscale,docker
```

### Cách 2: Cài đặt global

```bash
# Cài đặt
npm install -g actions-keep-alive

# Chạy
actions-keep-alive
# hoặc
aka  # short command
```

## Tích hợp vào GitHub Actions

### Ví dụ đơn giản - Thay thế YAML cũ của bạn

**YAML cũ:**
```yaml
- name: ⏳ Keep Alive
  run: |
    while true; do
      echo "⏰ $(date): Remote access still running..."
      sleep 300
    done
```

**YAML mới (đơn giản hơn):**
```yaml
- name: ⏳ Keep Alive
  run: npx actions-keep-alive
```

### Ví dụ với monitoring services

```yaml
- name: ⏳ Keep Alive với Tailscale
  run: npx actions-keep-alive --services tailscale --interval 300 --verbose
```

### Ví dụ đầy đủ

```yaml
name: Remote Development

on:
  workflow_dispatch:

jobs:
  remote:
    runs-on: ubuntu-latest
    timeout-minutes: 360  # 6 giờ
    
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
            --message "Remote session đang chạy..." \
            --verbose
```

## Các tùy chọn thường dùng

```bash
# Interval 2 phút thay vì 5 phút
npx actions-keep-alive --interval 120

# Monitor nhiều services
npx actions-keep-alive --services tailscale,docker,ngrok

# Hiển thị chi tiết
npx actions-keep-alive --verbose

# Tắt emoji (cho Windows terminal cũ)
npx actions-keep-alive --no-emoji

# Kết hợp nhiều options
npx actions-keep-alive -i 180 -s tailscale,docker -v
```

## Các services được hỗ trợ

- ✅ **tailscale** - VPN service
- ✅ **docker** - Docker containers
- ✅ **ngrok** - Tunneling service
- ✅ **ssh** - SSH server

## Ví dụ output

```
╔════════════════════════════════════════════════════════════════╗
║  🚀 Actions Keep Alive Started                              ║
╔════════════════════════════════════════════════════════════════╝

Configuration:
  Interval: 300 seconds (5 minutes)
  Monitoring: tailscale
  Health Checks: Enabled
  Verbose: Yes

⏰ 03/02/2026, 10:30:15 Remote access still running... (#1)
   ✅ tailscale: Running

⏰ 03/02/2026, 10:35:15 Remote access still running... (#2)
   ✅ tailscale: Running
   💓 Heartbeat: Workflow healthy
```

## Publishing lên NPM (nếu muốn)

```bash
# 1. Đăng nhập NPM
npm login

# 2. Publish
npm publish

# 3. Sau đó người khác có thể dùng:
npx your-package-name
```

## Troubleshooting

### Lỗi "command not found"
- Đảm bảo Node.js đã được cài đặt
- Trong GitHub Actions, thêm step setup Node.js

### Lỗi permission trên Windows
- Chạy terminal với quyền Administrator
- Hoặc dùng PowerShell

### Workflow bị timeout
- Tăng `timeout-minutes` trong job config
- Ví dụ: `timeout-minutes: 360` cho 6 giờ

## Tips

1. **Dùng npx**: Không cần cài đặt, luôn dùng version mới nhất
2. **Set timeout phù hợp**: Đảm bảo timeout lớn hơn thời gian cần
3. **Chỉ monitor services cần thiết**: Nhanh hơn và ít log hơn
4. **Dùng verbose khi debug**: Xem được nhiều thông tin hơn

## Liên hệ & Đóng góp

Nếu gặp lỗi hoặc muốn thêm tính năng, hãy tạo issue trên GitHub!
