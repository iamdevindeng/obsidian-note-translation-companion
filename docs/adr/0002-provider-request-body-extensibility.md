# ADR 0002: Provider Request Body Extensibility

## Status

Accepted

## Context

The plugin supports OpenAI-compatible providers through a small settings surface:
`baseURL`, `apiKey`, `model`, `temperature`, and optional `extraHeaders`.

That covers basic translation calls, but provider-specific OpenAI-compatible APIs
also expose behavior controls in the JSON request body. Examples include DeepSeek
thinking mode, reasoning effort, and OpenRouter routing options. Treating those
fields as HTTP headers would blur transport configuration with model behavior and
make cache validation incomplete.

## Decision

Keep the provider extension points split by purpose:

- `extraHeaders` is only for HTTP headers.
- `extraBody` is for provider-specific `/chat/completions` JSON body fields.
- `extraBody` must be a JSON object and cannot override plugin-owned request
  fields such as `model`, `messages`, `temperature`, or `stream`.
- Cache validation includes a request behavior hash derived from `temperature`
  and normalized `extraBody`.

## Consequences

- Users can configure providers such as DeepSeek and OpenRouter without adding
  provider-specific branches to the translation flow.
- Changing request behavior invalidates cached translations instead of reusing a
  result generated under different model settings.
- Legacy cached translations without `ntc_request_hash` remain valid only when
  the current request behavior is the default.
- The settings UI gains one advanced JSON field, so invalid JSON must fail early
  with a clear message before any network call.
