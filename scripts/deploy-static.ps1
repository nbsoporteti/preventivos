# Build del front y ZIP para subir al hosting (contenido = public_html).
# Uso (desde la raíz del repo): npm run deploy:web
# Antes: copia apps/web/.env.production.example a apps/web/.env.production y pon tu VITE_API_BASE_URL.

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$envFile = Join-Path $Root 'apps\web\.env.production'
if (-not (Test-Path $envFile)) {
	Write-Warning "No existe apps\web\.env.production - el build usara VITE_API_BASE_URL por defecto (/hcgi/api)."
	Write-Warning "Copia apps\web\.env.production.example -> .env.production y configura la URL publica de la API."
}

Write-Host ">> npm run build"
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$WebDist = Join-Path $Root 'dist\apps\web'
if (-not (Test-Path $WebDist)) {
	throw "No se genero la carpeta de build: $WebDist"
}

$Deploy = Join-Path $Root 'deploy'
New-Item -ItemType Directory -Force -Path $Deploy | Out-Null
$Stamp = Get-Date -Format 'yyyyMMdd-HHmm'
$Zip = Join-Path $Deploy "preventivos-web-$Stamp.zip"
if (Test-Path $Zip) { Remove-Item -LiteralPath $Zip }

$items = Get-ChildItem -LiteralPath $WebDist -Force
Compress-Archive -Path $items.FullName -DestinationPath $Zip -CompressionLevel Optimal -Force

Write-Host ""
Write-Host "ZIP creado: $Zip"
Write-Host "Sube los archivos DESCOMPRIMIDOS a public_html (o sube el zip y extraelo en el panel)."
Write-Host ""
