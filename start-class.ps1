# Mở DSA Visualizer cho cả lớp dùng, chạy ngay trên máy này.
#
#   1. Build và chạy app trong Docker (có sandbox: code sinh viên không đụng được tới máy bạn).
#   2. Lần đầu (và mỗi khi code thay đổi) chạy selftest để chắc mọi ngôn ngữ và sandbox đều ổn.
#   3. Mở đường hầm Cloudflare miễn phí -> link https://....trycloudflare.com cho sinh viên.
#   4. Mở một trang có link + mã QR để chiếu lên màn hình.
#
# Cách dùng: bấm đúp start-class.bat. Nhấn Enter (hoặc Ctrl+C) trong cửa sổ để kết thúc buổi học.
# Tùy chọn (chạy từ PowerShell):  .\start-class.ps1 -Port 8080 -MaxRuns 6 -NoTunnel -ForceTest

param(
  [int]$Port = 8080,        # cổng trên máy bạn
  [int]$MaxRuns = 6,        # số lượt chạy code cùng lúc, còn lại xếp hàng
  [switch]$NoTunnel,        # chỉ dùng mạng LAN, không mở đường hầm Cloudflare
  [switch]$ForceTest        # luôn chạy selftest, kể cả khi code không đổi
)

$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
Set-Location -LiteralPath $PSScriptRoot

$Image = 'dsa-visualizer'
$Container = 'dsa-class'
$StateDir = Join-Path $env:LOCALAPPDATA 'dsa-visualizer'
New-Item -ItemType Directory -Force -Path $StateDir | Out-Null
$Host.UI.RawUI.WindowTitle = 'DSA Visualizer - Lớp học'

function Step([string]$Message) { Write-Host "`n==> $Message" -ForegroundColor Cyan }
function Warn([string]$Message) { Write-Host $Message -ForegroundColor Yellow }
function Fail([string]$Message) {
  Write-Host "`nLỖI: $Message" -ForegroundColor Red
  Read-Host "`nNhấn Enter để đóng"
  exit 1
}
function Test-DockerReady { docker info *> $null; return ($LASTEXITCODE -eq 0) }

# ---------------------------------------------------------------- 1. Docker
Step 'Kiểm tra Docker Desktop'
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Fail ('Chưa cài Docker Desktop. Tải tại https://www.docker.com/products/docker-desktop/ , ' +
        'cài xong khởi động lại máy rồi chạy lại file này.')
}
if (-not (Test-DockerReady)) {
  $desktop = Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'
  if (Test-Path $desktop) { Start-Process $desktop }
  Write-Host 'Đang chờ Docker Desktop khởi động (tối đa 3 phút)...'
  $ready = $false
  for ($i = 0; $i -lt 60 -and -not $ready; $i++) { Start-Sleep -Seconds 3; $ready = Test-DockerReady }
  if (-not $ready) { Fail 'Docker Desktop chưa chạy. Mở Docker Desktop, chờ báo "Engine running" rồi chạy lại.' }
}
Write-Host 'Docker đã sẵn sàng.'

# ---------------------------------------------------------------- 2. Build
Step 'Build image (lần đầu mất 5-10 phút để tải Python, g++, JDK; các lần sau chỉ vài giây)'
docker build -t $Image .
if ($LASTEXITCODE -ne 0) { Fail 'Build image thất bại. Xem thông báo phía trên (thường do mất mạng khi tải lần đầu).' }

# ---------------------------------------------------------------- 3. Chạy container
Step "Khởi động server trên cổng $Port"
docker rm -f $Container *> $null
# SYS_ADMIN + NET_ADMIN: để server tạo sandbox (tách mạng, đổi uid) cho từng lượt chạy code.
# Bản thân code sinh viên vẫn chạy bằng uid không có quyền, không có mạng, có giới hạn tài nguyên.
docker run -d --name $Container -p "${Port}:8080" `
  --cap-add SYS_ADMIN --cap-add NET_ADMIN `
  -e "MAX_CONCURRENT_RUNS=$MaxRuns" $Image | Out-Null
if ($LASTEXITCODE -ne 0) {
  Fail "Không chạy được container. Có thể cổng $Port đang bị chương trình khác dùng; thử: .\start-class.ps1 -Port 8090"
}

$health = $null
for ($i = 0; $i -lt 30 -and -not $health; $i++) {
  Start-Sleep -Seconds 1
  try { $health = Invoke-RestMethod -Uri "http://localhost:$Port/api/health" -TimeoutSec 5 } catch { }
}
if (-not $health) {
  docker logs $Container
  Fail 'Server không phản hồi. Xem log phía trên.'
}
$langs = $health.languages
Write-Host ("Server đã chạy. Python: {0}  C++: {1}  Java: {2}" -f $langs.python, $langs.cpp, $langs.java)

# ---------------------------------------------------------------- 4. Selftest
$imageId = (docker image inspect $Image --format '{{.Id}}').Trim()
$markerFile = Join-Path $StateDir 'selftest-ok.txt'
$lastOk = if (Test-Path $markerFile) { (Get-Content $markerFile -Raw).Trim() } else { '' }

if ($ForceTest -or $lastOk -ne $imageId) {
  Step 'Selftest: chạy toàn bộ code đáp án và thử sandbox (khoảng 1 phút, chỉ chạy khi code thay đổi)'
  $testOutput = docker exec $Container node /app/server/selftest.js 2>&1
  $testOk = ($LASTEXITCODE -eq 0)
  foreach ($line in $testOutput) {
    $text = "$line"
    if ($text -match '^FAIL') { Write-Host $text -ForegroundColor Red } else { Write-Host $text }
  }
  if ($testOk) {
    Set-Content -Path $markerFile -Value $imageId
  } else {
    $sandboxBroken = @($testOutput | Where-Object { "$_" -match '^FAIL sandbox' }).Count -gt 0
    if ($sandboxBroken) {
      Warn ("`nSandbox KHÔNG hoạt động đầy đủ. Code sinh viên vẫn bị Docker cách ly khỏi máy bạn, " +
            "nhưng có thể làm phiền lượt chạy của bạn khác hoặc làm treo server.")
    } else {
      Warn "`nMột số mục selftest lỗi (xem các dòng FAIL màu đỏ). Các thuật toán / ngôn ngữ đó có thể chạy sai."
    }
    $answer = Read-Host 'Vẫn mở cho lớp dùng? (y/N)'
    if ($answer -notmatch '^(y|yes|c|co|có)$') {
      docker rm -f $Container *> $null
      Fail 'Đã dừng theo lựa chọn của bạn. Gửi các dòng FAIL cho người hỗ trợ kỹ thuật để sửa.'
    }
  }
} else {
  Write-Host 'Selftest đã đạt với bản build này trước đó, bỏ qua. (Dùng -ForceTest để chạy lại.)'
}

# ---------------------------------------------------------------- 5. Địa chỉ LAN
$lanUrl = $null
try {
  $route = Get-NetRoute -DestinationPrefix '0.0.0.0/0' -ErrorAction Stop |
    Sort-Object { $_.RouteMetric + $_.InterfaceMetric } | Select-Object -First 1
  $ip = Get-NetIPAddress -InterfaceIndex $route.ifIndex -AddressFamily IPv4 -ErrorAction Stop |
    Select-Object -First 1 -ExpandProperty IPAddress
  if ($ip) { $lanUrl = "http://${ip}:$Port" }
} catch { }

# ---------------------------------------------------------------- 6. Đường hầm Cloudflare
function Find-Cloudflared {
  $cmd = Get-Command cloudflared -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $candidates = @(
    (Join-Path ${env:ProgramFiles(x86)} 'cloudflared\cloudflared.exe'),
    (Join-Path $env:ProgramFiles 'cloudflared\cloudflared.exe'),
    (Join-Path $StateDir 'cloudflared.exe')
  )
  $found = Get-ChildItem -Path (Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages') -Filter 'cloudflared*.exe' `
    -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($found) { $candidates += $found.FullName }
  foreach ($path in $candidates) { if ($path -and (Test-Path $path)) { return $path } }
  return $null
}

$tunnel = $null
$publicUrl = $null
if (-not $NoTunnel) {
  Step 'Mở đường hầm Cloudflare (miễn phí, không cần tài khoản)'
  $cloudflared = Find-Cloudflared
  if (-not $cloudflared) {
    Write-Host 'Chưa có cloudflared, đang cài...'
    if (Get-Command winget -ErrorAction SilentlyContinue) {
      winget install --id Cloudflare.cloudflared -e --silent --accept-source-agreements --accept-package-agreements | Out-Host
      $cloudflared = Find-Cloudflared
    }
    if (-not $cloudflared) {
      # Không có winget: tải thẳng bản chính thức từ GitHub.
      $dest = Join-Path $StateDir 'cloudflared.exe'
      try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -UseBasicParsing -OutFile $dest `
          -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe'
        $cloudflared = $dest
      } catch { }
    }
  }

  if (-not $cloudflared) {
    Warn 'Không cài được cloudflared. Chỉ dùng được qua mạng LAN (link bên dưới).'
  } else {
    $log = Join-Path $StateDir 'cloudflared.log'
    $outLog = Join-Path $StateDir 'cloudflared.out.log'
    Remove-Item $log, $outLog -ErrorAction SilentlyContinue
    $tunnel = Start-Process -FilePath $cloudflared -NoNewWindow -PassThru `
      -ArgumentList @('tunnel', '--no-autoupdate', '--url', "http://localhost:$Port") `
      -RedirectStandardError $log -RedirectStandardOutput $outLog
    for ($i = 0; $i -lt 60 -and -not $publicUrl -and -not $tunnel.HasExited; $i++) {
      Start-Sleep -Seconds 1
      if (Test-Path $log) {
        $match = Select-String -Path $log -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' | Select-Object -First 1
        if ($match) { $publicUrl = $match.Matches[0].Value }
      }
    }
    if (-not $publicUrl) {
      Warn "Không lấy được link Cloudflare (mạng có thể chặn). Log: $log"
      Warn 'Vẫn dùng được qua mạng LAN (link bên dưới).'
      if (-not $tunnel.HasExited) { Stop-Process -Id $tunnel.Id -Force -ErrorAction SilentlyContinue }
      $tunnel = $null
    } else {
      # Link mới thường cần vài giây để DNS cập nhật.
      for ($i = 0; $i -lt 20; $i++) {
        try { Invoke-RestMethod -Uri "$publicUrl/api/health" -TimeoutSec 5 | Out-Null; break } catch { Start-Sleep -Seconds 2 }
      }
    }
  }
}

# ---------------------------------------------------------------- 7. Trang chiếu link + QR
$mainUrl = if ($publicUrl) { $publicUrl } elseif ($lanUrl) { $lanUrl } else { "http://localhost:$Port" }
$secondary = if ($publicUrl -and $lanUrl) { "Cùng WiFi với giáo viên cũng có thể vào: $lanUrl" }
             elseif (-not $publicUrl) { 'Sinh viên cần dùng cùng mạng WiFi với máy giáo viên.' }
             else { '' }
$qrPage = Join-Path $StateDir 'class-link.html'
$html = @"
<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><title>Link lớp học</title>
<style>
  body{margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;
       font-family:system-ui,'Segoe UI',sans-serif;background:#0f172a;color:#f8fafc;text-align:center;gap:24px;padding:24px}
  h1{margin:0;font-size:36px;font-weight:600}
  #qr{background:#fff;padding:20px;border-radius:16px}
  .url{font-size:clamp(22px,3.2vw,44px);font-weight:700;color:#7dd3fc;word-break:break-all}
  .note{font-size:20px;color:#cbd5e1}
</style></head><body>
  <h1>DSA Visualizer - quét mã hoặc gõ link</h1>
  <div id="qr"></div>
  <div class="url">$mainUrl</div>
  <div class="note">$secondary</div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
  <script>try{new QRCode(document.getElementById('qr'),{text:'$mainUrl',width:360,height:360})}catch(e){document.getElementById('qr').style.display='none'}</script>
</body></html>
"@
[System.IO.File]::WriteAllText($qrPage, $html, (New-Object System.Text.UTF8Encoding $false))
Set-Clipboard -Value $mainUrl -ErrorAction SilentlyContinue
Start-Process $qrPage

Write-Host ''
Write-Host '==============================================================' -ForegroundColor Green
Write-Host '  LỚP HỌC ĐÃ SẴN SÀNG' -ForegroundColor Green
Write-Host ''
Write-Host "  Link cho sinh viên:  $mainUrl" -ForegroundColor White
if ($publicUrl -and $lanUrl) { Write-Host "  (Qua WiFi chung:     $lanUrl)" }
Write-Host '  Link đã được copy vào clipboard; trang có mã QR vừa mở trên trình duyệt.'
Write-Host ''
Write-Host '  Giữ cửa sổ này mở trong suốt buổi học.' -ForegroundColor Yellow
Write-Host '  Nhấn Enter (hoặc Ctrl+C) để kết thúc buổi học.' -ForegroundColor Yellow
Write-Host '==============================================================' -ForegroundColor Green

# ---------------------------------------------------------------- 8. Chờ tới khi kết thúc
[Console]::TreatControlCAsInput = $true
try {
  while ($true) {
    if ([Console]::KeyAvailable) {
      $key = [Console]::ReadKey($true)
      if ($key.Key -eq 'Enter' -or ($key.Key -eq 'C' -and $key.Modifiers -band [ConsoleModifiers]::Control)) { break }
    }
    if ($tunnel -and $tunnel.HasExited) {
      Warn "`nĐường hầm Cloudflare đã ngắt. Chạy lại start-class.bat để có link mới (link sẽ khác)."
      $tunnel = $null
    }
    Start-Sleep -Milliseconds 300
  }
} finally {
  [Console]::TreatControlCAsInput = $false
  Step 'Đang dừng...'
  if ($tunnel -and -not $tunnel.HasExited) { Stop-Process -Id $tunnel.Id -Force -ErrorAction SilentlyContinue }
  docker rm -f $Container *> $null
  Write-Host 'Đã tắt server và đường hầm. Có thể đóng cửa sổ.'
  Start-Sleep -Seconds 3
}
