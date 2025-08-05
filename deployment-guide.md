# Supabase Edge Function Deployment Guide

Diese Anleitung führt Sie durch die Erstellung und das Deployment Ihrer Supabase Edge Function für den KI-Agenten.

## Voraussetzungen

1. **Supabase CLI installieren:**
   ```bash
   # macOS
   brew install supabase/tap/supabase
   
   # Windows (mit Scoop)
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase
   
   # Linux
   curl -fsSL https://supabase.com/install.sh | sh
   ```

2. **Docker installieren** (für lokale Entwicklung)

## Setup-Schritte

### 1. Supabase-Projekt initialisieren

```bash
# Im Hauptverzeichnis Ihres Projekts
supabase init
```

### 2. Mit Ihrem Supabase-Projekt verbinden

```bash
# Ersetzen Sie YOUR_PROJECT_REF mit Ihrer tatsächlichen Projekt-Referenz
supabase link --project-ref YOUR_PROJECT_REF
```

### 3. Umgebungsvariablen setzen

```bash
# OpenAI API Key setzen
supabase secrets set OPENAI_API_KEY=your_openai_api_key_here

# Supabase Service Role Key (falls nicht automatisch gesetzt)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 4. Lokale Entwicklung starten (optional)

```bash
# Lokale Supabase-Instanz starten
supabase start

# Edge Functions lokal ausführen
supabase functions serve --no-verify-jwt
```

Die Funktion ist dann lokal unter `http://localhost:54321/functions/v1/lumi-ai-agent` verfügbar.

### 5. Edge Function deployen

```bash
# Funktion in die Cloud deployen
supabase functions deploy lumi-ai-agent
```

Nach erfolgreichem Deployment erhalten Sie eine URL wie:
`https://YOUR_PROJECT_REF.supabase.co/functions/v1/lumi-ai-agent`

## Frontend-Integration

Aktualisieren Sie Ihre `frontend/.env`-Datei:

```env
VITE_SUPABASE_FUNCTIONS_BASE_URL=https://YOUR_PROJECT_REF.supabase.co/functions/v1
```

## Testen der Edge Function

Sie können die Funktion mit curl testen:

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/lumi-ai-agent' \
  -H 'Authorization: Bearer YOUR_USER_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Hello Lumi!",
    "agent_type": "main",
    "path": "main"
  }'
```

## Monitoring und Logs

```bash
# Logs der Edge Function anzeigen
supabase functions logs lumi-ai-agent

# Realtime-Logs verfolgen
supabase functions logs lumi-ai-agent --follow
```

## Troubleshooting

### Häufige Probleme:

1. **"Function not found"**: Stellen Sie sicher, dass die Funktion erfolgreich deployed wurde
2. **"Unauthorized"**: Überprüfen Sie, ob der JWT-Token korrekt übertragen wird
3. **"OpenAI API Error"**: Überprüfen Sie, ob der OPENAI_API_KEY korrekt gesetzt ist

### Debugging:

```bash
# Secrets anzeigen
supabase secrets list

# Lokale Logs anzeigen
supabase functions logs lumi-ai-agent --local
```

## Nächste Schritte

1. Testen Sie die Edge Function gründlich
2. Implementieren Sie Echtzeit-Updates im Frontend
3. Überwachen Sie die Kosten für OpenAI-Aufrufe
4. Implementieren Sie Rate Limiting falls nötig

## Wichtige Hinweise

- Die Edge Function läuft auf Deno, nicht Node.js
- Verwenden Sie ESM-Imports für externe Bibliotheken
- Secrets werden automatisch als Umgebungsvariablen verfügbar gemacht
- CORS-Headers sind bereits konfiguriert