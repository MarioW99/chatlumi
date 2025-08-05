# Supabase Setup Script for Chat Me Application
# This script sets up Supabase locally and configures the environment

Write-Host "🚀 Setting up Supabase for Chat Me Application..." -ForegroundColor Green

# Check if Docker is running
Write-Host "Checking Docker status..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

# Check if Supabase CLI is installed
Write-Host "Checking Supabase CLI..." -ForegroundColor Yellow
try {
    supabase --version | Out-Null
    Write-Host "✅ Supabase CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not found. Installing..." -ForegroundColor Yellow
    
    # Try to install via winget
    try {
        winget install Supabase.CLI
        Write-Host "✅ Supabase CLI installed via winget" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install via winget. Please install manually:" -ForegroundColor Red
        Write-Host "   Visit: https://supabase.com/docs/guides/cli/getting-started" -ForegroundColor Yellow
        exit 1
    }
}

# Navigate to project root
Set-Location $PSScriptRoot

# Start Supabase locally
Write-Host "Starting Supabase locally..." -ForegroundColor Yellow
try {
    supabase start
    Write-Host "✅ Supabase started successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to start Supabase. Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Wait a moment for services to be ready
Start-Sleep -Seconds 10

# Get Supabase URLs
Write-Host "Getting Supabase URLs..." -ForegroundColor Yellow
try {
    $supabaseStatus = supabase status --output json | ConvertFrom-Json
    $apiUrl = $supabaseStatus.api
    $anonKey = $supabaseStatus.db.anon_key
    $serviceKey = $supabaseStatus.db.service_role_key
    
    Write-Host "✅ Supabase URLs retrieved" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to get Supabase URLs" -ForegroundColor Red
    exit 1
}

# Create environment files
Write-Host "Creating environment files..." -ForegroundColor Yellow

# Frontend .env file
$frontendEnvContent = @"
# Supabase Configuration
VITE_SUPABASE_URL=$apiUrl
VITE_SUPABASE_ANON_KEY=$anonKey
VITE_SUPABASE_FUNCTIONS_BASE_URL=$apiUrl/functions/v1

# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# Feature Flags
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG_MODE=true

# Performance Configuration
VITE_MESSAGE_CACHE_DURATION=300000
VITE_MAX_MESSAGE_LENGTH=2000
"@

$frontendEnvContent | Out-File -FilePath "frontend\.env" -Encoding UTF8
Write-Host "✅ Frontend .env file created" -ForegroundColor Green

# Backend .env file
$backendEnvContent = @"
# Supabase Configuration
SUPABASE_URL=$apiUrl
SUPABASE_KEY=$serviceKey

# Security
SECRET_KEY=your_jwt_secret_key_here_make_it_long_and_random_$(Get-Random -Minimum 1000 -Maximum 9999)

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Application Settings
DEBUG=true
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900

# Logging
LOG_LEVEL=INFO
"@

$backendEnvContent | Out-File -FilePath "backend\.env" -Encoding UTF8
Write-Host "✅ Backend .env file created" -ForegroundColor Green

# Apply database migrations
Write-Host "Applying database migrations..." -ForegroundColor Yellow
try {
    supabase db reset
    Write-Host "✅ Database migrations applied" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to apply migrations. Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Generate TypeScript types
Write-Host "Generating TypeScript types..." -ForegroundColor Yellow
try {
    supabase gen types typescript --local > frontend\src\types\database.ts
    Write-Host "✅ TypeScript types generated" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to generate types. Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Display setup information
Write-Host "`n🎉 Supabase setup completed successfully!" -ForegroundColor Green
Write-Host "`n📋 Setup Information:" -ForegroundColor Cyan
Write-Host "   Supabase API URL: $apiUrl" -ForegroundColor White
Write-Host "   Supabase Studio: http://localhost:54323" -ForegroundColor White
Write-Host "   Database URL: postgresql://postgres:postgres@localhost:54322/postgres" -ForegroundColor White
Write-Host "   Anon Key: $anonKey" -ForegroundColor White
Write-Host "   Service Role Key: $serviceKey" -ForegroundColor White

Write-Host "`n📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Update your OpenAI API key in backend\.env" -ForegroundColor White
Write-Host "   2. Start your frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host "   3. Start your backend: cd backend && python main.py" -ForegroundColor White
Write-Host "   4. Visit http://localhost:3000 to see your app" -ForegroundColor White

Write-Host "`n🔧 Useful Commands:" -ForegroundColor Cyan
Write-Host "   - Stop Supabase: supabase stop" -ForegroundColor White
Write-Host "   - View logs: supabase logs" -ForegroundColor White
Write-Host "   - Reset database: supabase db reset" -ForegroundColor White
Write-Host "   - Generate types: supabase gen types typescript --local" -ForegroundColor White

Write-Host "`n✅ Setup complete! Your Chat Me application is ready to use." -ForegroundColor Green 