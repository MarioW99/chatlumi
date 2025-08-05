# Manual Supabase Setup for Chat Me

Since the automated setup script encountered issues, here's a manual step-by-step guide to set up Supabase for your Chat Me application.

## 🚀 Step 1: Install Supabase CLI

### Option A: Download from GitHub (Recommended)
1. Go to [Supabase CLI Releases](https://github.com/supabase/cli/releases)
2. Download the latest version for Windows (e.g., `supabase_windows_amd64.exe`)
3. Rename it to `supabase.exe`
4. Move it to a directory in your PATH (e.g., `C:\Windows\` or create a `bin` folder)

### Option B: Using Chocolatey
```powershell
choco install supabase
```

### Option C: Using Scoop
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

## 🐳 Step 2: Install Docker Desktop

1. Download [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
2. Install and start Docker Desktop
3. Ensure Docker is running (you should see the Docker icon in your system tray)

## 🔧 Step 3: Start Supabase Locally

```powershell
# Navigate to your project directory
cd "C:\Users\Mario-PC\Downloads\project-bolt-sb1-udet7zy3 (2)\project"

# Start Supabase
supabase start
```

You should see output like:
```
API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
Inbucket URL: http://localhost:54324
JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📝 Step 4: Create Environment Files

### Frontend Environment (.env)

Create `frontend\.env` with the following content (replace the keys with your actual values):

```env
# Supabase Configuration
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your_anon_key_from_step_3
VITE_SUPABASE_FUNCTIONS_BASE_URL=http://localhost:54321/functions/v1

# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# Feature Flags
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG_MODE=true

# Performance Configuration
VITE_MESSAGE_CACHE_DURATION=300000
VITE_MAX_MESSAGE_LENGTH=2000
```

### Backend Environment (.env)

Create `backend\.env` with the following content:

```env
# Supabase Configuration
SUPABASE_URL=http://localhost:54321
SUPABASE_KEY=your_service_role_key_from_step_3

# Security
SECRET_KEY=your_jwt_secret_key_here_make_it_long_and_random_1234

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Application Settings
DEBUG=true
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900

# Logging
LOG_LEVEL=INFO
```

## 🗄️ Step 5: Apply Database Migrations

```powershell
# Apply the database schema
supabase db reset
```

## 🔧 Step 6: Generate TypeScript Types

```powershell
# Generate TypeScript types from your database schema
supabase gen types typescript --local > frontend\src\types\database.ts
```

## 🚀 Step 7: Deploy Edge Functions

```powershell
# Deploy the AI agent function
supabase functions deploy lumi-ai-agent
```

## 🔐 Step 8: Set Function Secrets

```powershell
# Set the required secrets for your edge function
supabase secrets set OPENAI_API_KEY=your_openai_api_key_here
supabase secrets set SUPABASE_URL=http://localhost:54321
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_from_step_3
```

## 🎯 Step 9: Test Your Setup

1. **Start your frontend:**
   ```powershell
   cd frontend
   npm run dev
   ```

2. **Start your backend:**
   ```powershell
   cd backend
   python main.py
   ```

3. **Visit your application:**
   - Frontend: http://localhost:3000
   - Supabase Studio: http://localhost:54323

## 🔧 Useful Commands

```powershell
# Stop Supabase
supabase stop

# View logs
supabase logs

# Reset database
supabase db reset

# Generate types
supabase gen types typescript --local

# Deploy functions
supabase functions deploy

# View function logs
supabase logs --service functions
```

## 🛠️ Troubleshooting

### Docker Issues
- Ensure Docker Desktop is running
- Restart Docker Desktop if needed
- Check Windows WSL2 integration

### Port Conflicts
If you get port conflicts, check what's using the ports:
```powershell
netstat -ano | findstr :54321
netstat -ano | findstr :54322
```

### Database Issues
```powershell
# Reset everything
supabase stop
supabase start
supabase db reset
```

## 📊 Verify Installation

1. **Check Supabase Studio** (http://localhost:54323)
   - You should see your database tables
   - Authentication should be working

2. **Test Authentication**
   - Try signing up a test user
   - Check if the user appears in the database

3. **Test Edge Functions**
   - Go to Edge Functions in Supabase Studio
   - Check if `lumi-ai-agent` is deployed

## 🎉 Success!

Once you've completed all steps, your Chat Me application will have:

✅ **Local Supabase instance** running on Docker  
✅ **Database schema** with all tables and security policies  
✅ **Authentication** system ready to use  
✅ **Edge Functions** for AI processing  
✅ **TypeScript types** generated from your schema  
✅ **Environment files** configured properly  

You can now start developing your empathic companion application! 🚀 