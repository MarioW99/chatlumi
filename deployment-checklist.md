# Deployment Checklist

## Pre-Deployment Checklist

- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Project linked to Supabase (`supabase link --project-ref YOUR_PROJECT_REF`)
- [ ] OpenAI API Key available
- [ ] Supabase Service Role Key available

## Deployment Steps

### 1. Set Environment Variables
```bash
# Set OpenAI API Key
supabase secrets set OPENAI_API_KEY=your_openai_api_key_here

# Set Supabase Service Role Key (if not automatically set)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 2. Apply Database Migration
```bash
# Push local migrations to Supabase
supabase db push
```

### 3. Deploy Edge Function
```bash
# Deploy the lumi-ai-agent function
supabase functions deploy lumi-ai-agent
```

### 4. Verify Deployment
```bash
# Check function logs
supabase functions logs lumi-ai-agent

# Test the function
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/lumi-ai-agent' \
  -H 'Authorization: Bearer YOUR_USER_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"message": "Hello Lumi!", "agent_type": "main", "path": "main"}'
```

## Post-Deployment Verification

### Frontend Integration
- [ ] Update `VITE_SUPABASE_FUNCTIONS_BASE_URL` in frontend/.env
- [ ] Test chat functionality in browser
- [ ] Verify realtime updates work across multiple tabs
- [ ] Check that messages are saved to database

### Performance Monitoring
- [ ] Monitor Edge Function performance in Supabase dashboard
- [ ] Check OpenAI API usage and costs
- [ ] Verify database query performance
- [ ] Monitor realtime connection stability

### Error Handling
- [ ] Test error scenarios (invalid input, API failures)
- [ ] Verify fallback mechanisms work
- [ ] Check error logging and monitoring

## Troubleshooting

### Common Issues

1. **"Function not found" error**
   - Verify function was deployed successfully
   - Check function name matches exactly
   - Ensure project is linked correctly

2. **"Unauthorized" error**
   - Verify JWT token is valid and not expired
   - Check user authentication in frontend
   - Ensure RLS policies allow access

3. **OpenAI API errors**
   - Verify OPENAI_API_KEY is set correctly
   - Check API key has sufficient credits
   - Monitor rate limits

4. **Realtime not working**
   - Verify migration was applied successfully
   - Check that realtime is enabled for chat_messages table
   - Ensure RLS policies don't block realtime updates

### Useful Commands

```bash
# Check deployment status
supabase status

# View function logs
supabase functions logs lumi-ai-agent --follow

# List all secrets
supabase secrets list

# Reset local database (if needed)
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > types/supabase.ts
```

## Success Criteria

✅ **Database Migration Applied**
- Realtime enabled for chat_messages table
- Performance indexes created
- No migration errors

✅ **Edge Function Deployed**
- Function accessible via HTTPS
- Secrets configured correctly
- No deployment errors

✅ **Frontend Integration Working**
- Messages sent successfully
- AI responses generated
- Realtime updates visible
- No console errors

✅ **Performance Acceptable**
- Response times < 2 seconds
- Realtime updates < 500ms
- No memory leaks or connection issues