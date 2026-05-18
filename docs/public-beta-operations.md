# Public Beta Operations

## Daily check

- app health
- database connectivity
- failed run count
- OpenAI provider failure pattern
- share link behavior
- user feedback / reported bugs

## Incident examples

### OpenAI provider failure increases

Actions:
1. Switch provider to mock if needed
2. Confirm failed runs show safe copy
3. Record incident
4. Do not mark failed runs as completed

### Source grounding failures

Actions:
1. Ask user to add official/manual URLs
2. Keep sufficient_grounding=false as failed
3. Do not fabricate sources

### Share link concern

Actions:
1. Confirm read-only mode
2. Confirm noindex/nofollow
3. Revoke/regenerate if supported
4. If not supported, document limitation

### Suspicious advice-like output

Actions:
1. Check report text
2. Confirm non-advice copy
3. Add regression test if needed
4. Tighten prompt/provider instructions if needed

## Manual release rollback

- Disable OpenAI provider
- Switch to mock provider
- Disable public distribution of beta access code
- Keep existing run/share pages read-only
