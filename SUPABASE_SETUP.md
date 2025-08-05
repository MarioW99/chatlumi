# Supabase Setup Guide for Chat Me

This guide will help you set up Supabase properly for your Chat Me application.

## 🚀 Quick Start (Automated)

Run the setup script to automatically configure everything:

```powershell
.\setup-supabase.ps1
```

## 📋 Prerequisites

1. **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)
2. **Supabase CLI** - Install via winget:
   ```powershell
   winget install Supabase.CLI
   ```
   Or download from [Supabase CLI releases](https://github.com/supabase/cli/releases)

## 🔧 Manual Setup

### 1. Install Supabase CLI

**Windows (PowerShell):**
```powershell
winget install Supabase.CLI
```

**macOS:**
```bash
brew install supabase/tap/supabase
```

**Linux:**
```bash
curl -fsSL https://supabase.com/install.sh | sh
```

### 2. Start Supabase Locally

```bash
# Navigate to your project root
cd your-project-directory

# Start Supabase
supabase start
```

### 3. Get Your Configuration

After starting Supabase, you'll see output like this:

```
API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
Inbucket URL: http://localhost:54324
JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Create Environment Files

**Frontend (.env):**
```env
# Supabase Configuration
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your_anon_key_here
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

**Backend (.env):**
```env
# Supabase Configuration
SUPABASE_URL=http://localhost:54321
SUPABASE_KEY=your_service_role_key_here

# Security
SECRET_KEY=your_jwt_secret_key_here_make_it_long_and_random

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
```

### 5. Apply Database Migrations

```bash
supabase db reset
```

### 6. Generate TypeScript Types

```bash
supabase gen types typescript --local > frontend/src/types/database.ts
```

## 🗄️ Database Schema

Your application includes the following tables:

### Core Tables

- **`users`** - User profiles and authentication
- **`chat_messages`** - All chat conversations
- **`agents`** - AI agent configurations
- **`user_progress`** - User growth tracking
- **`user_sessions`** - Session analytics
- **`labeling_tasks`** - Data annotation tasks
- **`labeling_submissions`** - Annotation results

### Security Features

- **Row Level Security (RLS)** enabled on all tables
- **Automatic user creation** when users sign up
- **Secure API access** with JWT tokens
- **Input validation** and sanitization

## 🔐 Authentication Setup

### 1. Configure Auth Settings

In Supabase Studio (http://localhost:54323):

1. Go to **Authentication** → **Settings**
2. Set **Site URL** to `http://localhost:3000`
3. Add **Redirect URLs**:
   - `http://localhost:3000`
   - `http://localhost:5173`

### 2. Email Templates (Optional)

Customize email templates in `supabase/templates/`:

- `confirmation.html` - Email confirmation
- `recovery.html` - Password reset
- `invite.html` - User invitation
- `magic_link.html` - Magic link login

## 🚀 Edge Functions

Your application uses Supabase Edge Functions for AI processing:

### Deploy Functions

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy lumi-ai-agent
```

### Function Configuration

The `lumi-ai-agent` function requires these environment variables:

```bash
supabase secrets set OPENAI_API_KEY=your_openai_key
supabase secrets set SUPABASE_URL=your_supabase_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 📊 Monitoring & Analytics

### Supabase Studio

Access your local Supabase Studio at: http://localhost:54323

Features available:
- **Table Editor** - View and edit data
- **SQL Editor** - Run custom queries
- **Authentication** - Manage users
- **Storage** - File management
- **Edge Functions** - Function logs
- **Logs** - System logs

### Database Logs

```bash
# View real-time logs
supabase logs

# View specific service logs
supabase logs --service db
supabase logs --service auth
supabase logs --service functions
```

## 🔧 Development Workflow

### 1. Start Development

```bash
# Start Supabase
supabase start

# Start frontend
cd frontend && npm run dev

# Start backend
cd backend && python main.py
```

### 2. Database Changes

```bash
# Create new migration
supabase migration new your_migration_name

# Apply migrations
supabase db reset

# Generate types after schema changes
supabase gen types typescript --local > frontend/src/types/database.ts
```

### 3. Testing

```bash
# Run database tests
supabase db test

# Run function tests
supabase functions test
```

## 🛠️ Troubleshooting

### Common Issues

**1. Docker not running**
```bash
# Start Docker Desktop
# Then restart Supabase
supabase stop
supabase start
```

**2. Port conflicts**
```bash
# Check what's using the ports
netstat -ano | findstr :54321
netstat -ano | findstr :54322

# Kill the process or change ports in config.toml
```

**3. Database connection issues**
```bash
# Reset the database
supabase db reset

# Check logs
supabase logs --service db
```

**4. Function deployment fails**
```bash
# Check function logs
supabase logs --service functions

# Redeploy function
supabase functions deploy lumi-ai-agent
```

### Reset Everything

```bash
# Stop Supabase
supabase stop

# Remove all data
supabase db reset

# Start fresh
supabase start
```

## 📈 Production Deployment

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get your project URL and keys

### 2. Update Environment Variables

Replace local URLs with your production Supabase URLs:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
```

### 3. Deploy Database

```bash
# Link to your production project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push

# Deploy functions
supabase functions deploy
```

### 4. Set Production Secrets

```bash
supabase secrets set OPENAI_API_KEY=your_production_openai_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
```

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Database Schema Reference](https://supabase.com/docs/guides/database)
- [Authentication Guide](https://supabase.com/docs/guides/auth)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)

## 🎉 You're Ready!

Your Chat Me application is now properly configured with Supabase. You can:

1. **Start developing** with real-time features
2. **Test authentication** flows
3. **Deploy edge functions** for AI processing
4. **Monitor performance** with built-in analytics
5. **Scale seamlessly** to production

Happy coding! 🚀 