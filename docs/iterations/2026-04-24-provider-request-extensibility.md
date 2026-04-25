# 2026-04-24 Provider Request Extensibility

## Goal

Support provider-specific OpenAI-compatible request-body parameters without misusing `extraHeaders`.

## Context

DeepSeek thinking mode uses request-body fields such as `thinking` and `reasoning_effort`. OpenRouter still needs header fields like `HTTP-Referer` and `X-Title`. The plugin needs both extension points while staying a focused translation companion.

## Decisions

- Keep `extraHeaders` scoped to HTTP headers.
- Add `extraBody` for provider-specific `/chat/completions` body fields.
- Reject `extraBody` keys owned by the plugin request builder.
- Include request behavior in cache validation through `ntc_request_hash`.
- Record the lasting decision in `docs/adr/0002-provider-request-body-extensibility.md`.

## Verification

- Add unit tests for extra body parsing, request body merging, and cache invalidation.
- `npm test` passes with 24 tests.
- `npm run build` passes.
