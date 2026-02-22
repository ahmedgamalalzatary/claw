# Config Contract (`config.json`)

This is the agreed configuration contract for MVP.

```json
{
  "timezone": "UTC",
  "provider": {
    "name": "google",
    "apiKey": "YOUR_GOOGLE_API_KEY",
    "primaryModel": "MODEL_NAME",
    "fallbackModels": ["FALLBACK_MODEL_1", "FALLBACK_MODEL_2"],
    "params": {
      "temperature": 0.2,
      "topP": 1,
      "maxOutputTokens": 8192
    }
  },
  "whatsapp": {
    "driver": "baileys",
    "mode": "dm_only",
    "authPath": "data/whatsapp",
    "textOnly": true
  },
  "commands": {
    "enabled": ["/status", "/ping", "/new"],
    "unknownCommandBehavior": "ignore",
    "slashRule": "message starts with '/' only"
  },
  "retries": {
    "maxRetries": 3,
    "delaysMs": [5000, 10000, 10000],
    "applyTo": "ai_calls_only",
    "fallbackOrder": [
      "retry same model",
      "fallback model 1",
      "fallback model 2"
    ]
  },
  "heartbeat": {
    "enabled": true,
    "intervalMinutes": 30
  },
  "storage": {
    "sessionsDir": "sessions",
    "memoryDir": "memory",
    "sqlitePath": "db/gateway.sqlite",
    "vector": {
      "engine": "sqlite-vec",
      "enabled": false,
      "indexSource": "chat_messages",
      "triggerMode": "bot_action_only"
    }
  },
  "logging": {
    "dir": "logs",
    "mode": "session_split",
    "output": ["file", "console"],
    "metadataOnly": false,
    "redact": ["api_keys"]
  },
  "hotReload": {
    "enabled": true,
    "files": ["config.json"]
  }
}
```

## Config Behavior

- Config is file-based (`config.json`) with defaults.
- Model and fallback chain are user-defined in config.
- API key is stored in `config.json` for MVP.
- Retry policy is for AI calls only.
- WhatsApp reconnect policy is infinite retries (not tied to AI retry count).

