# =====================================================
# VocaPro Setup Script for Windows (PowerShell)
# =====================================================

Write-Host "🚀 VocaPro Setup Script" -ForegroundColor Cyan
Write-Host "=====================================================`n" -ForegroundColor Cyan

# Check Node.js version
Write-Host "Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Node.js $nodeVersion installed" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check npm
Write-Host "Checking npm..." -ForegroundColor Yellow
$npmVersion = npm --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ npm $npmVersion installed" -ForegroundColor Green
} else {
    Write-Host "✗ npm is not installed" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dependencies installed" -ForegroundColor Green

# Check for .env file
Write-Host "`nChecking for .env file..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✓ .env file created" -ForegroundColor Green
    Write-Host "`n⚠️  IMPORTANT: Please edit .env file with your Azure SQL connection string and other credentials" -ForegroundColor Yellow
} else {
    Write-Host "✓ .env file exists" -ForegroundColor Green
}

# Generate Prisma Client
Write-Host "`nGenerating Prisma Client..." -ForegroundColor Yellow
npm run prisma:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to generate Prisma Client" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Prisma Client generated" -ForegroundColor Green

# Create directories
Write-Host "`nCreating required directories..." -ForegroundColor Yellow
$directories = @("uploads", "logs")
foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir | Out-Null
        Write-Host "✓ Created $dir directory" -ForegroundColor Green
    } else {
        Write-Host "✓ $dir directory exists" -ForegroundColor Green
    }
}

Write-Host "`n=====================================================`n" -ForegroundColor Cyan
Write-Host "✅ Setup completed successfully!`n" -ForegroundColor Green

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env file with your database credentials" -ForegroundColor White
Write-Host "2. Run: npm run prisma:push (to create database tables)" -ForegroundColor White
Write-Host "3. Run: npm run dev (to start development server)" -ForegroundColor White
Write-Host "4. Open: http://localhost:3000`n" -ForegroundColor White

Write-Host "For Azure deployment instructions, see README.md" -ForegroundColor Gray
Write-Host "API Documentation will be available at: http://localhost:3000/api-docs`n" -ForegroundColor Gray
