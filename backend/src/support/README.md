# Support System Module

This folder contains the AI-enabled customer care backend module.

## Endpoints

- `GET /support/health` - Health and mode check.
- `POST /support/chat` - Authenticated support chat endpoint.

## Chat payload

```json
{
  "message": "My transfer failed",
  "history": [
    { "role": "user", "content": "Hi" },
    { "role": "assistant", "content": "How can I help?" }
  ]
}
```

## AI provider settings

- `OPENAI_API_KEY` - optional. If present, endpoint uses OpenAI first.
- `OPENAI_MODEL` - optional, defaults to `gpt-4o-mini`.

If no API key is present (or provider call fails), the system uses local fallback knowledge responses.
