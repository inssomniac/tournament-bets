# dev-start.ps1
param([switch]$Stop)

$Root     = $PSScriptRoot
$Backend  = "$Root\backend"
$Frontend = "$Root\frontend"
$EnvFile  = "$Root\.env"

if ($Stop) {
    Write-Host "Stopping all processes..." -ForegroundColor Yellow
    Get-Process -Name "node"         -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process -Name "cloudflared"  -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process | Where-Object { $_.Name -match "python" } | Stop-Process -Force -ErrorAction SilentlyContinue
    docker compose -f "$Root\docker-compose.dev.yml" stop 2>&1 | Out-Null
    Write-Host "Done." -ForegroundColor Green
    exit
}

function Update-EnvVar($file, $key, $value) {
    $content = Get-Content $file -Raw
    if ($content -match "(?m)^$key=.*$") {
        $content = $content -replace "(?m)^$key=.*$", "$key=$value"
    } else {
        $content = $content.TrimEnd() + "`n$key=$value`n"
    }
    Set-Content $file $content -NoNewline
}

function Wait-Port($port, $timeoutSec = 30) {
    $deadline = (Get-Date).AddSeconds($timeoutSec)
    while ((Get-Date) -lt $deadline) {
        $r = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
        if ($r.TcpTestSucceeded) { return $true }
        Start-Sleep -Milliseconds 800
    }
    return $false
}

Write-Host ""
Write-Host "======================================"  -ForegroundColor Cyan
Write-Host "  Tournament Bets - Dev Stack Start   "  -ForegroundColor Cyan
Write-Host "======================================"  -ForegroundColor Cyan
Write-Host ""

# 1. Postgres
Write-Host "[1/6] PostgreSQL..." -ForegroundColor DarkCyan
docker compose -f "$Root\docker-compose.dev.yml" up -d 2>&1 | Out-Null
Write-Host "      OK (port 6432)" -ForegroundColor Green

# 2. FastAPI
Write-Host "[2/6] FastAPI..." -ForegroundColor DarkCyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Backend'; python -m uvicorn app.main:app --reload --port 8000" -WindowStyle Minimized
if (Wait-Port 8000 30) {
    Write-Host "      OK (http://localhost:8000)" -ForegroundColor Green
} else {
    Write-Host "      FAIL - check uvicorn window" -ForegroundColor Red; exit 1
}

# 3. Vite
Write-Host "[3/6] Vite..." -ForegroundColor DarkCyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Frontend'; npm run dev" -WindowStyle Minimized
if (Wait-Port 5173 30) {
    Write-Host "      OK (http://localhost:5173)" -ForegroundColor Green
} else {
    Write-Host "      FAIL - check vite window" -ForegroundColor Red; exit 1
}

# 4. cloudflared tunnel
Write-Host "[4/6] cloudflared tunnel (port 5173)..." -ForegroundColor DarkCyan

$cfCmd = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cfCmd) {
    # winget installs here before PATH refresh
    $cfPath = Get-ChildItem "C:\Program Files*" -Recurse -Filter "cloudflared.exe" -ErrorAction SilentlyContinue |
              Select-Object -First 1 -ExpandProperty FullName
    if ($cfPath) { $cfCmd = $cfPath } else {
        Write-Host "      cloudflared not found. Restart terminal after: winget install Cloudflare.cloudflared" -ForegroundColor Red
        exit 1
    }
}
$cfExe = if ($cfCmd -is [string]) { $cfCmd } else { $cfCmd.Source }

$cfLog = "$env:TEMP\cf-tunnel-$([int](Get-Date -UFormat %s)).log"

# cloudflared пишет URL в stderr → RedirectStandardError
Start-Process $cfExe -ArgumentList "tunnel --url http://localhost:5173" `
    -RedirectStandardError $cfLog -WindowStyle Minimized

$tunnelUrl = $null
$deadline = (Get-Date).AddSeconds(35)
while ((Get-Date) -lt $deadline) {
    if (Test-Path $cfLog) {
        $content = Get-Content $cfLog -Raw -ErrorAction SilentlyContinue
        if ($content -match "https://[a-z0-9\-]+\.trycloudflare\.com") {
            $tunnelUrl = $matches[0]
            break
        }
    }
    Start-Sleep -Milliseconds 700
}

if (-not $tunnelUrl) {
    Write-Host "      FAIL - could not get tunnel URL" -ForegroundColor Red
    Write-Host "      Try manually: cloudflared tunnel --url http://localhost:5173" -ForegroundColor Yellow
    exit 1
}

Write-Host "      OK: $tunnelUrl" -ForegroundColor Green

# 5. Update .env
Write-Host "[5/6] Updating .env TWA_URL..." -ForegroundColor DarkCyan
Update-EnvVar $EnvFile "TWA_URL" $tunnelUrl
Write-Host "      TWA_URL=$tunnelUrl" -ForegroundColor Green

# 6. Bot
Write-Host "[6/6] Telegram bot..." -ForegroundColor DarkCyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Backend'; python -m bot.main" -WindowStyle Minimized
Start-Sleep -Seconds 3
Write-Host "      OK" -ForegroundColor Green

Write-Host ""
Write-Host "======================================"  -ForegroundColor Green
Write-Host "  All services running!"                -ForegroundColor Green
Write-Host "======================================"  -ForegroundColor Green
Write-Host "  FastAPI : http://localhost:8000"      -ForegroundColor White
Write-Host "  Vite    : http://localhost:5173"      -ForegroundColor White
Write-Host "  TWA URL : $tunnelUrl"                 -ForegroundColor Yellow
Write-Host ""
Write-Host "  NOTE: open $tunnelUrl in browser first" -ForegroundColor Cyan
Write-Host "  and click 'Click to Continue' (localtunnel gate)" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Then open the bot in Telegram."      -ForegroundColor White
Write-Host "  To stop: .\dev-start.ps1 -Stop"      -ForegroundColor Gray
Write-Host ""
