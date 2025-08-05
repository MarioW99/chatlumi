#!/bin/bash

# Deployment Script for Supabase Edge Function and Database Migration
# Run this script from your project root directory

echo "🚀 Starting deployment process..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    echo "   or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if we're linked to a Supabase project
if [ ! -f ".supabase/config.toml" ]; then
    echo "❌ Not linked to a Supabase project. Please run:"
    echo "   supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
fi

echo "📊 Checking current project status..."
supabase status

echo "🗄️  Applying database migrations..."
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Database migration completed successfully"
else
    echo "❌ Database migration failed"
    exit 1
fi

echo "🔑 Setting up secrets for Edge Function..."
echo "Please ensure you have set the following secrets:"
echo "   supabase secrets set OPENAI_API_KEY=your_openai_api_key"
echo "   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"

read -p "Have you set the required secrets? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please set the secrets first, then run this script again."
    exit 1
fi

echo "🚀 Deploying Edge Function..."
supabase functions deploy lumi-ai-agent

if [ $? -eq 0 ]; then
    echo "✅ Edge Function deployed successfully"
    echo "🌐 Your function is now available at:"
    echo "   https://YOUR_PROJECT_REF.supabase.co/functions/v1/lumi-ai-agent"
else
    echo "❌ Edge Function deployment failed"
    exit 1
fi

echo "🧪 Testing Edge Function..."
echo "You can test your function with:"
echo "curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/lumi-ai-agent' \\"
echo "  -H 'Authorization: Bearer YOUR_USER_JWT_TOKEN' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"message\": \"Hello Lumi!\", \"agent_type\": \"main\", \"path\": \"main\"}'"

echo "✅ Deployment completed successfully!"
echo "🎉 Your realtime chat with AI agent is now live!"